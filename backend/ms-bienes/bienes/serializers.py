from rest_framework import serializers
from .models import (
    Bien, BienDetalleCpu, BienDetalleMonitor,
    BienDetalleImpresora, BienDetalleScanner, BienDetalleSwitch,
)
from catalogos.serializers import (
    CatTipoBienSerializer, CatMarcaSerializer, CatRegimenTenenciaSerializer,
    CatEstadoBienSerializer, CatEstadoFuncionamientoSerializer, CatMotivoBajaSerializer,
)

class BienDetalleCpuSerializer(serializers.ModelSerializer):
    tipo_computadora_nombre = serializers.CharField(source='tipo_computadora.nombre', read_only=True)
    tipo_disco_nombre       = serializers.CharField(source='tipo_disco.nombre', read_only=True)
    arquitectura_bits_nombre= serializers.CharField(source='arquitectura_bits.nombre', read_only=True)

    class Meta:
        model  = BienDetalleCpu
        exclude = ['id', 'bien']
class BienDetalleMonitorSerializer(serializers.ModelSerializer):
    tipo_monitor_nombre = serializers.CharField(source='tipo_monitor.nombre', read_only=True)

    class Meta:
        model   = BienDetalleMonitor
        exclude = ['id', 'bien']
class BienDetalleImpresoraSerializer(serializers.ModelSerializer):
    tipo_impresion_nombre    = serializers.CharField(source='tipo_impresion.nombre', read_only=True)
    interfaz_conexion_nombre = serializers.CharField(source='interfaz_conexion.nombre', read_only=True)
    tamano_carro_nombre      = serializers.CharField(source='tamano_carro.nombre', read_only=True)
    class Meta:
        model   = BienDetalleImpresora
        exclude = ['id', 'bien']
class BienDetalleScannerSerializer(serializers.ModelSerializer):
    tipo_escaner_nombre      = serializers.CharField(source='tipo_escaner.nombre', read_only=True)
    interfaz_conexion_nombre = serializers.CharField(source='interfaz_conexion.nombre', read_only=True)
    class Meta:
        model   = BienDetalleScanner
        exclude = ['id', 'bien']
class BienDetalleSwitchSerializer(serializers.ModelSerializer):
    class Meta:
        model   = BienDetalleSwitch
        exclude = ['id', 'bien']

class BienListSerializer(serializers.ModelSerializer):
    categoria_bien_nombre = serializers.CharField(source='categoria_bien.nombre', read_only=True, default=None)
    tipo_bien_nombre          = serializers.CharField(source='tipo_bien.nombre', read_only=True)
    marca_nombre              = serializers.CharField(source='marca.nombre', read_only=True)
    regimen_tenencia_nombre=serializers.CharField(source='regimen_tenencia.nombre', read_only=True)    
    estado_bien_nombre        = serializers.CharField(source='estado_bien.nombre', read_only=True)    
    estado_funcionamiento_nombre = serializers.CharField(source='estado_funcionamiento.nombre', read_only=True)
    motivo_baja_nombre        = serializers.CharField(source='motivo_baja.nombre', read_only=True, default=None)
    
    empresa_nombre=serializers.CharField(read_only=True)  
    sede_nombre= serializers.CharField(read_only=True) 
    modulo_nombre=serializers.CharField(read_only=True) 
    ubicacion_nombre= serializers.CharField(read_only=True) 
    usuario_asignado_nombre=serializers.CharField(read_only=True) 
    usuario_registra_nombre=serializers.CharField(read_only=True) 
    class Meta:
        model  = Bien
        fields = [
            'id', 
            'categoria_bien_nombre',
            'tipo_bien_nombre', 
            'marca_nombre', 
            'modelo',
            'numero_serie',
            'codigo_patrimonial', 
            'regimen_tenencia_nombre',
            'estado_bien_nombre', 
            'estado_funcionamiento_nombre',
            'detalle_tecnico',
            
            'empresa_id', 
            'empresa_nombre',            
            'sede_id', 
            'sede_nombre', 
            'modulo_id', 
            'modulo_nombre', 
            'ubicacion_id', 
            'ubicacion_nombre',
            'piso',
            
            'usuario_asignado_id',
            'usuario_asignado_nombre',
            'usuario_registra_id',  
            'usuario_registra_nombre',    
            
            'anio_adquisicion',  
            'fecha_compra','numero_orden_compra',
            'fecha_vencimiento_garantia',
            'fecha_instalacion',
            'fecha_ultimo_inventario',
            'observacion',
            'fecha_ultimo_mantenimiento',
            'fecha_registro',
            'fecha_actualizacion',
            'fecha_baja', 
            'motivo_baja_nombre',             
            
            'is_active', 
            'corte',
        ]
        
        

class BienDetailSerializer(serializers.ModelSerializer):
    categoria_bien_nombre = serializers.CharField(source='categoria_bien.nombre', read_only=True, default=None)
    tipo_bien           = CatTipoBienSerializer(read_only=True)
    marca               = CatMarcaSerializer(read_only=True)
    regimen_tenencia    = CatRegimenTenenciaSerializer(read_only=True)
    estado_bien         = CatEstadoBienSerializer(read_only=True)
    estado_funcionamiento = CatEstadoFuncionamientoSerializer(read_only=True)
    motivo_baja         = CatMotivoBajaSerializer(read_only=True)
    detalle_cpu       = BienDetalleCpuSerializer(read_only=True)
    detalle_monitor   = BienDetalleMonitorSerializer(read_only=True)
    detalle_impresora = BienDetalleImpresoraSerializer(read_only=True)
    detalle_scanner   = BienDetalleScannerSerializer(read_only=True)
    detalle_switch    = BienDetalleSwitchSerializer(read_only=True)

    class Meta:
        model  = Bien
        fields = '__all__'




class BienDetalleCpuWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model   = BienDetalleCpu
        exclude = ['id', 'bien']
        extra_kwargs = {
            'tipo_tarjeta_video': {'read_only': True},
        }
class BienDetalleMonitorWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model   = BienDetalleMonitor
        exclude = ['id', 'bien']
class BienDetalleImpresoraWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model   = BienDetalleImpresora
        exclude = ['id', 'bien']
class BienDetalleScannerWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model   = BienDetalleScanner
        exclude = ['id', 'bien']
class BienDetalleSwitchWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model   = BienDetalleSwitch
        exclude = ['id', 'bien']
class BienWriteSerializer(serializers.Serializer):
    categoria_bien_id = serializers.IntegerField(required=False, allow_null=True)
    tipo_bien_id             = serializers.IntegerField()
    tipo_bien_nombre         = serializers.CharField(read_only=True, required=False) 
    marca_id                 = serializers.IntegerField()
    modelo                   = serializers.CharField(max_length=150)
    numero_serie             = serializers.CharField(max_length=100, required=False, allow_null=True)
    codigo_patrimonial       = serializers.CharField(max_length=50, required=False, allow_null=True)
    regimen_tenencia_id      = serializers.IntegerField()
    estado_bien_id           = serializers.IntegerField()
    estado_funcionamiento_id = serializers.IntegerField()
    detalle_tecnico          = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    empresa_id   = serializers.IntegerField()
    sede_id      = serializers.IntegerField()
    modulo_id    = serializers.IntegerField(required=False, allow_null=True)
    ubicacion_id = serializers.IntegerField(required=False, allow_null=True)
    piso         = serializers.IntegerField(required=False, allow_null=True)
    anio_adquisicion           = serializers.IntegerField(required=False, allow_null=True)
    fecha_compra               = serializers.DateField(required=False, allow_null=True)
    numero_orden_compra        = serializers.CharField(max_length=50, required=False, allow_null=True)
    fecha_vencimiento_garantia = serializers.DateField(required=False, allow_null=True)
    fecha_instalacion          = serializers.DateField(required=False, allow_null=True)
    fecha_ultimo_inventario    = serializers.DateField(required=False, allow_null=True)
    observacion                = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    detalle = serializers.DictField(child=serializers.JSONField(), required=False, default=dict)
    