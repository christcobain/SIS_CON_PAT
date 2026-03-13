from typing import Optional, Dict, Any, List
from django.db.models import QuerySet, Max
from .models import Baja, BajaDetalle
from bienes.models import Bien

class BajaRepository:
    @staticmethod
    def get_by_id(pk: int) -> Optional[Baja]:
        return (
            Baja.objects
            .filter(pk=pk)
            .select_related('motivo_cancelacion')
            .prefetch_related('detalles__bien__tipo_bien', 'detalles__motivo_baja')
            .first()
        )
    @staticmethod
    def filter(filters: Dict[str, Any]) -> QuerySet:
        qs = Baja.objects.prefetch_related('detalles')
        if filters.get('estado'):
            qs = qs.filter(estado=filters['estado'])
        if filters.get('sede_elabora_id'):
            qs = qs.filter(sede_elabora_id=filters['sede_elabora_id'])
        if filters.get('usuario_elabora_id'):
            qs = qs.filter(usuario_elabora_id=filters['usuario_elabora_id'])
        return qs.order_by('-fecha_registro')
    @staticmethod
    def create(data: Dict[str, Any]) -> Baja:
        return Baja.objects.create(**data)
    @staticmethod
    def update_fields(baja: Baja, fields: Dict[str, Any]) -> None:
        for attr, val in fields.items():
            setattr(baja, attr, val)
        baja.save(update_fields=list(fields.keys()))
    @staticmethod
    def generate_numero_informe() -> str:
        from django.utils import timezone
        hoy = timezone.now().strftime('%Y%m%d')
        prefix = f'BAJ-{hoy}-'
        last = (
            Baja.objects
            .filter(numero_informe__startswith=prefix)
            .aggregate(Max('numero_informe'))['numero_informe__max']
        )
        seq = int(last[-4:]) + 1 if last else 1
        return f'{prefix}{seq:04d}'

class BajaDetalleRepository:
    @staticmethod
    def bulk_create(baja: Baja, items: List[Dict[str, Any]]) -> None:
        detalles = [
            BajaDetalle(
                baja=baja,
                bien=item['bien'],
                motivo_baja_id=item['motivo_baja_id'],
                mantenimiento_id=item.get('mantenimiento_id'),
                tipo_bien_nombre=item['bien'].tipo_bien.nombre,
                marca_nombre=item['bien'].marca.nombre,
                modelo=item['bien'].modelo,
                numero_serie=item['bien'].numero_serie or 'S/N',
                codigo_patrimonial=item['bien'].codigo_patrimonial or 'S/N',
                estado_funcionamiento=item['bien'].estado_funcionamiento.nombre,
            )
            for item in items
        ]
        BajaDetalle.objects.bulk_create(detalles)