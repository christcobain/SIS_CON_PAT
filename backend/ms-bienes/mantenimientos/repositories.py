from typing import Optional, Dict, Any, List
from django.db.models import QuerySet, Q
from django.utils import timezone
from .models import (
    Mantenimiento,
    MantenimientoDetalle,
    MantenimientoAprobacion,
    MantenimientoImagen,
)
from bienes.models import Bien


class MantenimientoRepository:
    @staticmethod
    def get_by_id(pk: int) -> Optional[Mantenimiento]:
        return (
            Mantenimiento.objects
            .filter(pk=pk)
            .select_related('motivo_cancelacion')
            .prefetch_related(
                'detalles__bien__tipo_bien',
                'detalles__bien__marca',
                'detalles__bien__estado_funcionamiento',
                'detalles__estado_funcionamiento_inicial',
                'detalles__estado_funcionamiento_final',
                'aprobaciones',
                'imagenes',
            )
            .first()
        )

    @staticmethod
    def filter(filters: Dict[str, Any]) -> QuerySet:
        qs = (
            Mantenimiento.objects
            .prefetch_related(
                'detalles__bien__tipo_bien',
                'detalles__estado_funcionamiento_inicial',
                'detalles__estado_funcionamiento_final',
                'aprobaciones',
                'imagenes',
            )
            .select_related('motivo_cancelacion')
        )
        if filters.get('estado_mantenimiento'):
            qs = qs.filter(estado_mantenimiento=filters['estado_mantenimiento'])
        if filters.get('sede_id'):
            qs = qs.filter(sede_id=filters['sede_id'])
        if filters.get('usuario_realiza_id'):
            qs = qs.filter(usuario_realiza_id=filters['usuario_realiza_id'])
        if filters.get('usuario_propietario_id'):
            qs = qs.filter(usuario_propietario_id=filters['usuario_propietario_id'])
        return qs.order_by('-fecha_registro')

    @staticmethod
    def filter_mis_mantenimientos(
        usuario_id: int,
        role: str,
        sede_id: int,
    ) -> QuerySet:
        qs = (
            Mantenimiento.objects
            .prefetch_related(
                'detalles__bien__tipo_bien',
                'detalles__estado_funcionamiento_inicial',
                'detalles__estado_funcionamiento_final',
                'aprobaciones',
                'imagenes',
            )
            .select_related('motivo_cancelacion')
        )
        if role in ('SYSADMIN', 'COORDSISTEMA'):
            return qs.all()
        if role == 'ADMINSEDE':
            return qs.filter(sede_id=sede_id)
        if role == 'ASISTSISTEMA':
            return qs.filter(
                Q(usuario_realiza_id=usuario_id) | Q(sede_id=sede_id)
            )
        return qs.filter(usuario_propietario_id=usuario_id)

    @staticmethod
    def create(data: Dict[str, Any]) -> Mantenimiento:
        return Mantenimiento.objects.create(**data)

    @staticmethod
    def update_fields(m: Mantenimiento, fields: Dict[str, Any]) -> None:
        for attr, val in fields.items():
            setattr(m, attr, val)
        m.save(update_fields=list(fields.keys()))

    @staticmethod
    def generate_numero_orden() -> str:
        year   = timezone.now().year
        prefix = f'MNT-{year}-'
        last   = (
            Mantenimiento.objects
            .filter(numero_orden__startswith=prefix)
            .order_by('-numero_orden')
            .values_list('numero_orden', flat=True)
            .first()
        )
        seq = int(last[-4:]) + 1 if last else 1
        return f'{prefix}{seq:04d}'


class MantenimientoDetalleRepository:
    @staticmethod
    def bulk_create(mantenimiento: Mantenimiento, bienes: List[Bien]) -> None:
        detalles = [
            MantenimientoDetalle(
                mantenimiento=mantenimiento,
                bien=bien,
                estado_funcionamiento_inicial=bien.estado_funcionamiento,
            )
            for bien in bienes
        ]
        MantenimientoDetalle.objects.bulk_create(detalles)

    @staticmethod
    def get_by_mantenimiento(m: Mantenimiento) -> QuerySet:
        return (
            MantenimientoDetalle.objects
            .filter(mantenimiento=m)
            .select_related(
                'bien',
                'bien__tipo_bien',
                'bien__marca',
                'estado_funcionamiento_inicial',
                'estado_funcionamiento_final',
            )
        )

    @staticmethod
    def get_by_id(pk: int) -> Optional[MantenimientoDetalle]:
        return (
            MantenimientoDetalle.objects
            .filter(pk=pk)
            .select_related(
                'bien',
                'estado_funcionamiento_inicial',
                'estado_funcionamiento_final',
            )
            .first()
        )

    @staticmethod
    def update_detalle(
        detalle: MantenimientoDetalle,
        estado_funcionamiento_final_id: Optional[int],
        diagnostico_inicial: str = '',
        trabajo_realizado: str = '',
        diagnostico_final: str = '',
        observacion_detalle: str = '',
    ) -> None:
        if estado_funcionamiento_final_id:
            detalle.estado_funcionamiento_final_id = estado_funcionamiento_final_id
        if diagnostico_inicial:
            detalle.diagnostico_inicial = diagnostico_inicial
        if trabajo_realizado:
            detalle.trabajo_realizado = trabajo_realizado
        if diagnostico_final:
            detalle.diagnostico_final = diagnostico_final
        if observacion_detalle:
            detalle.observacion_detalle = observacion_detalle
        detalle.save(update_fields=[
            'estado_funcionamiento_final_id',
            'diagnostico_inicial',
            'trabajo_realizado',
            'diagnostico_final',
            'observacion_detalle',
        ])


class MantenimientoAprobacionRepository:
    @staticmethod
    def registrar(
        mantenimiento: Mantenimiento,
        rol: str,
        accion: str,
        usuario_id: int,
        observacion: str = '',
    ) -> MantenimientoAprobacion:
        return MantenimientoAprobacion.objects.create(
            mantenimiento=mantenimiento,
            rol_aprobador=rol,
            accion=accion,
            usuario_id=usuario_id,
            observacion=observacion,
        )


class MantenimientoImagenRepository:
    @staticmethod
    def create(
        mantenimiento: Mantenimiento,
        imagen_path: str,
        descripcion: str = '',
        subido_por_id: int = None,
    ) -> MantenimientoImagen:
        return MantenimientoImagen.objects.create(
            mantenimiento=mantenimiento,
            imagen_path=imagen_path,
            descripcion=descripcion,
            subido_por_id=subido_por_id,
        )

    @staticmethod
    def get_by_id(pk: int) -> Optional[MantenimientoImagen]:
        return MantenimientoImagen.objects.filter(pk=pk).first()

    @staticmethod
    def delete(imagen: MantenimientoImagen) -> None:
        imagen.delete()

    @staticmethod
    def get_by_mantenimiento(m: Mantenimiento) -> QuerySet:
        return MantenimientoImagen.objects.filter(
            mantenimiento=m
        ).order_by('fecha_subida')