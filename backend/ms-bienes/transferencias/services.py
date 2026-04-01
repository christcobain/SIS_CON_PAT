import os
import logging
from typing import Dict, Any, List
from .pdf_generator import generar_pdf_transferencia
from django.conf import settings
from django.db.models import Q
from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import ValidationError, NotFound, PermissionDenied
from .repositories import (
    TransferenciaRepository,
    TransferenciaDetalleRepository,
    TransferenciaAprobacionRepository,
)
from bienes.repositories import BienRepository
from shared.clients import MsUsuariosClient
from shared.storage_client import subir_pdf, subir_pdf_firmado, descargar_pdf
from catalogos.models import CatEstadoBien

logger = logging.getLogger(__name__)

ROLES_REGISTRA_TRASLADO   = {'ANALISTASISTEMA', 'COORDSISTEMA', 'SYSADMIN'}
ROLES_REGISTRA_ASIGNACION = {'ASISTSISTEMA', 'SYSADMIN'}
ROLES_ADMINSEDE           = {'ADMINSEDE', 'COORDSISTEMA', 'SYSADMIN'}
ROLES_SEGURSEDE           = {'SEGURSEDE', 'SYSADMIN'}
MODULO_COORD_INFORMATICA  = 1


class TransferenciaService:

    @staticmethod
    def _rol_aprobador_adminsede(role: str) -> str:
        return role if role == 'COORDSISTEMA' else 'ADMINSEDE'

    @staticmethod
    def _validar_aprobador_adminsede(role, sede_aprobador_id, modulo_aprobador_id, sede_origen_id, modulo_origen_id):
        if role == 'SYSADMIN':
            return
        es_coord_informatica = (sede_origen_id == 1 and modulo_origen_id == MODULO_COORD_INFORMATICA)
        if es_coord_informatica:
            if role != 'COORDSISTEMA':
                raise PermissionDenied('Solo COORDSISTEMA puede aprobar traslados del módulo Coordinación de Informática.')
            if sede_aprobador_id != sede_origen_id:
                raise PermissionDenied('COORDSISTEMA debe pertenecer a la sede central para aprobar.')
        else:
            if role != 'ADMINSEDE':
                raise PermissionDenied('Solo ADMINSEDE puede aprobar traslados de esta sede.')
            if sede_aprobador_id != sede_origen_id:
                raise PermissionDenied('Solo puede aprobar traslados de su propia sede.')

    @staticmethod
    def _validar_sede_segursede(sede_segur_id: int, sede_transferencia_id: int, role: str):
        if role == 'SYSADMIN':
            return
        if sede_segur_id != sede_transferencia_id:
            raise PermissionDenied('Personal de Seguridad solo puede aprobar/rechazar salidas/entradas de transferencias de su propia sede.')

    @staticmethod
    def _extraer_origen(bienes: list) -> Dict[str, Any]:
        bien_ref = bienes[0]
        return {
            'usuario_origen_id':   bien_ref.usuario_asignado_id,
            'sede_origen_id':      bien_ref.sede_id,
            'modulo_origen_id':    bien_ref.modulo_id,
            'ubicacion_origen_id': bien_ref.ubicacion_id,
            'piso_origen':         bien_ref.piso,
        }

    @staticmethod
    def _cambiar_estado_bienes(bienes: list, nombre_estado: str) -> None:
        estado = CatEstadoBien.objects.filter(nombre__iexact=nombre_estado, is_active=True).first()
        if not estado:
            raise ValidationError(f'Estado "{nombre_estado}" no configurado en catálogos.')
        for item in bienes:
            bien = getattr(item, 'bien', item)
            BienRepository.update_fields(bien, {'estado_bien_id': estado.id})

    @staticmethod
    def _restaurar_estado_bienes(transferencia, nombre_estado: str = 'ACTIVO') -> None:
        estado = CatEstadoBien.objects.filter(nombre__iexact=nombre_estado, is_active=True).first()
        if not estado:
            raise ValidationError(f'Estado "{nombre_estado}" no configurado en catálogos.')
        detalles = TransferenciaDetalleRepository.get_by_transferencia_con_bienes(transferencia)
        for detalle in detalles:
            BienRepository.update_fields(detalle.bien, {'estado_bien_id': estado.id})

    @staticmethod
    def _get_bienes_validados(bien_ids: List[int], exclude_transferencia_id: int = None) -> list:
        if not bien_ids:
            raise ValidationError('Debe incluir al menos un bien.')
        bienes = []
        for bid in bien_ids:
            bien = BienRepository.get_by_id(bid)
            if not bien:
                raise ValidationError(f'Bien id={bid} no encontrado.')
            estado = bien.estado_bien.nombre.upper() if bien.estado_bien else None
            if estado != 'ACTIVO':
                raise ValidationError(f'El bien "{bien.codigo_patrimonial}" no está disponible. Estado actual: {estado}.')
            transferencia_activa = TransferenciaDetalleRepository.get_transferencia_activa_por_bien(
                bid, exclude_transferencia_id=exclude_transferencia_id,
            )
            if transferencia_activa:
                t = transferencia_activa.transferencia
                raise ValidationError(
                    f'El bien "{bien.codigo_patrimonial}" ya tiene una transferencia activa '
                    f'(#{t.numero_orden} — estado: {t.estado_transferencia}). '
                    'Debe cancelarse antes de incluirlo en otra transferencia.'
                )
            bienes.append(bien)
        sedes   = {b.sede_id for b in bienes}
        modulos = {b.modulo_id for b in bienes}
        if len(sedes) > 1:
            raise ValidationError('Todos los bienes deben pertenecer a la misma sede origen.')
        if len(modulos) > 1:
            raise ValidationError('Todos los bienes deben pertenecer al mismo módulo origen.')
        return bienes

    @staticmethod
    def _get_or_404(pk: int):
        t = TransferenciaRepository.get_by_id(pk)
        if not t:
            raise NotFound(f'Transferencia con id={pk} no encontrada.')
        return t

    @staticmethod
    def _registrar_aprobacion(transferencia, rol_aprobador: str, accion: str, usuario_id: int, detalle: str = None) -> None:
        TransferenciaAprobacionRepository.create(
            transferencia=transferencia,
            rol_aprobador=rol_aprobador,
            accion=accion,
            usuario_id=usuario_id,
            detalle=detalle,
        )

    @staticmethod
    def _aplicar_traslado(transferencia) -> None:
        detalles = TransferenciaDetalleRepository.get_by_transferencia_con_bienes(transferencia)
        for detalle in detalles:
            BienRepository.update_fields(detalle.bien, {
                'sede_id':             transferencia.sede_destino_id,
                'modulo_id':           transferencia.modulo_destino_id,
                'ubicacion_id':        transferencia.ubicacion_destino_id,
                'piso':                transferencia.piso_destino,
                'usuario_asignado_id': transferencia.usuario_destino_id,
            })

    @staticmethod
    def _aplicar_asignacion(transferencia) -> None:
        detalles = TransferenciaDetalleRepository.get_by_transferencia_con_bienes(transferencia)
        for detalle in detalles:
            BienRepository.update_fields(detalle.bien, {
                'modulo_id':           transferencia.modulo_destino_id,
                'ubicacion_id':        transferencia.ubicacion_destino_id,
                'piso':                transferencia.piso_destino,
                'usuario_asignado_id': transferencia.usuario_destino_id,
            })

    @staticmethod
    def _guardar_pdf(transferencia, cookie: str = '') -> None:
        try:
            pdf_bytes = generar_pdf_transferencia(transferencia, cookie=cookie)
        except Exception as e:
            logger.error('Error generando PDF %s: %s', transferencia.numero_orden, e)
            return
        try:
            nombre_archivo = f'{transferencia.numero_orden}.pdf'
            ruta = subir_pdf(pdf_bytes, nombre_archivo)
            TransferenciaRepository.update_fields(transferencia, {
                'pdf_path':  ruta,
                'fecha_pdf': timezone.now(),
            })
        except Exception as e:
            logger.error('Error subiendo PDF a Supabase Storage: %s', e)

    @staticmethod
    def get_user_name(user_id, token):
        if not user_id:
            return None
        try:
            usuario = MsUsuariosClient.validar_usuario(user_id, token)
            if usuario and isinstance(usuario, dict):
                return f"{usuario.get('first_name', '')} {usuario.get('last_name', '')}".strip()
            return 'Usuario no encontrado'
        except Exception:
            return 'Error en consulta'

    @staticmethod
    def _enriquecer_transferencia(tr, token):
        tr.usuario_origen_nombre = TransferenciaService.get_user_name(tr.usuario_origen_id, token)
        sede_origen = MsUsuariosClient.validar_sede(tr.sede_origen_id, token)
        tr.sede_origen_nombre = sede_origen.get('nombre') if sede_origen else None
        if tr.modulo_origen_id:
            modulo = MsUsuariosClient.validar_modulo(tr.modulo_origen_id, token)
            tr.modulo_origen_nombre = modulo.get('nombre') if modulo else None
        else:
            tr.modulo_origen_nombre = None
        if tr.ubicacion_origen_id:
            ubicacion = MsUsuariosClient.validar_ubicacion(tr.ubicacion_origen_id, token)
            tr.ubicacion_origen_nombre = ubicacion.get('nombre') if ubicacion else None
        else:
            tr.ubicacion_origen_nombre = None
        tr.usuario_destino_nombre = TransferenciaService.get_user_name(tr.usuario_destino_id, token)
        sede_destino = MsUsuariosClient.validar_sede(tr.sede_destino_id, token)
        tr.sede_destino_nombre = sede_destino.get('nombre') if sede_destino else None
        if tr.modulo_destino_id:
            modulo = MsUsuariosClient.validar_modulo(tr.modulo_destino_id, token)
            tr.modulo_destino_nombre = modulo.get('nombre') if modulo else None
        else:
            tr.modulo_destino_nombre = None
        if tr.ubicacion_destino_id:
            ubicacion = MsUsuariosClient.validar_ubicacion(tr.ubicacion_destino_id, token)
            tr.ubicacion_destino_nombre = ubicacion.get('nombre') if ubicacion else None
        else:
            tr.ubicacion_destino_nombre = None
        tr.aprobado_por_adminsede_nombre         = TransferenciaService.get_user_name(tr.aprobado_por_adminsede_id, token)
        tr.aprobado_segur_salida_nombre          = TransferenciaService.get_user_name(tr.aprobado_segur_salida_id, token)
        tr.aprobado_segur_entrada_nombre         = TransferenciaService.get_user_name(tr.aprobado_segur_entrada_id, token)
        tr.confirmado_por_usuario_destino_nombre = TransferenciaService.get_user_name(tr.confirmado_por_usuario_destino_id, token)
        tr.aprobado_retorno_salida_nombre        = TransferenciaService.get_user_name(tr.aprobado_retorno_salida_id, token)
        tr.aprobado_retorno_entrada_nombre       = TransferenciaService.get_user_name(tr.aprobado_retorno_entrada_id, token)
        for aprob in tr.aprobaciones.all():
            aprob.usuario_nombre = TransferenciaService.get_user_name(aprob.usuario_id, token)
        ultima = tr.aprobaciones.last()
        if ultima:
            ultima.usuario_nombre = TransferenciaService.get_user_name(ultima.usuario_id, token)
        return tr

    @staticmethod
    def listar(filters, token):
        qs = TransferenciaRepository.listar(filters)
        for tr in qs:
            TransferenciaService._enriquecer_transferencia(tr, token)
            _ = list(tr.detalles.all())
        return qs

    @staticmethod
    def obtener(pk, token):
        tr = TransferenciaRepository.get_by_id(pk)
        if not tr:
            raise ValidationError('Transferencia no existe')
        TransferenciaService._enriquecer_transferencia(tr, token)
        _ = list(tr.detalles.all())
        return tr
    
    @staticmethod
    def mis_transferencias(usuario_id: int, role: str, sede_id: int, filters: Dict[str, Any], token):
        qs = TransferenciaRepository.get_mis_transferencias(usuario_id, role, sede_id)
        if hasattr(filters, 'dict'):
            
            filters = filters.dict()
        if filters.get('tipo'):
            qs = qs.filter(tipo=filters['tipo'])
        if filters.get('estado_transferencia'):
            qs = qs.filter(estado_transferencia=filters['estado_transferencia'])
        qs = qs.order_by('-fecha_registro')
        lista = list(qs)
        for tr in lista:
            TransferenciaService._enriquecer_transferencia(tr, token)
            _ = list(tr.detalles.all())
        return lista

    @staticmethod
    @transaction.atomic
    def crear_traslado_sede(data: Dict[str, Any], usuario_registra_id: int, sede_registra_id: int, role: str, token: str = None) -> Dict[str, Any]:
        print('token== ',token)
        if role not in ROLES_REGISTRA_TRASLADO:
            raise PermissionDenied('No tiene permiso para registrar traslados entre sedes.')
        bien_ids = data.pop('bien_ids', [])
        bienes   = TransferenciaService._get_bienes_validados(bien_ids)
        origen   = TransferenciaService._extraer_origen(bienes)
        if data['sede_destino_id'] == origen['sede_origen_id']:
            raise ValidationError('Bien asignado es de la misma Sede destino. Seleccione otro bien.')
        
        MsUsuariosClient.validar_usuario(data['usuario_destino_id'], token)
        MsUsuariosClient.validar_sede(data['sede_destino_id'], token)
        if data.get('modulo_destino_id'):
            MsUsuariosClient.validar_modulo(data['modulo_destino_id'], token)
        numero_orden  = TransferenciaRepository.generate_numero_orden()
        transferencia = TransferenciaRepository.create({
            **data,
            'numero_orden':         numero_orden,
            'tipo':                 'TRASLADO_SEDE',
            'estado_transferencia': 'PENDIENTE_APROBACION',
            **origen,
        })
        TransferenciaService._registrar_aprobacion(
            transferencia, 'REGISTRADOR', 'APROBADO', usuario_registra_id,
            detalle='Transferencia registrada exitosamente, Pendiente aprobación ADMINSEDE/COORDSISTEMA.',
        )
        TransferenciaDetalleRepository.bulk_create(transferencia, bienes)
        TransferenciaService._cambiar_estado_bienes(bienes, 'EN_TRASLADO')
        return {'success': True, 'message': f'Traslado Nro. {transferencia.numero_orden} registrado exitosamente.'}
    @staticmethod
    @transaction.atomic
    def crear_asignacion_interna(data: Dict[str, Any], usuario_registra_id: int, sede_registra_id: int, role: str, token: str = None) -> Dict[str, Any]:
        if role not in ROLES_REGISTRA_ASIGNACION:
            raise PermissionDenied('Solo ASISTSISTEMA puede registrar asignaciones internas.')
        bien_ids = data.pop('bien_ids', [])
        bienes   = TransferenciaService._get_bienes_validados(bien_ids)
        origen   = TransferenciaService._extraer_origen(bienes)
        if origen['sede_origen_id'] != sede_registra_id:
            raise PermissionDenied('Solo puede asignar bienes de su propia sede.')
        if data['sede_destino_id'] != sede_registra_id:
            raise PermissionDenied('La asignación interna no puede cambiar de sede.')
        MsUsuariosClient.validar_usuario(data['usuario_destino_id'], token)
        if data.get('modulo_destino_id'):
            MsUsuariosClient.validar_modulo(data['modulo_destino_id'], token)
        if data.get('ubicacion_destino_id'):
            MsUsuariosClient.validar_ubicacion(data['ubicacion_destino_id'], token)
        numero_orden  = TransferenciaRepository.generate_numero_orden()
        transferencia = TransferenciaRepository.create({
            **data,
            'numero_orden':         numero_orden,
            'tipo':                 'ASIGNACION_INTERNA',
            'estado_transferencia': 'PENDIENTE_APROBACION',
            **origen,
        })
        TransferenciaService._registrar_aprobacion(
            transferencia, 'REGISTRADOR', 'APROBADO', usuario_registra_id,
            detalle='Transferencia registrada exitosamente, Pendiente aprobación ADMINSEDE/COORDSISTEMA.',
        )
        TransferenciaDetalleRepository.bulk_create(transferencia, bienes)
        TransferenciaService._cambiar_estado_bienes(bienes, 'EN_ASIGNACION')
        return {'success': True, 'message': f'Asignación interna Nro. {transferencia.numero_orden} registrada exitosamente.'}

    @staticmethod
    @transaction.atomic
    def aprobar_ADMINSEDE(pk, aprobador_id, role, sede_aprobador_id, modulo_aprobador_id, cookie: str = ''):
        t = TransferenciaService._get_or_404(pk)
        if t.estado_transferencia != 'PENDIENTE_APROBACION':
            raise ValidationError(f'No se puede aprobar en estado "{t.estado_transferencia}".')
        if t.aprobado_por_adminsede_id:
            raise ValidationError('La transferencia ya fue aprobada previamente.')
        TransferenciaService._validar_aprobador_adminsede(role, sede_aprobador_id, modulo_aprobador_id, t.sede_origen_id, t.modulo_origen_id)
        rol_historial = TransferenciaService._rol_aprobador_adminsede(role)
        now = timezone.now()
        if t.tipo == 'ASIGNACION_INTERNA':
            TransferenciaService._aplicar_asignacion(t)
            TransferenciaRepository.update_fields(t, {
                'aprobado_por_adminsede_id':  aprobador_id,
                'fecha_aprobacion_adminsede': now,
                'estado_transferencia':       'EN_ESPERA_FIRMA',
            })
            TransferenciaService._registrar_aprobacion(t, rol_historial, 'APROBADO', aprobador_id, detalle='Asignación aprobada. Pendiente subir acta firmada.')
            TransferenciaService._guardar_pdf(t, cookie=cookie)
        else:
            TransferenciaRepository.update_fields(t, {
                'aprobado_por_adminsede_id':  aprobador_id,
                'fecha_aprobacion_adminsede': now,
            })
            TransferenciaService._registrar_aprobacion(t, rol_historial, 'APROBADO', aprobador_id, detalle='Traslado aprobado. Pendiente aprobación de seguridad.')
        return {'success': True, 'message': 'Aprobación registrada exitosamente.'}

    @staticmethod
    @transaction.atomic
    def devolver_ADMINSEDE(pk, aprobador_id, motivo, role, sede_aprobador_id, modulo_aprobador_id):
        t = TransferenciaService._get_or_404(pk)
        if t.estado_transferencia != 'PENDIENTE_APROBACION':
            raise ValidationError('Solo se puede devolver en estado PENDIENTE_APROBACION.')
        TransferenciaService._validar_aprobador_adminsede(role, sede_aprobador_id, modulo_aprobador_id, t.sede_origen_id, t.modulo_origen_id)
        rol_historial = TransferenciaService._rol_aprobador_adminsede(role)
        TransferenciaRepository.update_fields(t, {
            'estado_transferencia':       'DEVUELTO',
            'motivo_devolucion':          motivo,
            'aprobado_por_adminsede_id':  None,
            'fecha_aprobacion_adminsede': None,
        })
        TransferenciaService._registrar_aprobacion(t, rol_historial, 'DEVUELTO', aprobador_id, detalle=motivo)
        TransferenciaService._restaurar_estado_bienes(t, 'ACTIVO')
        return {'success': True, 'message': 'Transferencia devuelta para corrección.'}

    @staticmethod
    @transaction.atomic
    def aprobar_segur_salida(pk, segursede_id, role, sede_segur_id):
        if role not in ROLES_SEGURSEDE:
            raise PermissionDenied('Solo SEGURSEDE puede aprobar la salida física.')
        t = TransferenciaService._get_or_404(pk)
        TransferenciaService._validar_sede_segursede(sede_segur_id, t.sede_origen_id, role)
        if t.tipo != 'TRASLADO_SEDE':
            raise ValidationError('Solo aplica a traslados entre sedes.')
        if not t.aprobado_por_adminsede_id:
            raise ValidationError('Debe existir aprobación previa del administrador.')
        if t.aprobado_segur_salida_id:
            raise ValidationError('La salida física ya fue aprobada.')
        TransferenciaRepository.update_fields(t, {
            'aprobado_segur_salida_id':      segursede_id,
            'fecha_aprobacion_segur_salida': timezone.now(),
        })
        TransferenciaService._registrar_aprobacion(t, 'SEGUR_SALIDA', 'APROBADO', segursede_id, detalle='Salida física aprobada.')
        return {'success': True, 'message': 'Salida física aprobada por Personal de Seguridad.'}

    @staticmethod
    @transaction.atomic
    def rechazar_segur_salida(pk, segursede_id, motivo, role, sede_segur_id):
        if role not in ROLES_SEGURSEDE:
            raise PermissionDenied('Solo SEGURSEDE puede rechazar la salida física.')
        t = TransferenciaService._get_or_404(pk)
        TransferenciaService._validar_sede_segursede(sede_segur_id, t.sede_origen_id, role)
        if t.tipo != 'TRASLADO_SEDE':
            raise ValidationError('Solo aplica a traslados entre sedes.')
        if not t.aprobado_por_adminsede_id:
            raise ValidationError('No existe aprobación previa del administrador.')
        if t.aprobado_segur_salida_id:
            raise ValidationError('La salida ya fue aprobada, no se puede rechazar.')
        TransferenciaRepository.update_fields(t, {
            'estado_transferencia':       'DEVUELTO',
            'motivo_devolucion':          motivo,
            'aprobado_por_adminsede_id':  None,
            'fecha_aprobacion_adminsede': None,
        })
        TransferenciaService._registrar_aprobacion(t, 'SEGUR_SALIDA', 'RECHAZADO', segursede_id, detalle=motivo)
        TransferenciaService._restaurar_estado_bienes(t, 'ACTIVO')
        return {'success': True, 'message': 'Salida física rechazada.'}

    @staticmethod
    @transaction.atomic
    def aprobar_segur_entrada(pk, segursede_id, observacion, role, sede_segur_id):
        if role not in ROLES_SEGURSEDE:
            raise PermissionDenied('Solo SEGURSEDE puede aprobar la entrada física.')
        t = TransferenciaService._get_or_404(pk)
        TransferenciaService._validar_sede_segursede(sede_segur_id, t.sede_destino_id, role)
        if t.tipo != 'TRASLADO_SEDE':
            raise ValidationError('Solo aplica a traslados entre sedes.')
        if not t.aprobado_segur_salida_id:
            raise ValidationError('Debe aprobarse la salida física antes.')
        if t.aprobado_segur_entrada_id:
            raise ValidationError('La entrada física ya fue aprobada.')
        TransferenciaRepository.update_fields(t, {
            'aprobado_segur_entrada_id':      segursede_id,
            'fecha_aprobacion_segur_entrada': timezone.now(),
            'observacion_segursede':          observacion,
            'estado_transferencia':           'EN_ESPERA_CONFORMIDAD',
        })
        TransferenciaService._registrar_aprobacion(t, 'SEGUR_ENTRADA', 'APROBADO', segursede_id, detalle=observacion or 'Entrada física aprobada. Pendiente conformidad del usuario destino.')
        return {'success': True, 'message': 'Entrada física aprobada. Esperando conformidad del usuario destinatario.'}

    @staticmethod
    @transaction.atomic
    def rechazar_segur_entrada(pk, segursede_id, motivo, role, sede_segur_id):
        if role not in ROLES_SEGURSEDE:
            raise PermissionDenied('Solo SEGURSEDE puede rechazar la entrada física.')
        t = TransferenciaService._get_or_404(pk)
        TransferenciaService._validar_sede_segursede(sede_segur_id, t.sede_destino_id, role)
        if t.tipo != 'TRASLADO_SEDE':
            raise ValidationError('Solo aplica a traslados entre sedes.')
        if not t.aprobado_segur_salida_id:
            raise ValidationError('No existe aprobación de salida previa.')
        if t.aprobado_segur_entrada_id:
            raise ValidationError('La entrada ya fue aprobada.')
        TransferenciaRepository.update_fields(t, {
            'estado_transferencia': 'EN_RETORNO',
            'motivo_devolucion':    motivo,
        })
        TransferenciaService._registrar_aprobacion(t, 'SEGUR_ENTRADA', 'RECHAZADO', segursede_id, detalle=motivo)
        return {'success': True, 'message': 'Entrada rechazada. Bien en retorno a sede origen.'}

    @staticmethod
    @transaction.atomic
    def confirmar_recepcion(pk, usuario_destino_id, role, cookie: str = ''):
        t = TransferenciaService._get_or_404(pk)
        if t.tipo != 'TRASLADO_SEDE':
            raise ValidationError('Solo aplica a traslados entre sedes.')
        if t.estado_transferencia != 'EN_ESPERA_CONFORMIDAD':
            raise ValidationError(f'Solo se puede confirmar en estado EN_ESPERA_CONFORMIDAD. Estado actual: {t.estado_transferencia}.')
        if t.usuario_destino_id != usuario_destino_id:
            raise PermissionDenied('Solo el usuario destinatario puede confirmar la recepción.')
        TransferenciaService._aplicar_traslado(t)
        now = timezone.now()
        TransferenciaRepository.update_fields(t, {
            'confirmado_por_usuario_destino_id': usuario_destino_id,
            'fecha_confirmacion_destino':        now,
            'estado_transferencia':              'EN_ESPERA_FIRMA',
        })
        TransferenciaService._registrar_aprobacion(t, 'USUARIO_DESTINO', 'APROBADO', usuario_destino_id, detalle='Recepción confirmada. Pendiente subir acta firmada.')
        TransferenciaService._guardar_pdf(t, cookie=cookie)
        return {'success': True, 'message': 'Recepción confirmada. Descargue el acta, obtenga la firma del destinatario y suba el documento escaneado.'}

    @staticmethod
    @transaction.atomic
    def cerrar_con_firma(pk: int, archivo, usuario_id: int) -> Dict[str, Any]:
        t = TransferenciaService._get_or_404(pk)
        if t.estado_transferencia != 'EN_ESPERA_FIRMA':
            raise ValidationError(f'Solo se puede cerrar con firma en estado EN_ESPERA_FIRMA. Estado actual: {t.estado_transferencia}.')
        ext = os.path.splitext(getattr(archivo, 'name', '.pdf'))[-1].lower() or '.pdf'
        if ext not in ('.pdf', '.jpg', '.jpeg', '.png'):
            raise ValidationError('Formato no permitido. Use PDF, JPG o PNG.')
        archivo_bytes = b''.join(chunk for chunk in archivo.chunks())
        try:
            nombre_archivo = f'{t.numero_orden}_firmado{ext}'
            ruta = subir_pdf_firmado(archivo_bytes, nombre_archivo)
        except Exception as e:
            logger.error('Error subiendo acta firmada a Supabase: %s', e)
            raise ValidationError('Error al guardar el archivo. Intente nuevamente.')
        if t.tipo == 'ASIGNACION_INTERNA':
            TransferenciaService._restaurar_estado_bienes(t, 'ACTIVO')
        TransferenciaRepository.update_fields(t, {
            'pdf_firmado_path':     ruta,
            'estado_transferencia': 'ATENDIDO',
            'fecha_pdf':            timezone.now(),
        })
        TransferenciaService._registrar_aprobacion(t, 'REGISTRADOR', 'APROBADO', usuario_id, detalle='Acta firmada recibida. Proceso ATENDIDO.')
        tipo_msg = 'Traslado' if t.tipo == 'TRASLADO_SEDE' else 'Asignación'
        return {'success': True, 'message': f'{tipo_msg} completado. Acta firmada registrada en el sistema.'}

    @staticmethod
    def obtener_documento(pk: int, cookie: str = '') -> bytes:
        t = TransferenciaService._get_or_404(pk)
        ESTADOS_CON_DOCUMENTO = {'EN_ESPERA_FIRMA', 'ATENDIDO'}
        if t.estado_transferencia not in ESTADOS_CON_DOCUMENTO:
            raise ValidationError('El documento solo está disponible cuando el estado es EN_ESPERA_FIRMA o ATENDIDO.')
        if t.pdf_firmado_path:
            try:
                return descargar_pdf(t.pdf_firmado_path)
            except Exception as e:
                logger.warning('No se pudo descargar PDF firmado %s: %s', t.pdf_firmado_path, e)
        if t.pdf_path:
            try:
                return descargar_pdf(t.pdf_path)
            except Exception as e:
                logger.warning('No se pudo descargar PDF %s: %s', t.pdf_path, e)
        return generar_pdf_transferencia(t, cookie=cookie)

    @staticmethod
    @transaction.atomic
    def aprobar_retorno_salida(pk, segursede_id, motivo, role, sede_segur_id):
        if role not in ROLES_SEGURSEDE:
            raise PermissionDenied('Solo SEGURSEDE puede aprobar el retorno.')
        t = TransferenciaService._get_or_404(pk)
        TransferenciaService._validar_sede_segursede(sede_segur_id, t.sede_destino_id, role)
        if t.tipo != 'TRASLADO_SEDE':
            raise ValidationError('Solo aplica a traslados entre sedes.')
        if t.estado_transferencia != 'EN_RETORNO':
            raise ValidationError(f'Solo se puede aprobar retorno en estado EN_RETORNO. Estado actual: {t.estado_transferencia}.')
        if t.aprobado_retorno_salida_id:
            raise ValidationError('El retorno-salida ya fue aprobado.')
        TransferenciaRepository.update_fields(t, {
            'aprobado_retorno_salida_id':      segursede_id,
            'fecha_aprobacion_retorno_salida': timezone.now(),
            'motivo_devolucion':               motivo or t.motivo_devolucion,
        })
        TransferenciaService._registrar_aprobacion(t, 'SEGUR_RETORNO_SALIDA', 'APROBADO', segursede_id, detalle=motivo or 'Salida de retorno aprobada.')
        return {'success': True, 'message': 'Salida de retorno aprobada.'}

    @staticmethod
    @transaction.atomic
    def aprobar_retorno_entrada(pk, segursede_id, observacion, role, sede_segur_id):
        if role not in ROLES_SEGURSEDE:
            raise PermissionDenied('Solo SEGURSEDE puede aprobar la entrada de retorno.')
        t = TransferenciaService._get_or_404(pk)
        TransferenciaService._validar_sede_segursede(sede_segur_id, t.sede_origen_id, role)
        if t.tipo != 'TRASLADO_SEDE':
            raise ValidationError('Solo aplica a traslados entre sedes.')
        if t.estado_transferencia != 'EN_RETORNO':
            raise ValidationError(f'Solo se puede aprobar entrada retorno en estado EN_RETORNO. Estado actual: {t.estado_transferencia}.')
        if not t.aprobado_retorno_salida_id:
            raise ValidationError('Debe aprobarse la salida de retorno primero.')
        if t.aprobado_retorno_entrada_id:
            raise ValidationError('La entrada de retorno ya fue aprobada.')
        TransferenciaService._restaurar_estado_bienes(t, 'ACTIVO')
        TransferenciaRepository.update_fields(t, {
            'aprobado_retorno_entrada_id':      segursede_id,
            'fecha_aprobacion_retorno_entrada': timezone.now(),
            'estado_transferencia':             'DEVUELTO',
            'aprobado_por_adminsede_id':        None,
            'fecha_aprobacion_adminsede':       None,
            'aprobado_segur_salida_id':         None,
            'fecha_aprobacion_segur_salida':    None,
            'aprobado_segur_entrada_id':        None,
            'fecha_aprobacion_segur_entrada':   None,
            'aprobado_retorno_salida_id':       None,
            'fecha_aprobacion_retorno_salida':  None,
            'aprobado_retorno_entrada_id':      None,
            'fecha_aprobacion_retorno_entrada': None,
        })
        TransferenciaService._registrar_aprobacion(t, 'SEGUR_RETORNO_ENTRADA', 'APROBADO', segursede_id, detalle=observacion or 'Bien retornado a sede origen.')
        return {'success': True, 'message': 'Retorno completado. El bien volvió a su sede origen.'}

    @staticmethod
    @transaction.atomic
    def cancelar(pk, usuario_id, motivo_cancelacion_id, detalle):
        t = TransferenciaService._get_or_404(pk)
        if t.estado_transferencia in ('ATENDIDO', 'CANCELADO'):
            raise ValidationError(f'No se puede cancelar en estado "{t.estado_transferencia}".')
        TransferenciaRepository.update_fields(t, {
            'estado_transferencia':  'CANCELADO',
            'fecha_cancelacion':     timezone.now(),
            'motivo_cancelacion_id': motivo_cancelacion_id,
            'detalle_cancelacion':   detalle,
            'aprobado_por_adminsede_id':        None,
            'fecha_aprobacion_adminsede':       None,
            'aprobado_segur_salida_id':         None,
            'fecha_aprobacion_segur_salida':    None,
            'aprobado_segur_entrada_id':        None,
            'fecha_aprobacion_segur_entrada':   None,
            'aprobado_retorno_salida_id':       None,
            'fecha_aprobacion_retorno_salida':  None,
            'aprobado_retorno_entrada_id':      None,
            'fecha_aprobacion_retorno_entrada': None,
        })
        TransferenciaService._registrar_aprobacion(t, 'REGISTRADOR', 'RECHAZADO', usuario_id, detalle=f'Cancelado. {detalle}')
        TransferenciaService._restaurar_estado_bienes(t, 'ACTIVO')
        return {'success': True, 'message': 'Transferencia cancelada.'}

    @staticmethod
    @transaction.atomic
    def reenviar(pk, usuario_id, role, sede_registra_id, data: Dict[str, Any], token=None):
        t = TransferenciaService._get_or_404(pk)
        if t.estado_transferencia != 'DEVUELTO':
            raise ValidationError(f'Solo se puede reenviar en estado DEVUELTO. Estado actual: {t.estado_transferencia}')
        if role != 'SYSADMIN' and t.usuario_origen_id != usuario_id:
            raise PermissionDenied('Solo el registrador original puede reenviar.')
        bien_ids = data.pop('bien_ids', None)
        if bien_ids:
            bienes = TransferenciaService._get_bienes_validados(bien_ids, exclude_transferencia_id=t.id)
            origen = TransferenciaService._extraer_origen(bienes)
            if origen['sede_origen_id'] != sede_registra_id:
                raise PermissionDenied('Solo puede trasladar bienes de su propia sede.')
            sede_destino = data.get('sede_destino_id', t.sede_destino_id)
            if sede_destino == origen['sede_origen_id'] and t.tipo == 'TRASLADO_SEDE':
                raise ValidationError('La sede destino debe ser diferente a la sede origen.')
            TransferenciaDetalleRepository.delete_by_transferencia(t)
            TransferenciaDetalleRepository.bulk_create(t, bienes)
            data.update(origen)
            estado_bloqueo = 'EN_TRASLADO' if t.tipo == 'TRASLADO_SEDE' else 'EN_ASIGNACION'
            TransferenciaService._cambiar_estado_bienes(bienes, estado_bloqueo)
        else:
            detalles        = TransferenciaDetalleRepository.get_by_transferencia_con_bienes(t)
            bienes_actuales = [d.bien for d in detalles]
            estado_bloqueo  = 'EN_TRASLADO' if t.tipo == 'TRASLADO_SEDE' else 'EN_ASIGNACION'
            TransferenciaService._cambiar_estado_bienes(bienes_actuales, estado_bloqueo)
        if data.get('sede_destino_id'):
            MsUsuariosClient.validar_sede(data['sede_destino_id'], token)
        if data.get('usuario_destino_id'):
            MsUsuariosClient.validar_usuario(data['usuario_destino_id'], token)
        if data.get('modulo_destino_id'):
            MsUsuariosClient.validar_modulo(data['modulo_destino_id'], token)
        update_data = {
            'estado_transferencia':             'PENDIENTE_APROBACION',
            'motivo_devolucion':                None,
            'aprobado_por_adminsede_id':        None,
            'fecha_aprobacion_adminsede':       None,
            'aprobado_segur_salida_id':         None,
            'fecha_aprobacion_segur_salida':    None,
            'aprobado_segur_entrada_id':        None,
            'fecha_aprobacion_segur_entrada':   None,
            'aprobado_retorno_salida_id':       None,
            'fecha_aprobacion_retorno_salida':  None,
            'aprobado_retorno_entrada_id':      None,
            'fecha_aprobacion_retorno_entrada': None,
        }
        for campo in [
            'motivo_transferencia_id', 'descripcion', 'usuario_destino_id',
            'sede_destino_id', 'modulo_destino_id', 'ubicacion_destino_id',
            'piso_destino', 'sede_origen_id', 'modulo_origen_id', 'usuario_origen_id',
        ]:
            if campo in data:
                update_data[campo] = data[campo]
        TransferenciaRepository.update_fields(t, update_data)
        TransferenciaService._registrar_aprobacion(t, 'REGISTRADOR', 'APROBADO', usuario_id, detalle='Transferencia reenviada con correcciones.')
        return {'success': True, 'message': 'Transferencia reenviada para aprobación.'}

    @staticmethod
    def listar_pendientes_segur(sede_id: int, role: str):
        qs = TransferenciaRepository.filter({'tipo': 'TRASLADO_SEDE'})
        qs = qs.exclude(estado_transferencia__in=['ATENDIDO', 'CANCELADO', 'DEVUELTO'])
        filtros = Q()
        filtros |= Q(sede_origen_id=sede_id, estado_transferencia='PENDIENTE_APROBACION', aprobado_por_adminsede_id__isnull=False, aprobado_segur_salida_id__isnull=True)
        filtros |= Q(sede_destino_id=sede_id, estado_transferencia='PENDIENTE_APROBACION', aprobado_segur_salida_id__isnull=False, aprobado_segur_entrada_id__isnull=True)
        filtros |= Q(sede_destino_id=sede_id, estado_transferencia='EN_RETORNO', aprobado_retorno_salida_id__isnull=True)
        filtros |= Q(sede_origen_id=sede_id, estado_transferencia='EN_RETORNO', aprobado_retorno_salida_id__isnull=False, aprobado_retorno_entrada_id__isnull=True)
        return qs.filter(filtros).distinct()

    @staticmethod
    def listar_pendientes_aprobacion(role: str, sede_id: int, modulo_id: int, token: str):
        ESTADOS_EXCLUIDOS = ['ATENDIDO', 'CANCELADO', 'EN_ESPERA_FIRMA']
        if role == 'SYSADMIN':
            qs = TransferenciaRepository.filter({})
            qs = qs.exclude(estado_transferencia__in=ESTADOS_EXCLUIDOS)
        elif role in ('COORDSISTEMA', 'ADMINSEDE'):
            filtros = Q()
            filtros |= Q(estado_transferencia='PENDIENTE_APROBACION', aprobado_por_adminsede_id__isnull=True, sede_origen_id=sede_id)
            filtros |= Q(tipo='ASIGNACION_INTERNA', estado_transferencia='PENDIENTE_APROBACION', sede_origen_id=sede_id)
            qs = TransferenciaRepository.filter({})
            qs = qs.filter(filtros)
        elif role == 'ASISTSISTEMA':
            filtros = Q()
            filtros |= Q(tipo='TRASLADO_SEDE', estado_transferencia='EN_ESPERA_CONFORMIDAD', sede_destino_id=sede_id)
            filtros |= Q(tipo='TRASLADO_SEDE', estado_transferencia='EN_ESPERA_FIRMA', sede_destino_id=sede_id)
            filtros |= Q(tipo='ASIGNACION_INTERNA', estado_transferencia='EN_ESPERA_FIRMA', sede_destino_id=sede_id)
            qs = TransferenciaRepository.filter({})
            qs = qs.filter(filtros)
        else:
            qs = TransferenciaRepository.filter({}).none()
        qs = qs.order_by('-fecha_registro')
        lista = list(qs)
        for tr in lista:
            TransferenciaService._enriquecer_transferencia(tr, token)
            _ = list(tr.detalles.all())
        return lista