from django.db import models
from bienes.models import Bien
from catalogos.models import CatMotivoBaja, CatMotivoCancelacion
from mantenimientos.models import Mantenimiento


class Baja(models.Model):
    ESTADO_CHOICES = [
        ('EN_PROCESO',           'En Proceso'),
        ('PENDIENTE_APROBACION', 'Pendiente de Aprobación'),
        ('ATENDIDO',             'Atendido'),
        ('DEVUELTO',             'Devuelto'),
        ('CANCELADO',            'Cancelado'),
    ]

    numero_informe        = models.CharField(max_length=30, unique=True)
    usuario_elabora_id    = models.IntegerField()
    cargo_elabora         = models.CharField(max_length=200, blank=True, default='')
    sede_elabora_id       = models.IntegerField()
    usuario_destino_id    = models.IntegerField()

    antecedentes    = models.TextField(null=True, blank=True)
    analisis        = models.TextField(null=True, blank=True)
    conclusiones    = models.TextField(null=True, blank=True)
    recomendaciones = models.TextField(null=True, blank=True)

    estado_baja       = models.CharField(max_length=25, choices=ESTADO_CHOICES, default='PENDIENTE_APROBACION')
    fecha_registro    = models.DateTimeField(auto_now_add=True)

    motivo_devolucion = models.TextField(null=True, blank=True)

    aprobado_por_coordsistema_id = models.IntegerField(null=True, blank=True)
    cargo_coordsistema           = models.CharField(max_length=200, blank=True, default='')
    fecha_aprobacion             = models.DateTimeField(null=True, blank=True)

    motivo_cancelacion  = models.ForeignKey(
        CatMotivoCancelacion, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='bajas_canceladas',
    )
    detalle_cancelacion = models.TextField(null=True, blank=True)
    fecha_cancelacion   = models.DateTimeField(null=True, blank=True)
    class Meta:
        db_table            = 'bienes_baja'
        ordering            = ['-fecha_registro']
        verbose_name        = 'Baja'
        verbose_name_plural = 'Bajas'
        indexes = [
            models.Index(fields=['estado_baja']),
            models.Index(fields=['sede_elabora_id']),
            models.Index(fields=['usuario_elabora_id']),
        ]
    def __str__(self):
        return f'{self.numero_informe} | {self.estado_baja}'


class BajaDetalle(models.Model):
    baja          = models.ForeignKey(Baja, on_delete=models.CASCADE, related_name='detalles')
    bien          = models.ForeignKey(Bien, on_delete=models.PROTECT, related_name='bajas')
    motivo_baja   = models.ForeignKey(CatMotivoBaja, on_delete=models.PROTECT)
    mantenimiento = models.ForeignKey(Mantenimiento, on_delete=models.SET_NULL,null=True, blank=True, related_name='bajas')

    tipo_bien_nombre      = models.CharField(max_length=150, blank=True, default='')
    marca_nombre          = models.CharField(max_length=150, blank=True, default='')
    modelo                = models.CharField(max_length=150, blank=True, default='')
    numero_serie          = models.CharField(max_length=150, blank=True, default='S/N')
    codigo_patrimonial    = models.CharField(max_length=100, blank=True, default='S/C')
    estado_funcionamiento = models.CharField(max_length=100, blank=True, default='')
    class Meta:
        db_table        = 'bienes_baja_detalle'
        unique_together = [('baja', 'bien')]
    def __str__(self):
        return f'Detalle {self.pk} — {self.tipo_bien_nombre} ({self.codigo_patrimonial})'