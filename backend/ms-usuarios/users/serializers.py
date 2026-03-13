from rest_framework import serializers
from .models import User,Dependencia,BDEmpleados
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Dependencia
from locations.models import Sede,Empresa,Distrito,Modulo  
from roles.models import Role ,Permission
User = get_user_model()

class BDEmpleadosSerializer(serializers.ModelSerializer):
    class Meta:
        model = BDEmpleados
        fields = [
            'id', 'dni', 'escalafon',
            'first_name', 'last_name',
            'cargo', 'modulo',
            'empresa',  
            'is_active',
        ]

class DependencySerializer(serializers.ModelSerializer):
    class Meta:
        model = Dependencia
        fields = ['id', 'nombre', 'codigo', 'is_active', 'created_at', 'updated_at', 'created_by']
class DependencyCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Dependencia
        fields = ['nombre', 'codigo']
        extra_kwargs = {
            'nombre': {'validators': []},
            'codigo': {'validators': []},
        }
class DistritoSimpleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Distrito
        fields = ['id', 'nombre']
class PermissionSimpleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Permission
        fields = ['id', 'codename']
class SedeSimpleSerializer(serializers.ModelSerializer):
    distrito  = DistritoSimpleSerializer(read_only=True)
    class Meta:
        model = Sede
        fields = ['id', 'nombre','direccion','distrito']
class RoleSimpleSerializer(serializers.ModelSerializer):
    permissions   = PermissionSimpleSerializer(many=True,read_only=True)
    class Meta:
        model = Role
        fields = ['id', 'name','permissions']    
class CreatedBySerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'first_name', 'last_name']
class EmpresaSimpleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Empresa
        fields = ['id', 'nombre', 'nombre_corto']
class ModuloSimpleSerializer(serializers.ModelSerializer): 
    class Meta:
        model  = Modulo
        fields = ['id', 'nombre']
        
class UserListSerializer(serializers.ModelSerializer):
    role       = RoleSimpleSerializer(read_only=True)
    dependencia = serializers.CharField(source='dependencia.nombre', read_only=True)
    sedes       = SedeSimpleSerializer(many=True, read_only=True)
    empresa    = EmpresaSimpleSerializer(read_only=True) 
    modulo      = ModuloSimpleSerializer(read_only=True) 
    class Meta:
        model = User
        fields = [
            'id',
            'dni',
            'first_name',
            'last_name',
            'cargo',
            'modulo_rrhh',
            'modulo',     
            'dependencia',
            'sedes',
            'empresa',    
            'es_usuario_sistema',
            'role',
            'is_active',
        ]
class UserDetailSerializer(serializers.ModelSerializer):
    role        = RoleSimpleSerializer(read_only=True)
    dependencia = DependencySerializer(read_only=True)
    sedes       = SedeSimpleSerializer(many=True, read_only=True)
    created_by  = CreatedBySerializer(read_only=True)
    empresa     = EmpresaSimpleSerializer(read_only=True) 
    modulo      = ModuloSimpleSerializer(read_only=True)
    class Meta:
        model = User
        fields = [
            'id',
            'dni',
            'first_name',
            'last_name',
            'cargo',
            'modulo_rrhh',
            'modulo',   
            'dependencia',
            'sedes',
            'empresa',         
            'created_by',
            'es_usuario_sistema',
            'role',
            'is_active',
            'date_joined',
            'fecha_baja',
        ]
class UserCreateSerializer(serializers.ModelSerializer):
    sedes = serializers.PrimaryKeyRelatedField(many=True,queryset=Sede.objects.all(),required=False)
    modulo = serializers.PrimaryKeyRelatedField( queryset=Modulo.objects.filter(is_active=True),required=False,allow_null=True)
    class Meta:
        model = User
        fields = [
            'dni',
            'dependencia',
            'sedes',
            'modulo',   
            'es_usuario_sistema',
            'role',
        ]
class UserUpdateSerializer(serializers.ModelSerializer):
    sedes = serializers.PrimaryKeyRelatedField(many=True,queryset=Sede.objects.all(),required=False,)
    # empresa = serializers.PrimaryKeyRelatedField(queryset=Empresa.objects.filter(is_active=True),required=False,allow_null=True,)
    modulo = serializers.PrimaryKeyRelatedField(queryset=Modulo.objects.filter(is_active=True), required=False, allow_null=True,)
    class Meta:
        model = User
        fields = [
            'role',
            'sedes',
            'dependencia',
            'modulo',     
            'es_usuario_sistema',
        ]
        