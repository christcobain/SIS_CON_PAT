import os
from typing import Dict, Any, List
from .pdf_generator import generar_pdf_mantenimiento
from django.conf import settings
from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import ValidationError, NotFound
from .repositories import (MantenimientoRepository,MantenimientoDetalleRepository,MantenimientoAprobacionRepository,
    MantenimientoImagenRepository)
from bienes.repositories import BienRepository
from catalogos.models import CatEstadoFuncionamiento
from shared.clients import MsUsuariosClient

class MantenimientoService:
    @staticmethod
    def _get_or_404(pk: int):
        m = MantenimientoRepository.get_by_id(pk)
        if not m:
            raise NotFound(f'Mantenimiento id={pk} no encontrado.')
        return m
    @staticmethod
    def _guardar_pdf(m, cookie: str = '') -> None:
        try:
            pdf_bytes = generar_pdf_mantenimiento(m, cookie=cookie)
            carpeta = os.path.join(settings.MEDIA_ROOT, 'mantenimientos', 'pdfs')
            os.makedirs(carpeta, exist_ok=True)
            nombre   = f'MNT-{m.pk}-{timezone.now().strftime("%Y%m%d%H%M%S")}.pdf'
            ruta     = os.path.join(carpeta, nombre)
            with open(ruta, 'wb') as f:
                f.write(pdf_bytes)
            MantenimientoRepository.update_fields(m, {
                'pdf_path':  os.path.join('mantenimientos', 'pdfs', nombre),
                'fecha_pdf': timezone.now(),
            })
        except Exception:
            pass  
    @staticmethod
    @transaction.atomic
    def crear(data: Dict[str, Any],usuario_realiza_id: int,sede_id: int,modulo_id:int) -> Dict[str, Any]:
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
            'estado':                 'EN_PROCESO',
            'usuario_realiza_id':     usuario_realiza_id,
            'sede_id':                sede_id,
            'modulo_id':              modulo_id,            
            'usuario_propietario_id': usuario_propietario_id,
        })
        MantenimientoDetalleRepository.bulk_create(mantenimiento, bienes)
        return {
            'success': True,
            'message': f'Mantenimiento {mantenimiento.numero_orden} registrado.',
            'data': mantenimiento,
        }
    @staticmethod
    def get_user_name(user_id,token):
            if not user_id:
                return None
            try:
                usuario = MsUsuariosClient.validar_usuario(user_id, token)
                if usuario and isinstance(usuario, dict):
                    return f"{usuario.get('first_name', '')} {usuario.get('last_name', '')}".strip()
                return "Usuario no encontrado"
            except Exception:
                return "Error en consulta"
    @staticmethod
    def _enriquecer_transferencia(tr, token):        
        sede_origen = MsUsuariosClient.validar_sede(tr.sede_id, token)
        tr.sede_nombre = sede_origen.get('nombre') if sede_origen else None        
        if tr.modulo_id:
            modulo = MsUsuariosClient.validar_modulo(tr.modulo_id, token)
            tr.modulo_nombre = modulo.get('nombre') if modulo else None
        else:
            tr.modulo_nombre = None      
        tr.usuario_propietario_nombre = MantenimientoService.get_user_name(tr.usuario_propietario_id,token)           
        tr.aprobado_por_adminsede_nombre = MantenimientoService.get_user_name(tr.aprobado_por_adminsede_id, token)
        tr.confirmado_por_propietario_nombre  = MantenimientoService.get_user_name(tr.confirmado_por_propietario_id, token)
        return tr  
    @staticmethod
    def listar(filters: Dict[str, Any],token) -> Dict[str, Any]:
        qs=MantenimientoRepository.filter(filters)
        for tr in qs:
            MantenimientoService._enriquecer_transferencia(tr, token)
            _ = list(tr.detalles.all())
        return qs
    @staticmethod
    def mis_mantenimientos(usuario_id: int,role: str,sede_id: int,filters: Dict[str, Any],) -> Dict[str, Any]:
        qs = MantenimientoRepository.filter_mis_mantenimientos(usuario_id, role, sede_id)
        if filters.get('estado'):
            qs = qs.filter(estado=filters['estado'])
        return {'success': True, 'data': qs}
    @staticmethod
    def obtener(pk: int,token) -> Dict[str, Any]:
        mant=MantenimientoRepository.get_by_id(pk)
        if not mant:
            raise ValidationError("Mantenimiento no existe")
        MantenimientoService._enriquecer_transferencia(mant, token)
        _ = list(mant.detalles.all())
        return mant
    @staticmethod
    @transaction.atomic
    def enviar_a_aprobacion(pk: int,usuario_id: int,trabajos_realizados: str,diagnostico: str,detalles_estado: List[Dict],) -> Dict[str, Any]:
        m = MantenimientoService._get_or_404(pk)
        if m.estado not in ('EN_PROCESO', 'DEVUELTO'):
            raise ValidationError(
                f'No se puede enviar a aprobación desde el estado "{m.estado}".'
            )
        detalle_map = {d.bien_id: d for d in MantenimientoDetalleRepository.get_by_mantenimiento(m)}
        for item in detalles_estado:
            det = detalle_map.get(item.get('bien_id'))
            if det and item.get('estado_funcionamiento_id'):
                if not CatEstadoFuncionamiento.objects.filter(pk=item['estado_funcionamiento_id']).exists():
                    raise ValidationError(
                        f'Estado de funcionamiento id={item["estado_funcionamiento_id"]} no existe.'
                    )
                MantenimientoDetalleRepository.update_estado_despues(
                    det,
                    item['estado_funcionamiento_id'],
                    item.get('observacion', ''),
                )
        MantenimientoRepository.update_fields(m, {
            'trabajos_realizados': trabajos_realizados,
            'diagnostico_final':   diagnostico,
            'fecha_termino':       timezone.now().date(),
            'estado':              'PENDIENTE_APROBACION',
            'motivo_devolucion':   None,
        })
        MantenimientoAprobacionRepository.registrar(
            m, 'ASISTSISTEMA', 'APROBADO', usuario_id,
            observacion='Enviado a aprobación por ASISTSISTEMA.',
        )
        return {'success': True, 'message': 'Mantenimiento enviado a aprobación.'}
    @staticmethod
    @transaction.atomic
    def aprobar(pk: int,adminsede_id: int,role: str,sede_id: int,observacion: str = '') -> Dict[str, Any]:
        m = MantenimientoService._get_or_404(pk)
        if m.estado != 'PENDIENTE_APROBACION':
            raise ValidationError(
                f'Solo se puede aprobar desde PENDIENTE_APROBACION. Estado actual: "{m.estado}".'
            )
        if role not in ('adminSede', 'coordSistema', 'SYSADMIN'):
            raise ValidationError('Solo ADMINSEDE, COORDSISTEMA o SYSADMIN pueden aprobar.')
        if role == 'adminSede' and m.sede_id != sede_id:
            raise ValidationError('Solo puede aprobar mantenimientos de su propia sede.')
        MantenimientoRepository.update_fields(m, {
            'aprobado_por_adminsede_id': adminsede_id,
            'fecha_aprobacion':          timezone.now(),
            'estado':                    'EN_ESPERA_CONFORMIDAD',
        })
        MantenimientoAprobacionRepository.registrar(
            m, 'ADMINSEDE', 'APROBADO', adminsede_id, observacion=observacion,
        )
        return {'success': True, 'message': 'Mantenimiento aprobado. En espera de conformidad del propietario.'}
    @staticmethod
    @transaction.atomic
    def confirmar_conformidad(pk: int,usuario_id: int,cookie: str = '') -> Dict[str, Any]:
        m = MantenimientoService._get_or_404(pk)
        if m.estado != 'EN_ESPERA_CONFORMIDAD':
            raise ValidationError(
                f'Solo se puede confirmar desde EN_ESPERA_CONFORMIDAD. Estado actual: "{m.estado}".'
            )
        if m.usuario_propietario_id != usuario_id:
            raise ValidationError(
                'Solo el propietario de los bienes puede dar conformidad al mantenimiento.'
            )
        now = timezone.now()
        for det in MantenimientoDetalleRepository.get_by_mantenimiento(m):
            bien    = det.bien
            updates = {'fecha_ultimo_mantenimiento': now.date()}
            if det.estado_funcionamiento_despues_id:
                updates['estado_funcionamiento_id'] = det.estado_funcionamiento_despues_id
            BienRepository.update_fields(bien, updates)
        MantenimientoRepository.update_fields(m, {
            'confirmado_por_propietario_id': usuario_id,
            'fecha_conformidad':             now,
            'estado':                        'ATENDIDO',
        })
        MantenimientoAprobacionRepository.registrar(
            m, 'PROPIETARIO', 'CONFIRMADO', usuario_id,
            observacion='Conformidad confirmada por el propietario del bien.',
        )
        MantenimientoService._guardar_pdf(m, cookie=cookie)
        return {'success': True, 'message': 'Conformidad registrada. Mantenimiento ATENDIDO.'}
    @staticmethod
    @transaction.atomic
    def devolver(pk: int,adminsede_id: int,role: str,sede_id: int,motivo: str,) -> Dict[str, Any]:
        m = MantenimientoService._get_or_404(pk)
        if m.estado != 'PENDIENTE_APROBACION':
            raise ValidationError('Solo se puede devolver desde PENDIENTE_APROBACION.')
        if role not in ('adminSede', 'coordSistema', 'SYSADMIN'):
            raise ValidationError('Solo ADMINSEDE o COORDSISTEMA pueden devolver.')
        if role == 'adminSede' and m.sede_id != sede_id:
            raise ValidationError('Solo puede devolver mantenimientos de su propia sede.')
        MantenimientoRepository.update_fields(m, {
            'estado':            'DEVUELTO',
            'motivo_devolucion': motivo,
        })
        MantenimientoAprobacionRepository.registrar(
            m, 'ADMINSEDE', 'DEVUELTO', adminsede_id, observacion=motivo,
        )
        return {'success': True, 'message': 'Mantenimiento devuelto para corrección.'}
    @staticmethod
    @transaction.atomic
    def cancelar(pk: int,usuario_id: int,motivo_cancelacion_id: int,detalle: str) -> Dict[str, Any]:
        m = MantenimientoService._get_or_404(pk)
        if m.estado in ('ATENDIDO', 'CANCELADO'):
            raise ValidationError(
                f'No se puede cancelar un mantenimiento en estado "{m.estado}".'
            )
        MantenimientoRepository.update_fields(m, {
            'estado':                'CANCELADO',
            'motivo_cancelacion_id': motivo_cancelacion_id,
            'detalle_cancelacion':   detalle,
            'fecha_cancelacion':     timezone.now(),
        })
        MantenimientoAprobacionRepository.registrar(
            m, 'ASISTSISTEMA', 'CANCELADO', usuario_id, observacion=detalle,
        )
        return {'success': True, 'message': 'Mantenimiento cancelado.'}
    @staticmethod
    def subir_imagen(
        pk: int,
        imagen,
        descripcion: str,
        usuario_id: int,
    ) -> Dict[str, Any]:
        m = MantenimientoService._get_or_404(pk)
        if m.estado not in ('EN_PROCESO', 'DEVUELTO'):
            raise ValidationError(
                f'Solo se pueden subir imágenes cuando el mantenimiento está EN_PROCESO o DEVUELTO. '
                f'Estado actual: "{m.estado}".'
            )
        MantenimientoImagenRepository.create(m, imagen, descripcion)
        if not m.tiene_imagenes:
            MantenimientoRepository.update_fields(m, {'tiene_imagenes': True})
        return {'success': True, 'message': 'Imagen subida exitosamente.'}
    @staticmethod
    def subir_firmado(pk: int, archivo, usuario_id: int) -> Dict[str, Any]:
        m = MantenimientoService._get_or_404(pk)
        if m.estado != 'ATENDIDO':
            raise ValidationError('Solo se puede subir el firmado cuando estado = ATENDIDO.')
        carpeta = os.path.join(settings.MEDIA_ROOT, 'mantenimientos', 'pdfs', 'firmados')
        os.makedirs(carpeta, exist_ok=True)
        ext    = os.path.splitext(archivo.name)[-1].lower() or '.pdf'
        nombre = f'MNT-{m.pk}-FIRMADO-{timezone.now().strftime("%Y%m%d%H%M%S")}{ext}'
        ruta   = os.path.join(carpeta, nombre)
        with open(ruta, 'wb') as f:
            for chunk in archivo.chunks():
                f.write(chunk)
        MantenimientoRepository.update_fields(m, {
            'pdf_firmado_path': os.path.join('mantenimientos', 'pdfs', 'firmados', nombre),
        })
        return {'success': True, 'message': 'Documento firmado guardado exitosamente.'}
    @staticmethod
    def obtener_documento(pk: int, cookie: str = '') -> bytes:
        m = MantenimientoService._get_or_404(pk)
        if m.estado != 'ATENDIDO':
            raise ValidationError('El documento solo está disponible cuando estado = ATENDIDO.')
        def _leer(rel_path: str) -> bytes:
            full = os.path.join(settings.MEDIA_ROOT, rel_path)
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
    