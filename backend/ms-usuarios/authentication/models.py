from django.db import models
from django.utils import timezone
from django.conf import settings
from users.models import User


class PasswordPolicy(models.Model):
    name = models.CharField(max_length=100, default='Default')
    min_length = models.PositiveSmallIntegerField(default=10)
    require_upper = models.BooleanField(default=True)
    require_lower = models.BooleanField(default=True)
    require_digit = models.BooleanField(default=True)
    require_special = models.BooleanField(default=True)
    expiration_days = models.PositiveSmallIntegerField(default=45)
    warning_days = models.PositiveSmallIntegerField(default=4)
    history_count = models.PositiveSmallIntegerField(default=5)
    active = models.BooleanField(default=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name='auth_passwordpolicies_created')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    class Meta:
        db_table = 'auth_passwordpolicy'
        ordering = ['-created_at']
    def __str__(self):
        return self.name
    @classmethod
    def get_active_policy(cls):
        return cls.objects.filter(active=True).order_by('-id').first()
    def validate_password(self, password):
        errors = []
        if len(password) < self.min_length:
            errors.append(f'Mínimo {self.min_length} caracteres.')
        if self.require_upper and not any(c.isupper() for c in password):
            errors.append('Debe incluir mayúscula.')
        if self.require_lower and not any(c.islower() for c in password):
            errors.append('Debe incluir minúscula.')
        if self.require_digit and not any(c.isdigit() for c in password):
            errors.append('Debe incluir dígito.')
        if self.require_special and not any(not c.isalnum() for c in password):
            errors.append('Debe incluir carácter especial.')
        return errors

class Credential(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='credential')
    active = models.BooleanField(default=True)
    force_password_change = models.BooleanField(default=True)
    last_password_change = models.DateTimeField(null=True, blank=True)
    allow_multiple_sessions = models.BooleanField(default=False)
    is_locked = models.BooleanField(default=False)
    failed_attempts = models.PositiveSmallIntegerField(default=0)
    lock_until = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    class Meta:
        db_table = 'auth_credential'
    def __str__(self):
        return f'Credential {self.user.username}'
    def is_password_expired(self):
        policy = PasswordPolicy.get_active_policy()
        if not policy or not self.last_password_change:
            return False
        expiration_date = self.last_password_change + timezone.timedelta(days=policy.expiration_days)
        return timezone.now() >= expiration_date
    def days_until_expiry(self):
        policy = PasswordPolicy.get_active_policy()
        if not policy or not self.last_password_change:
            return None
        expiration_date = self.last_password_change + timezone.timedelta(days=policy.expiration_days)
        delta = (expiration_date - timezone.now()).days
        return max(0, delta)
    def needs_password_warning(self):
        policy = PasswordPolicy.get_active_policy()
        if not policy:
            return False
        days_left = self.days_until_expiry()
        if days_left is None:
            return False
        return days_left <= policy.warning_days and not self.is_password_expired()

class PasswordHistory(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='auth_password_histories')
    hashed_password = models.CharField(max_length=256)
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        db_table = 'auth_passwordhistory'
        ordering = ['-created_at']
    def __str__(self):
        return f'PasswordHistory user={self.user_id}'

class LoginSession(models.Model):
    STATUS_CHOICES = [
        ('active', 'Activo'),
        ('logout', 'Cerrado'),
        ('expired', 'Expirado'),
    ]
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='login_sessions')
    ip_address = models.GenericIPAddressField()
    device_info = models.CharField(max_length=500, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    login_at = models.DateTimeField(default=timezone.now)
    logout_at = models.DateTimeField(null=True, blank=True)
    last_activity = models.DateTimeField(auto_now=True)
    jwt_token_hash = models.CharField(max_length=256, blank=True)
    class Meta:
        db_table = 'auth_loginsession'
        ordering = ['-login_at']
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['login_at']),
        ]
    def __str__(self):
        return f'{self.user.username} - {self.status}'

class LoginAttempt(models.Model):
    ATTEMPT_TYPE_CHOICES = [
        ('success', 'Exitoso'),
        ('invalid_password', 'Contraseña inválida'),
        ('user_not_found', 'Usuario no encontrado'),
        ('user_inactive', 'Usuario inactivo'),
        ('password_expired', 'Contraseña expirada'),
        ('locked', 'Cuenta bloqueada'),
        ('force_password_change', 'Cambio de contraseña requerido'),
        ('other', 'Otro error'),
    ]
    username = models.CharField(max_length=150, db_index=True)
    ip_address = models.GenericIPAddressField()
    device_info = models.CharField(max_length=500, blank=True)
    attempt_type = models.CharField(max_length=30, choices=ATTEMPT_TYPE_CHOICES, default='other')
    success = models.BooleanField(default=False, db_index=True)
    attempted_at = models.DateTimeField(default=timezone.now, db_index=True)
    error_message = models.CharField(max_length=500, blank=True)
    class Meta:
        db_table = 'auth_loginattempt'
        ordering = ['-attempted_at']
        indexes = [
            models.Index(fields=['username', 'attempted_at']),
            models.Index(fields=['ip_address', 'attempted_at']),
            models.Index(fields=['success', 'attempted_at']),
        ]
    def __str__(self):
        return f'{self.username} - {self.attempt_type}'
