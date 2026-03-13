from rest_framework import serializers
from .models import Mantenimiento, MantenimientoDetalle, MantenimientoImagen, MantenimientoAprobacion

class MantenimientoImagenSerializer(serializers.ModelSerializer):
    class Meta:
        model  = MantenimientoImagen
        fields = ['id', 'imagen', 'descripcion', 'fecha_subida']

class MantenimientoAprobacionSerializer(serializers.ModelSerializer):
    class Meta:
        model  = MantenimientoAprobacion
        fields = ['id', 'rol_aprobador', 'accion', 'usuario_id', 'observacion', 'fecha']

class MantenimientoDetalleSerializer(serializers.ModelSerializer):
    estado_funcionamiento_antes_nombre   = serializers.CharField(source='estado_funcionamiento_antes.nombre', read_only=True)
    estado_funcionamiento_despues_nombre = serializers.CharField(source='estado_funcionamiento_despues.nombre', read_only=True, default=None)
    class Meta:
        model  = MantenimientoDetalle
        fields = [
            'id', 'bien_id',
            'codigo_patrimonial', 'tipo_bien_nombre',
            'estado_funcionamiento_antes', 'estado_funcionamiento_antes_nombre',
            'estado_funcionamiento_despues', 'estado_funcionamiento_despues_nombre',
            'observacion_detalle',
        ]

class MantenimientoListSerializer(serializers.ModelSerializer):
    total_bienes = serializers.IntegerField(source='detalles.count', read_only=True)
    class Meta:
        model  = Mantenimiento
        fields = [
            'id', 'numero_orden', 'estado',
            'usuario_realiza_id', 'sede_id', 'modulo_id',
            'usuario_propietario_id',
            'fecha_registro', 'fecha_inicio', 'fecha_termino',
            'tiene_imagenes', 'pdf_path', 'pdf_firmado_path',
            'total_bienes',
        ]
class MantenimientoDetailSerializer(serializers.ModelSerializer):
    detalles    = MantenimientoDetalleSerializer(many=True, read_only=True)
    imagenes    = MantenimientoImagenSerializer(many=True, read_only=True)
    aprobaciones = MantenimientoAprobacionSerializer(many=True, read_only=True)
    tiene_pdf_firmado = serializers.SerializerMethodField()
    def get_tiene_pdf_firmado(self, obj):
        return bool(obj.pdf_firmado_path)
    class Meta:
        model  = Mantenimiento
        fields = '__all__'

class MantenimientoCreateSerializer(serializers.Serializer):
    bien_ids        = serializers.ListField(child=serializers.IntegerField(), min_length=1)
    datos_iniciales = serializers.CharField(required=False, allow_blank=True)
    modulo_id       = serializers.IntegerField(required=False, allow_null=True)
class DetalleEstadoSerializer(serializers.Serializer):
    bien_id                    = serializers.IntegerField()
    estado_funcionamiento_id   = serializers.IntegerField()
    observacion                = serializers.CharField(required=False, allow_blank=True, default='')
class EnviarAprobacionSerializer(serializers.Serializer):
    trabajos_realizados = serializers.CharField()
    diagnostico_final   = serializers.CharField()
    detalles_estado     = DetalleEstadoSerializer(many=True, required=False, default=list)
class AprobacionSerializer(serializers.Serializer):
    observacion = serializers.CharField(required=False, allow_blank=True, default='')
class DevolucionSerializer(serializers.Serializer):
    motivo_devolucion = serializers.CharField()
class CancelacionSerializer(serializers.Serializer):
    motivo_cancelacion_id = serializers.IntegerField()
    detalle_cancelacion   = serializers.CharField(required=False, allow_blank=True, default='')
    