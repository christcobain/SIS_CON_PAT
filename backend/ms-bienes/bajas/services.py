from typing import Dict, Any, List
from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import ValidationError, NotFound
from .repositories import BajaRepository, BajaDetalleRepository
from bienes.repositories import BienRepository

class BajaService:
    @staticmethod
    def _get_or_404(pk: int):
        baja = BajaRepository.get_by_id(pk)
        if not baja:
            raise NotFound(f'Baja con id={pk} no encontrada.')
        return baja
    @staticmethod
    @transaction.atomic
    def crear(data: Dict[str, Any], usuario_elabora_id: int, sede_elabora_id: int) -> Dict[str, Any]:
        items_raw = data.pop('items', [])
        if not items_raw:
            raise ValidationError('Debe incluir al menos un bien en la baja.')
        ESTADOS_BAJA = {'AVERIADO', 'INOPERATIVO'}
        items = []
        for item in items_raw:
            bien = BienRepository.get_by_id(item['bien_id'])
            if not bien:
                raise ValidationError(f'Bien id={item["bien_id"]} no encontrado.')
            if not bien.is_active:
                raise ValidationError(f'El bien id={bien.pk} ya está dado de baja.')
            if bien.estado_funcionamiento.nombre.upper() not in ESTADOS_BAJA:
                raise ValidationError(
                    f'El bien id={bien.pk} tiene estado "{bien.estado_funcionamiento.nombre}". '
                    f'Solo se puede dar de baja bienes AVERIADOS o INOPERATIVOS.'
                )
            items.append({
                'bien':             bien,
                'motivo_baja_id':   item['motivo_baja_id'],
                'mantenimiento_id': item.get('mantenimiento_id'),
            })
        numero_informe = BajaRepository.generate_numero_informe()
        baja = BajaRepository.create({
            **data,
            'numero_informe':    numero_informe,
            'estado':            'PENDIENTE_APROBACION',
            'usuario_elabora_id': usuario_elabora_id,
            'sede_elabora_id':    sede_elabora_id,
        })
        BajaDetalleRepository.bulk_create(baja, items)
        return {"success": True, "message": "Baja registrada exitosamente.", "data": baja}
    @staticmethod
    @transaction.atomic
    def aprobar(pk: int, coordsistema_id: int) -> Dict[str, Any]:
        baja = BajaService._get_or_404(pk)
        if baja.estado != 'PENDIENTE_APROBACION':
            raise ValidationError(f'No se puede aprobar desde el estado "{baja.estado}".')
        now = timezone.now()
        for det in baja.detalles.select_related('bien'):
            BienRepository.update_fields(det.bien, {
                'is_active':      False,
                'fecha_baja':     now.date(),
                'motivo_baja_id': det.motivo_baja_id,
            })
        BajaRepository.update_fields(baja, {
            'aprobado_por_id': coordsistema_id,
            'fecha_aprobacion': now,
            'estado':           'ATENDIDO',
        })
        return {"success": True, "message": "Baja aprobada. Bienes dados de baja definitivamente."}
    @staticmethod
    @transaction.atomic
    def devolver(pk: int, motivo: str) -> Dict[str, Any]:
        baja = BajaService._get_or_404(pk)
        if baja.estado != 'PENDIENTE_APROBACION':
            raise ValidationError('Solo se puede devolver desde PENDIENTE_APROBACION.')
        BajaRepository.update_fields(baja, {
            'estado':           'DEVUELTO',
            'motivo_devolucion': motivo,
        })
        return {"success": True, "message": "Baja devuelta para corrección."}
    @staticmethod
    @transaction.atomic
    def cancelar(pk: int, motivo_cancelacion_id: int, detalle: str) -> Dict[str, Any]:
        baja = BajaService._get_or_404(pk)
        if baja.estado in ('ATENDIDO', 'CANCELADO'):
            raise ValidationError(f'No se puede cancelar una baja en estado "{baja.estado}".')
        BajaRepository.update_fields(baja, {
            'estado':               'CANCELADO',
            'motivo_cancelacion_id': motivo_cancelacion_id,
            'detalle_cancelacion':  detalle,
            'fecha_cancelacion':    timezone.now(),
        })
        return {"success": True, "message": "Baja cancelada."}
    @staticmethod
    def listar(filters: Dict[str, Any]) -> Dict[str, Any]:
        qs = BajaRepository.filter(filters)
        return {"success": True, "data": qs}
    @staticmethod
    def obtener(pk: int) -> Dict[str, Any]:
        baja = BajaService._get_or_404(pk)
        return {"success": True, "data": baja}