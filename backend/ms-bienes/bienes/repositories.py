from typing import Optional, Dict, Any
from django.db.models import QuerySet, Q
from .models import (
    Bien, BienDetalleCpu, BienDetalleMonitor,
    BienDetalleImpresora, BienDetalleScanner, BienDetalleSwitch,
)

_DETALLE_PREFETCH = (
    'detalle_cpu',
    'detalle_cpu__tipo_computadora',
    'detalle_cpu__tipo_disco',
    'detalle_cpu__arquitectura_bits',
    'detalle_monitor',
    'detalle_monitor__tipo_monitor',
    'detalle_impresora',
    'detalle_impresora__tipo_impresion',
    'detalle_impresora__interfaz_conexion',
    'detalle_impresora__tamano_carro',
    'detalle_scanner',
    'detalle_scanner__tipo_escaner',
    'detalle_scanner__interfaz_conexion',
    'detalle_switch',
)


class BienRepository:
    @staticmethod
    def get_all_activos() -> QuerySet:
        return (
            Bien.objects
            .filter(is_active=True)
            .select_related('tipo_bien', 'marca', 'regimen_tenencia', 'estado_bien', 'estado_funcionamiento')
            .prefetch_related(*_DETALLE_PREFETCH)
            .order_by('id')
        )

    @staticmethod
    def get_by_id(pk: int) -> Optional[Bien]:
        return (
            Bien.objects
            .filter(pk=pk)
            .select_related(
                'tipo_bien', 'marca', 'regimen_tenencia',
                'estado_bien', 'estado_funcionamiento', 'motivo_baja', 'categoria_bien',
            )
            .prefetch_related(*_DETALLE_PREFETCH)
            .first()
        )

    @staticmethod
    def filter(filters: Dict[str, Any]) -> QuerySet:
        qs = (
            Bien.objects
            .select_related(
                'tipo_bien', 'marca', 'estado_bien', 'estado_funcionamiento',
                'regimen_tenencia', 'categoria_bien', 'motivo_baja',
            )
            .prefetch_related(*_DETALLE_PREFETCH)
            .order_by('id')
        )

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
            q = filters['search']
            qs = qs.filter(
                Q(codigo_patrimonial__icontains=q) |
                Q(numero_serie__icontains=q) |
                Q(modelo__icontains=q)
            )
        return qs

    @staticmethod
    def update(bien: Bien, data: Dict[str, Any]) -> Bien:
        for field, value in data.items():
            setattr(bien, field, value)
        bien.save()
        return bien

    @staticmethod
    def update_fields(bien: Bien, data: Dict[str, Any]) -> None:
        for field, value in data.items():
            setattr(bien, field, value)
        bien.save(update_fields=list(data.keys()))

    @staticmethod
    def create(data: Dict[str, Any]) -> Bien:
        return Bien.objects.create(**data)

    @staticmethod
    def get_bienes_by_usuario(usuario_id: int) -> QuerySet:
        return (
            Bien.objects
            .filter(usuario_asignado_id=usuario_id, is_active=True)
            .select_related('tipo_bien', 'marca', 'estado_funcionamiento', 'estado_bien', 'categoria_bien', 'regimen_tenencia')
            .prefetch_related(*_DETALLE_PREFETCH)
            .order_by('id')
        )

    @staticmethod
    def get_bienes_disponibles_en_sede(sede_id: int) -> QuerySet:
        return (
            Bien.objects
            .filter(sede_id=sede_id, is_active=True, usuario_asignado_id__isnull=True)
            .select_related('tipo_bien', 'marca', 'estado_funcionamiento', 'estado_bien', 'categoria_bien')
            .prefetch_related(*_DETALLE_PREFETCH)
            .order_by('id')
        )


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