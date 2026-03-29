from django.contrib import admin
from django.utils.html import format_html
from .models import Baja, BajaDetalle, BajaAprobacion


class BajaDetalleInline(admin.TabularInline):
    """Permite gestionar los bienes incluidos en el informe directamente."""
    model = BajaDetalle
    extra = 0
    fields = ('bien', 'motivo_baja', 'estado_funcionamiento', 'mantenimiento')
    readonly_fields = ('tipo_bien_nombre', 'marca_nombre', 'codigo_patrimonial')
    autocomplete_fields = ['bien'] 

class BajaAprobacionInline(admin.StackedInline):
    """Muestra el historial de pasos/firmas de forma vertical."""
    model = BajaAprobacion
    extra = 0
    readonly_fields = ('fecha',)
    fieldsets = (
        (None, {
            'fields': (('rol_aprobador', 'accion', 'usuario_id'), 'observacion', 'fecha')
        }),
    )

@admin.register(Baja)
class BajaAdmin(admin.ModelAdmin):
    list_display = (
        'numero_informe', 
        'estado_badge',
        'sede_elabora_nombre', 
        'nombre_elabora', 
        'fecha_registro',
        'es_firmado'
    )
    list_filter = ('estado_baja', 'sede_elabora_nombre', 'fecha_registro')
    search_fields = ('numero_informe', 'nombre_elabora', 'sede_elabora_nombre')
    date_hierarchy = 'fecha_registro'
    
    fieldsets = (
        ('Identificación del Informe', {
            'fields': (
                'numero_informe', 
                ('estado_baja', 'fecha_registro'),
            )
        }),
        ('Personal y Origen', {
            'description': 'Datos del personal que elabora y el destino del informe',
            'fields': (
                ('usuario_elabora_id', 'nombre_elabora', 'cargo_elabora'),
                ('sede_elabora_id', 'sede_elabora_nombre'),
                ('modulo_elabora_id', 'modulo_elabora_nombre'),
                ('usuario_destino_id', 'nombre_destino', 'cargo_destino'),
            )
        }),
        ('Cuerpo del Informe Técnica', {
            'classes': ('collapse',), 
            'fields': ('antecedentes', 'analisis', 'conclusiones', 'recomendaciones')
        }),
        ('Gestión de Archivos PDF', {
            'fields': (
                ('pdf_path', 'fecha_doc'),
                ('pdf_firmado_path', 'fecha_pdf_firmado'),
                'subido_por_id'
            )
        }),
        ('Aprobaciones y Cancelaciones', {
            'fields': (
                ('nombre_coordsistema', 'fecha_aprobacion', 'aprobado_por_coordsistema_id'),
                'motivo_devolucion',
                ('motivo_cancelacion', 'fecha_cancelacion'),
                'detalle_cancelacion'
            )
        }),
    )
    readonly_fields = ('fecha_registro',)
    inlines = [BajaDetalleInline, BajaAprobacionInline]
    @admin.display(description='Estado')
    def estado_badge(self, obj):
        colors = {
            'PENDIENTE_APROBACION': '#b45309',
            'ATENDIDO': '#16a34a',
            'DEVUELTO': '#e11d48',
            'CANCELADO': '#64748b',
        }
        return format_html(
            '<span style="color: white; background-color: {}; padding: 3px 10px; border-radius: 10px; font-weight: bold; font-size: 10px;">{}</span>',
            colors.get(obj.estado_baja, '#000'),
            obj.get_estado_baja_display()
        )

    @admin.display(boolean=True, description='¿Firmado?')
    def es_firmado(self, obj):
        return bool(obj.pdf_firmado_path)

