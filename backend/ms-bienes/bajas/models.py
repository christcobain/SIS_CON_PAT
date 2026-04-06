from django.db import models
from bienes.models import Bien
from catalogos.models import CatMotivoBaja, CatMotivoCancelacion
from mantenimientos.models import Mantenimiento


class Baja(models.Model):
    ESTADO_CHOICES = [
        ('PENDIENTE_APROBACION', 'Pendiente de Aprobación'),
        ('DEVUELTO',             'Devuelto'),
        ('APROBADO',              'Aprobado — Pendiente de Firma'),
        ('EN_ESPERA_FIRMA', 'En Espera de Firma del Documento'),  
        ('ATENDIDO',             'Atendido'),        
        ('CANCELADO',            'Cancelado'),    ]

    numero_informe      = models.CharField(max_length=30, unique=True)

    usuario_elabora_id  = models.IntegerField()
    nombre_elabora      = models.CharField(max_length=255, blank=True, default='')
    cargo_elabora       = models.CharField(max_length=200, blank=True, default='')
    sede_elabora_id     = models.IntegerField()
    sede_elabora_nombre = models.CharField(max_length=255, blank=True, default='')
    modulo_elabora_id   = models.IntegerField(null=True, blank=True)
    modulo_elabora_nombre = models.CharField(max_length=255, blank=True, default='')

    usuario_destino_id  = models.IntegerField()
    nombre_destino      = models.CharField(max_length=255, blank=True, default='')
    cargo_destino       = models.CharField(max_length=200, blank=True, default='')

    antecedentes    = models.TextField(null=True, blank=True)
    analisis        = models.TextField(null=True, blank=True)
    conclusiones    = models.TextField(null=True, blank=True)
    recomendaciones = models.TextField(null=True, blank=True)

    estado_baja    = models.CharField(max_length=25, choices=ESTADO_CHOICES, default='PENDIENTE_APROBACION')
    fecha_registro = models.DateTimeField(auto_now_add=True)

    motivo_devolucion = models.TextField(null=True, blank=True)

    aprobado_por_coordsistema_id = models.IntegerField(null=True, blank=True)
    nombre_coordsistema         = models.CharField(max_length=255, blank=True, default='')
    cargo_coordsistema           = models.CharField(max_length=200, blank=True, default='')
    fecha_aprobacion             = models.DateTimeField(null=True, blank=True)

    motivo_cancelacion  = models.ForeignKey(CatMotivoCancelacion, on_delete=models.SET_NULL,null=True, blank=True, related_name='bajas_canceladas',)
    detalle_cancelacion = models.TextField(null=True, blank=True)
    fecha_cancelacion   = models.DateTimeField(null=True, blank=True)

    docx_path = models.CharField(max_length=500, null=True, blank=True)
    pdf_path  = models.CharField(max_length=500, null=True, blank=True)
    fecha_doc = models.DateTimeField(null=True, blank=True)

    pdf_firmado_path  = models.CharField(max_length=500, null=True, blank=True)
    fecha_pdf_firmado = models.DateTimeField(null=True, blank=True)
    subido_por_id     = models.IntegerField(null=True, blank=True)   

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
    mantenimiento = models.ForeignKey(Mantenimiento, on_delete=models.SET_NULL,null=True, blank=True, related_name='bajas',)

    tipo_bien_nombre      = models.CharField(max_length=150, blank=True, default='')
    marca_nombre          = models.CharField(max_length=150, blank=True, default='')
    modelo                = models.CharField(max_length=150, blank=True, default='')
    numero_serie          = models.CharField(max_length=150, blank=True, default='S/N')
    codigo_patrimonial    = models.CharField(max_length=100, blank=True, default='S/C')
    estado_funcionamiento = models.CharField(max_length=100, blank=True, default='')

    diagnostico_inicial = models.TextField(null=True, blank=True)
    trabajo_realizado   = models.TextField(null=True, blank=True)
    diagnostico_final   = models.TextField(null=True, blank=True)
    observacion_tecnica = models.TextField(null=True, blank=True)

    imagenes_incluidas = models.JSONField(default=list, blank=True)
    class Meta:
        db_table        = 'bienes_baja_detalle'
        unique_together = [('baja', 'bien')]
    def __str__(self):
        return f'{self.tipo_bien_nombre} — {self.codigo_patrimonial}'


class BajaAprobacion(models.Model):
    ACCION_CHOICES = [
        ('REGISTRADO', 'Registrado y derivado para aprobación'),
        ('ENVIADO',    'Reenviado a aprobación con correcciones'),
        ('APROBADO',   'Aprobado — bienes dados de baja'),     
        ('ATENDIDO',   'Atendido con PDF subido'),
        ('DEVUELTO',   'Devuelto para corrección'),
        ('CANCELADO',  'Cancelado'),
    ]
    ROL_CHOICES = [
        ('ASISTSISTEMA', 'Asistente de Sistemas'),
        ('COORDSISTEMA', 'Coordinador de Sistemas'),
        ('SYSADMIN',     'Administrador del Sistema'),
    ]
    baja          = models.ForeignKey(Baja, on_delete=models.CASCADE, related_name='aprobaciones')
    rol_aprobador = models.CharField(max_length=30, choices=ROL_CHOICES)
    accion        = models.CharField(max_length=20, choices=ACCION_CHOICES)
    usuario_id    = models.IntegerField()
    observacion   = models.TextField(null=True, blank=True)
    fecha         = models.DateTimeField(auto_now_add=True)
    class Meta:
        db_table = 'bienes_baja_aprobacion'
        ordering = ['fecha']
    def __str__(self):
        return f'{self.baja.numero_informe} | {self.accion} | {self.rol_aprobador}'
    
    