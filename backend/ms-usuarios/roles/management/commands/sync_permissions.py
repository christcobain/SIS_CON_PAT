import os
import logging
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone

logger = logging.getLogger('management.sync_permissions')


class Command(BaseCommand):
    help = 'Sincroniza permisos de todos los microservicios registrados en roles_permission.'
    def add_arguments(self, parser):
        parser.add_argument('--service', type=str, default=None)
        parser.add_argument('--dry-run', action='store_true')
    def handle(self, *args, **options):
        try:
            import httpx
        except ImportError:
            raise CommandError('Instala httpx: pip install httpx')
        from roles.models import Permission
        raw = os.environ.get('REGISTERED_MICROSERVICES', '').strip()
        if not raw:
            raise CommandError(
                'REGISTERED_MICROSERVICES no configurado.\n'
                'Formato en .env: ms-usuarios|http://localhost:8000,ms-bienes|http://localhost:8001'
            )
        registered = self._parse(raw)
        if not registered:
            raise CommandError('No se pudo parsear REGISTERED_MICROSERVICES. Verifica el formato.')
        sync_key  = os.environ.get('SERVICE_SYNC_KEY', '')
        dry_run   = options['dry_run']
        filter_ms = options['service']
        self.stdout.write(f'MSs encontrados: {list(registered.keys())}')
        total_c = total_u = total_d = 0
        for ms_name, base_url in registered.items():
            if filter_ms and ms_name != filter_ms:
                continue
            self.stdout.write(f'\n── Sincronizando {ms_name} ({base_url})...')
            try:
                permissions = self._fetch(ms_name, base_url, sync_key, httpx)
            except Exception as e:
                self.stderr.write(f'  ERROR al conectar con {ms_name}: {e}')
                self.stderr.write(f'  ¿Está corriendo {ms_name} en {base_url}?')
                continue
            self.stdout.write(f'  {len(permissions)} permisos recibidos.')
            if dry_run:
                for p in permissions[:5]:
                    self.stdout.write(f'  [dry-run] {p["app_label"]}.{p["codename"]}')
                if len(permissions) > 5:
                    self.stdout.write(f'  ... y {len(permissions)-5} más')
                continue
            c, u, d = self._sync(ms_name, permissions, Permission)
            total_c += c; total_u += u; total_d += d
            self.stdout.write(
                self.style.SUCCESS(f'  ✓ creados={c}  actualizados={u}  desactivados={d}')
            )
        if not dry_run:
            self.stdout.write(
                self.style.SUCCESS(
                    f'\n✅ Total: {total_c} nuevos, {total_u} actualizados, {total_d} desactivados.'
                )
            )
    @staticmethod
    def _parse(raw: str) -> dict:
        result = {}
        for entry in raw.split(','):
            entry = entry.strip()
            if not entry:
                continue
            if '|' not in entry:
                parts = entry.split(':', 1)
                if len(parts) == 2 and not parts[1].startswith('//'):
                    logger.warning(f'Entrada malformada ignorada: {entry}')
                    continue
                ms_name = parts[0].strip()
                base_url = parts[1].strip() if len(parts) > 1 else ''
            else:
                ms_name, base_url = entry.split('|', 1)
                ms_name  = ms_name.strip()
                base_url = base_url.strip()
            if ms_name and base_url:
                result[ms_name] = base_url
        return result
    @staticmethod
    def _fetch(ms_name: str, base_url: str, sync_key: str, httpx) -> list:
        url     = f'{base_url.rstrip("/")}/internal/permissions/'
        headers = {'X-Service-Key': sync_key}
        resp = httpx.get(url, headers=headers, timeout=10.0)
        resp.raise_for_status()
        data = resp.json()
        if not isinstance(data, list):
            raise ValueError(f'Respuesta inesperada: {type(data)}')
        return data
    @staticmethod
    @transaction.atomic
    def _sync(ms_name: str, incoming_list: list, Permission) -> tuple:
        incoming = {(p['app_label'], p['codename']): p for p in incoming_list}
        existing = {
            (p.app_label, p.codename): p
            for p in Permission.objects.filter(microservice_name=ms_name)
        }
        created = updated = deactivated = 0
        for (app_label, codename), pdata in incoming.items():
            key = (app_label, codename)
            if key in existing:
                perm = existing[key]
                changed = False
                if perm.name != pdata.get('name', perm.name):
                    perm.name = pdata['name']; changed = True
                if perm.model_name != pdata.get('model_name', perm.model_name):
                    perm.model_name = pdata['model_name']; changed = True
                if not perm.is_active:
                    perm.is_active = True; changed = True
                if changed:
                    perm.save(); updated += 1
            else:
                Permission.objects.create(
                    microservice_name=ms_name,
                    app_label=app_label,
                    model_name=pdata.get('model_name', ''),
                    codename=codename,
                    name=pdata.get('name', codename),
                    is_active=True,
                )
                created += 1
        for key, perm in existing.items():
            if key not in incoming and perm.is_active:
                perm.is_active = False
                perm.save(update_fields=['is_active', 'synced_at'])
                deactivated += 1
        return created, updated, deactivated