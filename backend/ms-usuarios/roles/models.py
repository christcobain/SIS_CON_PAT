from django.db import models
from django.conf import settings

class Permission(models.Model):
    microservice_name = models.CharField(max_length=100,verbose_name='Microservicio', db_index=True)
    app_label = models.CharField(max_length=100,verbose_name='App label',db_index=True)
    model_name = models.CharField(max_length=100,verbose_name='Modelo')
    codename = models.CharField(max_length=150,verbose_name='Codename',db_index=True,)
    name = models.CharField(max_length=255,verbose_name='Nombre')
    is_active  = models.BooleanField(default=True, db_index=True)
    created_at  = models.DateTimeField(auto_now=True)
    updated_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        db_table = 'roles_permission'
        ordering = ['microservice_name', 'app_label','model_name', 'codename']
        unique_together = [['microservice_name', 'app_label', 'codename']]
        indexes = [
            models.Index(fields=['microservice_name', 'app_label']),
            models.Index(fields=['is_active', 'microservice_name']),
        ]
        verbose_name = 'Permiso'
        verbose_name_plural = 'Permisos'
    def __str__(self):
        return f'[{self.microservice_name}] {self.app_label}.{self.codename}'
    @property
    def full_codename(self) -> str:
        return f'{self.microservice_name}:{self.app_label}:{self.codename}'

class Role(models.Model):
    name = models.CharField(max_length=100,unique=True,verbose_name='Nombre')
    description = models.TextField(blank=True,verbose_name='Descripción',)
    permissions = models.ManyToManyField(Permission,through='RolePermission',through_fields=('role', 'permission'),related_name='roles',blank=True,verbose_name='Permisos asignados',)
    is_active  = models.BooleanField(default=True, db_index=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL,null=True, blank=True,on_delete=models.SET_NULL,related_name='roles_created',verbose_name='Creado por',)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    class Meta:
        db_table = 'roles_role'
        ordering = ['name']
        verbose_name = 'Rol'
        verbose_name_plural = 'Roles'
    def __str__(self):
        return self.name
    def build_jwt_permissions(self) -> dict:
        result: dict = {}
        rows = (
            self.permissions
            .filter(is_active=True)
            .values('microservice_name', 'app_label', 'codename')
            .order_by('microservice_name', 'app_label', 'codename')
        )
        for row in rows:
            ms  = row['microservice_name']
            app = row['app_label']
            result.setdefault(ms, {}).setdefault(app, []).append(row['codename'])
        return result
    def build_flat_permissions(self) -> set:
        return {
            f'{row["microservice_name"]}:{row["app_label"]}:{row["codename"]}'
            for row in (
                self.permissions
                .filter(is_active=True)
                .values('microservice_name', 'app_label', 'codename')
            )
        }

class RolePermission(models.Model):
    role = models.ForeignKey(Role,on_delete=models.CASCADE,related_name='role_permissions',)
    permission = models.ForeignKey(Permission,on_delete=models.CASCADE,related_name='role_permissions',)
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL,null=True, blank=True,on_delete=models.SET_NULL,related_name='permissions_created',verbose_name='Asignado por',)
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        db_table        = 'roles_role_permission'
        unique_together = [['role', 'permission']]
        verbose_name    = 'Permiso de rol'
    def __str__(self):
        return f'{self.role.name} → {self.permission}'