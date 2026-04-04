from rest_framework import serializers
from .models import Mantenimiento, MantenimientoDetalle, MantenimientoImagen, MantenimientoAprobacion


class MantenimientoImagenSerializer(serializers.ModelSerializer):
    """
    Serializa las imágenes de evidencia fotográfica.
    El campo `imagen_path` contiene la ruta relativa dentro del bucket de Supabase.
    El frontend puede solicitar una URL firmada temporal al endpoint
    GET /mantenimientos/{id}/imagenes/{imagen_id}/url/
    """
    class Meta:
        model  = MantenimientoImagen
        fields = [
            'id',
            'imagen_path',     
            'descripcion',
            'subido_por_id',
            'fecha_subida',
        ]


class MantenimientoAprobacionSerializer(serializers.ModelSerializer):
    class Meta:
        model  = MantenimientoAprobacion
        fields = ['id', 'rol_aprobador', 'accion', 'usuario_id', 'observacion', 'fecha']


class MantenimientoDetalleSerializer(serializers.ModelSerializer):
    bien_id                              = serializers.IntegerField(source='bien.id', read_only=True)
    tipo_bien_nombre                     = serializers.CharField(source='bien.tipo_bien.nombre', read_only=True)
    marca_nombre                         = serializers.CharField(source='bien.marca.nombre', read_only=True)
    modelo                               = serializers.CharField(source='bien.modelo', read_only=True)
    numero_serie                         = serializers.CharField(source='bien.numero_serie', read_only=True)
    codigo_patrimonial                   = serializers.CharField(source='bien.codigo_patrimonial', read_only=True)
    estado_funcionamiento_inicial_nombre = serializers.CharField(
        source='estado_funcionamiento_inicial.nombre', read_only=True, default=None,
    )
    estado_funcionamiento_final_nombre   = serializers.CharField(
        source='estado_funcionamiento_final.nombre', read_only=True, default=None,
    )

    class Meta:
        model  = MantenimientoDetalle
        fields = [
            'id',
            'bien_id',
            'tipo_bien_nombre',
            'marca_nombre',
            'modelo',
            'numero_serie',
            'codigo_patrimonial',
            'estado_funcionamiento_inicial',
            'estado_funcionamiento_inicial_nombre',
            'diagnostico_inicial',
            'trabajo_realizado',
            'diagnostico_final',
            'estado_funcionamiento_final',
            'estado_funcionamiento_final_nombre',
            'observacion_detalle',
        ]


class MantenimientoListSerializer(serializers.ModelSerializer):
    sede_nombre                   = serializers.CharField(read_only=True)
    modulo_nombre                 = serializers.CharField(read_only=True)
    usuario_propietario_nombre    = serializers.CharField(read_only=True)
    aprobado_por_adminsede_nombre = serializers.CharField(read_only=True)
    subido_por_nombre             = serializers.CharField(read_only=True)
    detalles                      = MantenimientoDetalleSerializer(many=True, read_only=True)
    aprobaciones                  = MantenimientoAprobacionSerializer(many=True, read_only=True)
    imagenes                      = MantenimientoImagenSerializer(many=True, read_only=True)
    total_bienes                  = serializers.IntegerField(source='detalles.count', read_only=True)
    tiene_pdf_firmado             = serializers.BooleanField(read_only=True)
    motivo_cancelacion_nombre     = serializers.SerializerMethodField()

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
            'pdf_path',
            'fecha_pdf',
            'pdf_firmado_path',
            'fecha_pdf_firmado',
            'tiene_pdf_firmado',
            'subido_por_id',
            'subido_por_nombre',
            'tiene_imagenes',
            'motivo_cancelacion',
            'motivo_cancelacion_nombre',
            'detalle_cancelacion',
            'fecha_cancelacion',
            'total_bienes',
            'detalles',
            'aprobaciones',
            'imagenes',
        ]

    def get_motivo_cancelacion_nombre(self, obj):
        return obj.motivo_cancelacion.nombre if obj.motivo_cancelacion else None


class MantenimientoDetailSerializer(MantenimientoListSerializer):
    class Meta(MantenimientoListSerializer.Meta):
        pass


class MantenimientoCreateSerializer(serializers.Serializer):
    bien_ids = serializers.ListField(
        child=serializers.IntegerField(min_value=1),
        min_length=1,
        help_text='Lista de IDs de bienes a incluir en el mantenimiento.',
    )


class DetalleTecnicoSerializer(serializers.Serializer):
    bien_id                        = serializers.IntegerField(min_value=1)
    estado_funcionamiento_final_id = serializers.IntegerField(min_value=1)
    diagnostico_inicial            = serializers.CharField(required=False, allow_blank=True, default='')
    trabajo_realizado              = serializers.CharField(min_length=5)
    diagnostico_final              = serializers.CharField(min_length=5)
    observacion_detalle            = serializers.CharField(required=False, allow_blank=True, default='')


class EnviarAprobacionSerializer(serializers.Serializer):
    detalles_tecnicos = DetalleTecnicoSerializer(
        many=True, min_length=1,
        help_text='Informe técnico de cada bien intervenido.',
    )


class AprobacionSerializer(serializers.Serializer):
    observacion = serializers.CharField(required=False, allow_blank=True, default='')


class DevolucionSerializer(serializers.Serializer):
    motivo_devolucion = serializers.CharField(min_length=10)


class CancelacionSerializer(serializers.Serializer):
    motivo_cancelacion_id = serializers.IntegerField(min_value=1)
    detalle_cancelacion   = serializers.CharField(required=False, allow_blank=True, default='')