from rest_framework import serializers
from .models import Departamento, Provincia, Distrito,Sede,Modulo,Ubicacion

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
            "direccion",
            "distrito",
            "distrito_nombre",
            "provincia_nombre",
            "departamento_nombre",
            "is_active",
            'created_by',
            'created_at',
            'updated_at',
            "modulos",
        ]
class SedeCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Sede
        fields = [
            "nombre",
            "direccion",
            "distrito",
        ]
        validators = [] 
class ModuloCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Modulo
        fields = [
            "sede",
            "nombre",
        ]
        validators = [] 
        
class UbicacionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ubicacion
        fields = [
            "id",
            "modulo",
            "nombre",
            "is_active",
        ]
        validators = []
class UbicacionCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ubicacion
        fields = [
            "modulo",
            "nombre",
        ]
        validators = []