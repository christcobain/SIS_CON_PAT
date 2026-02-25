from django.contrib.auth.models import AbstractUser
from django.conf import settings
from django.db import models
from django.core.validators import RegexValidator
from roles.models import Role
from locations.models import Sede

#--TABLA INDEPENDIENTE CONMO SI FUERA UNA BBD EXTERNA DE OTRA ENTIDAD---
class BDEmpleados(models.Model):
    dni = models.CharField(max_length=8, unique=True)
    escalafon = models.CharField( max_length=10, blank=True, validators=[RegexValidator(r'^\d{1,10}$')])
    first_name = models.CharField(max_length=150)
    last_name = models.CharField(max_length=150)
    cargo = models.CharField(max_length=150, blank=True)
    modulo= models.CharField(max_length=50, blank=True)
    empresa = models.CharField(max_length=150, blank=True)
    is_active= models.BooleanField(default=True)
    class Meta:
        db_table = 'bdempleados'
        ordering = ['last_name', 'first_name']
        verbose_name = "Persona RRHH"
        verbose_name_plural = "Personas RRHH"
        indexes = [
            models.Index(fields=['dni']),
            models.Index(fields=['is_active']) ]
    def __str__(self):
        return f'{self.first_name} {self.last_name} ({self.dni})'

#--dependencias: Administrativa, Operativa,Jurisdiccional, informatica.
class Dependencia(models.Model):
    nombre = models.CharField(max_length=100, unique=True)
    codigo = models.CharField(max_length=10, unique=True)
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True,blank=True,on_delete=models.SET_NULL,related_name='dependencias_creadas')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    class Meta:
        db_table = 'users_dependencia'
        ordering = ['nombre']
        indexes = [
            models.Index(fields=['codigo']),
            models.Index(fields=['is_active']),
        ]
    def __str__(self):
        return self.nombre
    
class User(AbstractUser):
    dni = models.CharField(max_length=8, unique=True, db_index=True)    
    cargo = models.CharField(max_length=150, blank=True)
    dependencia = models.ForeignKey(Dependencia,null=True,blank=True,on_delete=models.SET_NULL,related_name='usuarios')
    sedes= models.ManyToManyField(Sede,related_name='usuarios')
    es_usuario_sistema = models.BooleanField(default=False)
    role = models.ForeignKey(Role,on_delete=models.PROTECT,related_name='usuarios')
    empresa = models.CharField(max_length=150, blank=True)
    fecha_baja = models.DateField(null=True, blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL,null=True,blank=True,on_delete=models.SET_NULL,related_name='usuarios_creados')
    REQUIRED_FIELDS = ['dni', 'first_name', 'last_name', 'role']
    class Meta:
        db_table = 'users_user'
        ordering = ['last_name', 'first_name']
        indexes = [
            models.Index(fields=['is_active']),
            models.Index(fields=['es_usuario_sistema']),
        ]
    def __str__(self):
        ordering = ['last_name', 'first_name']
        return f'{self.first_name} {self.last_name} ({self.dni})'
    def get_tipo_usuario(self):
        return 'Sistema' if self.es_usuario_sistema else 'Jurisdiccional'
    def puede_acceder_al_sistema(self):
        return self.is_active
