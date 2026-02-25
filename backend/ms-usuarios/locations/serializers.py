from rest_framework import serializers
from .models import Departamento, Provincia, Distrito,Sede,Modulo

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
    sede_nombre = serializers.CharField(source="sede.nombre", read_only=True)
    class Meta:
        model = Modulo
        fields = [
            "id",
            "sede",
            "sede_nombre",
            "nombre",
            "is_active",
            "created_at",
            "updated_at",
        ]
class SedeSerializer(serializers.ModelSerializer):
    distrito_nombre = serializers.CharField(source="distrito.nombre", read_only=True)
    provincia_nombre = serializers.CharField(source="distrito.provincia.nombre", read_only=True)
    departamento_nombre = serializers.CharField(source="distrito.provincia.departamento.nombre", read_only=True)
    modulos = ModuloSerializer(many=True, read_only=True)
    class Meta:
        model = Sede
        fields = [
            "id",
            "nombre",
            "codigo",
            "direccion",
            "distrito",
            "distrito_nombre",
            "provincia_nombre",
            "departamento_nombre",
            "is_active",
            "modulos",
            "created_at",
            "updated_at",
        ]
class SedeCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Sede
        fields = [
            "nombre",
            "codigo",
            "direccion",
            "distrito",
        ]
class ModuloCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Modulo
        fields = [
            "sede",
            "nombre",
        ]