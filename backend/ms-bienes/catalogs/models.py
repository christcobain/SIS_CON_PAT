from django.db import models


class Categoria(models.Model):
    "Informático, mobiliario, vehicular, etc."
    nombre = models.CharField(max_length=100, unique=True)
    is_active= models.BooleanField(default=True)
    class Meta:
        db_table = 'catalog_categoria'
        ordering = ['nombre']
class TipoBien(models.Model):
    "Cpu,monitor,Teclado,Laptop,impresora"
    nombre = models.CharField(max_length=100)
    is_active = models.BooleanField(default=True)
    class Meta:
        db_table = 'catalog_tipo_bien'
        ordering = ['nombre']
class Marca(models.Model):
    nombre = models.CharField(max_length=100, unique=True)
    is_active = models.BooleanField(default=True)
    class Meta:
        db_table = 'catalog_marca'
        ordering = ['nombre']

class EstadoBien(models.Model):
    "" 'Activo''Inactivo'""
    nombre = models.CharField(max_length=50, unique=True)
    class Meta:
        db_table = 'catalog_estadobien'
class EstadoFuncionamiento(models.Model):
    "" 'Operativo''Averiado''Inoperativo'""
    nombre = models.CharField(max_length=50, unique=True)
    class Meta:
        db_table = 'catalog_estadofuncionamiento'
class TipoMonitor(models.Model):
    "lcd,led,etc"
    nombre = models.CharField(max_length=50, unique=True)
    class Meta:
        db_table = 'catalog_tipo_monitor'
class TipoCpu(models.Model):
    "Escritorio,AllinOne,servidor"
    nombre = models.CharField(max_length=50, unique=True)
    class Meta:
        db_table = 'catalog_tipo_cpu'
class TipoImpresora(models.Model):
    "Laser,matricial,etc"
    nombre = models.CharField(max_length=50, unique=True)
    class Meta:
        db_table = 'catalog_tipo_impresora'
class TipoDiscoDuro(models.Model):
    "Mecanico, SSD"
    nombre = models.CharField(max_length=50, unique=True)
    class Meta:
        db_table = 'catalog_tipo_disco_duro'
class ArquitecturaBits(models.Model):
    nombre = models.CharField(max_length=20, unique=True)
    class Meta:
        db_table = 'catalog_arquitectura_bits'

class TipoInterfazConexion(models.Model):
    nombre = models.CharField(max_length=50, unique=True)
    class Meta:
        db_table = 'catalog_tipo_interfaz_conexion'

class TamanoCarroImpresora(models.Model):
    "Ancho,Angosto"
    nombre = models.CharField(max_length=50, unique=True)
    class Meta:
        db_table = 'catalog_tamano_carro_impresora'

class TipoTintaImpresion(models.Model):
    nombre = models.CharField(max_length=50, unique=True)
    class Meta:
        db_table = 'catalog_tipo_tinta_impresion'

class RegimenTenenciaBien(models.Model):
    "Propio,alquilado,comodato"
    nombre = models.CharField(max_length=100, unique=True)
    class Meta:
        db_table = 'catalog_regimen_tenencia_bien'

class MotivoTransferencia(models.Model):
    nombre = models.CharField(max_length=100, unique=True)
    estado = models.BooleanField(default=True)
    class Meta:
        db_table = 'catalog_motivo_transferencia'

class MotivoBaja(models.Model):
    ""
    nombre = models.CharField(max_length=100, unique=True)
    is_active = models.BooleanField(default=True)
    class Meta:
        db_table = 'catalog_motivo_baja'
        