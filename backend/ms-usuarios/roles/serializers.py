from rest_framework import serializers
from .models import Permission, Role, RolePermission


class PermissionSerializer(serializers.ModelSerializer):
    full_codename= serializers.CharField(read_only=True)
    class Meta:
        model  = Permission
        fields = [
            'id', 'microservice_name', 'app_label', 'model_name',
            'codename', 'name', 'full_codename', 'is_active',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['synced_at', 'created_at', 'full_codename']
class RoleListSerializer(serializers.ModelSerializer):
    total_permissions= serializers.IntegerField(source='permissions.count', read_only=True)
    active_permissions= serializers.SerializerMethodField()
    class Meta:
        model  = Role
        fields = [
            'id', 'name', 'description', 'is_active',
            'total_permissions', 'active_permissions',
            'created_at', 'updated_at',
        ]
    def get_active_permissions(self, obj):
        return obj.permissions.filter(is_active=True).count()
class RoleDetailSerializer(serializers.ModelSerializer):
    permissions_list= PermissionSerializer(source='permissions', many=True, read_only=True)
    permissions_grouped= serializers.SerializerMethodField()
    class Meta:
        model  = Role
        fields = [
            'id', 'name', 'description', 'is_active',
            'permissions_list', 'permissions_grouped',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']
    def get_permissions_grouped(self, obj: Role) -> dict:
        return obj.build_jwt_permissions()
class CreateRoleSerializer(serializers.Serializer):
    name= serializers.CharField(max_length=100)
    description= serializers.CharField(required=False, default='')
    is_active= serializers.BooleanField(default=True)
    permission_ids= serializers.ListField(
        child=serializers.IntegerField(min_value=1),
        required=False, default=list,
    )
class UpdateRoleSerializer(serializers.Serializer):
    name           = serializers.CharField(max_length=100, required=False)
    description    = serializers.CharField(required=False)
    is_active      = serializers.BooleanField(required=False)
    permission_ids = serializers.ListField(child=serializers.IntegerField(min_value=1),
                                           required=False, allow_null=True,
                                           help_text='Si se envía, REEMPLAZA todos los permisos.')
class MultiplePermissionSerializer(serializers.Serializer):
    permission_ids = serializers.ListField(
        child=serializers.IntegerField(min_value=1),
        min_length=1
    )
class RolePermissionDetailSerializer(serializers.ModelSerializer):
    permission      = PermissionSerializer(read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True, default=None)
    class Meta:
        model  = RolePermission
        fields = ['id', 'permission', 'created_by_name', 'created_at']
