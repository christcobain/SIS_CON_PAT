from django.contrib import admin
from .models import Permission, Role, RolePermission

@admin.register(Permission)
class PermissionAdmin(admin.ModelAdmin):
    list_display = ('codename', 'name', 'microservice_name', 'app_label', 'model_name', 'is_active')
    list_filter = ('microservice_name', 'app_label', 'is_active')
    search_fields = ('codename', 'name', 'model_name')
    list_editable = ('is_active',)
    ordering = ('microservice_name', 'app_label', 'codename')

class RolePermissionInline(admin.TabularInline):
    model = RolePermission
    extra = 1
    autocomplete_fields = ['permission'] # Requiere search_fields en PermissionAdmin
    verbose_name = "Permiso Asignado"
    verbose_name_plural = "Permisos Asignados"

@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ('name', 'description', 'is_active', 'created_at')
    list_filter = ('is_active',)
    search_fields = ('name',)
    list_editable = ('is_active',)
    inlines = [RolePermissionInline]
    
    # Esto excluye el campo ManyToMany directo si usas el 'through' (RolePermission)
    # para evitar duplicidad en el formulario
    exclude = ('permissions',) 

@admin.register(RolePermission)
class RolePermissionAdmin(admin.ModelAdmin):
    list_display = ('role', 'permission', 'is_active', 'created_by', 'created_at')
    list_filter = ('role', 'is_active')
    search_fields = ('role__name', 'permission__name', 'permission__codename')