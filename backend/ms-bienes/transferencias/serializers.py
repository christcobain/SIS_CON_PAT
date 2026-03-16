from rest_framework import serializers
from .models import Transferencia, TransferenciaDetalle, TransferenciaAprobacion
from bienes.services import MsUsuariosClient

class AprobacionSerializer(serializers.ModelSerializer):
    rol_aprobador_nombre= serializers.CharField(read_only=True)  
    class Meta:
        model  = TransferenciaAprobacion
        fields = ['id', 'rol_aprobador', 'accion',
                  'usuario_id', 'rol_aprobador_nombre','detalle', 'fecha']
class TransferenciaDetalleSerializer(serializers.ModelSerializer):
    class Meta:
        model  = TransferenciaDetalle
        fields = [
            'id','categoria_bien_nombre', 
            'bien_id','tipo_bien_nombre',
            'marca_nombre', 'modelo', 
            'numero_serie','codigo_patrimonial',             
        ]
class TransferenciaListSerializer(serializers.ModelSerializer):
    usuario_origen_nombre= serializers.CharField(read_only=True)   
    sede_origen_nombre = serializers.CharField(read_only=True)
    modulo_origen_nombre = serializers.CharField(read_only=True)
    ubicacion_origen_nombre = serializers.CharField(read_only=True)
    usuario_destino_nombre = serializers.CharField(read_only=True)
    sede_destino_nombre = serializers.CharField(read_only=True)    
    modulo_destino_nombre = serializers.CharField(read_only=True)
    ubicacion_destino_nombre = serializers.CharField(read_only=True)     
    motivo_nombre     = serializers.CharField(source='motivo.nombre',read_only=True)
    cancelacion_nombre = serializers.SerializerMethodField()
    ultima_aprobacion = serializers.SerializerMethodField()
    tiene_pdf_firmado = serializers.SerializerMethodField()
    bienes=TransferenciaDetalleSerializer(source='detalles',many=True,read_only=True)
    aprobaciones=AprobacionSerializer(many=True,read_only=True)
    class Meta:
        model  = Transferencia
        fields = [
            'id', 'numero_orden', 'tipo', 'estado',
            'usuario_origen_id', 
            "usuario_origen_nombre",
            'sede_origen_id', 
            "sede_origen_nombre",
            'modulo_origen_id',
            "modulo_origen_nombre",
            "ubicacion_origen_id",
            "ubicacion_origen_nombre",  
            'piso_origen',
            
            "usuario_destino_id",
            "usuario_destino_nombre",
            'sede_destino_id', 
            "sede_destino_nombre",
            'modulo_destino_id',
            "modulo_destino_nombre",
            "ubicacion_destino_id",
            "ubicacion_destino_nombre",    
            'piso_destino',
            
            'descripcion',         
            'motivo_nombre', 
            'motivo_devolucion', 
            'cancelacion_nombre',
            'fecha_registro', 'ultima_aprobacion',
            'pdf_path', 'tiene_pdf_firmado', 'fecha_pdf',
            'bienes',
            'aprobaciones'
        ]
    def get_ultima_aprobacion(self, obj):
        ultima = obj.aprobaciones.last()
        if not ultima:
            return None
        return {
            'rol_aprobador': ultima.rol_aprobador,
            'accion':        ultima.accion,
            'usuario_id':    ultima.usuario_id,
            'usuario_nombre': getattr(ultima, 'usuario_nombre', 'Cargando...'), 
            'detalle':       ultima.detalle,
            'fecha':         ultima.fecha,
        }
    def get_tiene_pdf_firmado(self, obj):
        return bool(obj.pdf_firmado_path)
    def get_cancelacion_nombre(self, obj):
        if obj.motivo_cancelacion:
            return obj.motivo_cancelacion.nombre
        return None

class TransferenciaDetailSerializer(serializers.ModelSerializer):
    sede_origen_nombre = serializers.CharField(read_only=True)
    sede_destino_nombre = serializers.CharField(read_only=True)
    modulo_destino_nombre = serializers.CharField(read_only=True)
    ubicacion_destino_nombre = serializers.CharField(read_only=True)
    usuario_destino_nombre = serializers.CharField(read_only=True)
    bienes = TransferenciaDetalleSerializer(source='detalles',many=True,read_only=True)
    class Meta:
        model = Transferencia
        fields = "__all__"
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