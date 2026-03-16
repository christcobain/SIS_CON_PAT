from rest_framework import serializers
from users.models import User
from .models import PasswordHistory, PasswordPolicy, LoginSession, LoginAttempt, Credential


class PasswordPolicySerializer(serializers.ModelSerializer):
    class Meta:
        model = PasswordPolicy
        fields = [
            "id", "name", "min_length",
            "require_upper", "require_lower", "require_digit", "require_special",
            "expiration_days", "warning_days", "history_count", "is_active",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class PasswordHistoryUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "first_name", "last_name"]


class PasswordHistoryQuerySerializer(serializers.Serializer):
    user_id = serializers.IntegerField(required=True)
    limit   = serializers.IntegerField(required=False, default=5, min_value=1)


class PasswordHistorySerializer(serializers.ModelSerializer):
    user = PasswordHistoryUserSerializer(read_only=True)
    class Meta:
        model  = PasswordHistory
        fields = ["id", "user", "created_at"]


class LoginRequestSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    password = serializers.CharField(max_length=255, write_only=True)


class ActiveSessionSerializer(serializers.ModelSerializer):
    dni      = serializers.CharField(source="user.dni",      read_only=True)
    username = serializers.CharField(source="user.username", read_only=True)
    class Meta:
        model  = LoginSession
        fields = ["id", "dni", "username", "ip_address", "device_info", "status", "login_at", "last_activity"]


class LoginSessionHistorialSerializer(serializers.ModelSerializer):
    dni            = serializers.CharField(source="user.dni",                  read_only=True)
    username       = serializers.CharField(source="user.username",             read_only=True)
    nombre_completo = serializers.SerializerMethodField()
    class Meta:
        model  = LoginSession
        fields = [
            "id", "dni", "username", "nombre_completo",
            "ip_address", "device_info",
            "status", "login_at", "logout_at", "last_activity",
        ]
    def get_nombre_completo(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}".strip() or obj.user.username


class LoginAttemptSerializer(serializers.ModelSerializer):
    class Meta:
        model  = LoginAttempt
        fields = [
            "id", "username", "ip_address", "device_info",
            "attempt_type", "success", "attempted_at", "error_message",
        ]


class CredentialUserSerializer(serializers.ModelSerializer):
    nombre_completo = serializers.SerializerMethodField()
    class Meta:
        model  = User
        fields = ["id", "dni", "username", "first_name", "last_name", "nombre_completo", "is_active"]
    def get_nombre_completo(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip() or obj.username


class CredentialListSerializer(serializers.ModelSerializer):
    user = CredentialUserSerializer(read_only=True)
    class Meta:
        model  = Credential
        fields = [
            "id", "user",
            "is_active", "force_password_change",
            "last_password_change", "allow_multiple_sessions",
            "is_locked", "failed_attempts",
            "created_at", "updated_at",
        ]


class SedeShortSerializer(serializers.Serializer):
    id     = serializers.IntegerField()
    nombre = serializers.CharField()
    codigo = serializers.CharField()


class LoginResponseSerializer(serializers.Serializer):
    nombres                  = serializers.CharField()
    apellidos                = serializers.CharField()
    role                     = serializers.CharField(allow_null=True)
    permissions              = serializers.DictField()
    sedes                    = SedeShortSerializer(many=True)
    dependencia              = serializers.CharField(allow_null=True)
    password_expires_in_days = serializers.IntegerField(allow_null=True)
    needs_password_warning   = serializers.BooleanField()


class MultipleSessionSerializer(serializers.Serializer):
    username  = serializers.CharField()
    option_id = serializers.IntegerField()


class AdminResetPasswordSerializer(serializers.Serializer):
    username     = serializers.CharField()
    new_password = serializers.CharField(required=False, allow_blank=True)


class UserChangePasswordSerializer(serializers.Serializer):
    username         = serializers.CharField()
    current_password = serializers.CharField()
    new_password     = serializers.CharField()


class SuccessResponseSerializer(serializers.Serializer):
    success = serializers.BooleanField()
    message = serializers.CharField()


class ErrorResponseSerializer(serializers.Serializer):
    error = serializers.CharField(max_length=500)


class UnlockCredentialSerializer(serializers.Serializer):
    username = serializers.CharField()