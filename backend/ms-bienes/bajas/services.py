import logging
from typing import Dict, Any, List
from django.db.models import  Q
from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import ValidationError, NotFound
from .repositories import (
    BajaRepository,
    BajaDetalleRepository,
    BajaAprobacionRepository,
    MantenimientoParaBajaRepository,
)
from .document_generator import generar_documentos_baja
from bienes.repositories import BienRepository
from bienes.models import Bien
from mantenimientos.models import Mantenimiento, MantenimientoImagen
from transferencias.services import TransferenciaService
from shared.storage_client import (
    subir_docx_baja,subir_pdf_baja,subir_pdf_firmado_baja,descargar_pdf
)

logger = logging.getLogger(__name__)

ESTADOS_FUNCIONAMIENTO_BAJA = {'INOPERATIVO', 'OBSOLETO', 'IRRECUPERABLE'}


class BajaService:
    @staticmethod
    def _get_or_404(pk: int):
        baja = BajaRepository.get_by_id(pk)
        if not baja:
            raise NotFound(f'Baja con id={pk} no encontrada.')
        return baja
    @staticmethod
    def _validar_item(item: Dict[str, Any]) -> Dict[str, Any]:
        bien = BienRepository.get_by_id(item['bien_id'])
        if not bien:
            raise ValidationError({'bien_id': f'Bien id={item["bien_id"]} no encontrado.'})
        if not bien.is_active:
            raise ValidationError({
                'bien_id': (
                    f'El bien "{bien.codigo_patrimonial or bien.pk}" '
                    'ya está dado de baja o inactivo.'
                )
            })
        estado_func = getattr(bien.estado_funcionamiento, 'nombre', '').upper()
        if estado_func not in ESTADOS_FUNCIONAMIENTO_BAJA:
            raise ValidationError({
                'bien_id': (
                    f'El bien "{bien.codigo_patrimonial or bien.pk}" tiene estado '
                    f'"{estado_func}". Solo se pueden dar de baja bienes con estado '
                    f'INOPERATIVO, OBSOLETO o IRRECUPERABLE.'
                )
            })

        mant_data        = {}
        mantenimiento_id = item.get('mantenimiento_id')
        if mantenimiento_id:
            try:
                mant = Mantenimiento.objects.get(pk=mantenimiento_id)
            except Mantenimiento.DoesNotExist:
                raise ValidationError({
                    'mantenimiento_id': f'Mantenimiento id={mantenimiento_id} no encontrado.'
                })
            if mant.estado_mantenimiento != 'ATENDIDO':
                raise ValidationError({
                    'mantenimiento_id': (
                        f'El mantenimiento {mant.numero_orden} debe estar ATENDIDO. '
                        f'Estado actual: {mant.estado_mantenimiento}.'
                    )
                })
            det = mant.detalles.filter(bien_id=bien.pk).first()
            if not det:
                raise ValidationError({
                    'mantenimiento_id': (
                        f'El mantenimiento {mant.numero_orden} no contiene '
                        f'al bien "{bien.codigo_patrimonial or bien.pk}".'
                    )
                })
            estado_final = (
                getattr(det.estado_funcionamiento_final, 'nombre', '')
                if det.estado_funcionamiento_final_id else ''
            )
            if estado_final.upper() not in ESTADOS_FUNCIONAMIENTO_BAJA:
                raise ValidationError({
                    'mantenimiento_id': (
                        f'El diagnóstico final del mantenimiento {mant.numero_orden} '
                        f'indica estado "{estado_final}". El bien no debe quedar OPERATIVO '
                        f'ni AVERIADO para poder incluirse en una baja.'
                    )
                })
            mant_data = {
                'diagnostico_inicial': det.diagnostico_inicial,
                'trabajo_realizado':   det.trabajo_realizado,
                'diagnostico_final':   det.diagnostico_final,
                'observacion_detalle': det.observacion_detalle,
            }

        imagenes_ids     = item.get('imagenes_incluidas', [])
        imagenes_validas = []
        if imagenes_ids and mantenimiento_id:
            imagenes_validas = list(
                MantenimientoImagen.objects
                .filter(pk__in=imagenes_ids, mantenimiento_id=mantenimiento_id)
                .values_list('pk', flat=True)
            )

        return {
            'bien':               bien,
            'motivo_baja_id':     item['motivo_baja_id'],
            'mantenimiento_id':   mantenimiento_id,
            'mant_data':          mant_data,
            'imagenes_incluidas': imagenes_validas,
        }

    @staticmethod
    def _regenerar_documentos(baja) -> bool:
        try:
            docs = generar_documentos_baja(baja)
            pdf_bytes  = docs.get('pdf_bytes')
            docx_bytes = docs.get('docx_bytes')
            nombre_pdf  = f'BAJ-{baja.pk}-{timezone.now().strftime("%Y%m%d%H%M%S")}.pdf'
            nombre_docx = f'BAJ-{baja.pk}-{timezone.now().strftime("%Y%m%d%H%M%S")}.docx'
            pdf_ruta  = None
            docx_ruta = None
            if pdf_bytes:
                pdf_ruta = subir_pdf_baja(pdf_bytes, nombre_pdf)
            if docx_bytes:
                docx_ruta = subir_docx_baja(docx_bytes, nombre_docx)
            BajaRepository.update_fields(baja, {
                'docx_path': docx_ruta or docs.get('docx_path'),
                'pdf_path':  pdf_ruta  or docs.get('pdf_path'),
                'fecha_doc': timezone.now(),
            })
            return True
        except Exception as exc:
            logger.error(
                'Error generando documentos para Baja id=%s: %s',
                getattr(baja, 'pk', '?'),
                str(exc),
                exc_info=True,
            )
            return False

    @staticmethod
    def listar(filters: Dict[str, Any]) -> Dict[str, Any]:
        qs = BajaRepository.filter(filters)
        return {'success': True, 'data': qs}

    @staticmethod
    def obtener(pk: int) -> Dict[str, Any]:
        baja = BajaService._get_or_404(pk)
        return {'data': baja}

    @staticmethod
    @transaction.atomic
    def crear(data: Dict[str, Any],usuario_elabora_id: int,nombre_elabora: str,
        cargo_elabora_token: str,sede_elabora_id: int,sede_nombre: str = '',
        modulo_elabora_id: int = None,modulo_elabora_nombre: str = '',rol: str = '') -> Dict[str, Any]:
        items_raw = data.pop('items', [])
        items     = [BajaService._validar_item(item) for item in items_raw]
        numero_informe = BajaRepository.generate_numero_informe()
        datos_baja = {
            **data,
            'numero_informe':        numero_informe,
            'estado_baja':           'PENDIENTE_APROBACION',
            'usuario_elabora_id':    usuario_elabora_id,
            'nombre_elabora':        nombre_elabora,
            'cargo_elabora':         data.get('cargo_elabora') or cargo_elabora_token,
            'sede_elabora_id':       sede_elabora_id,
            'sede_elabora_nombre':   sede_nombre,
            'modulo_elabora_id':     modulo_elabora_id,
            'modulo_elabora_nombre': modulo_elabora_nombre,
        }
        baja = BajaRepository.create(datos_baja)
        BajaDetalleRepository.bulk_create(baja, items)
        bienes = [it['bien'] for it in items]
        TransferenciaService._cambiar_estado_bienes(bienes, 'PENDIENTE_BAJA')
        baja   = BajaRepository.get_by_id(baja.pk)
        doc_ok = BajaService._regenerar_documentos(baja)
        BajaAprobacionRepository.registrar(
            baja=baja,
            accion='REGISTRADO',
            rol=rol,
            usuario_id=usuario_elabora_id,
            observacion=f'Informe {numero_informe} registrado y enviado a aprobación.',
        )
        msg = f'Informe {numero_informe} registrado. Pendiente de aprobación.'
        if not doc_ok:
            msg += ' (El documento PDF no pudo generarse; revise los logs del servidor.)'
        return {'success': True, 'message': msg}

    @staticmethod
    @transaction.atomic
    def reenviar(pk: int, data: Dict[str, Any], usuario_id: int,role:str,token:str) -> Dict[str, Any]:
        baja = BajaService._get_or_404(pk)
        if baja.estado_baja != 'DEVUELTO':
            raise ValidationError(
                f'Solo se puede reenviar desde DEVUELTO. Estado actual: {baja.estado_baja}.'
            )
        campos = {k: v for k, v in data.items() if v is not None}
        campos['estado_baja']       = 'PENDIENTE_APROBACION'
        campos['motivo_devolucion'] = None
        BajaRepository.update_fields(baja, campos)
        baja = BajaRepository.get_by_id(baja.pk)
        BajaService._regenerar_documentos(baja)
        BajaAprobacionRepository.registrar(
            baja=baja,
            accion='ENVIADO',
            rol=role,
            usuario_id=usuario_id,
            observacion='Informe corregido y reenviado a aprobación.',
        )
        baja = BajaRepository.get_by_id(baja.pk)
        return {'success': True, 'message': 'Informe reenviado a aprobación.', 'data': baja}

    @staticmethod
    @transaction.atomic
    def aprobar(pk: int,coordsistema_id: int,nombre_coord: str, cargo_coord: str,role:str) -> Dict[str, Any]:
        baja = BajaService._get_or_404(pk)
        if baja.estado_baja != 'PENDIENTE_APROBACION':
            raise ValidationError(
                f'No se puede aprobar desde "{baja.estado_baja}". Se requiere PENDIENTE_APROBACION.'
            )
        now = timezone.now()
        for det in baja.detalles.select_related('bien'):
            BienRepository.update_fields(det.bien, {
                'is_active':      False,
                'fecha_baja':     now.date(),
                'motivo_baja_id': det.motivo_baja_id,
            })
        BajaRepository.update_fields(baja, {
            'aprobado_por_coordsistema_id': coordsistema_id,
            'nombre_coordsistema':          nombre_coord,
            'cargo_coordsistema':           cargo_coord,
            'fecha_aprobacion':             now,
            'estado_baja':                  'APROBADO',
        })
        BajaAprobacionRepository.registrar(
            baja=baja,
            accion='APROBADO',
            rol=role,
            usuario_id=coordsistema_id,
            observacion='Baja aprobada. Bienes dados de baja en el sistema.',
        )
        total = baja.detalles.count()
        return {
            'success': True,
            'message': (
                f'Baja {baja.numero_informe} aprobada. '
                f'{total} bien(es) dado(s) de baja definitivamente.'
            ),
        }

    @staticmethod
    @transaction.atomic
    def devolver(pk: int, motivo: str, usuario_id: int,role:str) -> Dict[str, Any]:
        baja = BajaService._get_or_404(pk)
        if baja.estado_baja != 'PENDIENTE_APROBACION':
            raise ValidationError(
                f'Solo se puede devolver desde PENDIENTE_APROBACION. Estado actual: {baja.estado_baja}.'
            )
        BajaRepository.update_fields(baja, {
            'estado_baja':       'DEVUELTO',
            'motivo_devolucion': motivo,
        })
        BajaAprobacionRepository.registrar(
            baja=baja,
            accion='DEVUELTO',
            rol=role,
            usuario_id=usuario_id,
            observacion=motivo,
        )
        return {'success': True, 'message': 'Informe devuelto al asistente para corrección.'}


    @staticmethod
    def listar_pendientes_aprobacion(user_id: int, role: str, sede_id: int, token: str) -> list:
        qs = BajaRepository.filter({})
        qs = qs.exclude(estado_baja__in=['ATENDIDO', 'CANCELADO'])
 
        if role == 'SYSADMIN':
            qs = qs.filter(estado_baja='PENDIENTE_APROBACION')
        else:
            filtros = Q()
 
            filtros |= Q(
                estado_baja='PENDIENTE_APROBACION',
                sede_elabora_id=sede_id,
                usuario_destino_id=user_id,
                aprobado_por_coordsistema_id__isnull=True,
            )
 
            filtros |= Q(
                estado_baja='APROBADO',
                sede_elabora_id=sede_id,
                usuario_elabora_id=user_id,
                pdf_firmado_path__isnull=True,
            ) & ~Q(aprobado_por_coordsistema_id=user_id)
 
            qs = qs.filter(filtros)
 
        return list(qs.order_by('-fecha_registro').distinct())
    
    @staticmethod
    @transaction.atomic
    def cancelar(pk: int,motivo_cancelacion_id: int, detalle: str,usuario_id: int,role:str) -> Dict[str, Any]:
        baja = BajaService._get_or_404(pk)
        if baja.estado_baja in ('ATENDIDO', 'CANCELADO'):
            raise ValidationError(
                f'No se puede cancelar una baja en estado "{baja.estado_baja}".'
            )
        BajaRepository.update_fields(baja, {
            'estado_baja':           'CANCELADO',
            'motivo_cancelacion_id': motivo_cancelacion_id,
            'detalle_cancelacion':   detalle,
            'fecha_cancelacion':     timezone.now(),
        })
        BajaAprobacionRepository.registrar(
            baja=baja,
            accion='CANCELADO',
            rol=role,
            usuario_id=usuario_id,
            observacion=detalle or 'Baja cancelada.',
        )
        return {'success': True, 'message': 'Baja cancelada correctamente.'}

    @staticmethod
    def descargar_pdf(pk: int,cookie: str = ''):
        baja = BajaService._get_or_404(pk)
        if baja.estado_baja not in ('APROBADO', 'ATENDIDO'):
            raise ValidationError(
                'El documento solo está disponible cuando el estado es APROBADO o ATENDIDO.'
            )        
        if baja.pdf_firmado_path:
            try:
                return descargar_pdf(baja.pdf_firmado_path)
            except Exception as e:
                logger.warning('No se pudo descargar PDF firmado de mantenimiento %s: %s', baja.pdf_firmado_path, e)
        if baja.pdf_path:
            try:
                return descargar_pdf(baja.pdf_path)
            except Exception as e:
                logger.warning('No se pudo descargar PDF de mantenimiento %s: %s', baja.pdf_path, e)
        return generar_documentos_baja(baja)
 
    @staticmethod
    @transaction.atomic
    def subir_pdf_firmado(pk: int, archivo, usuario_id: int, role: str) -> Dict[str, Any]:
        baja = BajaService._get_or_404(pk)
        if baja.estado_baja != 'APROBADO':
            raise ValidationError(
                'Solo se puede subir el documento firmado cuando el estado es APROBADO.'
            )
        if baja.pdf_firmado_path:
            raise ValidationError(
                'Ya existe un documento firmado para esta baja. No se puede reemplazar.'
            )
        archivo_bytes = b''.join(archivo.chunks())
        ext    = (getattr(archivo, 'name', '.pdf').rsplit('.', 1)[-1].lower()) or 'pdf'
        nombre_archivo = f'{baja.numero_informe}_firmado{ext}'
        ruta   = subir_pdf_firmado_baja(archivo_bytes, nombre_archivo)        
        bienes = [det.bien for det in baja.detalles.select_related('bien')]
        TransferenciaService._cambiar_estado_bienes(bienes, 'INACTIVO')
        BajaRepository.update_fields(baja, {
            'estado_baja': 'ATENDIDO',
            'pdf_firmado_path':  ruta,
            'fecha_pdf_firmado': timezone.now(),
            'tiene_pdf_firmado':    True,
            'subido_por_id':     usuario_id,
        })
        BajaAprobacionRepository.registrar(
            baja=baja,
            accion='ATENDIDO',
            rol=role,
            usuario_id=usuario_id,
            observacion='Acta firmada recibida. Proceso ATENDIDO',
        )
        return {'success': True, 'message': 'Documento firmado subido correctamente.'}
    @staticmethod
    def obtener_bienes_para_baja(sede_id: int) -> List[Dict[str, Any]]:
        bienes = (
            Bien.objects
            .filter(
                sede_id=sede_id,
                is_active=True,
                estado_funcionamiento__nombre__in=list(ESTADOS_FUNCIONAMIENTO_BAJA),
            )
            .select_related('tipo_bien', 'marca', 'estado_funcionamiento')
            .order_by('tipo_bien__nombre', 'codigo_patrimonial')
        )
        resultado = []
        for bien in bienes:
            mantenimientos = MantenimientoParaBajaRepository.get_mantenimientos_atendidos_por_bien(bien.pk)
            resultado.append({
                'bien_id':                      bien.pk,
                'tipo_bien_nombre':             getattr(bien.tipo_bien, 'nombre', ''),
                'marca_nombre':                 getattr(bien.marca, 'nombre', ''),
                'modelo':                       bien.modelo or '',
                'numero_serie':                 bien.numero_serie or 'S/N',
                'codigo_patrimonial':           bien.codigo_patrimonial or 'S/C',
                'estado_funcionamiento_nombre': getattr(bien.estado_funcionamiento, 'nombre', ''),
                'sede_id':                      bien.sede_id,
                'modulo_id':                    bien.modulo_id,
                'usuario_asignado_id':          bien.usuario_asignado_id,
                'mantenimientos_disponibles':   mantenimientos,
            })
        return resultado

    @staticmethod
    def obtener_mantenimientos_para_baja(bien_id: int) -> List[Dict[str, Any]]:
        return MantenimientoParaBajaRepository.get_mantenimientos_atendidos_por_bien(bien_id)