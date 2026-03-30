from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils.translation import gettext_lazy as _
from .models import User, BDEmpleados, Dependencia

@admin.register(User)
class CustomUserAdmin(UserAdmin):

    list_display = ('id','username', 'dni', 'first_name', 'last_name', 'role', 'is_staff', 'is_superuser','is_active')
    list_filter = ('id','is_staff', 'is_superuser', 'is_active', 'role', 'empresa', 'modulo')
    search_fields = ('username', 'first_name', 'last_name', 'dni', 'email')
    ordering = ('last_name', 'first_name')
    
    # Organización de los campos dentro del formulario de edición
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        (_('Información Personal'), {'fields': ('first_name', 'last_name', 'email', 'dni', 'cargo')}),
        (_('Ubicación y Estructura'), {'fields': ('empresa', 'modulo', 'sedes', 'dependencia', 'modulo_rrhh')}),
        (_('Permisos y Roles'), {
            'fields': ('role', 'is_active', 'is_staff', 'is_superuser', 'es_usuario_sistema', 'groups', 'user_permissions'),
        }),
        (_('Fechas Importantes'), {'fields': ('last_login', 'date_joined', 'fecha_baja')}),
    )

    # Permitir la selección múltiple de sedes de forma amigable
    filter_horizontal = ('sedes', 'groups', 'user_permissions')

@admin.register(BDEmpleados)
class BDEmpleadosAdmin(admin.ModelAdmin):
    list_display = ('dni', 'last_name', 'first_name', 'cargo', 'modulo', 'empresa', 'is_active')
    search_fields = ('dni', 'last_name', 'first_name')
    list_filter = ('is_active', 'empresa', 'modulo')
    readonly_fields = ('dni',) # Por seguridad si es una base "externa"

@admin.register(Dependencia)
class DependenciaAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'codigo', 'is_active', 'created_at')
    search_fields = ('nombre', 'codigo')
    list_filter = ('is_active',)
    
    def save_model(self, request, obj, form, change):
        if not change: # Si es creación
            obj.created_by = request.user
        super().save_model(request, obj, form, change)