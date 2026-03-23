from django.db import models
from bienes.models import Bien
from catalogos.models import CatMotivoCancelacion, CatEstadoFuncionamiento


class Mantenimiento(models.Model):
    ESTADO_CHOICES = [
        ('EN_PROCESO',            'En Proceso'),
        ('PENDIENTE_APROBACION',  'Pendiente de Aprobación'),
        ('APROBADO',              'Aprobado — Pendiente de Firma'),
        ('ATENDIDO',              'Atendido'),
        ('DEVUELTO',              'Devuelto'),
        ('CANCELADO',             'Cancelado'),
    ]

    numero_orden           = models.CharField(max_length=20, unique=True)
    usuario_realiza_id     = models.IntegerField()
    sede_id                = models.IntegerField()
    modulo_id              = models.IntegerField(null=True, blank=True)
    usuario_propietario_id = models.IntegerField()

    estado_mantenimiento  = models.CharField(max_length=25, choices=ESTADO_CHOICES, default='EN_PROCESO')
    fecha_registro        = models.DateTimeField(auto_now_add=True)
    fecha_inicio_mant     = models.DateField(null=True, blank=True)
    fecha_termino_mant    = models.DateField(null=True, blank=True)

    aprobado_por_adminsede_id    = models.IntegerField(null=True, blank=True)
    fecha_aprobacion_adminsede   = models.DateTimeField(null=True, blank=True)

    pdf_path              = models.CharField(max_length=500, null=True, blank=True)
    fecha_pdf             = models.DateTimeField(null=True, blank=True)

    pdf_firmado_path      = models.CharField(max_length=500, null=True, blank=True)
    fecha_pdf_firmado     = models.DateTimeField(null=True, blank=True)
    subido_por_id         = models.IntegerField(null=True, blank=True)

    tiene_imagenes        = models.BooleanField(default=False)

    motivo_cancelacion    = models.ForeignKey(CatMotivoCancelacion,on_delete=models.SET_NULL,null=True, blank=True,related_name='mantenimientos_cancelados')
    detalle_cancelacion   = models.TextField(null=True, blank=True)
    fecha_cancelacion     = models.DateTimeField(null=True, blank=True)
    class Meta:
        db_table            = 'bienes_mantenimiento'
        ordering            = ['-fecha_registro']
        verbose_name        = 'Mantenimiento'
        verbose_name_plural = 'Mantenimientos'
        indexes = [
            models.Index(fields=['estado_mantenimiento']),
            models.Index(fields=['sede_id']),
            models.Index(fields=['usuario_realiza_id']),
            models.Index(fields=['usuario_propietario_id']),
        ]

    def __str__(self):
        return f'{self.numero_orden} | {self.estado_mantenimiento}'
    @property
    def tiene_pdf_firmado(self) -> bool:
        return bool(self.pdf_firmado_path)


class MantenimientoDetalle(models.Model):
    mantenimiento = models.ForeignKey(Mantenimiento, on_delete=models.CASCADE, related_name='detalles')
    bien = models.ForeignKey(Bien, on_delete=models.PROTECT, related_name='mantenimientos')
    estado_funcionamiento_inicial = models.ForeignKey(CatEstadoFuncionamiento,on_delete=models.SET_NULL,null=True, blank=True,related_name='detalles_mant_inicial',)

    diagnostico_inicial   = models.TextField(null=True, blank=True)
    trabajo_realizado     = models.TextField(null=True, blank=True)
    diagnostico_final     = models.TextField(null=True, blank=True)
    estado_funcionamiento_final = models.ForeignKey(CatEstadoFuncionamiento,on_delete=models.SET_NULL,null=True, blank=True,related_name='detalles_mant_final')
    observacion_detalle   = models.TextField(null=True, blank=True)
    class Meta:
        db_table        = 'bienes_mantenimiento_detalle'
        unique_together = [('mantenimiento', 'bien')]
    def __str__(self):
        return (
            f'{self.mantenimiento.numero_orden} | '
            f'{self.bien.tipo_bien} | '
            f'{self.bien.codigo_patrimonial or "S/N"}'
        )

class MantenimientoAprobacion(models.Model):
    ACCION_CHOICES = [
        ('ENVIADO',   'Enviado a aprobación'),
        ('APROBADO',  'Aprobado'),
        ('DEVUELTO',  'Devuelto'),
        ('CANCELADO', 'Cancelado'),
        ('PDF_SUBIDO','PDF firmado subido'),
    ]
    ROL_CHOICES = [
        ('asistSistema', 'Asistente de Sistemas'),
        ('adminSede',    'Administrador de Sede'),
        ('coordSistema', 'Coordinador de Sistemas'),
        ('SYSADMIN',     'Administrador del Sistema'),
    ]
    mantenimiento = models.ForeignKey(Mantenimiento, on_delete=models.CASCADE, related_name='aprobaciones')
    rol_aprobador = models.CharField(max_length=20, choices=ROL_CHOICES)
    accion        = models.CharField(max_length=15, choices=ACCION_CHOICES)
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
    imagen        = models.ImageField(upload_to='mantenimientos/imagenes/')
    descripcion   = models.CharField(max_length=200, null=True, blank=True)
    fecha_subida  = models.DateTimeField(auto_now_add=True)
    class Meta:
        db_table = 'bienes_mantenimiento_imagen'
    def __str__(self):
        return f'{self.mantenimiento.numero_orden} | img-{self.pk}'
    