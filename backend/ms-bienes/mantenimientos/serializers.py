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
    bien_id= serializers.IntegerField(source='bien.id', read_only=True)
    tipo_bien_nombre  = serializers.CharField(source='bien.tipo_bien.nombre', read_only=True)    
    marca_bien= serializers.CharField(source='bien.marca.nombre', read_only=True)
    modelo= serializers.CharField(source='bien.modelo', read_only=True)
    numero_serie= serializers.CharField(source='bien.numero_serie', read_only=True)
    codigo_patrimonial= serializers.CharField(source='bien.codigo_patrimonial', read_only=True)    
    
    estado_funcionamiento_inicial   = serializers.CharField(source='CatEstadoFuncionamiento.nombre', read_only=True)
    # diagnostico_inicial= serializers.CharField(read_only=True)
    # trabajo_realizado = serializers.CharField(read_only=True)
    # diagnostico_final= serializers.CharField(read_only=True)
    estado_funcionamiento_final = serializers.CharField(source='CatEstadoFuncionamiento.nombre', read_only=True, default=None)
    class Meta:
        model  = MantenimientoDetalle
        fields = [
            'id', 
            'tipo_bien_nombre',
            'bien_id',
            'marca_bien',
            'modelo',
            'numero_serie',            
            'codigo_patrimonial', 
            
            'estado_funcionamiento_inicial',
            'diagnostico_inicial',
            'trabajo_realizado',
            'diagnostico_final',
            'estado_funcionamiento_final',
            'observacion_detalle',
        ]

class MantenimientoListSerializer(serializers.ModelSerializer):
    sede_nombre= serializers.CharField(read_only=True)    
    modulo_nombre= serializers.CharField(read_only=True)   
    usuario_propietario_nombre= serializers.CharField(read_only=True)   
    aprobado_por_adminsede_nombre= serializers.CharField(read_only=True)   
    confirmado_por_propietario_nombre= serializers.CharField(read_only=True)       
    detalles_mantenimiento=MantenimientoDetalleSerializer(source='detalles',many=True,read_only=True)
    total_bienes = serializers.IntegerField(source='detalles.count', read_only=True)
    class Meta:
        model  = Mantenimiento
        fields = [
            'id', 
            'numero_orden',
            'usuario_realiza_id', 
            'sede_id', 
            'sede_nombre', 
            'modulo_id',
            'modulo_nombre',
            'usuario_propietario_id',
            'usuario_propietario_nombre',          
            
            'estado_mantenimiento',            
            'fecha_registro', 
            'fecha_inicio_mant', 
            'fecha_termino_mant',
            
            'aprobado_por_adminsede_id',
            'aprobado_por_adminsede_nombre',
            'fecha_aprobacion_adminsede',
            'confirmado_por_propietario_id',
            'confirmado_por_propietario_nombre',
            'fecha_confirmacion_propietario',
            
            'pdf_path', 
            'pdf_firmado_path',             
            'fecha_pdf',
            'tiene_imagenes',
            
            'motivo_cancelacion',
            'detalle_cancelacion',
            'fecha_cancelacion',
            'detalles_mantenimiento',
            
            'total_bienes',
        ]
        def get_cancelacion_nombre(self, obj):
            if obj.motivo_cancelacion:
                return obj.motivo_cancelacion.nombre
            return None
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
    