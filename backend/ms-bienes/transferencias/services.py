import os
from typing import Dict, Any, List
from .pdf_generator import generar_pdf_transferencia
from django.conf import settings
from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import ValidationError, NotFound, PermissionDenied
from .repositories import (
    TransferenciaRepository,
    TransferenciaDetalleRepository,
    TransferenciaAprobacionRepository,
)
from bienes.repositories import BienRepository
from bienes.services import MsUsuariosClient

ROLES_REGISTRA_TRASLADO   = {'analistaSistema', 'coordSistema', 'SYSADMIN'}
ROLES_REGISTRA_ASIGNACION = {'asistSistema', 'SYSADMIN'}
ROLES_ADMINSEDE           = {'adminSede', 'coordSistema', 'SYSADMIN'}
ROLES_SEGURSEDE           = {'segurSede', 'SYSADMIN'}
MODULO_COORD_INFORMATICA  = 1


class TransferenciaService:
    @staticmethod
    def _rol_aprobador_adminsede(role: str) -> str:
        return 'COORDSISTEMA' if role == 'coordSistema' else 'ADMINSEDE'
    @staticmethod
    def _validar_aprobador_adminsede(
        role, sede_aprobador_id, modulo_aprobador_id,
        sede_origen_id, modulo_origen_id,
    ):
        if role == 'SYSADMIN':
            return
        es_coord_informatica = (
            sede_origen_id == 1 and modulo_origen_id == MODULO_COORD_INFORMATICA
        )
        if es_coord_informatica:
            if role != 'coordSistema':
                raise PermissionDenied(
                    'Solo coordSistema puede aprobar traslados del módulo '
                    'Coordinación de Informática.'
                )
            if sede_aprobador_id != sede_origen_id:
                raise PermissionDenied(
                    'coordSistema debe pertenecer a la sede central para aprobar.'
                )
        else:
            if role != 'adminSede':
                raise PermissionDenied('Solo adminSede puede aprobar traslados de esta sede.')
            if sede_aprobador_id != sede_origen_id:
                raise PermissionDenied('Solo puede aprobar traslados de su propia sede.')

    @staticmethod
    def _validar_sede_segursede(sede_segur_id: int, sede_transferencia_id: int, role: str):
        if role == 'SYSADMIN':
            return
        if sede_segur_id != sede_transferencia_id:
            raise PermissionDenied(
                'Personal de Seguridad solo puede aprobar/rechazar '
                'salidas/entradas de transferencias de su propia sede.'
            )
    @staticmethod
    def _extraer_origen(bienes: list) -> Dict[str, Any]:
        bien_ref = bienes[0]
        return {
            'sede_origen_id':    bien_ref.sede_id,
            'modulo_origen_id':  bien_ref.modulo_id,
            'usuario_origen_id': bien_ref.usuario_asignado_id,
        }
    @staticmethod
    def _cambiar_estado_bienes(bienes: list, nombre_estado: str) -> None:
        from catalogos.models import CatEstadoBien
        estado = CatEstadoBien.objects.filter(
            nombre__iexact=nombre_estado, is_active=True
        ).first()
        if not estado:
            raise ValidationError(f'Estado "{nombre_estado}" no configurado en catálogos.')
        for bien in bienes:
            BienRepository.update_fields(bien, {'estado_bien_id': estado.id})
    @staticmethod
    def _restaurar_estado_bienes(transferencia, nombre_estado: str = 'ACTIVO') -> None:
        from catalogos.models import CatEstadoBien
        estado = CatEstadoBien.objects.filter(
            nombre__iexact=nombre_estado, is_active=True
        ).first()
        if not estado:
            raise ValidationError(f'Estado "{nombre_estado}" no configurado en catálogos.')
        detalles = TransferenciaDetalleRepository.get_by_transferencia_con_bienes(transferencia)
        for detalle in detalles:
            BienRepository.update_fields(detalle.bien, {'estado_bien_id': estado.id})
    @staticmethod
    def _get_bienes_validados(
        bien_ids: List[int],
        exclude_transferencia_id: int = None,
    ) -> list:
        if not bien_ids:
            raise ValidationError('Debe incluir al menos un bien.')
        bienes = []
        for bid in bien_ids:
            bien = BienRepository.get_by_id(bid)
            if not bien:
                raise ValidationError(f'Bien id={bid} no encontrado.')
            estado = bien.estado_bien.nombre.upper() if bien.estado_bien else None
            if estado != 'ACTIVO':
                raise ValidationError(
                    f'El bien "{bien.codigo_patrimonial}" no está disponible. '
                    f'Estado actual: {estado}.'
                )
            transferencia_activa = TransferenciaDetalleRepository.get_transferencia_activa_por_bien(
                bid, exclude_transferencia_id=exclude_transferencia_id,
            )
            if transferencia_activa:
                t = transferencia_activa.transferencia
                raise ValidationError(
                    f'El bien "{bien.codigo_patrimonial}" ya tiene una transferencia '
                    f'activa (#{t.numero_orden} — estado: {t.estado}). '
                    f'Debe cancelarse antes de incluirlo en otra transferencia.'
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
    def _registrar_aprobacion(
        transferencia, rol_aprobador: str, accion: str,
        usuario_id: int, detalle: str = None,
    ) -> None:
        TransferenciaAprobacionRepository.create(
            transferencia = transferencia,
            rol_aprobador = rol_aprobador,
            accion        = accion,
            usuario_id    = usuario_id,
            detalle       = detalle,
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
        TransferenciaService._restaurar_estado_bienes(transferencia, 'ACTIVO')
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
        TransferenciaService._restaurar_estado_bienes(transferencia, 'ACTIVO')
    @staticmethod
    def _guardar_pdf(transferencia, cookie: str = '') -> None:        
        try:
            pdf_bytes = generar_pdf_transferencia(transferencia, cookie=cookie)
        except Exception:
            return
        directorio = os.path.join(
            getattr(settings, 'MEDIA_ROOT', 'media'),
            'transferencias', 'pdfs',
        )
        os.makedirs(directorio, exist_ok=True)
        nombre_archivo = f'{transferencia.numero_orden}.pdf'
        ruta_absoluta  = os.path.join(directorio, nombre_archivo)
        with open(ruta_absoluta, 'wb') as f:
            f.write(pdf_bytes)
        ruta_relativa = os.path.join('transferencias', 'pdfs', nombre_archivo)
        TransferenciaRepository.update_fields(transferencia, {
            'pdf_path':  ruta_relativa,
            'fecha_pdf': timezone.now(),
        })
    @staticmethod
    def listar(filters: Dict[str, Any]) -> Dict[str, Any]:
        qs = TransferenciaRepository.filter(filters)
        return {"success": True, "data": qs}
    @staticmethod
    def obtener(pk: int) -> Dict[str, Any]:
        t = TransferenciaService._get_or_404(pk)
        return {"success": True, "data": t}
    @staticmethod
    def mis_transferencias(
        usuario_id: int, role: str, sede_id: int,
        filters: Dict[str, Any],
    ) -> Dict[str, Any]:
        qs = TransferenciaRepository.get_mis_transferencias(usuario_id, role, sede_id)
        if filters.get('estado'):
            qs = qs.filter(estado=filters['estado'])
        if filters.get('tipo'):
            qs = qs.filter(tipo=filters['tipo'])
        return {"success": True, "data": qs.order_by('-fecha_registro')}
    @staticmethod
    @transaction.atomic
    def crear_traslado_sede(
        data: Dict[str, Any], usuario_registra_id: int,
        sede_registra_id: int, role: str, token: str = None,
    ) -> Dict[str, Any]:
        if role not in ROLES_REGISTRA_TRASLADO:
            raise PermissionDenied('No tiene permiso para registrar traslados entre sedes.')
        bien_ids = data.pop('bien_ids', [])
        bienes   = TransferenciaService._get_bienes_validados(bien_ids)
        origen   = TransferenciaService._extraer_origen(bienes)
        if origen['sede_origen_id'] != sede_registra_id:
            raise PermissionDenied('Solo puede trasladar bienes que pertenecen a su propia sede.')
        if data['sede_destino_id'] == origen['sede_origen_id']:
            raise ValidationError('La sede destino debe ser diferente a la sede origen.')
        MsUsuariosClient.validar_usuario(data['usuario_destino_id'], token)
        MsUsuariosClient.validar_sede(data['sede_destino_id'], token)
        if data.get('modulo_destino_id'):
            MsUsuariosClient.validar_modulo(data['modulo_destino_id'], token)
        numero_orden  = TransferenciaRepository.generate_numero_orden()
        transferencia = TransferenciaRepository.create({
            **data,
            'numero_orden': numero_orden,
            'tipo':         'TRASLADO_SEDE',
            'estado':       'PENDIENTE_APROBACION',
            **origen,
        })
        TransferenciaDetalleRepository.bulk_create(transferencia, bienes)
        TransferenciaService._cambiar_estado_bienes(bienes, 'EN_TRASLADO')
        return {
            "success": True,
            "message": "Traslado registrado exitosamente.",
            "data":    {"id": transferencia.id, "numero_orden": transferencia.numero_orden},
        }
    @staticmethod
    @transaction.atomic
    def crear_asignacion_interna(data: Dict[str, Any], usuario_registra_id: int,sede_registra_id: int, role: str, token: str = None,) -> Dict[str, Any]:
        if role not in ROLES_REGISTRA_ASIGNACION:
            raise PermissionDenied('Solo asistSistema puede registrar asignaciones internas.')
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
            'numero_orden': numero_orden,
            'tipo':         'ASIGNACION_INTERNA',
            'estado':       'PENDIENTE_APROBACION',
            **origen,
        })
        TransferenciaDetalleRepository.bulk_create(transferencia, bienes)
        TransferenciaService._cambiar_estado_bienes(bienes, 'EN_ASIGNACION')
        return {
            "success": True,
            "message": "Asignación interna registrada exitosamente.",
            "data":    {"id": transferencia.id, "numero_orden": transferencia.numero_orden},
        }
    @staticmethod
    @transaction.atomic
    def aprobar_adminsede(pk, aprobador_id, role, sede_aprobador_id, modulo_aprobador_id,cookie: str = '',):
        t = TransferenciaService._get_or_404(pk)
        if t.estado != 'PENDIENTE_APROBACION':
            raise ValidationError(f'No se puede aprobar en estado "{t.estado}".')
        if t.aprobado_por_adminsede_id:
            raise ValidationError('La transferencia ya fue aprobada previamente.')
        TransferenciaService._validar_aprobador_adminsede(
            role, sede_aprobador_id, modulo_aprobador_id,
            t.sede_origen_id, t.modulo_origen_id,
        )
        rol_historial = TransferenciaService._rol_aprobador_adminsede(role)
        now = timezone.now()
        if t.tipo == 'ASIGNACION_INTERNA':
            TransferenciaService._aplicar_asignacion(t)
            TransferenciaRepository.update_fields(t, {
                'aprobado_por_adminsede_id':  aprobador_id,
                'fecha_aprobacion_adminsede': now,
                'estado':                     'ATENDIDO',
            })
            TransferenciaService._registrar_aprobacion(
                t, rol_historial, 'APROBADO', aprobador_id,
                detalle='Asignación interna aprobada y ejecutada.',
            )
            TransferenciaService._guardar_pdf(t, cookie=cookie)
        else:
            TransferenciaRepository.update_fields(t, {
                'aprobado_por_adminsede_id':  aprobador_id,
                'fecha_aprobacion_adminsede': now,
            })
            TransferenciaService._registrar_aprobacion(
                t, rol_historial, 'APROBADO', aprobador_id,
                detalle='Traslado aprobado. Pendiente aprobación de seguridad.',
            )
        return {"success": True, "message": "Aprobación registrada exitosamente."}
    @staticmethod
    @transaction.atomic
    def devolver_adminsede(pk, aprobador_id, motivo, role, sede_aprobador_id, modulo_aprobador_id):
        t = TransferenciaService._get_or_404(pk)
        if t.estado != 'PENDIENTE_APROBACION':
            raise ValidationError('Solo se puede devolver en estado PENDIENTE_APROBACION.')
        TransferenciaService._validar_aprobador_adminsede(
            role, sede_aprobador_id, modulo_aprobador_id,
            t.sede_origen_id, t.modulo_origen_id,
        )
        rol_historial = TransferenciaService._rol_aprobador_adminsede(role)
        TransferenciaRepository.update_fields(t, {
            'estado':                     'DEVUELTO',
            'motivo_devolucion':          motivo,
            'aprobado_por_adminsede_id':  None,
            'fecha_aprobacion_adminsede': None,
        })
        TransferenciaService._registrar_aprobacion(
            t, rol_historial, 'DEVUELTO', aprobador_id, detalle=motivo,
        )
        TransferenciaService._restaurar_estado_bienes(t, 'ACTIVO')
        return {"success": True, "message": "Transferencia devuelta para corrección."}
    @staticmethod
    @transaction.atomic
    def aprobar_segur_salida(pk, segursede_id, role, sede_segur_id):
        if role not in ROLES_SEGURSEDE:
            raise PermissionDenied('Solo segurSede puede aprobar la salida física.')
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
        TransferenciaService._registrar_aprobacion(
            t, 'SEGUR_SALIDA', 'APROBADO', segursede_id,
            detalle='Salida física aprobada.',
        )
        return {"success": True, "message": "Salida física aprobada por Personal de Seguridad."}
    @staticmethod
    @transaction.atomic
    def rechazar_segur_salida(pk, segursede_id, motivo, role, sede_segur_id):
        if role not in ROLES_SEGURSEDE:
            raise PermissionDenied('Solo segurSede puede rechazar la salida física.')
        t = TransferenciaService._get_or_404(pk)
        TransferenciaService._validar_sede_segursede(sede_segur_id, t.sede_origen_id, role)
        if t.tipo != 'TRASLADO_SEDE':
            raise ValidationError('Solo aplica a traslados entre sedes.')
        if not t.aprobado_por_adminsede_id:
            raise ValidationError('No existe aprobación previa del administrador.')
        if t.aprobado_segur_salida_id:
            raise ValidationError('La salida ya fue aprobada, no se puede rechazar.')
        TransferenciaRepository.update_fields(t, {
            'estado':                     'DEVUELTO',
            'motivo_devolucion':          motivo,
            'aprobado_por_adminsede_id':  None,
            'fecha_aprobacion_adminsede': None,
        })
        TransferenciaService._registrar_aprobacion(
            t, 'SEGUR_SALIDA', 'RECHAZADO', segursede_id, detalle=motivo,
        )
        TransferenciaService._restaurar_estado_bienes(t, 'ACTIVO')
        return {"success": True, "message": "Salida física rechazada."}
    @staticmethod
    @transaction.atomic
    def aprobar_segur_entrada(pk, segursede_id, observacion, role, sede_segur_id):
        if role not in ROLES_SEGURSEDE:
            raise PermissionDenied('Solo segurSede puede aprobar la entrada física.')
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
            'estado':                         'EN_ESPERA_CONFORMIDAD',
        })
        TransferenciaService._registrar_aprobacion(
            t, 'SEGUR_ENTRADA', 'APROBADO', segursede_id,
            detalle=observacion or 'Entrada física aprobada. Pendiente conformidad del usuario destino.',
        )
        return {
            "success": True,
            "message": "Entrada física aprobada. Esperando conformidad del usuario destinatario.",
        }
    @staticmethod
    @transaction.atomic
    def rechazar_segur_entrada(pk, segursede_id, motivo, role, sede_segur_id):
        """
        SEGURSEDE destino rechaza la entrada física → el bien debe retornar a la sede origen.
        Estado: EN_RETORNO (no se restaura ACTIVO aún, el bien sigue en tránsito).
        """
        if role not in ROLES_SEGURSEDE:
            raise PermissionDenied('Solo segurSede puede rechazar la entrada física.')
        t = TransferenciaService._get_or_404(pk)
        TransferenciaService._validar_sede_segursede(sede_segur_id, t.sede_destino_id, role)
        if t.tipo != 'TRASLADO_SEDE':
            raise ValidationError('Solo aplica a traslados entre sedes.')
        if not t.aprobado_segur_salida_id:
            raise ValidationError('No existe aprobación de salida previa.')
        if t.aprobado_segur_entrada_id:
            raise ValidationError('La entrada ya fue aprobada.')
        TransferenciaRepository.update_fields(t, {
            'estado':            'EN_RETORNO',
            'motivo_devolucion': motivo,
        })
        TransferenciaService._registrar_aprobacion(
            t, 'SEGUR_ENTRADA', 'RECHAZADO', segursede_id, detalle=motivo,
        )
        return {"success": True, "message": "Entrada rechazada. Bien en retorno a sede origen."}
    @staticmethod
    @transaction.atomic
    def confirmar_recepcion(pk, usuario_destino_id, cookie: str = ''):
        t = TransferenciaService._get_or_404(pk)
        if t.tipo != 'TRASLADO_SEDE':
            raise ValidationError('Solo aplica a traslados entre sedes.')
        if t.estado != 'EN_ESPERA_CONFORMIDAD':
            raise ValidationError(
                f'Solo se puede confirmar en estado EN_ESPERA_CONFORMIDAD. '
                f'Estado actual: {t.estado}.'
            )
        if t.usuario_destino_id != usuario_destino_id:
            raise PermissionDenied(
                'Solo el usuario destinatario puede confirmar la recepción.'
            )
        TransferenciaService._aplicar_traslado(t)
        now = timezone.now()
        TransferenciaRepository.update_fields(t, {
            'confirmado_por_usuario_destino_id': usuario_destino_id,
            'fecha_confirmacion_destino':        now,
            'estado':                            'ATENDIDO',
        })
        TransferenciaService._registrar_aprobacion(
            t, 'USUARIO_DESTINO', 'APROBADO', usuario_destino_id,
            detalle='Recepción confirmada por el usuario destinatario. Traslado completado.',
        )
        TransferenciaService._guardar_pdf(t, cookie=cookie)
        return {"success": True, "message": "Recepción confirmada. Traslado completado exitosamente."}
    @staticmethod
    @transaction.atomic
    def aprobar_retorno_salida(pk, segursede_id, motivo, role, sede_segur_id):
        """SEGURSEDE destino confirma que el bien salió físicamente de vuelta."""
        if role not in ROLES_SEGURSEDE:
            raise PermissionDenied('Solo segurSede puede aprobar el retorno.')
        t = TransferenciaService._get_or_404(pk)
        if t.estado != 'EN_RETORNO':
            raise ValidationError(f'Solo aplica en estado EN_RETORNO. Estado actual: {t.estado}')
        TransferenciaService._validar_sede_segursede(sede_segur_id, t.sede_destino_id, role)
        if t.aprobado_retorno_salida_id:
            raise ValidationError('La salida de retorno ya fue registrada.')
        TransferenciaRepository.update_fields(t, {
            'aprobado_retorno_salida_id':      segursede_id,
            'fecha_aprobacion_retorno_salida': timezone.now(),
        })
        TransferenciaService._registrar_aprobacion(
            t, 'SEGUR_RETORNO_SALIDA', 'APROBADO', segursede_id,
            detalle=motivo or 'Salida de retorno confirmada desde sede destino.',
        )
        return {"success": True, "message": "Salida de retorno confirmada. Bien en camino a sede origen."}
    @staticmethod
    @transaction.atomic
    def aprobar_retorno_entrada(pk, segursede_id, observacion, role, sede_segur_id):
        if role not in ROLES_SEGURSEDE:
            raise PermissionDenied('Solo segurSede puede confirmar el retorno.')
        t = TransferenciaService._get_or_404(pk)
        if t.estado != 'EN_RETORNO':
            raise ValidationError(f'Solo aplica en estado EN_RETORNO. Estado actual: {t.estado}')
        TransferenciaService._validar_sede_segursede(sede_segur_id, t.sede_origen_id, role)
        if not t.aprobado_retorno_salida_id:
            raise ValidationError('Debe confirmarse primero la salida de retorno desde sede destino.')
        if t.aprobado_retorno_entrada_id:
            raise ValidationError('El retorno ya fue confirmado.')
        TransferenciaRepository.update_fields(t, {
            'estado':                           'DEVUELTO',
            'aprobado_retorno_entrada_id':      segursede_id,
            'fecha_aprobacion_retorno_entrada': timezone.now(),
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
        TransferenciaService._restaurar_estado_bienes(t, 'ACTIVO')
        TransferenciaService._registrar_aprobacion(
            t, 'SEGUR_RETORNO_ENTRADA', 'APROBADO', segursede_id,
            detalle=observacion or 'Bien recibido en sede origen. Retorno completado.',
        )
        return {"success": True, "message": "Retorno completado. Bien disponible en sede origen."}
    @staticmethod
    @transaction.atomic
    def cancelar(pk, usuario_id, motivo_cancelacion_id, detalle):
        t = TransferenciaService._get_or_404(pk)
        if t.estado in ('ATENDIDO', 'CANCELADO'):
            raise ValidationError(f'No se puede cancelar en estado "{t.estado}".')
        TransferenciaRepository.update_fields(t, {
            'estado':                           'CANCELADO',
            'motivo_cancelacion_id':            motivo_cancelacion_id,
            'detalle_cancelacion':              detalle,
            'fecha_cancelacion':                timezone.now(),
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
        TransferenciaService._registrar_aprobacion(
            t, 'REGISTRADOR', 'RECHAZADO', usuario_id,
            detalle=f'Cancelado. {detalle}',
        )
        TransferenciaService._restaurar_estado_bienes(t, 'ACTIVO')
        return {"success": True, "message": "Transferencia cancelada."}
    @staticmethod
    @transaction.atomic
    def reenviar(
        pk, usuario_id, role, sede_registra_id,
        data: Dict[str, Any], token=None,
    ):
        t = TransferenciaService._get_or_404(pk)
        if t.estado != 'DEVUELTO':
            raise ValidationError(
                f'Solo se puede reenviar en estado DEVUELTO. Estado actual: {t.estado}'
            )
        if role != 'SYSADMIN' and t.usuario_origen_id != usuario_id:
            raise PermissionDenied('Solo el registrador original puede reenviar.')

        bien_ids = data.pop('bien_ids', None)
        if bien_ids:
            bienes = TransferenciaService._get_bienes_validados(
                bien_ids, exclude_transferencia_id=t.id,
            )
            origen = TransferenciaService._extraer_origen(bienes)
            if origen['sede_origen_id'] != sede_registra_id:
                raise PermissionDenied('Solo puede trasladar bienes de su propia sede.')
            sede_destino = data.get('sede_destino_id', t.sede_destino_id)
            if sede_destino == origen['sede_origen_id']:
                raise ValidationError('La sede destino debe ser diferente a la sede origen.')
            TransferenciaDetalleRepository.delete_by_transferencia(t)
            TransferenciaDetalleRepository.bulk_create(t, bienes)
            data.update(origen)
            estado_bloqueo = 'EN_TRASLADO' if t.tipo == 'TRASLADO_SEDE' else 'EN_ASIGNACION'
            TransferenciaService._cambiar_estado_bienes(bienes, estado_bloqueo)
        else:
            detalles = TransferenciaDetalleRepository.get_by_transferencia_con_bienes(t)
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
            'estado':                           'PENDIENTE_APROBACION',
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
            'motivo_id', 'descripcion', 'usuario_destino_id', 'sede_destino_id',
            'modulo_destino_id', 'ubicacion_destino_id', 'piso_destino',
            'sede_origen_id', 'modulo_origen_id', 'usuario_origen_id',
        ]:
            if campo in data:
                update_data[campo] = data[campo]
        TransferenciaRepository.update_fields(t, update_data)
        TransferenciaService._registrar_aprobacion(
            t, 'REGISTRADOR', 'APROBADO', usuario_id,
            detalle='Transferencia reenviada con correcciones.',
        )
        return {"success": True, "message": "Transferencia reenviada para aprobación."}
    @staticmethod
    def obtener_documento(pk: int, cookie: str = '') -> bytes:
        t = TransferenciaService._get_or_404(pk)
        if t.estado != 'ATENDIDO':
            raise ValidationError(
                'El documento solo está disponible cuando el proceso está en estado ATENDIDO.'
            )
        media_root = getattr(settings, 'MEDIA_ROOT', 'media')
        if t.pdf_firmado_path:
            ruta = os.path.join(media_root, t.pdf_firmado_path)
            if os.path.exists(ruta):
                with open(ruta, 'rb') as f:
                    return f.read()
        if t.pdf_path:
            ruta = os.path.join(media_root, t.pdf_path)
            if os.path.exists(ruta):
                with open(ruta, 'rb') as f:
                    return f.read()
        
        return generar_pdf_transferencia(t, cookie=cookie)
    @staticmethod
    @transaction.atomic
    def subir_firmado(pk: int, archivo, usuario_id: int) -> Dict[str, Any]:
        t = TransferenciaService._get_or_404(pk)
        if t.tipo != 'ASIGNACION_INTERNA':
            raise ValidationError('Solo aplica a asignaciones internas.')
        if t.estado != 'ATENDIDO':
            raise ValidationError(
                'Solo se puede subir el documento firmado cuando la asignación está ATENDIDA.'
            )
        media_root = getattr(settings, 'MEDIA_ROOT', 'media')
        directorio = os.path.join(media_root, 'transferencias', 'pdfs', 'firmados')
        os.makedirs(directorio, exist_ok=True)
        ext = os.path.splitext(archivo.name)[1] if hasattr(archivo, 'name') else '.pdf'
        nombre_archivo = f'{t.numero_orden}_firmado{ext}'
        ruta_absoluta  = os.path.join(directorio, nombre_archivo)
        with open(ruta_absoluta, 'wb') as f:
            for chunk in archivo.chunks():
                f.write(chunk)
        ruta_relativa = os.path.join('transferencias', 'pdfs', 'firmados', nombre_archivo)
        TransferenciaRepository.update_fields(t, {'pdf_firmado_path': ruta_relativa})
        return {"success": True, "message": "Documento firmado cargado exitosamente."}