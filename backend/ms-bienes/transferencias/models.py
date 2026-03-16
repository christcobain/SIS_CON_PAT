from django.db import models
from catalogos.models import CatMotivoCancelacion, CatMotivoTransferencia


class Transferencia(models.Model):
    TIPO_CHOICES = [
        ('TRASLADO_SEDE',      'Traslado entre Sedes'),
        ('ASIGNACION_INTERNA', 'Asignación Interna'),
    ]
    ESTADO_CHOICES = [
        ('PENDIENTE_APROBACION',   'Pendiente de Aprobación'),
        ('EN_ESPERA_CONFORMIDAD',  'En Espera de Conformidad del Destinatario'),
        ('EN_RETORNO',             'En Retorno a Sede Origen'),
        ('ATENDIDO',               'Atendido'),
        ('DEVUELTO',               'Devuelto'),
        ('CANCELADO',              'Cancelado'),
    ]
    numero_orden = models.CharField(max_length=20, unique=True)
    tipo         = models.CharField(max_length=20, choices=TIPO_CHOICES)
    descripcion  = models.TextField(null=True, blank=True)
    
    usuario_origen_id = models.IntegerField()
    sede_origen_id    = models.IntegerField()
    modulo_origen_id  = models.IntegerField(null=True, blank=True)
    ubicacion_origen_id  = models.IntegerField(null=True, blank=True)
    piso_origen          = models.SmallIntegerField(null=True, blank=True)
    
    usuario_destino_id    = models.IntegerField()
    sede_destino_id       = models.IntegerField()
    modulo_destino_id     = models.IntegerField(null=True, blank=True)
    ubicacion_destino_id  = models.IntegerField(null=True, blank=True)
    piso_destino          = models.SmallIntegerField(null=True, blank=True)
    
    motivo             = models.ForeignKey(CatMotivoTransferencia, on_delete=models.SET_NULL,null=True, blank=True, related_name='transferencias',)
    
    estado              = models.CharField(max_length=25, choices=ESTADO_CHOICES, default='PENDIENTE_APROBACION')
    fecha_registro      = models.DateTimeField(auto_now_add=True)
    fecha_cancelacion   = models.DateTimeField(null=True, blank=True)
    motivo_cancelacion = models.ForeignKey(CatMotivoCancelacion, on_delete=models.SET_NULL,null=True, blank=True, related_name='transferencias_canceladas')
    detalle_cancelacion = models.TextField(null=True, blank=True)
    
    motivo_devolucion   = models.TextField(null=True, blank=True)
    aprobado_por_adminsede_id  = models.IntegerField(null=True, blank=True)
    fecha_aprobacion_adminsede = models.DateTimeField(null=True, blank=True)
    aprobado_segur_salida_id      = models.IntegerField(null=True, blank=True)
    fecha_aprobacion_segur_salida = models.DateTimeField(null=True, blank=True)
    aprobado_segur_entrada_id      = models.IntegerField(null=True, blank=True)
    fecha_aprobacion_segur_entrada = models.DateTimeField(null=True, blank=True)
    observacion_segursede          = models.TextField(null=True, blank=True)
    confirmado_por_usuario_destino_id = models.IntegerField(null=True, blank=True)
    fecha_confirmacion_destino        = models.DateTimeField(null=True, blank=True)
    aprobado_retorno_salida_id       = models.IntegerField(null=True, blank=True)
    fecha_aprobacion_retorno_salida  = models.DateTimeField(null=True, blank=True)
    aprobado_retorno_entrada_id      = models.IntegerField(null=True, blank=True)
    fecha_aprobacion_retorno_entrada = models.DateTimeField(null=True, blank=True)
    pdf_path         = models.CharField(max_length=500, null=True, blank=True) 
    pdf_firmado_path = models.CharField(max_length=500, null=True, blank=True) 
    fecha_pdf        = models.DateTimeField(null=True, blank=True)
    class Meta:
        db_table            = 'bienes_transferencia'
        ordering            = ['-fecha_registro']
        verbose_name        = 'Transferencia'
        verbose_name_plural = 'Transferencias'
        indexes = [
            models.Index(fields=['estado']),
            models.Index(fields=['tipo']),
            models.Index(fields=['sede_origen_id']),
            models.Index(fields=['sede_destino_id']),
            models.Index(fields=['usuario_origen_id']),
            models.Index(fields=['usuario_destino_id']),
        ]
    def __str__(self):
        return f'{self.numero_orden} | {self.tipo} | {self.estado}'

class TransferenciaDetalle(models.Model):    
    transferencia = models.ForeignKey(Transferencia, on_delete=models.CASCADE, related_name='detalles')
    categoria_bien_nombre = models.CharField(max_length=100)
    bien = models.ForeignKey('bienes.Bien', on_delete=models.PROTECT, related_name='transferencias')
    codigo_patrimonial = models.CharField(max_length=50)
    tipo_bien_nombre   = models.CharField(max_length=100)
    marca_nombre       = models.CharField(max_length=100, blank=True)
    modelo             = models.CharField(max_length=200, blank=True)
    numero_serie       = models.CharField(max_length=100, blank=True)
    class Meta:
        db_table        = 'bienes_transferencia_detalle'
        unique_together = [('transferencia', 'bien')]
    def __str__(self):
        return f'{self.transferencia.numero_orden} | {self.codigo_patrimonial}'


class TransferenciaAprobacion(models.Model):
    ACCION_CHOICES = [
        ('APROBADO',  'Aprobado'),
        ('RECHAZADO', 'Rechazado'),
        ('DEVUELTO',  'Devuelto'),
    ]
    ROL_CHOICES = [
        ('COORDSISTEMA',          'Coordinador de Sistemas'),
        ('ADMINSEDE',             'Administrador de Sede'),
        ('SEGUR_SALIDA',          'Seguridad Salida'),
        ('SEGUR_ENTRADA',         'Seguridad Entrada'),
        ('SEGUR_RETORNO_SALIDA',  'Seguridad Retorno Salida'),
        ('SEGUR_RETORNO_ENTRADA', 'Seguridad Retorno Entrada'),
        ('USUARIO_DESTINO',       'Usuario Destinatario'),
        ('REGISTRADOR',           'Registrador'),
    ]
    transferencia = models.ForeignKey(Transferencia, on_delete=models.CASCADE, related_name='aprobaciones')
    rol_aprobador = models.CharField(max_length=25, choices=ROL_CHOICES)
    accion        = models.CharField(max_length=10, choices=ACCION_CHOICES)
    usuario_id    = models.IntegerField()
    detalle       = models.TextField(null=True, blank=True)
    fecha         = models.DateTimeField(auto_now_add=True)
    class Meta:
        db_table = 'bienes_transferencia_aprobacion'
        ordering = ['fecha']
    def __str__(self):
        return f'{self.transferencia.numero_orden} | {self.rol_aprobador} | {self.accion}'