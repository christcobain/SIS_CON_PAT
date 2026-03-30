from django.contrib import admin
from .models import PasswordPolicy, PasswordHistory, Credential, LoginSession, LoginAttempt

@admin.register(PasswordPolicy)
class PasswordPolicyAdmin(admin.ModelAdmin):
    list_display = ('name', 'min_length', 'expiration_days', 'is_active', 'created_at')
    list_filter = ('is_active',)
    search_fields = ('name',)

@admin.register(PasswordHistory)
class PasswordHistoryAdmin(admin.ModelAdmin):
    list_display = ('user', 'created_at')
    search_fields = ('user__username', 'user__dni')
    list_filter = ('created_at',)

@admin.register(Credential)
class CredentialAdmin(admin.ModelAdmin):
    list_display = ('user', 'is_active', 'is_locked', 'force_password_change', 'failed_attempts')
    list_filter = ('is_active', 'is_locked', 'force_password_change')
    search_fields = ('user__username',)
    readonly_fields = ('created_at', 'updated_at')

@admin.register(LoginSession)
class LoginSessionAdmin(admin.ModelAdmin):
    # Campos existentes: user, ip_address, device_info, status, login_at, logout_at, last_activity
    list_display = ('user', 'status', 'ip_address', 'login_at', 'last_activity')
    list_filter = ('status', 'login_at')
    search_fields = ('user__username', 'ip_address')
    readonly_fields = ('login_at', 'last_activity')

@admin.register(LoginAttempt)
class LoginAttemptAdmin(admin.ModelAdmin):
    # Campos existentes: username, ip_address, device_info, attempt_type, success, attempted_at, error_message
    list_display = ('username', 'attempt_type', 'success', 'ip_address', 'attempted_at')
    list_filter = ('attempt_type', 'success', 'attempted_at')
    search_fields = ('username', 'ip_address')
    readonly_fields = ('attempted_at',)