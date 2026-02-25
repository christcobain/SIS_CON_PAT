from rest_framework import serializers
from .models import User,Dependencia,BDEmpleados
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Dependencia
from locations.models import Sede
from roles.models import Role  
User = get_user_model()

class BDEmpleadosSerializer(serializers.ModelSerializer):
    class Meta:
        model = BDEmpleados
        fields = ['id', 'dni', 'escalafon', 
                  'first_name', 'last_name', 'cargo', 'modulo', 'is_active']

class DependencySerializer(serializers.ModelSerializer):
    class Meta:
        model = Dependencia
        fields = ['id', 'nombre','codigo','is_active','created_at','updated_at','created_by']
class DependencyCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Dependencia
        fields = ['nombre', 'codigo','created_by']
        extra_kwargs = {
            'nombre': {'validators': []},
            'codigo': {'validators': []},
        }
class SedeSimpleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Sede
        fields = [
            "id",
            "nombre",
            "codigo"
        ]
class RoleSimpleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = [
            "id",
            "name"
        ]
class CreatedBySerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "first_name", "last_name"]
class UserListSerializer(serializers.ModelSerializer):
    role = serializers.CharField(source="role.nombre", read_only=True)
    dependencia = serializers.CharField(source="dependencia.nombre", read_only=True)
    class Meta:
        model = User
        fields = [
            "id",
            "dni",
            "first_name",
            "last_name",  
            "cargo",          
            "dependencia",
            "empresa",
            "es_usuario_sistema",
            "role",
            "is_active"
        ]

class UserDetailSerializer(serializers.ModelSerializer):
    role = RoleSimpleSerializer(read_only=True)
    dependencia = DependencySerializer(read_only=True)
    sedes = SedeSimpleSerializer(many=True, read_only=True)
    created_by = CreatedBySerializer(read_only=True)
    class Meta:
        model = User
        fields = [
            "id",
            "dni",
            "first_name",
            "last_name",
            "cargo",            
            "dependencia",
            "sedes",
            "empresa",
            "created_by",
            "es_usuario_sistema",
            "role",
            "is_active",
            "date_joined",
            "fecha_baja"
        ]        
class UserCreateSerializer(serializers.ModelSerializer):
    sedes = serializers.PrimaryKeyRelatedField(many=True,queryset=Sede.objects.all(),
        required=False)
    class Meta:
        model = User
        fields = [
            "dni",            
            "dependencia",
            "sedes",
            "es_usuario_sistema",
            "role",
            "is_active"
        ]    
class UserUpdateSerializer(serializers.ModelSerializer):
    sedes = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=User.sedes.rel.model.objects.all(),
        required=False
    )
    class Meta:
        model = User
        fields = [            
            "cargo",
            "role",
            "sedes",
            "dependencia",
            "es_usuario_sistema",
        ]
