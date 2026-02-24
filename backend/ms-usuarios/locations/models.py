from django.db import models
from django.conf import settings


class Departamento(models.Model):
    nombre = models.CharField(max_length=100, unique=True)
    codigo = models.CharField(max_length=10, unique=True)
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name='departamentos_creados')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    class Meta:
        db_table = 'locations_departamento'
        ordering = ['nombre']
        indexes = [
            models.Index(fields=['codigo']),
            models.Index(fields=['is_active']),
        ]
    def __str__(self):
        return self.nombre

class Provincia(models.Model):
    departamento = models.ForeignKey(Departamento, on_delete=models.CASCADE, related_name='provincias')
    nombre = models.CharField(max_length=100)
    codigo = models.CharField(max_length=10)
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name='provincias_creadas')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    class Meta:
        db_table = 'locations_provincia'
        ordering = ['nombre']
        unique_together = ['departamento', 'codigo']
        indexes = [
            models.Index(fields=['codigo']),
            models.Index(fields=['is_active']),
        ]
    def __str__(self):
        return self.nombre

class Distrito(models.Model):
    provincia = models.ForeignKey(Provincia, on_delete=models.CASCADE, related_name='distritos')
    nombre = models.CharField(max_length=100)
    codigo = models.CharField(max_length=10)
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name='distritos_creados')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    class Meta:
        db_table = 'locations_distrito'
        ordering = ['nombre']
        unique_together = ['provincia', 'codigo']
        indexes = [
            models.Index(fields=['codigo']),
            models.Index(fields=['is_active']),
        ]
    def __str__(self):
        return self.nombre

class Empresa(models.Model):
    nombre = models.CharField(max_length=300)
    codigo = models.CharField(max_length=50, unique=True)
    descripcion = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name='empresas_creadas')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    class Meta:
        db_table = 'locations_empresa'
        ordering = ['nombre']
        indexes = [
            models.Index(fields=['codigo']),
            models.Index(fields=['is_active']),
        ]
    def __str__(self):
        return self.nombre

class Sede(models.Model):
    nombre = models.CharField(max_length=200)
    codigo = models.CharField(max_length=20, unique=True)
    direccion = models.CharField(max_length=300)
    distrito = models.ForeignKey(Distrito, on_delete=models.SET_NULL, null=True, related_name='sedes')
    empresa = models.ForeignKey(Empresa, on_delete=models.SET_NULL, null=True, blank=True, related_name='sedes')
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name='sedes_creadas')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    class Meta:
        db_table = 'locations_sede'
        ordering = ['nombre']
        indexes = [
            models.Index(fields=['codigo']),
            models.Index(fields=['is_active']),   ]
    def __str__(self):
        return self.nombre

class Choices(models.Model):
    codigo=models.CharField(max_length=30)
    nombre=models.CharField(max_length=200)
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name='choices_creados')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)  
    class Meta:
        db_table = 'locations_codigo'
        ordering = ['nombre']
        unique_together = ['nombre', 'codigo']
        indexes = [
            models.Index(fields=['codigo']),
            models.Index(fields=['is_active']),
        ]        

class Modulo(models.Model):
    sede = models.ForeignKey(Sede, on_delete=models.CASCADE, related_name='modulos')
    codigo = models.ForeignKey(Choices, on_delete=models.CASCADE,related_name='codigos')
    nombre = models.CharField(max_length=200)
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name='modulos_creados')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    class Meta:
        db_table = 'locations_modulo'
        ordering = ['nombre']
        unique_together = ['sede', 'codigo']
        indexes = [
            models.Index(fields=['codigo']),
            models.Index(fields=['is_active']),
        ]
    def __str__(self):
        return f'{self.sede.nombre} - {self.nombre}'

class Area(models.Model):
    modulo = models.ForeignKey(Modulo, on_delete=models.CASCADE, related_name='areas')
    nombre = models.CharField(max_length=200)
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name='areas_creadas')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    class Meta:
        db_table = 'locations_area'
        ordering = ['nombre']
        unique_together = ['modulo', 'nombre']
        indexes = [
            models.Index(fields=['is_active']),
        ]
    def __str__(self):
        return f'{self.modulo.sede.nombre} / {self.modulo.nombre} / {self.nombre}'
