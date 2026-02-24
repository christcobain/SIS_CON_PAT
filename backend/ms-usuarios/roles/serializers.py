from rest_framework import serializers
from .models import Role, Permission


class PermissionSerializer(serializers.ModelSerializer):
    """Serializer para Permission con auditoría."""
    created_by_detail = serializers.SerializerMethodField()    
    class Meta:
        model = Permission
        fields = ['id', 'codename', 'name', 'module', 'action', 'description', 'estado', 'created_by', 'created_by_detail', 'updated_at']    

class RoleSerializer(serializers.ModelSerializer):
    """Serializer completo para Role con auditoría."""
    permissions = PermissionSerializer(many=True, read_only=True)
    permission_ids = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Permission.objects.all(),
        write_only=True, required=False, source='permissions')
    created_by_detail = serializers.SerializerMethodField()
    class Meta:
        model = Role
        fields = [
            'id', 'code', 'name', 'description', 'permissions', 'permission_ids', 
            'estado', 'created_by', 'created_by_detail', 'created_at', 'updated_at' ]


class RoleListSerializer(serializers.ModelSerializer):
    permission_count = serializers.SerializerMethodField()
    created_by_detail = serializers.SerializerMethodField()
    class Meta:
        model = Role
        fields = [
            'id', 'codename', 'name', 'description', 'estado', 'permission_count', 
            'created_by', 'created_by_detail', 'created_at'
        ]