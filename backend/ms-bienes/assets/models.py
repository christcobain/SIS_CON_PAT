from django.db import models
from catalogs.models import (Categoria,TipoBien,Marca,EstadoBien,EstadoFuncionamiento,TipoMonitor, TipoCpu,TipoImpresora,
                             TipoDiscoDuro,ArquitecturaBits, TipoInterfazConexion,TamanoCarroImpresora,TipoTintaImpresion, 
                             RegimenTenenciaBien,MotivoTransferencia,MotivoBaja )

class Bien(models.Model): 
    categoria            = models.ForeignKey(Categoria, on_delete=models.PROTECT)   
    tipo_bien           = models.ForeignKey(TipoBien, on_delete=models.PROTECT)
    marca               = models.ForeignKey(Marca, on_delete=models.PROTECT)
    modelo              = models.CharField(max_length=200)
    numero_serie       = models.CharField(max_length=100, unique=True)
    codigo_patrimonial = models.CharField(max_length=50, unique=True)
    estado_bien          = models.CharField(EstadoBien,on_delete=models.PROTECT)
    estado_funcionamiento = models.CharField(EstadoFuncionamiento,on_delete=models.PROTECT)
    regimen_tenencia     = models.ForeignKey(RegimenTenenciaBien, on_delete=models.SET_NULL, null=True, blank=True)
    fecha_compra             = models.DateField(null=True, blank=True)
    numero_orden_compra      = models.CharField(max_length=50, blank=True)
    fecha_vencimiento_garantia = models.DateField(null=True, blank=True)
    fecha_instalacion        = models.DateField(null=True, blank=True)
    fecha_ultimo_inventario  = models.DateField(null=True, blank=True)
    # Usuario institucional asignado (ID del ms-usuarios)
    usuario_asignado_id   = models.IntegerField(null=True, blank=True)
    usuario_asignado_dni  = models.CharField(max_length=8, blank=True)
    usuario_asignado_nombre = models.CharField(max_length=200, blank=True)
    # Ubicación (IDs del ms-usuarios)
    sede_id    = models.IntegerField(null=True, blank=True)
    sede_nombre = models.CharField(max_length=200, blank=True)
    modulo_id  = models.IntegerField(null=True, blank=True)
    area_id    = models.IntegerField(null=True, blank=True)
    # Usuario de sistema que registra (ID del ms-usuarios)
    usuario_registra_id     = models.IntegerField()
    usuario_registra_nombre = models.CharField(max_length=200)
    observacion   = models.TextField(blank=True)
    fecha_registro = models.DateTimeField(auto_now_add=True)
    fecha_baja     = models.DateField(null=True, blank=True)
    motivo_baja    = models.TextField(blank=True)
    class Meta:
        db_table = 'assets_bien'
        ordering = ['-fecha_registro']
        verbose_name = 'Bien'
    def __str__(self):
        return f'{self.tipo_bien} - {self.codigo_patrimonial}'

class BienCPU(models.Model):
    bien = models.OneToOneField(Bien, on_delete=models.CASCADE, related_name='cpu_detail')
    hostname = models.CharField(max_length=100, blank=True)
    dominio_equipo= models.CharField(max_length=100, blank=True)
    direccion_ip= models.GenericIPAddressField(null=True, blank=True)
    direccion_mac= models.CharField(max_length=17, blank=True)
    tipo_computadora= models.ForeignKey(TipoCpu, on_delete=models.SET_NULL, null=True,blank=True)
    funcion_cpu  = models.CharField(max_length=100, blank=True)
    procesador_tipo      = models.CharField(max_length=100, blank=True)
    procesador_cantidad  = models.IntegerField(null=True, blank=True)
    procesador_nucleos   = models.IntegerField(null=True, blank=True)
    procesador_velocidad = models.CharField(max_length=20, blank=True)
    sistema_operativo  = models.CharField(max_length=100, blank=True)
    arquitectura_bits  = models.ForeignKey(ArquitecturaBits, on_delete=models.SET_NULL, null=True, blank=True)
    licencia_so        = models.CharField(max_length=100, blank=True)
    version_office     = models.CharField(max_length=50, blank=True)
    licencia_office= models.CharField(max_length=100, blank=True)
    capacidad_ram_gb = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    cantidad_modulos_ram = models.IntegerField(null=True, blank=True)
    tipo_disco= models.ForeignKey(TipoDiscoDuro, on_delete=models.SET_NULL, null=True, blank=True)
    capacidad_disco_gb = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    cantidad_discos = models.IntegerField(null=True, blank=True)
    tipo_tarjeta_video= models.CharField(max_length=100, blank=True)
    class Meta:
        db_table = 'assets_bien_cpu'

class BienMonitor(models.Model):
    bien          = models.OneToOneField(Bien, on_delete=models.CASCADE, related_name='monitor_detail')
    tipo_monitor  = models.ForeignKey(TipoMonitor, on_delete=models.SET_NULL, null=True, blank=True)
    tamano_pulgadas = models.DecimalField(max_digits=5, decimal_places=1, null=True, blank=True)
    class Meta:
        db_table = 'assets_bien_monitor'

class BienImpresora(models.Model):
    bien              = models.OneToOneField(Bien, on_delete=models.CASCADE, related_name='impresora_detail')
    tipo_impresion    = models.CharField(max_length=50, blank=True)
    impresion_color   = models.BooleanField(default=False)
    memoria_ram_mb    = models.IntegerField(null=True, blank=True)
    resolucion_maxima_ppp = models.CharField(max_length=30, blank=True)
    interfaz_conexion = models.ForeignKey(TipoInterfazConexion, on_delete=models.SET_NULL, null=True, blank=True)
    tamano_carro      = models.ForeignKey(TamanoCarroImpresora, on_delete=models.SET_NULL, null=True, blank=True)
    tamano_hojas_soportadas = models.CharField(max_length=50, blank=True)
    unidad_duplex         = models.BooleanField(default=False)
    velocidad_impresion_ppm = models.IntegerField(null=True, blank=True)
    conexion_red          = models.BooleanField(default=False)
    alimentacion_ac       = models.CharField(max_length=50, blank=True)
    class Meta:
        db_table = 'assets_bien_impresora'