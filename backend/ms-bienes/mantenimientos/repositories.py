from typing import Optional, Dict, Any, List
from django.db.models import QuerySet, Q
from django.utils import timezone
from .models import (Mantenimiento, MantenimientoDetalle,
    MantenimientoAprobacion, MantenimientoImagen)
from bienes.models import Bien

class MantenimientoRepository:
    @staticmethod
    def get_by_id(pk: int) -> Optional[Mantenimiento]:
        return (
            Mantenimiento.objects
            .filter(pk=pk)
            .select_related('motivo_cancelacion')
            .prefetch_related(
                'detalles__bien',
                'detalles__estado_funcionamiento_antes',
                'detalles__estado_funcionamiento_despues',
                'aprobaciones',
                'imagenes',
            )
            .first()
        )
    @staticmethod
    def filter(filters: Dict[str, Any]) -> QuerySet:
        qs = Mantenimiento.objects.prefetch_related('detalles').select_related('motivo_cancelacion')
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
    def filter_mis_mantenimientos(usuario_id: int, role: str, sede_id: int) -> QuerySet:
        qs = Mantenimiento.objects.prefetch_related('detalles').select_related('motivo_cancelacion')
        ROLES_GLOBAL = {'SYSADMIN', 'coordSistema'}
        if role in ROLES_GLOBAL:
            return qs.all()
        if role == 'adminSede':
            return qs.filter(sede_id=sede_id)
        if role == 'asistSistema':
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
                tipo_bien_nombre=bien.tipo_bien.nombre,
                bien=bien,
                marca=bien.marca,
                modelo=bien.modelo,
                serie=bien.numero_serie,
                codigo_patrimonial=bien.codigo_patrimonial or 'S/N',                
                estado_funcionamiento_antes=bien.estado_funcionamiento,
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
                'estado_funcionamiento_antes',
                'estado_funcionamiento_despues',
            )
        )
    @staticmethod
    def update_estado_despues(
        detalle: MantenimientoDetalle,
        estado_funcionamiento_id: int,
        observacion: str = '',
    ) -> None:
        detalle.estado_funcionamiento_despues_id = estado_funcionamiento_id
        detalle.observacion_detalle = observacion
        detalle.save(update_fields=['estado_funcionamiento_despues_id', 'observacion_detalle'])

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
        imagen,
        descripcion: str = '',
    ) -> MantenimientoImagen:
        return MantenimientoImagen.objects.create(
            mantenimiento=mantenimiento,
            imagen=imagen,
            descripcion=descripcion,
        )
    @staticmethod
    def get_by_mantenimiento(m: Mantenimiento) -> QuerySet:
        return MantenimientoImagen.objects.filter(mantenimiento=m).order_by('fecha_subida')