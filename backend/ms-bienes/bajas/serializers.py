from typing import Optional
from rest_framework import serializers
from .models import Baja, BajaDetalle, BajaAprobacion


class BajaAprobacionSerializer(serializers.ModelSerializer):
    class Meta:
        model  = BajaAprobacion
        fields = ['id', 'rol_aprobador', 'accion', 'usuario_id', 'observacion', 'fecha']


class BajaDetalleSerializer(serializers.ModelSerializer):
    motivo_baja_nombre   = serializers.CharField(source='motivo_baja.nombre', read_only=True)
    mantenimiento_numero = serializers.SerializerMethodField()

    class Meta:
        model  = BajaDetalle
        fields = [
            'id',
            'bien_id',
            'tipo_bien_nombre',
            'marca_nombre',
            'modelo',
            'numero_serie',
            'codigo_patrimonial',
            'estado_funcionamiento',
            'motivo_baja_id',
            'motivo_baja_nombre',
            'mantenimiento_id',
            'mantenimiento_numero',
            'diagnostico_inicial',
            'trabajo_realizado',
            'diagnostico_final',
            'observacion_tecnica',
            'imagenes_incluidas',
        ]

    def get_mantenimiento_numero(self, obj) -> Optional[str]:
        if obj.mantenimiento_id:
            return getattr(obj.mantenimiento, 'numero_orden', None)
        return None


class BajaListSerializer(serializers.ModelSerializer):
    motivo_cancelacion_nombre = serializers.CharField(
        source='motivo_cancelacion.nombre', read_only=True,
    )
    total_bienes = serializers.SerializerMethodField()

    class Meta:
        model  = Baja
        fields = [
            'id',
            'numero_informe',
            'estado_baja',
            'usuario_elabora_id',
            'nombre_elabora',
            'cargo_elabora',
            'sede_elabora_id',
            'sede_elabora_nombre',
            'modulo_elabora_id',
            'modulo_elabora_nombre',
            'usuario_destino_id',
            'nombre_destino',
            'fecha_registro',
            'fecha_aprobacion',
            'motivo_cancelacion_nombre',
            'pdf_path',
            'total_bienes',
        ]

    def get_total_bienes(self, obj) -> int:
        return obj.detalles.count()


class BajaDetailSerializer(serializers.ModelSerializer):
    detalles                  = BajaDetalleSerializer(many=True, read_only=True)
    aprobaciones              = BajaAprobacionSerializer(many=True, read_only=True)
    motivo_cancelacion_nombre = serializers.CharField(
        source='motivo_cancelacion.nombre', read_only=True,
    )
    total_bienes = serializers.SerializerMethodField()

    class Meta:
        model  = Baja
        fields = [
            'id',
            'numero_informe',
            'estado_baja',
            'usuario_elabora_id',
            'nombre_elabora',
            'cargo_elabora',
            'sede_elabora_id',
            'sede_elabora_nombre',
            'modulo_elabora_id',
            'modulo_elabora_nombre',
            'usuario_destino_id',
            'nombre_destino',
            'cargo_destino',
            'antecedentes',
            'analisis',
            'conclusiones',
            'recomendaciones',
            'fecha_registro',
            'aprobado_por_coordsistema_id',
            'nombre_coordsistema',
            'cargo_coordsistema',
            'fecha_aprobacion',
            'motivo_devolucion',
            'motivo_cancelacion',
            'motivo_cancelacion_nombre',
            'detalle_cancelacion',
            'fecha_cancelacion',
            'docx_path',
            'pdf_path',
            'fecha_doc',
            'total_bienes',
            'detalles',
            'aprobaciones',
        ]

    def get_total_bienes(self, obj) -> int:
        return obj.detalles.count()


class BajaItemSerializer(serializers.Serializer):
    bien_id            = serializers.IntegerField(min_value=1)
    motivo_baja_id     = serializers.IntegerField(min_value=1)
    mantenimiento_id   = serializers.IntegerField(required=False, allow_null=True, min_value=1)
    imagenes_incluidas = serializers.ListField(
        child=serializers.IntegerField(min_value=1),
        required=False,
        default=list,
    )


class BajaCreateSerializer(serializers.Serializer):
    usuario_destino_id = serializers.IntegerField(min_value=1)
    nombre_destino     = serializers.CharField(required=False, allow_blank=True, default='')
    cargo_destino      = serializers.CharField(required=False, allow_blank=True, default='')
    cargo_elabora      = serializers.CharField(required=False, allow_blank=True, default='')
    antecedentes       = serializers.CharField(required=False, allow_blank=True, default='')
    analisis           = serializers.CharField(required=False, allow_blank=True, default='')
    conclusiones       = serializers.CharField(required=False, allow_blank=True, default='')
    recomendaciones    = serializers.CharField(required=False, allow_blank=True, default='')
    items              = BajaItemSerializer(many=True)

    def validate_items(self, value):
        if not value:
            raise serializers.ValidationError('Debe incluir al menos un bien.')
        bien_ids = [i['bien_id'] for i in value]
        if len(bien_ids) != len(set(bien_ids)):
            raise serializers.ValidationError('No se pueden repetir bienes en la misma baja.')
        return value


class BajaReenviarSerializer(serializers.Serializer):
    antecedentes    = serializers.CharField(required=False, allow_blank=True)
    analisis        = serializers.CharField(required=False, allow_blank=True)
    conclusiones    = serializers.CharField(required=False, allow_blank=True)
    recomendaciones = serializers.CharField(required=False, allow_blank=True)


class DevolucionSerializer(serializers.Serializer):
    motivo_devolucion = serializers.CharField(min_length=5)


class CancelacionSerializer(serializers.Serializer):
    motivo_cancelacion_id = serializers.IntegerField(min_value=1)
    detalle_cancelacion   = serializers.CharField(required=False, allow_blank=True, default='')


class MantenimientoParaBajaSerializer(serializers.Serializer):
    mantenimiento_id                   = serializers.IntegerField()
    numero_orden                       = serializers.CharField()
    fecha_registro                     = serializers.DateTimeField()
    bien_id                            = serializers.IntegerField()
    tipo_bien_nombre                   = serializers.CharField()
    marca_nombre                       = serializers.CharField()
    modelo                             = serializers.CharField()
    codigo_patrimonial                 = serializers.CharField()
    diagnostico_inicial                = serializers.CharField(allow_null=True)
    trabajo_realizado                  = serializers.CharField(allow_null=True)
    diagnostico_final                  = serializers.CharField(allow_null=True)
    observacion_detalle                = serializers.CharField(allow_null=True)
    estado_funcionamiento_final_nombre = serializers.CharField(allow_null=True)
    imagenes = serializers.ListField(child=serializers.DictField(), default=list)


class BienParaBajaSerializer(serializers.Serializer):
    bien_id                            = serializers.IntegerField()
    tipo_bien_nombre                   = serializers.CharField()
    marca_nombre                       = serializers.CharField()
    modelo                             = serializers.CharField()
    numero_serie                       = serializers.CharField()
    codigo_patrimonial                 = serializers.CharField()
    estado_funcionamiento_nombre       = serializers.CharField()
    sede_id                            = serializers.IntegerField()
    modulo_id                          = serializers.IntegerField(allow_null=True)
    usuario_asignado_id                = serializers.IntegerField(allow_null=True)
    mantenimientos_disponibles         = MantenimientoParaBajaSerializer(many=True)