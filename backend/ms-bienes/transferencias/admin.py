from django.contrib import admin
from .models import Transferencia, TransferenciaDetalle, TransferenciaAprobacion

admin.site.site_header = "SISTEMA CONTROL PATRIMONIAL - ms-bienes"

class TransferenciaDetalleInline(admin.TabularInline):
    """Muestra los bienes incluidos en la transferencia"""
    model = TransferenciaDetalle
    extra = 0
    fields = (
        'bien', 
        'codigo_patrimonial', 
        'categoria_bien_nombre', 
        'tipo_bien_nombre', 
        'marca_nombre', 
        'modelo', 
        'numero_serie'
    )

class TransferenciaAprobacionInline(admin.TabularInline):
    """Historial de aprobaciones por roles (Seguridad, Admin, etc.)"""
    model = TransferenciaAprobacion
    extra = 0
    readonly_fields = ('fecha',)

@admin.register(Transferencia)
class TransferenciaAdmin(admin.ModelAdmin):
    list_display = (
        'numero_orden', 
        'tipo', 
        'estado_transferencia', 
        'sede_origen_id', 
        'sede_destino_id', 
        'fecha_registro'
    )
    list_filter = ('estado_transferencia', 'tipo', 'fecha_registro', 'sede_origen_id')
    search_fields = ('numero_orden', 'usuario_origen_id', 'usuario_destino_id')

    fieldsets = (
        ('Información General', {
            'fields': ('numero_orden', 'tipo', 'estado_transferencia', 'fecha_registro')
        }),
        ('Origen (IDs)', {
            'fields': ('usuario_origen_id', 'sede_origen_id', 'modulo_origen_id', 'ubicacion_origen_id', 'piso_origen')
        }),
        ('Destino (IDs)', {
            'fields': ('usuario_destino_id', 'sede_destino_id', 'modulo_destino_id', 'ubicacion_destino_id', 'piso_destino')
        }),
        ('Motivo y Descripción', {
            'fields': ('motivo_transferencia', 'descripcion', 'motivo_devolucion')
        }),
        ('Flujo de Aprobación y Seguridad', {
            'fields': (
                'aprobado_por_adminsede_id', 'fecha_aprobacion_adminsede',
                'aprobado_segur_salida_id', 'fecha_aprobacion_segur_salida',
                'aprobado_segur_entrada_id', 'fecha_aprobacion_segur_entrada',
                'observacion_segursede',
                'confirmado_por_usuario_destino_id', 'fecha_confirmacion_destino'
            )
        }),
        ('Flujo de Retorno (Si aplica)', {
            'fields': (
                'aprobado_retorno_salida_id', 'fecha_aprobacion_retorno_salida',
                'aprobado_retorno_entrada_id', 'fecha_aprobacion_retorno_entrada'
            )
        }),
        ('Documentación PDF', {
            'fields': ('pdf_path', 'pdf_firmado_path', 'fecha_pdf')
        }),
        ('Cancelación', {
            'fields': ('fecha_cancelacion', 'motivo_cancelacion', 'detalle_cancelacion')
        }),
    )

    readonly_fields = ('fecha_registro',)
    inlines = [TransferenciaDetalleInline, TransferenciaAprobacionInline]

@admin.register(TransferenciaDetalle)
class TransferenciaDetalleAdmin(admin.ModelAdmin):
    list_display = ('transferencia', 'bien', 'codigo_patrimonial', 'tipo_bien_nombre')
    search_fields = ('transferencia__numero_orden', 'codigo_patrimonial')

@admin.register(TransferenciaAprobacion)
class TransferenciaAprobacionAdmin(admin.ModelAdmin):
    list_display = ('transferencia', 'rol_aprobador', 'accion', 'usuario_id', 'fecha')
    list_filter = ('rol_aprobador', 'accion')