from django.db import models
from django.db.models import QuerySet,Q
from .models import Transferencia, TransferenciaDetalle, TransferenciaAprobacion


class TransferenciaRepository:
    @staticmethod
    def get_by_id(pk: int):
        return (
            Transferencia.objects
            .select_related('motivo_transferencia', 'motivo_cancelacion')
            .prefetch_related('detalles__bien', 'aprobaciones')
            .filter(pk=pk)
            .first()
        )
    @staticmethod
    def listar(filters: dict):
        qs = TransferenciaRepository.filter(filters)
        return qs
    @staticmethod
    def create(data: dict) -> Transferencia:
        return Transferencia.objects.create(**data)
    @staticmethod
    def update_fields(transferencia: Transferencia, fields: dict) -> None:
        for attr, value in fields.items():
            setattr(transferencia, attr, value)
        transferencia.save(update_fields=list(fields.keys()))
    @staticmethod
    def filter(filters: dict) -> QuerySet:
        if hasattr(filters, 'dict'):
            params = filters.dict()
        else:
            params = dict(filters)
        qs = Transferencia.objects.select_related(
            'motivo_transferencia', 
            'motivo_cancelacion'
        ).prefetch_related(
            'detalles__bien', 
            'aprobaciones'
        ).all().order_by('-fecha_registro')
        user_id = params.get('user_id')
        role    = params.get('role')
        user_sede_id = params.get('user_sede_id') 
        if role and role != 'SYSADMIN':
            if role in ['COORDSISTEMA', 'ADMINSEDE', 'SEGURSEDE']:
                qs = qs.filter(Q(sede_origen_id=user_sede_id) | Q(sede_destino_id=user_sede_id))
            elif role == 'ASISTSISTEMA':
                qs = qs.filter(Q(usuario_origen_id=user_id) | Q(usuario_destino_id=user_id))
        if params.get('sede_origen_id'):
            qs = qs.filter(sede_origen_id=params.get('sede_origen_id'))
        if params.get('sede_destino_id'):
            qs = qs.filter(sede_destino_id=params.get('sede_destino_id'))
        if params.get('usuario_origen_id'):
            qs = qs.filter(usuario_origen_id=params.get('usuario_origen_id'))
        if params.get('usuario_destino_id'):
            qs = qs.filter(usuario_destino_id=params.get('usuario_destino_id'))
        if params.get('estado_transferencia'):
            qs = qs.filter(estado_transferencia=params.get('estado_transferencia'))
        if params.get('tipo'):
            qs = qs.filter(tipo=params.get('tipo'))
        if params.get('search'):
            s = params.get('search')
            qs = qs.filter(
                Q(numero_orden__icontains=s) |
                Q(detalles__codigo_patrimonial__icontains=s) |
                Q(detalles__numero_serie__icontains=s)
            ).distinct()
        return qs
    @staticmethod
    def get_mis_transferencias(usuario_id: int, role: str, sede_id: int) -> QuerySet:
        qs = Transferencia.objects.prefetch_related('detalles__bien')
        if role=='SYSADMIN':
            return qs.all()
        if role in ['COORDSISTEMA', 'ASISTSISTEMA']:
            return qs.filter(
                models.Q(usuario_origen_id=usuario_id) | 
                models.Q(usuario_destino_id=usuario_id)
            )
        if role == 'ADMINSEDE':
            return qs.filter(sede_origen_id=sede_id)            
        if role == 'SEGURSEDE':
            return qs.filter(
                models.Q(sede_origen_id=sede_id) | models.Q(sede_destino_id=sede_id),
                tipo='TRASLADO_SEDE'
            )
        return qs.filter(usuario_destino_id=usuario_id)
    @staticmethod
    def generate_numero_orden() -> str:
        from django.utils import timezone
        year = timezone.now().year
        prefix = f'TRF-{year}-'
        last = (
            Transferencia.objects
            .filter(numero_orden__startswith=prefix)
            .order_by('-numero_orden')
            .values_list('numero_orden', flat=True)
            .first()
        )
        seq = int(last.split('-')[-1]) + 1 if last else 1
        return f'{prefix}{seq:05d}'

class TransferenciaDetalleRepository:
    @staticmethod
    def bulk_create(transferencia: Transferencia, bienes: list) -> None:
        detalles = []
        for bien in bienes:
            detalles.append(TransferenciaDetalle(
                transferencia      = transferencia,
                bien               = bien,
                categoria_bien_nombre=bien.categoria_bien.nombre if bien.categoria_bien else 'SIN CATEGORÍA',
                codigo_patrimonial = bien.codigo_patrimonial or '',
                tipo_bien_nombre   = bien.tipo_bien.nombre if bien.tipo_bien else '',
                marca_nombre       = bien.marca.nombre if bien.marca else '',
                modelo             = bien.modelo or '',
                numero_serie       = bien.numero_serie or '',
            ))
        TransferenciaDetalle.objects.bulk_create(detalles)
    @staticmethod
    def get_by_transferencia_con_bienes(transferencia: Transferencia) -> QuerySet:
        return (
            TransferenciaDetalle.objects
            .select_related('bien')
            .filter(transferencia=transferencia)
        )
    @staticmethod
    def get_transferencia_activa_por_bien(
        bien_id: int,
        exclude_transferencia_id: int = None,
    ):
        qs = TransferenciaDetalle.objects.filter(
            bien_id=bien_id,
            transferencia__estado_transferencia__in=[
                'PENDIENTE_APROBACION',
                'DEVUELTO',
                'EN_RETORNO',
                'EN_ESPERA_CONFORMIDAD',
            ],
        ).select_related('transferencia')
        if exclude_transferencia_id:
            qs = qs.exclude(transferencia_id=exclude_transferencia_id)
        return qs.first()
    @staticmethod
    def delete_by_transferencia(transferencia: Transferencia) -> None:
        TransferenciaDetalle.objects.filter(transferencia=transferencia).delete()


class TransferenciaAprobacionRepository:
    @staticmethod
    def create(transferencia: Transferencia,
        rol_aprobador: str,accion: str,usuario_id: int,detalle: str = None,) -> TransferenciaAprobacion:
        return TransferenciaAprobacion.objects.create(
            transferencia = transferencia,
            rol_aprobador = rol_aprobador,
            accion        = accion,
            usuario_id    = usuario_id,
            detalle       = detalle,
        )