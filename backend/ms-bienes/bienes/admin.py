from django.contrib import admin
from .models import (
    Bien, BienDetalleCpu, BienDetalleMonitor, 
    BienDetalleImpresora, BienDetalleScanner, BienDetalleSwitch
)

admin.site.site_header = "SISTEMA CONTROL PATRIMONIAL - ms-bienes"


class BienDetalleCpuInline(admin.StackedInline):
    model = BienDetalleCpu
    can_delete = False
    verbose_name_plural = 'Especificaciones de Computo (CPU)'

class BienDetalleMonitorInline(admin.StackedInline):
    model = BienDetalleMonitor
    can_delete = False

class BienDetalleImpresoraInline(admin.StackedInline):
    model = BienDetalleImpresora
    can_delete = False

class BienDetalleScannerInline(admin.StackedInline):
    model = BienDetalleScanner
    can_delete = False

class BienDetalleSwitchInline(admin.StackedInline):
    model = BienDetalleSwitch
    can_delete = False


@admin.register(Bien)
class BienAdmin(admin.ModelAdmin):
    list_display = (
        'codigo_patrimonial', 
        'tipo_bien', 
        'marca', 
        'modelo', 
        'numero_serie', 
        'estado_funcionamiento',
        'is_active',
        'sede_id'
    )
    list_filter = (
        'is_active', 
        'categoria_bien', 
        'tipo_bien', 
        'estado_bien', 
        'estado_funcionamiento', 
        'sede_id',
        'corte'
    )
    search_fields = ('codigo_patrimonial', 'numero_serie', 'modelo', 'detalle_tecnico')
    fieldsets = (
        ('Identificación del Activo', {
            'fields': (
                'codigo_patrimonial', 'numero_serie', 'categoria_bien', 
                'tipo_bien', 'marca', 'modelo', 'corte'
            )
        }),
        ('Estado y Tenencia', {
            'fields': ('regimen_tenencia', 'estado_bien', 'estado_funcionamiento', 'is_active')
        }),
        ('Ubicación y Responsables (IDs)', {
            'fields': ('sede_id', 'modulo_id', 'ubicacion_id', 'piso', 'usuario_asignado_id', 'usuario_registra_id')
        }),
        ('Información de Adquisición', {
            'fields': (
                'anio_adquisicion', 'fecha_compra', 'numero_orden_compra', 
                'fecha_vencimiento_garantia', 'fecha_instalacion'
            )
        }),
        ('Historial y Notas', {
            'fields': (
                'fecha_ultimo_inventario', 'fecha_ultimo_mantenimiento', 
                'fecha_baja', 'motivo_baja', 'observacion', 'detalle_tecnico'
            )
        }),
        ('Auditoría', {
            'fields': ('fecha_registro', 'fecha_actualizacion'),
            'classes': ('collapse',) 
        }),
    )

    readonly_fields = ('fecha_registro', 'fecha_actualizacion')
    inlines = [
        BienDetalleCpuInline,
        BienDetalleMonitorInline,
        BienDetalleImpresoraInline,
        BienDetalleScannerInline,
        BienDetalleSwitchInline
    ]

@admin.register(BienDetalleCpu)
class BienDetalleCpuAdmin(admin.ModelAdmin):
    list_display = ('bien', 'hostname', 'sistema_operativo', 'capacidad_ram_gb')
    search_fields = ('bien__codigo_patrimonial', 'hostname', 'direccion_ip')

@admin.register(BienDetalleMonitor)
class BienDetalleMonitorAdmin(admin.ModelAdmin):
    list_display = ('bien', 'tipo_monitor', 'tamano_pulgadas')

@admin.register(BienDetalleImpresora)
class BienDetalleImpresoraAdmin(admin.ModelAdmin):
    list_display = ('bien', 'tipo_impresion', 'direccion_ip')

@admin.register(BienDetalleScanner)
class BienDetalleScannerAdmin(admin.ModelAdmin):
    list_display = ('bien', 'tipo_escaner', 'interfaz_conexion')

@admin.register(BienDetalleSwitch)
class BienDetalleSwitchAdmin(admin.ModelAdmin):
    list_display = ('bien', 'direccion_ip', 'cantidad_puertos_utp', 'velocidad_mbps')