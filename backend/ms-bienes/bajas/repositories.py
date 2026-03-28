from typing import Optional, Dict, Any, List
from django.db.models import QuerySet, Max
from django.utils import timezone

from .models import Baja, BajaDetalle, BajaAprobacion
from mantenimientos.models import MantenimientoDetalle


class BajaRepository:

    @staticmethod
    def get_by_id(pk: int) -> Optional[Baja]:
        return (
            Baja.objects
            .filter(pk=pk)
            .select_related('motivo_cancelacion')
            .prefetch_related(
                'detalles__bien__tipo_bien',
                'detalles__bien__marca',
                'detalles__bien__estado_funcionamiento',
                'detalles__motivo_baja',
                'detalles__mantenimiento',
                'aprobaciones',
            )
            .first()
        )

    @staticmethod
    def filter(filters: Dict[str, Any]) -> QuerySet:
        qs = (
            Baja.objects
            .select_related('motivo_cancelacion')
            .prefetch_related('detalles__motivo_baja', 'aprobaciones')
        )
        if filters.get('estado_baja'):
            qs = qs.filter(estado_baja=filters['estado_baja'])
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
        anio   = timezone.now().strftime('%Y')
        prefix = f'BAJ-{anio}-'
        last   = (
            Baja.objects
            .filter(numero_informe__startswith=prefix)
            .aggregate(max_num=Max('numero_informe'))['max_num']
        )
        seq = int(last[-4:]) + 1 if last else 1
        return f'{prefix}{seq:04d}'


class BajaDetalleRepository:

    @staticmethod
    def bulk_create(baja: Baja, items: List[Dict[str, Any]]) -> None:
        detalles = []
        for item in items:
            bien      = item['bien']
            mant_data = item.get('mant_data', {})
            detalles.append(
                BajaDetalle(
                    baja=baja,
                    bien=bien,
                    motivo_baja_id=item['motivo_baja_id'],
                    mantenimiento_id=item.get('mantenimiento_id'),
                    tipo_bien_nombre=(
                        getattr(bien.tipo_bien, 'nombre', '')
                        if bien.tipo_bien_id else ''
                    ),
                    marca_nombre=(
                        getattr(bien.marca, 'nombre', '')
                        if bien.marca_id else ''
                    ),
                    modelo=bien.modelo or '',
                    numero_serie=bien.numero_serie or 'S/N',
                    codigo_patrimonial=bien.codigo_patrimonial or 'S/C',
                    estado_funcionamiento=(
                        getattr(bien.estado_funcionamiento, 'nombre', '')
                        if bien.estado_funcionamiento_id else ''
                    ),
                    diagnostico_inicial=mant_data.get('diagnostico_inicial'),
                    trabajo_realizado=mant_data.get('trabajo_realizado'),
                    diagnostico_final=mant_data.get('diagnostico_final'),
                    observacion_tecnica=mant_data.get('observacion_detalle'),
                    imagenes_incluidas=item.get('imagenes_incluidas', []),
                )
            )
        BajaDetalle.objects.bulk_create(detalles)


class BajaAprobacionRepository:

    @staticmethod
    def registrar(
        baja: Baja,
        accion: str,
        rol: str,
        usuario_id: int,
        observacion: str = '',
    ) -> BajaAprobacion:
        return BajaAprobacion.objects.create(
            baja=baja,
            accion=accion,
            rol_aprobador=rol,
            usuario_id=usuario_id,
            observacion=observacion,
        )


class MantenimientoParaBajaRepository:

    ESTADOS_BAJA = {'INOPERATIVO', 'OBSOLETO', 'IRRECUPERABLE'}

    @staticmethod
    def get_mantenimientos_atendidos_por_bien(bien_id: int) -> List[Dict[str, Any]]:
        detalles = (
            MantenimientoDetalle.objects
            .filter(
                bien_id=bien_id,
                mantenimiento__estado_mantenimiento='ATENDIDO',
            )
            .select_related(
                'mantenimiento',
                'bien__tipo_bien',
                'bien__marca',
                'estado_funcionamiento_final',
            )
            .prefetch_related('mantenimiento__imagenes')
            .order_by('-mantenimiento__fecha_registro')
        )
        resultado = []
        for det in detalles:
            ef = (
                getattr(det.estado_funcionamiento_final, 'nombre', '')
                if det.estado_funcionamiento_final_id else ''
            )
            if ef.upper() not in MantenimientoParaBajaRepository.ESTADOS_BAJA:
                continue
            imagenes = [
                {
                    'id':          img.pk,
                    'imagen':      img.imagen.url if img.imagen else None,
                    'descripcion': img.descripcion,
                    'fecha':       img.fecha_subida.isoformat() if img.fecha_subida else None,
                }
                for img in det.mantenimiento.imagenes.all()
            ]
            resultado.append({
                'mantenimiento_id':                   det.mantenimiento.pk,
                'numero_orden':                       det.mantenimiento.numero_orden,
                'fecha_registro':                     det.mantenimiento.fecha_registro,
                'bien_id':                            det.bien_id,
                'tipo_bien_nombre':                   getattr(det.bien.tipo_bien, 'nombre', ''),
                'marca_nombre':                       getattr(det.bien.marca, 'nombre', ''),
                'modelo':                             det.bien.modelo or '',
                'codigo_patrimonial':                 det.bien.codigo_patrimonial or 'S/C',
                'diagnostico_inicial':                det.diagnostico_inicial,
                'trabajo_realizado':                  det.trabajo_realizado,
                'diagnostico_final':                  det.diagnostico_final,
                'observacion_detalle':                det.observacion_detalle,
                'estado_funcionamiento_final_nombre': ef,
                'imagenes':                           imagenes,
            })
        return resultado