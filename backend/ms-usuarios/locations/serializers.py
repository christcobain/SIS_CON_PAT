from rest_framework import serializers
from .models import Empresa,Departamento, Provincia, Distrito,Sede,Modulo,Ubicacion

class EmpresaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Empresa
        fields = [
            'id',
            'nombre',
            'nombre_corto',
            'descripcion',
            'ruc',
            'is_active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
class EmpresaCreateSerializer(serializers.ModelSerializer):
    nombre       = serializers.CharField(max_length=200)
    nombre_corto = serializers.CharField(max_length=20)
    descripcion  = serializers.CharField(required=False, allow_blank=True, default='')
    ruc          = serializers.CharField(
        max_length=11,
        required=False,
        allow_blank=True,
        default=''
    )
    class Meta:
        model = Empresa
        fields = ['nombre', 'nombre_corto', 'descripcion', 'ruc']

    def validate_nombre_corto(self, value: str) -> str:
        return value.strip().upper()

    def validate_ruc(self, value: str) -> str:
        if value and not value.isdigit():
            raise serializers.ValidationError('El RUC debe contener solo dígitos.')
        return value
class EmpresaUpdateSerializer(serializers.ModelSerializer):
    nombre       = serializers.CharField(max_length=200, required=False)
    nombre_corto = serializers.CharField(max_length=20, required=False)
    descripcion  = serializers.CharField(required=False, allow_blank=True)
    ruc          = serializers.CharField(
        max_length=11,
        required=False,
        allow_blank=True
    )
    class Meta:
        model = Empresa
        fields = ['nombre', 'nombre_corto', 'descripcion', 'ruc']
    def validate_nombre_corto(self, value: str) -> str:
        return value.strip().upper()
    def validate_ruc(self, value: str) -> str:
        if value and not value.isdigit():
            raise serializers.ValidationError('El RUC debe contener solo dígitos.')
        return value


class DistritoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Distrito
        fields = [
            "id",
            "nombre",
            "codigo",
        ]
class ProvinciaSerializer(serializers.ModelSerializer):
    distritos = DistritoSerializer(many=True, read_only=True)
    class Meta:
        model = Provincia
        fields = [
            "id",
            "nombre",
            "codigo",
            "departamento",
            "distritos",
        ]
class DepartamentoSerializer(serializers.ModelSerializer):
    provincias = ProvinciaSerializer(many=True, read_only=True)
    class Meta:
        model = Departamento
        fields = [
            "id",
            "nombre",
            "codigo",
            "provincias",
        ]
class ModuloSerializer(serializers.ModelSerializer):
    class Meta:
        model = Modulo
        fields = [
            "id",
            "nombre",
            "is_active",
            "created_at",
            "updated_at",
        ]
class ModuloCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Modulo
        fields = [
            "nombre",
        ]
class UbicacionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ubicacion
        fields = [
            "id",
            "nombre",
            "descripcion",
            "is_active",
            "created_at",
            "updated_at",
        ]
class UbicacionCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ubicacion
        fields = [
            "nombre",
            "descripcion",
        ]
        validators = []
class SedeSerializer(serializers.ModelSerializer):
    distrito_nombre = serializers.CharField(source="distrito.nombre", read_only=True)
    provincia_nombre = serializers.CharField(source="distrito.provincia.nombre", read_only=True)
    departamento_nombre = serializers.CharField(source="distrito.provincia.departamento.nombre", read_only=True)
    empresa_nombre=serializers.CharField(source="empresa.nombre", read_only=True)
    ubicaciones = UbicacionSerializer(many=True, read_only=True)
    class Meta:
        model = Sede
        fields = [
            "id",
            "nombre",
            "direccion",
            "distrito",
            "distrito_nombre",
            "provincia_nombre",
            "departamento_nombre",
            "empresa_nombre",
            "is_active",
            "created_by",
            "created_at",
            "updated_at",
            "ubicaciones",
        ]        
class SedeCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Sede
        fields = [
            "nombre",
            "direccion",
            "distrito",
        ]       
        
        
        
        
        
        