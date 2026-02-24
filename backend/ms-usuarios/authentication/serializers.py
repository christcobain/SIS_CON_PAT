from rest_framework import serializers

class LoginRequestSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150, required=True)
    password = serializers.CharField(max_length=255, required=True, write_only=True)

class ChangePasswordRequestSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150, required=True)
    new_password = serializers.CharField(max_length=255, required=True, write_only=True)

class SedeShortSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    nombre = serializers.CharField(max_length=255)
    codigo = serializers.CharField(max_length=50)

class UserDetailResponseSerializer(serializers.Serializer):
    user_id = serializers.IntegerField()
    username = serializers.CharField(max_length=150)
    full_name = serializers.CharField(max_length=255)
    email = serializers.EmailField()
    role = serializers.CharField(max_length=50, allow_null=True)
    role_name = serializers.CharField(max_length=255, allow_null=True)
    permissions = serializers.ListField(child=serializers.CharField())
    sedes = SedeShortSerializer(many=True)
    password_expires_in_days = serializers.IntegerField(allow_null=True, required=False)
    needs_password_warning = serializers.BooleanField(required=False)

class LoginResponseSerializer(serializers.Serializer):
    success = serializers.BooleanField()
    user = UserDetailResponseSerializer()
    message = serializers.CharField(max_length=255)


class ChangePasswordResponseSerializer(serializers.Serializer):
    success = serializers.BooleanField()
    message = serializers.CharField(max_length=255)
    requires_relogin = serializers.BooleanField()

class SuccessResponseSerializer(serializers.Serializer):
    success = serializers.BooleanField()
    message = serializers.CharField(max_length=255)


class ErrorResponseSerializer(serializers.Serializer):
    error = serializers.CharField(max_length=500)