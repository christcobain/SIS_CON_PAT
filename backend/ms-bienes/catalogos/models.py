from django.db import models


class CatalogoBase(models.Model):
    nombre      = models.CharField(max_length=100, unique=True)
    descripcion = models.TextField(blank=True, null=True)
    is_active   = models.BooleanField(default=True)
    class Meta:
        abstract = True
        ordering = ['nombre']
    def __str__(self):
        return self.nombre
class CatCategoriaBien(CatalogoBase):
    """Informático, Mueble, Inmueble, Vehicular, etc."""
    class Meta(CatalogoBase.Meta):
        db_table            = 'bienes_cat_categoria_bien'
        verbose_name        = 'Categoría de Bien'
        verbose_name_plural = 'Categorías de Bien'
class CatTipoBien(CatalogoBase):
    class Meta(CatalogoBase.Meta):
        db_table       = 'bienes_cat_tipo_bien'
        verbose_name   = 'Tipo de Bien'
        verbose_name_plural = 'Tipos de Bien'
class CatMarca(CatalogoBase):
    class Meta(CatalogoBase.Meta):
        db_table       = 'bienes_cat_marca'
        verbose_name   = 'Marca'
        verbose_name_plural = 'Marcas'
class CatRegimenTenencia(CatalogoBase):
    class Meta(CatalogoBase.Meta):
        db_table       = 'bienes_cat_regimen_tenencia'
        verbose_name   = 'Régimen de Tenencia'
        verbose_name_plural = 'Regímenes de Tenencia'
class CatEstadoBien(CatalogoBase):
    class Meta(CatalogoBase.Meta):
        db_table       = 'bienes_cat_estado_bien'
        verbose_name   = 'Estado del Bien'
        verbose_name_plural = 'Estados del Bien'
class CatEstadoFuncionamiento(CatalogoBase):
    class Meta(CatalogoBase.Meta):
        db_table       = 'bienes_cat_estado_funcionamiento'
        verbose_name   = 'Estado de Funcionamiento'
        verbose_name_plural = 'Estados de Funcionamiento'
class CatMotivoBaja(CatalogoBase):
    class Meta(CatalogoBase.Meta):
        db_table       = 'bienes_cat_motivo_baja'
        verbose_name   = 'Motivo de Baja'
        verbose_name_plural = 'Motivos de Baja'

class CatMotivoTransferencia(CatalogoBase):
    class Meta(CatalogoBase.Meta):
        db_table       = 'bienes_cat_motivo_transferencia'
        verbose_name   = 'Motivo de Transferencia'
        verbose_name_plural = 'Motivos de Transferencia'
class CatMotivoCancelacion(CatalogoBase):
    class Meta(CatalogoBase.Meta):
        db_table       = 'bienes_cat_motivo_cancelacion'
        verbose_name   = 'Motivo de Cancelación'
        verbose_name_plural = 'Motivos de Cancelación'
        


class CatTipoComputadora(CatalogoBase):
    class Meta(CatalogoBase.Meta):
        db_table       = 'bienes_cat_tipo_computadora'
        verbose_name   = 'Tipo de Computadora'
        verbose_name_plural = 'Tipos de Computadora'
class CatTipoTarjetaVideo(CatalogoBase):
    class Meta(CatalogoBase.Meta):
        db_table       = 'bienes_cat_tipo_tarjeta_video'
        verbose_name   = 'Tipo de Tarjeta de Video'
        verbose_name_plural = 'Tipos de Tarjeta de Video'
class CatTipoDisco(CatalogoBase):
    class Meta(CatalogoBase.Meta):
        db_table       = 'bienes_cat_tipo_disco'
        verbose_name   = 'Tipo de Disco'
        verbose_name_plural = 'Tipos de Disco'
class CatArquitecturaBits(CatalogoBase):
    class Meta(CatalogoBase.Meta):
        db_table       = 'bienes_cat_arq_bits'
        verbose_name   = 'Arquitectura de Bits'
        verbose_name_plural = 'Arquitecturas de Bits'
class CatTipoMonitor(CatalogoBase):
    class Meta(CatalogoBase.Meta):
        db_table       = 'bienes_cat_tipo_monitor'
        verbose_name   = 'Tipo de Monitor'
        verbose_name_plural = 'Tipos de Monitor'
class CatTipoEscaner(CatalogoBase):
    class Meta(CatalogoBase.Meta):
        db_table       = 'bienes_cat_tipo_escaner'
        verbose_name   = 'Tipo de Escáner'
        verbose_name_plural = 'Tipos de Escáner'
class CatInterfazConexion(CatalogoBase):
    class Meta(CatalogoBase.Meta):
        db_table       = 'bienes_cat_interfaz_conexion'
        verbose_name   = 'Interfaz de Conexión'
        verbose_name_plural = 'Interfaces de Conexión'
class CatTipoImpresion(CatalogoBase):
    class Meta(CatalogoBase.Meta):
        db_table       = 'bienes_cat_tipo_impresion'
        verbose_name   = 'Tipo de Impresión'
        verbose_name_plural = 'Tipos de Impresión'
class CatTamanoCarro(CatalogoBase):
    class Meta(CatalogoBase.Meta):
        db_table       = 'bienes_cat_tamano_carro'
        verbose_name   = 'Tamaño de Carro'
        verbose_name_plural = 'Tamaños de Carro'