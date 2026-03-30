from django.contrib import admin
from .models import Empresa, Departamento, Provincia, Distrito, Sede, Modulo, Ubicacion

@admin.register(Empresa)
class EmpresaAdmin(admin.ModelAdmin):
    list_display = ('nombre_corto', 'nombre', 'ruc', 'is_active')
    search_fields = ('nombre', 'nombre_corto', 'ruc')
    list_filter = ('is_active',)

@admin.register(Departamento)
class DepartamentoAdmin(admin.ModelAdmin):
    list_display = ('codigo', 'nombre', 'is_active')
    search_fields = ('nombre', 'codigo')

@admin.register(Provincia)
class ProvinciaAdmin(admin.ModelAdmin):
    list_display = ('codigo', 'nombre', 'departamento', 'is_active')
    list_filter = ('departamento', 'is_active')
    search_fields = ('nombre', 'codigo')

@admin.register(Distrito)
class DistritoAdmin(admin.ModelAdmin):
    list_display = ('codigo', 'nombre', 'provincia', 'is_active')
    list_filter = ('provincia__departamento', 'is_active')
    search_fields = ('nombre', 'codigo')

@admin.register(Sede)
class SedeAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'empresa', 'distrito', 'is_active')
    list_filter = ('empresa', 'is_active', 'distrito__provincia__departamento')
    search_fields = ('nombre', 'direccion')

@admin.register(Modulo)
class ModuloAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'is_active', 'created_at')
    search_fields = ('nombre',)
    list_filter = ('is_active',)

@admin.register(Ubicacion)
class UbicacionAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'is_active', 'created_at')
    search_fields = ('nombre', 'descripcion')
    list_filter = ('is_active',)