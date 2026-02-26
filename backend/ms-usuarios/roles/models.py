from django.db import models
from django.conf import settings

class Role(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL,null=True,blank=True,on_delete=models.SET_NULL,elated_name='roles_creadps')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    class Meta:
        db_table = 'roles_role'
        ordering = ['name']
        indexes = [
            models.Index(fields=['is_active']),
        ]
    def __str__(self):
        return self.name
    
class Permission(models.Model):
    role = models.ForeignKey(Role,on_delete=models.CASCADE, related_name='permissions')
    codename = models.CharField(max_length=150, unique=True)
    name = models.CharField(max_length=200)
    module = models.CharField(max_length=100)
    action = models.CharField(max_length=50)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL,null=True,blank=True,on_delete=models.SET_NULL,related_name='permissions_created')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    class Meta:
        db_table = 'roles_permission'
        ordering = ['module', 'action']
        unique_together = ['module', 'action']
        indexes = [
            models.Index(fields=['module']),
            models.Index(fields=['action']),
            models.Index(fields=['is_active']),
        ]
    def __str__(self):
        return f'{self.module}.{self.action}'