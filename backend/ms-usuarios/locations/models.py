from django.db import models
from django.conf import settings

   
class Departamento(models.Model):
    nombre = models.CharField(max_length=100, unique=True)
    codigo = models.CharField(max_length=10, unique=True)
    is_active = models.BooleanField(default=True)
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

class Sede(models.Model):
    nombre = models.CharField(max_length=200)
    direccion = models.CharField(max_length=300)
    distrito = models.ForeignKey(Distrito, on_delete=models.SET_NULL, null=True, related_name='sedes')
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name='sedes_creadas')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    class Meta:
        db_table = 'locations_sede'
        ordering = ['nombre']
        indexes = [
            models.Index(fields=['is_active']),   ]
    def __str__(self):
        return self.nombre  
##-NCPP,CIVIL,LFAGRANCIA,--
class Modulo(models.Model):
    sede = models.ForeignKey(Sede, on_delete=models.CASCADE, related_name='modulos')
    nombre = models.CharField(max_length=200)
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name='modulos_creados')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    class Meta:
        db_table = 'locations_modulo'
        ordering = ['nombre']
        indexes = [
            models.Index(fields=['is_active']),
        ]
    def __str__(self):
        return f'{self.sede.nombre} - {self.nombre}'

#("JUZGADO", "Juzgado"),
        # ("OFICINA", "Oficina"),
        # ("SALA", "Sala de Audiencia"),
        # ("POOL", "Pool"),
        # ("COORDINACION", "Coordinación"),
        # ("ALMACEN", "Almacén"),

#---pool especialistas audiencia,pool espcausa, pool asistentes,area_informatica, administracion, subadministracion,coordinacion
## 1er juzgado civil,juzgadi jip, etc
class Ubicacion(models.Model):
    modulo = models.ForeignKey(Modulo,on_delete=models.CASCADE,related_name="ubicaciones")
    nombre = models.CharField(max_length=200)
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name='choices_creados')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)  
    class Meta:
        db_table = "locations_ubicacion"
        indexes = [
            models.Index(fields=["modulo"]),
            models.Index(fields=["is_active"]),        ]
    def __str__(self):
        return f"{self.modulo.nombre} - {self.nombre}"