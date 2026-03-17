from django.db import models
from catalogos.models import (CatCategoriaBien, CatTipoBien, CatTipoTarjetaVideo,CatMarca, CatRegimenTenencia, CatEstadoBien,
    CatEstadoFuncionamiento, CatMotivoBaja, CatTipoComputadora,
    CatTipoDisco, CatArquitecturaBits, CatTipoMonitor, CatTipoEscaner,
    CatInterfazConexion, CatTipoImpresion, CatTamanoCarro,
)

class Bien(models.Model):
    categoria_bien = models.ForeignKey(CatCategoriaBien,on_delete=models.PROTECT,related_name='bienes',null=True, blank=True)
    tipo_bien             = models.ForeignKey(CatTipoBien, on_delete=models.PROTECT, related_name='bienes')
    marca                 = models.ForeignKey(CatMarca, on_delete=models.PROTECT, related_name='bienes')
    modelo                = models.CharField(max_length=150)
    numero_serie          = models.CharField(max_length=100, unique=True, null=True, blank=True)
    codigo_patrimonial    = models.CharField(max_length=50, unique=True, null=True, blank=True)
    regimen_tenencia      = models.ForeignKey(CatRegimenTenencia, on_delete=models.PROTECT, related_name='bienes')
    estado_bien           = models.ForeignKey(CatEstadoBien, on_delete=models.PROTECT, related_name='bienes')
    estado_funcionamiento = models.ForeignKey(CatEstadoFuncionamiento, on_delete=models.PROTECT, related_name='bienes')
    detalle_tecnico       = models.TextField(null=True, blank=True)
    
    empresa_id   = models.IntegerField()
    sede_id      = models.IntegerField()
    modulo_id    = models.IntegerField(null=True, blank=True)
    ubicacion_id = models.IntegerField(null=True, blank=True)
    piso         = models.SmallIntegerField(null=True, blank=True)
    
    usuario_asignado_id = models.IntegerField(null=True, blank=True)
    usuario_registra_id = models.IntegerField()
    
    anio_adquisicion          = models.SmallIntegerField(null=True, blank=True)
    fecha_compra              = models.DateField(null=True, blank=True)
    numero_orden_compra       = models.CharField(max_length=50, null=True, blank=True)
    fecha_vencimiento_garantia= models.DateField(null=True, blank=True)
    fecha_instalacion         = models.DateField(null=True, blank=True)
    fecha_ultimo_inventario   = models.DateField(null=True, blank=True)
    observacion               = models.TextField(null=True, blank=True)
    fecha_ultimo_mantenimiento = models.DateField(null=True, blank=True)
    fecha_registro     = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion= models.DateTimeField(auto_now=True)
    fecha_baja   = models.DateField(null=True, blank=True)
    motivo_baja  = models.ForeignKey(CatMotivoBaja, on_delete=models.SET_NULL,null=True, blank=True, related_name='bienes',)
    is_active = models.BooleanField(default=True)
    corte     = models.CharField(max_length=20, default='CSJLN')
    class Meta:
        db_table = 'bienes_bien'
        ordering = ['-fecha_registro']
        indexes = [
            models.Index(fields=['empresa_id']),
            models.Index(fields=['sede_id']),
            models.Index(fields=['modulo_id']),
            models.Index(fields=['ubicacion_id']),
            models.Index(fields=['usuario_asignado_id']),
            models.Index(fields=['tipo_bien']),
            models.Index(fields=['estado_funcionamiento']),
            models.Index(fields=['is_active']),
            models.Index(fields=['codigo_patrimonial']),
            models.Index(fields=['numero_serie']),        ]
        verbose_name        = 'Bien'
        verbose_name_plural = 'Bienes'
    def __str__(self):
        return f'{self.tipo_bien} | {self.marca} {self.modelo} | {self.codigo_patrimonial or "S/N"}'

class BienDetalleCpu(models.Model):
    bien             = models.OneToOneField(Bien, on_delete=models.CASCADE, related_name='detalle_cpu')
    hostname         = models.CharField(max_length=100, null=True, blank=True)
    dominio_equipo   = models.CharField(max_length=100, null=True, blank=True)
    direccion_ip     = models.CharField(max_length=45, null=True, blank=True)
    direccion_mac    = models.CharField(max_length=17, null=True, blank=True)
    conectado_red    = models.BooleanField(default=False)
    tipo_computadora = models.ForeignKey(CatTipoComputadora, on_delete=models.PROTECT, null=True, blank=True)
    funcion_cpu      = models.CharField(max_length=100, null=True, blank=True)
    procesador_tipo      = models.CharField(max_length=100, null=True, blank=True)
    procesador_cantidad  = models.SmallIntegerField(null=True, blank=True)
    procesador_nucleos   = models.SmallIntegerField(null=True, blank=True)
    procesador_velocidad = models.CharField(max_length=30, null=True, blank=True)
    sistema_operativo = models.CharField(max_length=100, null=True, blank=True)
    arquitectura_bits = models.ForeignKey(CatArquitecturaBits, on_delete=models.SET_NULL, null=True, blank=True)
    licencia_so       = models.CharField(max_length=100, null=True, blank=True)
    version_office    = models.CharField(max_length=50, null=True, blank=True)
    licencia_office   = models.CharField(max_length=100, null=True, blank=True)
    capacidad_ram_gb     = models.CharField(max_length=20, null=True, blank=True)
    cantidad_modulos_ram = models.SmallIntegerField(null=True, blank=True)
    tipo_disco       = models.ForeignKey(CatTipoDisco, on_delete=models.SET_NULL, null=True, blank=True)
    capacidad_disco  = models.CharField(max_length=30, null=True, blank=True)
    cantidad_discos  = models.SmallIntegerField(null=True, blank=True)
    multimedia          = models.CharField(max_length=100, null=True, blank=True)
    tipo_tarjeta_video  = models.ForeignKey(CatTipoTarjetaVideo,on_delete=models.PROTECT, null=True, blank=True)
    class Meta:
        db_table            = 'bienes_bien_detalle_cpu'
        verbose_name        = 'Detalle CPU'
        verbose_name_plural = 'Detalles CPU'

class BienDetalleMonitor(models.Model):
    bien           = models.OneToOneField(Bien, on_delete=models.CASCADE, related_name='detalle_monitor')
    tipo_monitor   = models.ForeignKey(CatTipoMonitor, on_delete=models.PROTECT, null=True, blank=True)
    tamano_pulgadas= models.DecimalField(max_digits=4, decimal_places=1, null=True, blank=True)
    class Meta:
        db_table            = 'bienes_bien_detalle_monitor'
        verbose_name        = 'Detalle Monitor'
        verbose_name_plural = 'Detalles Monitor'
class BienDetalleImpresora(models.Model):
    bien                    = models.OneToOneField(Bien, on_delete=models.CASCADE, related_name='detalle_impresora')
    tipo_impresion          = models.ForeignKey(CatTipoImpresion, on_delete=models.PROTECT, null=True, blank=True)
    impresion_color         = models.BooleanField(null=True, blank=True)
    memoria_ram_mb          = models.SmallIntegerField(null=True, blank=True)
    resolucion_maxima_ppp   = models.CharField(max_length=30, null=True, blank=True)
    interfaz_conexion       = models.ForeignKey(CatInterfazConexion, on_delete=models.SET_NULL, null=True, blank=True)
    tamano_carro            = models.ForeignKey(CatTamanoCarro, on_delete=models.SET_NULL, null=True, blank=True)
    tamano_hojas_soportadas = models.CharField(max_length=50, null=True, blank=True)
    unidad_duplex           = models.BooleanField(null=True, blank=True)
    velocidad_impresion_ppm = models.SmallIntegerField(null=True, blank=True)
    conexion_red            = models.BooleanField(null=True, blank=True)
    direccion_ip     = models.CharField(max_length=45, null=True, blank=True)
    alimentacion_ac         = models.CharField(max_length=20, null=True, blank=True)
    class Meta:
        db_table            = 'bienes_bien_detalle_impresora'
        verbose_name        = 'Detalle Impresora'
        verbose_name_plural = 'Detalles Impresora'
class BienDetalleScanner(models.Model):
    bien                  = models.OneToOneField(Bien, on_delete=models.CASCADE, related_name='detalle_scanner')
    tipo_escaner          = models.ForeignKey(CatTipoEscaner, on_delete=models.PROTECT, null=True, blank=True)
    tamano_documentos     = models.CharField(max_length=20, null=True, blank=True)
    alimentador_automatico= models.BooleanField(null=True, blank=True)
    metadata              = models.BooleanField(null=True, blank=True)
    resolucion_exploracion= models.CharField(max_length=50, null=True, blank=True)
    resolucion_salida     = models.CharField(max_length=50, null=True, blank=True)
    interfaz_conexion     = models.ForeignKey(CatInterfazConexion, on_delete=models.SET_NULL, null=True, blank=True)
    alimentacion_ac       = models.CharField(max_length=20, null=True, blank=True)
    class Meta:
        db_table            = 'bienes_bien_detalle_scanner'
        verbose_name        = 'Detalle Escáner'
        verbose_name_plural = 'Detalles Escáner'
class BienDetalleSwitch(models.Model):
    bien                 = models.OneToOneField(Bien, on_delete=models.CASCADE, related_name='detalle_switch')
    direccion_mac        = models.CharField(max_length=17, null=True, blank=True)
    direccion_ip         = models.CharField(max_length=45, null=True, blank=True)
    cantidad_puertos_utp = models.SmallIntegerField(null=True, blank=True)
    cantidad_puertos_ftp = models.SmallIntegerField(null=True, blank=True)
    cantidad_puertos_fo  = models.SmallIntegerField(null=True, blank=True)
    cantidad_puertos_wan = models.SmallIntegerField(null=True, blank=True)
    admin_software       = models.BooleanField(null=True, blank=True)
    velocidad_mbps       = models.IntegerField(null=True, blank=True)
    chasis_slots         = models.SmallIntegerField(null=True, blank=True)
    migracion_atm        = models.BooleanField(null=True, blank=True)
    soporta_vlan         = models.BooleanField(null=True, blank=True)
    alimentacion_ac      = models.CharField(max_length=20, null=True, blank=True)
    manual_incluido      = models.BooleanField(null=True, blank=True)
    fuente_poder         = models.CharField(max_length=100, null=True, blank=True)

    class Meta:
        db_table            = 'bienes_bien_detalle_switch'
        verbose_name        = 'Detalle Switch'
        verbose_name_plural = 'Detalles Switch'