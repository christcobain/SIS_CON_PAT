import os
from typing import Dict, Any, List, Optional
from django.db.models import QuerySet,Q
from django.conf import settings
from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import ValidationError, NotFound, PermissionDenied

from .models import Mantenimiento
from .repositories import (
    MantenimientoRepository,
    MantenimientoDetalleRepository,
    MantenimientoAprobacionRepository,
    MantenimientoImagenRepository,
)
from .pdf_generator import generar_pdf_mantenimiento
from bienes.repositories import BienRepository
from catalogos.models import CatEstadoFuncionamiento
from transferencias.services import TransferenciaService
from shared.clients import MsUsuariosClient


COORD_SEDE_ID   = 1
COORD_MODULO_ID = 1

class MantenimientoService:
    @staticmethod
    def _get_or_404(pk: int) -> Mantenimiento:
        m = MantenimientoRepository.get_by_id(pk)
        if not m:
            raise NotFound(f'Mantenimiento id={pk} no encontrado.')
        return m
    @staticmethod
    def _get_user_name(user_id: Optional[int], token: str) -> Optional[str]:
        if not user_id:
            return None
        try:
            usuario = MsUsuariosClient.validar_usuario(user_id, token)
            if usuario and isinstance(usuario, dict):
                return f"{usuario.get('first_name', '')} {usuario.get('last_name', '')}".strip() or None
        except Exception:
            pass
        return None
    @staticmethod
    def _enriquecer(m: Mantenimiento, token: str) -> Mantenimiento:
        try:
            sede = MsUsuariosClient.validar_sede(m.sede_id, token)
            m.sede_nombre = sede.get('nombre') if sede else None
        except Exception:
            m.sede_nombre = None
        if m.modulo_id:
            try:
                modulo = MsUsuariosClient.validar_modulo(m.modulo_id, token)
                m.modulo_nombre = modulo.get('nombre') if modulo else None
            except Exception:
                m.modulo_nombre = None
        else:
            m.modulo_nombre = None
        m.usuario_propietario_nombre     = MantenimientoService._get_user_name(m.usuario_propietario_id, token)
        m.aprobado_por_adminsede_nombre  = MantenimientoService._get_user_name(m.aprobado_por_adminsede_id, token)
        m.subido_por_nombre              = MantenimientoService._get_user_name(m.subido_por_id, token)
        return m
    @staticmethod
    def _guardar_pdf(m: Mantenimiento, cookie: str = '') -> None:
        try:
            pdf_bytes = generar_pdf_mantenimiento(m, cookie=cookie)
            carpeta   = os.path.join(settings.MEDIA_ROOT, 'mantenimientos', 'pdfs')
            os.makedirs(carpeta, exist_ok=True)
            nombre = f'MNT-{m.pk}-{timezone.now().strftime("%Y%m%d%H%M%S")}.pdf'
            ruta   = os.path.join(carpeta, nombre)
            with open(ruta, 'wb') as f:
                f.write(pdf_bytes)
            MantenimientoRepository.update_fields(m, {
                'pdf_path':  os.path.join('mantenimientos', 'pdfs', nombre),
                'fecha_pdf': timezone.now(),
            })
        except Exception:
            pass
    @staticmethod
    def listar(filters: Dict[str, Any], token: str):
        real_filters = dict(filters)
        if real_filters.get('estado'):
            real_filters['estado_mantenimiento'] = real_filters.pop('estado')
        qs = MantenimientoRepository.filter(real_filters)
        for m in qs:
            MantenimientoService._enriquecer(m, token)
        return qs
    @staticmethod
    def mis_mantenimientos(usuario_id: int,role: str,sede_id: int,filters: Dict[str, Any],token: str) -> QuerySet:
        qs = MantenimientoRepository.filter_mis_mantenimientos(usuario_id, role, sede_id)
        if filters.get('estado'):
            qs = qs.filter(estado_mantenimiento=filters['estado'])
        for m in qs:
            MantenimientoService._enriquecer(m, token)
        return qs    
    @staticmethod
    def obtener(pk: int, token: str) -> Mantenimiento:
        m = MantenimientoService._get_or_404(pk)
        return MantenimientoService._enriquecer(m, token)
    @staticmethod
    @transaction.atomic
    def crear(data: Dict[str, Any],usuario_realiza_id: int,sede_id: int, modulo_id: Optional[int],) -> Mantenimiento:
        bien_ids = data.pop('bien_ids', [])
        if not bien_ids:
            raise ValidationError('Debe incluir al menos un bien.')
        bienes = []
        for bid in bien_ids:
            bien = BienRepository.get_by_id(bid)
            if not bien:
                raise ValidationError(f'Bien id={bid} no encontrado.')
            if not bien.is_active:
                raise ValidationError(f'El bien id={bid} está dado de baja.')
            bienes.append(bien)
        propietario_ids = {b.usuario_asignado_id for b in bienes}
        if len(propietario_ids) > 1:
            raise ValidationError(
                'Todos los bienes deben pertenecer al mismo usuario asignado.'
            )
        usuario_propietario_id = propietario_ids.pop()
        if usuario_propietario_id is None:
            raise ValidationError(
                'Los bienes no tienen usuario asignado. '
                'Asigne los bienes antes de registrar el mantenimiento.'
            )
        mantenimiento = MantenimientoRepository.create({
            **data,
            'numero_orden':           MantenimientoRepository.generate_numero_orden(),
            'estado_mantenimiento':   'EN_PROCESO',
            'usuario_realiza_id':     usuario_realiza_id,
            'sede_id':                sede_id,
            'modulo_id':              modulo_id,
            'usuario_propietario_id': usuario_propietario_id,
            'fecha_inicio_mant':      timezone.now().date(),
        })
        MantenimientoDetalleRepository.bulk_create(mantenimiento, bienes)
        TransferenciaService._cambiar_estado_bienes(bienes, 'EN_MANTENIMIENTO')
        MantenimientoAprobacionRepository.registrar(
            mantenimiento, 'asistSistema', 'REGISTRADO', usuario_realiza_id,
            observacion='Mantenimiento registrado.',
        )
        return {
            'success': True,
            'message': f'Mant. Nro. {mantenimiento.numero_orden} registrado exitosamente.',
        }
    @staticmethod
    @transaction.atomic
    def enviar_a_aprobacion(
        pk: int,
        usuario_id: int,
        detalles_tecnicos: List[Dict],
    ) -> Dict[str, Any]:
        m = MantenimientoService._get_or_404(pk)
        if m.estado_mantenimiento not in ('EN_PROCESO', 'DEVUELTO'):
            raise ValidationError(
                f'No se puede enviar a aprobación desde el estado '
                f'"{m.estado_mantenimiento}".'
            )
        detalle_map = {
            d.bien_id: d
            for d in MantenimientoDetalleRepository.get_by_mantenimiento(m)
        }
        for item in detalles_tecnicos:
            bien_id = item.get('bien_id')
            det = detalle_map.get(bien_id)
            if not det:
                raise ValidationError(
                    f'El bien id={bien_id} no pertenece a este mantenimiento.'
                )
            ef_id = item.get('estado_funcionamiento_final_id')
            if not ef_id:
                raise ValidationError(
                    f'Debe indicar el estado de funcionamiento final '
                    f'para el bien id={bien_id}.'
                )
            if not CatEstadoFuncionamiento.objects.filter(pk=ef_id).exists():
                raise ValidationError(
                    f'Estado de funcionamiento id={ef_id} no existe.'
                )
            MantenimientoDetalleRepository.update_detalle(
                detalle=det,
                estado_funcionamiento_final_id=ef_id,
                diagnostico_inicial=item.get('diagnostico_inicial', ''),
                trabajo_realizado=item.get('trabajo_realizado', ''),
                diagnostico_final=item.get('diagnostico_final', ''),
                observacion_detalle=item.get('observacion_detalle', ''),
            )

        MantenimientoRepository.update_fields(m, {
            'estado_mantenimiento': 'PENDIENTE_APROBACION',
            'fecha_termino_mant':   timezone.now().date(),
        })
        MantenimientoAprobacionRepository.registrar(
            m, 'asistSistema', 'ENVIADO', usuario_id,
            observacion='Informe técnico completado. Enviado a aprobación.',
        )
        return {'success': True, 'message': 'Mantenimiento enviado a aprobación.'}
    @staticmethod
    def listar_pendientes_aprobacion(role: str, sede_id: int, modulo_id: int, token: str):
        ESTADOS_EXCLUIDOS = ['ATENDIDO', 'CANCELADO']
        if role == 'SYSADMIN':
            qs = MantenimientoRepository.filter({})
            qs = qs.exclude(estado_mantenimiento__in=ESTADOS_EXCLUIDOS) 
        elif role in ('coordSistema', 'adminSede'):
            filtros = Q()
            filtros |= Q(
                estado_mantenimiento='PENDIENTE_APROBACION',
                aprobado_por_adminsede_id__isnull=True,
                sede_id=sede_id,
            )
            qs = MantenimientoRepository.filter({})
            qs = qs.filter(filtros)
        qs = qs.order_by('-fecha_registro')
        lista = list(qs)
        for tr in lista:
            MantenimientoService._enriquecer(tr, token)
            _ = list(tr.detalles.all()) 
        return lista
    @staticmethod
    def _validar_acceso_aprobador(m: Mantenimiento, sede_id: int, modulo_id: Optional[int]) -> None:
        if m.sede_id == sede_id:
            return
        if m.sede_id == COORD_SEDE_ID and sede_id == COORD_SEDE_ID and modulo_id == COORD_MODULO_ID:
            return
        raise PermissionDenied('No tiene acceso para operar mantenimientos de esta sede.')
    @staticmethod
    @transaction.atomic
    def aprobar(
        pk: int,
        aprobador_id: int,
        role: str,
        sede_id: int,
        modulo_id: Optional[int],
        observacion: str = '',
        cookie: str = '',
    ) -> Dict[str, Any]:
        m = MantenimientoService._get_or_404(pk)
        if m.estado_mantenimiento != 'PENDIENTE_APROBACION':
            raise ValidationError(
                f'Solo se puede aprobar desde PENDIENTE_APROBACION. '
                f'Estado actual: "{m.estado_mantenimiento}".'
            )
        MantenimientoService._validar_acceso_aprobador(m, sede_id, modulo_id)
        now = timezone.now()
        MantenimientoRepository.update_fields(m, {
            'aprobado_por_adminsede_id':  aprobador_id,
            'fecha_aprobacion_adminsede': now,
            'estado_mantenimiento':       'APROBADO',
        })
        MantenimientoAprobacionRepository.registrar(
            m, role, 'APROBADO', aprobador_id, observacion='Aprobado',
        )
        
        MantenimientoService._guardar_pdf(m, cookie=cookie)
        return {
            'success': True,
            'message': (
                'Mantenimiento aprobado. '
                'PDF del acta generado. '
                'Proceda a imprimir, obtener la firma del propietario '
                'y subir el documento firmado para cerrar el proceso.'
            ),
        }
    @staticmethod
    @transaction.atomic
    def devolver(
        pk: int,
        aprobador_id: int,
        role: str,
        sede_id: int,
        modulo_id: Optional[int],
        motivo: str,
    ) -> Dict[str, Any]:
        m = MantenimientoService._get_or_404(pk)
        if m.estado_mantenimiento != 'PENDIENTE_APROBACION':
            raise ValidationError(
                'Solo se puede devolver desde PENDIENTE_APROBACION.'
            )
        MantenimientoService._validar_acceso_aprobador(m, sede_id, modulo_id)
        MantenimientoRepository.update_fields(m, {
            'estado_mantenimiento':       'DEVUELTO',
            'aprobado_por_adminsede_id':  None,
            'fecha_aprobacion_adminsede': None,
            'pdf_path':                   None,
            'fecha_pdf':                  None,
        })
        MantenimientoAprobacionRepository.registrar(
            m, role, 'DEVUELTO', aprobador_id, observacion=motivo,
        )
        return {'success': True, 'message': 'Mantenimiento devuelto para corrección.'}
    @staticmethod
    @transaction.atomic
    def subir_pdf_firmado(pk: int,archivo,usuario_id: int,role: str,) -> Dict[str, Any]:
        m = MantenimientoService._get_or_404(pk)
        if m.estado_mantenimiento != 'APROBADO':
            raise ValidationError(
                'Solo se puede subir el documento firmado cuando '
                'el estado es APROBADO.'
            )
        media_root = getattr(settings, 'MEDIA_ROOT', 'media')
        carpeta    = os.path.join(media_root, 'mantenimientos', 'pdfs', 'firmados')
        os.makedirs(carpeta, exist_ok=True)

        ext    = os.path.splitext(getattr(archivo, 'name', '.pdf'))[-1].lower() or '.pdf'
        nombre = f'MNT-{m.pk}-FIRMADO-{timezone.now().strftime("%Y%m%d%H%M%S")}{ext}'
        ruta   = os.path.join(carpeta, nombre)
        with open(ruta, 'wb') as f:
            for chunk in archivo.chunks():
                f.write(chunk)
        now = timezone.now()
        for det in MantenimientoDetalleRepository.get_by_mantenimiento(m):
            bien    = det.bien
            updates = {'fecha_ultimo_mantenimiento': now.date()}
            if det.estado_funcionamiento_final_id:
                updates['estado_funcionamiento_id'] = det.estado_funcionamiento_final_id
            BienRepository.update_fields(bien, updates)
        detalles = m.detalles.all()
        lista_bienes = [d.bien for d in detalles]
        TransferenciaService._cambiar_estado_bienes(lista_bienes, 'ACTIVO')
        MantenimientoRepository.update_fields(m, {
            'pdf_firmado_path':   os.path.join('mantenimientos', 'pdfs', 'firmados', nombre),
            'fecha_pdf_firmado':  now,
            'subido_por_id':      usuario_id,
            'estado_mantenimiento': 'ATENDIDO',
        })
        MantenimientoAprobacionRepository.registrar(
            m, role, 'ATENDIDO', usuario_id,
            observacion='Documento firmado subido. Proceso cerrado.',
        )
        return {
            'success': True,
            'message': 'Documento firmado subido. Mantenimiento ATENDIDO.',
        }
    @staticmethod
    @transaction.atomic
    def cancelar(
        pk: int,
        usuario_id: int,
        role: str,
        motivo_cancelacion_id: int,
        detalle: str,
    ) -> Dict[str, Any]:
        m = MantenimientoService._get_or_404(pk)
        if m.estado_mantenimiento in ('ATENDIDO', 'CANCELADO'):
            raise ValidationError(
                f'No se puede cancelar un mantenimiento en estado '
                f'"{m.estado_mantenimiento}".'
            )
        detalles = m.detalles.all()
        if not detalles:
            raise ValidationError("El mantenimiento no tiene bienes asociados.")
        lista_bienes = [d.bien for d in detalles]          
        MantenimientoRepository.update_fields(m, {
            'estado_mantenimiento':  'CANCELADO',
            'motivo_cancelacion_id': motivo_cancelacion_id,
            'detalle_cancelacion':   detalle,
            'fecha_cancelacion':     timezone.now(),
        })
        TransferenciaService._cambiar_estado_bienes(lista_bienes, 'ACTIVO')
        MantenimientoAprobacionRepository.registrar(
            m, role, 'CANCELADO', usuario_id, observacion=detalle,
        )
        return {'success': True, 'message': 'Mantenimiento cancelado Exitosamente.'}
    @staticmethod
    def subir_imagen(
        pk: int,
        imagen,
        descripcion: str,
        usuario_id: int,
    ) -> Dict[str, Any]:
        m = MantenimientoService._get_or_404(pk)
        if m.estado_mantenimiento not in ('EN_PROCESO', 'DEVUELTO'):
            raise ValidationError(
                f'Solo se pueden subir imágenes cuando el mantenimiento '
                f'está EN_PROCESO o DEVUELTO. '
                f'Estado actual: "{m.estado_mantenimiento}".'
            )
        MantenimientoImagenRepository.create(m, imagen, descripcion)
        if not m.tiene_imagenes:
            MantenimientoRepository.update_fields(m, {'tiene_imagenes': True})
        return {'success': True, 'message': 'Imagen subida exitosamente.'}
    @staticmethod
    def obtener_documento(pk: int, cookie: str = '') -> bytes:
        m = MantenimientoService._get_or_404(pk)
        if m.estado_mantenimiento not in ('APROBADO', 'ATENDIDO'):
            raise ValidationError(
                'El documento solo está disponible cuando el estado '
                'es APROBADO o ATENDIDO.'
            )
        media_root = getattr(settings, 'MEDIA_ROOT', 'media')
        def _leer(rel_path: str) -> bytes:
            full = os.path.join(media_root, rel_path)
            if os.path.exists(full):
                with open(full, 'rb') as f:
                    return f.read()
            return b''
        if m.pdf_firmado_path:
            data = _leer(m.pdf_firmado_path)
            if data:
                return data
        if m.pdf_path:
            data = _leer(m.pdf_path)
            if data:
                return data
        return generar_pdf_mantenimiento(m, cookie=cookie)
    