from rest_framework import serializers
from .models import User,Dependencia,BDEmpleados

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

class UserSerializer(serializers.ModelSerializer):
    sedes = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=User.sedes.rel.model.objects.all(),
        required=False
    )
    class Meta:
        model = User
        fields = [
            "id",
            "dni",    
            "email",
            "role",
            "sedes",
            "dependencia",
            "es_usuario_sistema",
            'is_superuser',
            "is_active",
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

class UserListSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id",
            'dni',
            "first_name",
            "last_name",
            'dependencia',
            "role",
            "es_usuario_sistema",
            "is_active"
        ]

class UserDetailSerializer(serializers.ModelSerializer):
    role = serializers.StringRelatedField()
    dependencia = serializers.StringRelatedField()
    sedes = serializers.StringRelatedField(many=True)
    class Meta:
        model = User
        exclude = ["password"]
