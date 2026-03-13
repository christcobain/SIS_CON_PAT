from typing import Optional, Dict, Any
from django.db.models import QuerySet, Q
from .models import (
    Bien, BienDetalleCpu, BienDetalleMonitor,
    BienDetalleImpresora, BienDetalleScanner, BienDetalleSwitch,
)


class BienRepository:
    @staticmethod
    def get_all_activos() -> QuerySet:
        return (
            Bien.objects
            .filter(is_active=True)
            .select_related('tipo_bien', 'marca', 'regimen_tenencia', 'estado_bien', 'estado_funcionamiento')
        ).order_by('id')
    @staticmethod
    def get_by_id(pk: int) -> Optional[Bien]:
        return (
            Bien.objects
            .filter(pk=pk)
            .select_related(
                'tipo_bien', 'marca', 'regimen_tenencia',
                'estado_bien', 'estado_funcionamiento', 'motivo_baja',
            )
            .prefetch_related(
                'detalle_cpu', 'detalle_monitor',
                'detalle_impresora', 'detalle_scanner', 'detalle_switch',
            )
            .first()
        )

    @staticmethod
    def filter(filters: Dict[str, Any]) -> QuerySet:
        qs = Bien.objects.select_related(
            'tipo_bien', 'marca', 'estado_bien', 'estado_funcionamiento'
        ).order_by('id')
        if filters.get('is_active') is not None:
            qs = qs.filter(is_active=filters['is_active'])
        else:
            qs = qs.filter(is_active=True)
        if filters.get('sede_id'):
            qs = qs.filter(sede_id=filters['sede_id'])
        if filters.get('modulo_id'):
            qs = qs.filter(modulo_id=filters['modulo_id'])
        if filters.get('ubicacion_id'):
            qs = qs.filter(ubicacion_id=filters['ubicacion_id'])
        if filters.get('empresa_id'):
            qs = qs.filter(empresa_id=filters['empresa_id'])
        if filters.get('usuario_asignado_id'):
            qs = qs.filter(usuario_asignado_id=filters['usuario_asignado_id'])
        if filters.get('tipo_bien_id'):
            qs = qs.filter(tipo_bien_id=filters['tipo_bien_id'])
        if filters.get('estado_funcionamiento_id'):
            qs = qs.filter(estado_funcionamiento_id=filters['estado_funcionamiento_id'])
        if filters.get('search'):
            term = filters['search']
            qs = qs.filter(
                Q(codigo_patrimonial__icontains=term)
                | Q(numero_serie__icontains=term)
                | Q(modelo__icontains=term)
            )
        return qs
    @staticmethod
    def get_by_codigo_patrimonial(codigo: str, exclude_pk: int = None) -> Optional[Bien]:
        qs = Bien.objects.filter(codigo_patrimonial=codigo)
        if exclude_pk:
            qs = qs.exclude(pk=exclude_pk)
        return qs.first()
    @staticmethod
    def get_by_numero_serie(serie: str, exclude_pk: int = None) -> Optional[Bien]:
        qs = Bien.objects.filter(numero_serie=serie)
        if exclude_pk:
            qs = qs.exclude(pk=exclude_pk)
        return qs.first()
    @staticmethod
    def create(data: Dict[str, Any]) -> Bien:
        return Bien.objects.create(**data)
    @staticmethod
    def update(bien: Bien, data: Dict[str, Any]) -> Bien:
        for field, value in data.items():
            setattr(bien, field, value)
        bien.save()
        return bien
    @staticmethod
    def update_fields(bien: Bien, fields: Dict[str, Any]) -> None:
        for attr, val in fields.items():
            setattr(bien, attr, val)
        bien.save(update_fields=list(fields.keys()))
    @staticmethod
    def get_bienes_by_usuario(usuario_id: int) -> QuerySet:
        return Bien.objects.filter(
            usuario_asignado_id=usuario_id, is_active=True
        ).select_related('tipo_bien', 'marca', 'estado_funcionamiento').order_by('id')
    @staticmethod
    def get_bienes_disponibles_en_sede(sede_id: int) -> QuerySet:
        return Bien.objects.filter(
            sede_id=sede_id, is_active=True, usuario_asignado_id__isnull=True
        ).select_related('tipo_bien', 'marca', 'estado_funcionamiento').order_by('id')
class BienDetalleCpuRepository:
    @staticmethod
    def get_by_bien(bien: Bien) -> Optional[BienDetalleCpu]:
        return BienDetalleCpu.objects.filter(bien=bien).first()
    @staticmethod
    def create(bien: Bien, data: Dict[str, Any]) -> BienDetalleCpu:
        return BienDetalleCpu.objects.create(bien=bien, **data)
    @staticmethod
    def update(detalle: BienDetalleCpu, data: Dict[str, Any]) -> BienDetalleCpu:
        for field, value in data.items():
            setattr(detalle, field, value)
        detalle.save()
        return detalle
class BienDetalleMonitorRepository:
    @staticmethod
    def get_by_bien(bien: Bien) -> Optional[BienDetalleMonitor]:
        return BienDetalleMonitor.objects.filter(bien=bien).first()
    @staticmethod
    def create(bien: Bien, data: Dict[str, Any]) -> BienDetalleMonitor:
        return BienDetalleMonitor.objects.create(bien=bien, **data)
    @staticmethod
    def update(detalle: BienDetalleMonitor, data: Dict[str, Any]) -> BienDetalleMonitor:
        for field, value in data.items():
            setattr(detalle, field, value)
        detalle.save()
        return detalle
class BienDetalleImpresoraRepository:
    @staticmethod
    def get_by_bien(bien: Bien) -> Optional[BienDetalleImpresora]:
        return BienDetalleImpresora.objects.filter(bien=bien).first()
    @staticmethod
    def create(bien: Bien, data: Dict[str, Any]) -> BienDetalleImpresora:
        return BienDetalleImpresora.objects.create(bien=bien, **data)
    @staticmethod
    def update(detalle: BienDetalleImpresora, data: Dict[str, Any]) -> BienDetalleImpresora:
        for field, value in data.items():
            setattr(detalle, field, value)
        detalle.save()
        return detalle
class BienDetalleScannerRepository:
    @staticmethod
    def get_by_bien(bien: Bien) -> Optional[BienDetalleScanner]:
        return BienDetalleScanner.objects.filter(bien=bien).first()
    @staticmethod
    def create(bien: Bien, data: Dict[str, Any]) -> BienDetalleScanner:
        return BienDetalleScanner.objects.create(bien=bien, **data)
    @staticmethod
    def update(detalle: BienDetalleScanner, data: Dict[str, Any]) -> BienDetalleScanner:
        for field, value in data.items():
            setattr(detalle, field, value)
        detalle.save()
        return detalle

class BienDetalleSwitchRepository:
    @staticmethod
    def get_by_bien(bien: Bien) -> Optional[BienDetalleSwitch]:
        return BienDetalleSwitch.objects.filter(bien=bien).first()
    @staticmethod
    def create(bien: Bien, data: Dict[str, Any]) -> BienDetalleSwitch:
        return BienDetalleSwitch.objects.create(bien=bien, **data)
    @staticmethod
    def update(detalle: BienDetalleSwitch, data: Dict[str, Any]) -> BienDetalleSwitch:
        for field, value in data.items():
            setattr(detalle, field, value)
        detalle.save()
        return detalle
    
DETALLE_REPO_MAP = {
    'CPU':       BienDetalleCpuRepository,
    'MONITOR':   BienDetalleMonitorRepository,
    'IMPRESORA': BienDetalleImpresoraRepository,
    'SCANNER':   BienDetalleScannerRepository,
    'SWITCH':    BienDetalleSwitchRepository,
}