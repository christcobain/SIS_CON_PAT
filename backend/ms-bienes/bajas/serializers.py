from rest_framework import serializers
from .models import Baja, BajaDetalle


class BajaDetalleSerializer(serializers.ModelSerializer):
    motivo_baja_nombre = serializers.CharField(source='motivo_baja.nombre', read_only=True)
    class Meta:
        model  = BajaDetalle
        fields = '__all__'
class BajaListSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Baja
        fields = [
            'id', 'numero_informe', 'estado',
            'usuario_elabora_id', 'sede_elabora_id',
            'usuario_destino_id', 'fecha_registro',
        ]
class BajaDetailSerializer(serializers.ModelSerializer):
    detalles = BajaDetalleSerializer(many=True, read_only=True)
    motivo_cancelacion_nombre = serializers.CharField(source='motivo_cancelacion.nombre', read_only=True)
    class Meta:
        model  = Baja
        fields = '__all__'

class BajaItemSerializer(serializers.Serializer):
    bien_id          = serializers.IntegerField()
    motivo_baja_id   = serializers.IntegerField()
    mantenimiento_id = serializers.IntegerField(required=False, allow_null=True)
class BajaCreateSerializer(serializers.Serializer):
    usuario_destino_id = serializers.IntegerField()   
    antecedentes       = serializers.CharField(required=False, allow_blank=True)
    analisis           = serializers.CharField(required=False, allow_blank=True)
    conclusiones       = serializers.CharField(required=False, allow_blank=True)
    recomendaciones    = serializers.CharField(required=False, allow_blank=True)
    items              = BajaItemSerializer(many=True, min_length=1)
class DevolucionSerializer(serializers.Serializer):
    motivo_devolucion = serializers.CharField()
class CancelacionSerializer(serializers.Serializer):
    motivo_cancelacion_id = serializers.IntegerField()
    detalle_cancelacion   = serializers.CharField(required=False, allow_blank=True)