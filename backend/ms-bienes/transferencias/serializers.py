from rest_framework import serializers
from .models import Transferencia, TransferenciaDetalle, TransferenciaAprobacion

class AprobacionSerializer(serializers.ModelSerializer):
    class Meta:
        model  = TransferenciaAprobacion
        fields = ['id', 'rol_aprobador', 'accion', 'usuario_id', 'detalle', 'fecha']
class TransferenciaDetalleSerializer(serializers.ModelSerializer):
    class Meta:
        model  = TransferenciaDetalle
        fields = [
            'id', 'bien_id',
            'codigo_patrimonial', 'tipo_bien_nombre',
            'marca_nombre', 'modelo', 'numero_serie',
        ]
class TransferenciaListSerializer(serializers.ModelSerializer):
    motivo_nombre     = serializers.CharField(source='motivo.nombre',           read_only=True)
    cancelacion_nombre = serializers.CharField(source='motivo_cancelacion.nombre', read_only=True)
    ultima_aprobacion = serializers.SerializerMethodField()
    tiene_pdf_firmado = serializers.SerializerMethodField()
    class Meta:
        model  = Transferencia
        fields = [
            'id', 'numero_orden', 'tipo', 'estado',
            'usuario_origen_id', 'sede_origen_id', 'modulo_origen_id',
            'usuario_destino_id', 'sede_destino_id', 'modulo_destino_id',
            'motivo_nombre', 'motivo_devolucion', 'cancelacion_nombre',
            'fecha_registro', 'ultima_aprobacion',
            'pdf_path', 'tiene_pdf_firmado', 'fecha_pdf',
        ]
    def get_ultima_aprobacion(self, obj):
        ultima = obj.aprobaciones.last()
        if not ultima:
            return None
        return {
            'rol_aprobador': ultima.rol_aprobador,
            'accion':        ultima.accion,
            'usuario_id':    ultima.usuario_id,
            'detalle':       ultima.detalle,
            'fecha':         ultima.fecha,
        }

    def get_tiene_pdf_firmado(self, obj):
        return bool(obj.pdf_firmado_path)

class TransferenciaDetailSerializer(serializers.ModelSerializer):
    detalles          = TransferenciaDetalleSerializer(many=True, read_only=True)
    aprobaciones      = AprobacionSerializer(many=True, read_only=True)
    motivo_nombre     = serializers.CharField(source='motivo.nombre',           read_only=True)
    cancelacion_nombre = serializers.CharField(source='motivo_cancelacion.nombre', read_only=True)
    tiene_pdf_firmado = serializers.SerializerMethodField()

    class Meta:
        model  = Transferencia
        fields = '__all__'

    def get_tiene_pdf_firmado(self, obj):
        return bool(obj.pdf_firmado_path)


class TrasladoSedeWriteSerializer(serializers.Serializer):
    bien_ids             = serializers.ListField(child=serializers.IntegerField(), min_length=1)
    usuario_destino_id   = serializers.IntegerField()
    sede_destino_id      = serializers.IntegerField()
    modulo_destino_id    = serializers.IntegerField(required=False, allow_null=True)
    ubicacion_destino_id = serializers.IntegerField(required=False, allow_null=True)
    piso_destino         = serializers.IntegerField(required=False, allow_null=True)
    motivo_id            = serializers.IntegerField(required=False, allow_null=True)
    descripcion          = serializers.CharField(required=False, allow_blank=True)


class AsignacionInternaWriteSerializer(serializers.Serializer):
    bien_ids             = serializers.ListField(child=serializers.IntegerField(), min_length=1)
    usuario_destino_id   = serializers.IntegerField()
    sede_destino_id      = serializers.IntegerField()
    modulo_destino_id    = serializers.IntegerField(required=False, allow_null=True)
    ubicacion_destino_id = serializers.IntegerField(required=False, allow_null=True)
    piso_destino         = serializers.IntegerField(required=False, allow_null=True)
    motivo_id            = serializers.IntegerField(required=False, allow_null=True)
    descripcion          = serializers.CharField(required=False, allow_blank=True)


class DevolucionSerializer(serializers.Serializer):
    motivo_devolucion = serializers.CharField(min_length=5)
class AprobacionSegurSerializer(serializers.Serializer):
    observacion = serializers.CharField(required=False, allow_blank=True)
class CancelacionSerializer(serializers.Serializer):
    motivo_cancelacion_id = serializers.IntegerField()
    detalle_cancelacion   = serializers.CharField(required=False, allow_blank=True)
class ReenvioSerializer(serializers.Serializer):
    bien_ids             = serializers.ListField(child=serializers.IntegerField(), min_length=1, required=False,)
    motivo_id            = serializers.IntegerField(required=False, allow_null=True)
    descripcion          = serializers.CharField(required=False, allow_blank=True)
    usuario_destino_id   = serializers.IntegerField(required=False)
    sede_destino_id      = serializers.IntegerField(required=False)
    modulo_destino_id    = serializers.IntegerField(required=False, allow_null=True)
    ubicacion_destino_id = serializers.IntegerField(required=False, allow_null=True)
    piso_destino         = serializers.IntegerField(required=False, allow_null=True)


class RetornoSalidaSerializer(serializers.Serializer):
    motivo_retorno = serializers.CharField(required=False, allow_blank=True)

class RetornoEntradaSerializer(serializers.Serializer):
    observacion = serializers.CharField(required=False, allow_blank=True)