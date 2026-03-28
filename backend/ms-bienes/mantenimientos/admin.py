from django.contrib import admin
from .models import Mantenimiento, MantenimientoDetalle, MantenimientoAprobacion, MantenimientoImagen

# Configuración visual del panel
admin.site.site_header = "SISTEMA CONTROL PATRIMONIAL - ms-bienes"

class MantenimientoDetalleInline(admin.TabularInline):
    """Permite ver y editar los bienes asociados dentro del mantenimiento"""
    model = MantenimientoDetalle
    extra = 0
    # Solo campos que existen en MantenimientoDetalle
    fields = (
        'bien', 
        'estado_funcionamiento_inicial', 
        'estado_funcionamiento_final', 
        'diagnostico_inicial', 
        'trabajo_realizado', 
        'diagnostico_final',
        'observacion_detalle'
    )

class MantenimientoAprobacionInline(admin.TabularInline):
    model = MantenimientoAprobacion
    extra = 0
    readonly_fields = ('fecha',)

class MantenimientoImagenInline(admin.StackedInline):
    model = MantenimientoImagen
    extra = 0

@admin.register(Mantenimiento)
class MantenimientoAdmin(admin.ModelAdmin):
    # Vista de lista principal
    list_display = (
        'numero_orden', 
        'estado_mantenimiento', 
        'sede_id', 
        'usuario_realiza_id', 
        'fecha_registro',
        'tiene_imagenes'
    )
    
    list_filter = ('estado_mantenimiento', 'fecha_registro', 'sede_id')
    search_fields = ('numero_orden', 'usuario_realiza_id')

    # Formulario de edición (Campos exactos de tu modelo Mantenimiento)
    fieldsets = (
        ('Información de Control', {
            'fields': ('numero_orden', 'estado_mantenimiento', 'fecha_registro')
        }),
        ('Participantes y Ubicación (IDs)', {
            'fields': ('usuario_realiza_id', 'usuario_propietario_id', 'sede_id', 'modulo_id')
        }),
        ('Cronograma', {
            'fields': ('fecha_inicio_mant', 'fecha_termino_mant')
        }),
        ('Aprobación Sede', {
            'fields': ('aprobado_por_adminsede_id', 'fecha_aprobacion_adminsede')
        }),
        ('Archivos y Cierre', {
            'fields': ('pdf_firmado_path', 'motivo_cancelacion', 'tiene_imagenes')
        }),
    )

    readonly_fields = ('fecha_registro',)

    # Relaciones hijo que se muestran abajo
    inlines = [
        MantenimientoDetalleInline, 
        MantenimientoAprobacionInline, 
        MantenimientoImagenInline
    ]

# Opcional: Registrar los otros para verlos como tablas sueltas
@admin.register(MantenimientoDetalle)
class MantenimientoDetalleAdmin(admin.ModelAdmin):
    list_display = ('mantenimiento', 'bien', 'estado_funcionamiento_inicial', 'estado_funcionamiento_final')

@admin.register(MantenimientoAprobacion)
class MantenimientoAprobacionAdmin(admin.ModelAdmin):
    list_display = ('mantenimiento', 'rol_aprobador', 'accion', 'usuario_id', 'fecha')

@admin.register(MantenimientoImagen)
class MantenimientoImagenAdmin(admin.ModelAdmin):
    list_display = ('mantenimiento', 'descripcion', 'fecha_subida')