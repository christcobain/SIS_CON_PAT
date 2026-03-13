from django.db import models
from bienes.models import Bien
from catalogos.models import CatMotivoCancelacion, CatEstadoFuncionamiento

class Mantenimiento(models.Model):
    ESTADO_CHOICES = [
        ('EN_PROCESO',           'En Proceso'),
        ('PENDIENTE_APROBACION', 'Pendiente de Aprobación'),
        ('EN_ESPERA_CONFORMIDAD','En Espera de Conformidad del Propietario'),
        ('ATENDIDO',             'Atendido'),
        ('DEVUELTO',             'Devuelto'),
        ('CANCELADO',            'Cancelado'),
    ]
    numero_orden            = models.CharField(max_length=20, unique=True)
    usuario_realiza_id      = models.IntegerField()
    sede_id                 = models.IntegerField()
    modulo_id               = models.IntegerField(null=True, blank=True)
    usuario_propietario_id  = models.IntegerField()
    datos_iniciales     = models.TextField(null=True, blank=True)
    trabajos_realizados = models.TextField(null=True, blank=True)
    diagnostico_final   = models.TextField(null=True, blank=True)
    estado            = models.CharField(max_length=25, choices=ESTADO_CHOICES, default='EN_PROCESO')
    fecha_registro    = models.DateTimeField(auto_now_add=True)
    fecha_inicio      = models.DateField(null=True, blank=True)
    fecha_termino     = models.DateField(null=True, blank=True)
    fecha_cancelacion = models.DateTimeField(null=True, blank=True)
    motivo_cancelacion  = models.ForeignKey(CatMotivoCancelacion, on_delete=models.SET_NULL,null=True, blank=True, related_name='mantenimientos_cancelados',)
    detalle_cancelacion = models.TextField(null=True, blank=True)
    motivo_devolucion   = models.TextField(null=True, blank=True)
    aprobado_por_adminsede_id = models.IntegerField(null=True, blank=True)
    fecha_aprobacion          = models.DateTimeField(null=True, blank=True)
    confirmado_por_propietario_id = models.IntegerField(null=True, blank=True)
    fecha_conformidad             = models.DateTimeField(null=True, blank=True)
    pdf_path         = models.CharField(max_length=500, null=True, blank=True)
    pdf_firmado_path = models.CharField(max_length=500, null=True, blank=True)
    fecha_pdf        = models.DateTimeField(null=True, blank=True)
    tiene_imagenes = models.BooleanField(default=False)
    class Meta:
        db_table            = 'bienes_mantenimiento'
        ordering            = ['-fecha_registro']
        verbose_name        = 'Mantenimiento'
        verbose_name_plural = 'Mantenimientos'
        indexes = [
            models.Index(fields=['estado']),
            models.Index(fields=['sede_id']),
            models.Index(fields=['usuario_realiza_id']),
            models.Index(fields=['usuario_propietario_id']),
        ]
    def __str__(self):
        return f'{self.numero_orden} | {self.estado}'

class MantenimientoDetalle(models.Model):
    mantenimiento = models.ForeignKey(Mantenimiento, on_delete=models.CASCADE, related_name='detalles')
    tipo_bien_nombre   = models.CharField(max_length=100)
    bien = models.ForeignKey(Bien, on_delete=models.PROTECT, related_name='mantenimientos')
    marca = models.CharField(max_length=100, null=True, blank=True)
    modelo     = models.CharField(max_length=100, null=True, blank=True)
    serie= models.CharField(max_length=100, null=True, blank=True)
    codigo_patrimonial = models.CharField(max_length=50)    
    estado_funcionamiento_antes   = models.ForeignKey(CatEstadoFuncionamiento, on_delete=models.SET_NULL,null=True, blank=True, related_name='detalles_antes',)
    estado_funcionamiento_despues = models.ForeignKey(CatEstadoFuncionamiento, on_delete=models.SET_NULL,null=True, blank=True, related_name='detalles_despues',)
    observacion_detalle = models.TextField(null=True, blank=True)
    class Meta:
        db_table        = 'bienes_mantenimiento_detalle'
        unique_together = [('mantenimiento', 'bien')]
    def __str__(self):
        return f'{self.mantenimiento.numero_orden} | {self.marca} |{self.modelo} |{self.serie} | {self.codigo_patrimonial}'

class MantenimientoAprobacion(models.Model):
    ACCION_CHOICES = [
        ('APROBADO',  'Aprobado'),
        ('DEVUELTO',  'Devuelto'),
        ('CANCELADO', 'Cancelado'),
        ('CONFIRMADO','Confirmado por propietario'),
    ]
    ROL_CHOICES = [
        ('ASISTSISTEMA', 'Asistente de Sistemas'),
        ('ADMINSEDE',    'Administrador de Sede'),
        ('PROPIETARIO',  'Usuario Propietario del Bien'),
    ]
    mantenimiento = models.ForeignKey(Mantenimiento, on_delete=models.CASCADE, related_name='aprobaciones')
    rol_aprobador = models.CharField(max_length=20, choices=ROL_CHOICES)
    accion        = models.CharField(max_length=10, choices=ACCION_CHOICES)
    usuario_id    = models.IntegerField()
    observacion   = models.TextField(null=True, blank=True)
    fecha         = models.DateTimeField(auto_now_add=True)
    class Meta:
        db_table = 'bienes_mantenimiento_aprobacion'
        ordering = ['fecha']
    def __str__(self):
        return f'{self.mantenimiento.numero_orden} | {self.rol_aprobador} | {self.accion}'

class MantenimientoImagen(models.Model):
    mantenimiento = models.ForeignKey(Mantenimiento, on_delete=models.CASCADE, related_name='imagenes')
    imagen       = models.ImageField(upload_to='mantenimientos/imagenes/')
    descripcion  = models.CharField(max_length=200, null=True, blank=True)
    fecha_subida = models.DateTimeField(auto_now_add=True)
    class Meta:
        db_table = 'bienes_mantenimiento_imagen'
    def __str__(self):
        return f'{self.mantenimiento.numero_orden} | img-{self.pk}'