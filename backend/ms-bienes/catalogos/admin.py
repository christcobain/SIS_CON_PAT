from django.contrib import admin
from .models import (
    CatCategoriaBien, CatTipoBien, CatMarca, CatRegimenTenencia,
    CatEstadoBien, CatEstadoFuncionamiento, CatMotivoMantenimiento,
    CatMotivoBaja, CatMotivoTransferencia, CatMotivoCancelacion,
    CatTipoComputadora, CatTipoTarjetaVideo, CatTipoDisco,
    CatArquitecturaBits, CatTipoMonitor, CatTipoEscaner,
    CatInterfazConexion, CatTipoImpresion, CatTamanoCarro
)

# Configuración del encabezado del Admin
admin.site.site_header = "Panel SYSADMIN - ms-bienes"

class BaseCatalogoAdmin(admin.ModelAdmin):
    """
    Clase base para todos los catálogos para no repetir código.
    """
    list_display = ('nombre', 'descripcion', 'is_active')
    list_filter = ('is_active',)
    search_fields = ('nombre', 'descripcion')
    list_editable = ('is_active',) # Permite activar/desactivar desde la lista
    ordering = ['nombre']

# Registro masivo de catálogos generales
admin.site.register(CatCategoriaBien, BaseCatalogoAdmin)
admin.site.register(CatTipoBien, BaseCatalogoAdmin)
admin.site.register(CatMarca, BaseCatalogoAdmin)
admin.site.register(CatRegimenTenencia, BaseCatalogoAdmin)
admin.site.register(CatEstadoBien, BaseCatalogoAdmin)
admin.site.register(CatEstadoFuncionamiento, BaseCatalogoAdmin)
admin.site.register(CatMotivoMantenimiento, BaseCatalogoAdmin)
admin.site.register(CatMotivoBaja, BaseCatalogoAdmin)
admin.site.register(CatMotivoTransferencia, BaseCatalogoAdmin)
admin.site.register(CatMotivoCancelacion, BaseCatalogoAdmin)

# Registro masivo de catálogos técnicos (Hardware/TI)
admin.site.register(CatTipoComputadora, BaseCatalogoAdmin)
admin.site.register(CatTipoTarjetaVideo, BaseCatalogoAdmin)
admin.site.register(CatTipoDisco, BaseCatalogoAdmin)
admin.site.register(CatArquitecturaBits, BaseCatalogoAdmin)
admin.site.register(CatTipoMonitor, BaseCatalogoAdmin)
admin.site.register(CatTipoEscaner, BaseCatalogoAdmin)
admin.site.register(CatInterfazConexion, BaseCatalogoAdmin)
admin.site.register(CatTipoImpresion, BaseCatalogoAdmin)
admin.site.register(CatTamanoCarro, BaseCatalogoAdmin)