"""
shared/clients.py

Cliente HTTP hacia ms-usuarios con caché LRU por proceso.

──────────────────────────────────────────────────────────────────────────────
PROBLEMA RESUELTO
─────────────────
Sin caché: listar 100 bienes → _enriquecer() × 100 → 500 llamadas HTTP a
ms-usuarios (empresa, sede, módulo, ubicación, usuario × bien).

Con lru_cache: la primera llamada a validar_sede(1, token) hace el HTTP.
La segunda llamada con los mismos argumentos devuelve el resultado en
microsegundos desde la memoria del proceso. Si 80 bienes están en la sede 1,
sólo se hace UNA llamada HTTP real para esa sede.

LÍMITE: maxsize=512 → se mantienen 512 combinaciones distintas (id, token).
En producción con muchas sedes/usuarios, es suficiente para un inventario
de miles de bienes donde la diversidad de sedes/usuarios es << 512.

NOTA: lru_cache vive en memoria del proceso Django. Si usas gunicorn con
múltiples workers, cada worker tiene su propia caché (correcto y seguro).
No hay riesgo de datos compartidos entre requests concurrentes.
──────────────────────────────────────────────────────────────────────────────
"""
import requests
import logging
from functools import lru_cache
from typing import Optional
from django.conf import settings
from rest_framework.exceptions import ValidationError

logger = logging.getLogger(__name__)


class MsUsuariosClient:
    @classmethod
    def _base_url(cls) -> str:
        return getattr(settings, 'MS_USUARIOS_BASE_URL', 'http://127.0.0.1:8000/api/v1')
    @classmethod
    def _cookie_name(cls) -> str:
        return getattr(settings, 'JWT_AUTH_COOKIE', 'sisconpat_access')
    @classmethod
    def _get(cls, path: str, token: str = '') -> tuple[Optional[dict], int]:
        cookies = {cls._cookie_name(): token} if token else {}
        try:
            resp = requests.get(
                f'{cls._base_url()}{path}',
                cookies=cookies,
                timeout=5,
            )
            if resp.status_code == 200:
                return resp.json(), 200
            return None, resp.status_code
        except requests.RequestException as e:
            logger.warning('MsUsuariosClient GET %s — %s: %s', path, type(e).__name__, e)
            return None, 503
    @staticmethod
    @lru_cache(maxsize=256)
    def _cached_empresa(empresa_id: int, token: str) -> Optional[dict]:
        from shared.clients import MsUsuariosClient as C
        data, _ = C._get(f'/locations/empresas/{empresa_id}/', token)
        return data
    @staticmethod
    @lru_cache(maxsize=256)
    def _cached_sede(sede_id: int, token: str) -> Optional[dict]:
        from shared.clients import MsUsuariosClient as C
        data, _ = C._get(f'/locations/sedes/{sede_id}/', token)
        return data
    @staticmethod
    @lru_cache(maxsize=256)
    def _cached_modulo(modulo_id: int, token: str) -> Optional[dict]:
        from shared.clients import MsUsuariosClient as C
        data, _ = C._get(f'/locations/modulos/{modulo_id}/', token)
        return data
    @staticmethod
    @lru_cache(maxsize=256)
    def _cached_ubicacion(ubicacion_id: int, token: str) -> Optional[dict]:
        from shared.clients import MsUsuariosClient as C
        data, _ = C._get(f'/locations/ubicaciones/{ubicacion_id}/', token)
        return data
    @staticmethod
    @lru_cache(maxsize=512)
    def _cached_usuario(usuario_id: int, token: str) -> Optional[dict]:
        from shared.clients import MsUsuariosClient as C
        data, _ = C._get(f'/users/users/{usuario_id}/', token)
        return data
    @classmethod
    def _raise_si_error(cls, data, status_code: int, entidad: str, pk: int):
        if status_code == 200:
            return
        mensajes = {
            401: f'ms-usuarios/{entidad} id={pk}: Token inválido o expirado.',
            403: f'ms-usuarios/{entidad} id={pk}: Sin autorización.',
            404: f'ms-usuarios/{entidad} id={pk}: No existe.',
            503: f'ms-usuarios/{entidad}: Servicio no disponible.',
        }
        raise ValidationError(mensajes.get(status_code, f'ms-usuarios/{entidad}: Error {status_code}.'))
    @classmethod
    def validar_empresa(cls, empresa_id: int, token: str = '') -> dict:
        data = cls._cached_empresa(empresa_id, token or '')
        if data is None:
            data, sc = cls._get(f'/locations/empresas/{empresa_id}/', token)
            cls._raise_si_error(data, sc, 'empresa', empresa_id)
        return data or {}
    @classmethod
    def validar_sede(cls, sede_id: int, token: str = '') -> dict:
        data = cls._cached_sede(sede_id, token or '')
        if data is None:
            data, sc = cls._get(f'/locations/sedes/{sede_id}/', token)
            cls._raise_si_error(data, sc, 'sede', sede_id)
        return data or {}
    @classmethod
    def validar_modulo(cls, modulo_id: int, token: str = '') -> dict:
        data = cls._cached_modulo(modulo_id, token or '')
        if data is None:
            data, sc = cls._get(f'/locations/modulos/{modulo_id}/', token)
            cls._raise_si_error(data, sc, 'módulo', modulo_id)
        return data or {}
    @classmethod
    def validar_ubicacion(cls, ubicacion_id: int, token: str = '') -> dict:
        data = cls._cached_ubicacion(ubicacion_id, token or '')
        if data is None:
            data, sc = cls._get(f'/locations/ubicaciones/{ubicacion_id}/', token)
            cls._raise_si_error(data, sc, 'ubicación', ubicacion_id)
        return data or {}
    @classmethod
    def validar_usuario(cls, usuario_id: int, token: str = '') -> dict:
        data = cls._cached_usuario(usuario_id, token or '')
        if data is None:
            data, sc = cls._get(f'/users/users/{usuario_id}/', token)
            cls._raise_si_error(data, sc, 'usuario', usuario_id)
        return data or {}
    @classmethod
    def invalidar_cache(cls):
        """Llama esto si necesitas forzar refresco (por ejemplo tras actualizar una sede)."""
        cls._cached_empresa.cache_clear()
        cls._cached_sede.cache_clear()
        cls._cached_modulo.cache_clear()
        cls._cached_ubicacion.cache_clear()
        cls._cached_usuario.cache_clear()