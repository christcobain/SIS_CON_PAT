from rest_framework import serializers
from .models import Sede, Modulo, Area, Departamento, Provincia, Distrito, Empresa


class DistritoSerializer(serializers.ModelSerializer):
    created_by_detail = serializers.SerializerMethodField()    
    class Meta:
        model = Distrito
        fields = ['id', 'nombre', 'codigo', 'is_active', 'created_by', 'created_by_detail', 'created_at', 'updated_at']    

class ProvinciaSerializer(serializers.ModelSerializer):
    """Serializer para Provincia con auditoría."""
    distritos = DistritoSerializer(many=True, read_only=True)
    created_by_detail = serializers.SerializerMethodField()
    class Meta:
        model = Provincia
        fields = ['id', 'nombre', 'codigo', 'distritos', 'is_active', 'created_by', 'created_by_detail', 'created_at', 'updated_at']    
        
class DepartamentoSerializer(serializers.ModelSerializer):
    """Serializer para Departamento con auditoría."""
    provincias = ProvinciaSerializer(many=True, read_only=True)
    created_by_detail = serializers.SerializerMethodField()
    class Meta:
        model = Departamento
        fields = ['id', 'nombre', 'codigo', 'provincias', 'is_active', 'created_by', 'created_by_detail', 'created_at', 'updated_at']    

class EmpresaSerializer(serializers.ModelSerializer):
    created_by_detail = serializers.SerializerMethodField()    
    class Meta:
        model = Empresa
        fields = ['id', 'nombre', 'codigo', 'descripcion', 'is_active', 'created_by', 'created_by_detail', 'created_at', 'updated_at']    
   
class AreaSerializer(serializers.ModelSerializer):
    created_by_detail = serializers.SerializerMethodField()    
    class Meta:
        model = Area
        fields = ['id', 'nombre', 'tipo_area', 'is_active', 'created_by', 'created_by_detail', 'created_at', 'updated_at']    

class ModuloSerializer(serializers.ModelSerializer):
    areas = AreaSerializer(many=True, read_only=True)
    created_by_detail = serializers.SerializerMethodField()
    class Meta:
        model = Modulo
        fields = ['id', 'sede', 'codigo', 'nombre', 'is_active', 'areas', 'created_by', 'created_by_detail', 'created_at', 'updated_at']    

class SedeSerializer(serializers.ModelSerializer):
    modulos = ModuloSerializer(many=True, read_only=True)
    distrito_detail = DistritoSerializer(source='distrito', read_only=True)
    empresa_detail = EmpresaSerializer(source='empresa', read_only=True)
    created_by_detail = serializers.SerializerMethodField()
    ubicacion = serializers.SerializerMethodField()
    class Meta:
        model = Sede
        fields = [
            'id', 'nombre', 'codigo', 'direccion', 'distrito', 'distrito_detail',
            'empresa', 'empresa_detail', 'ubicacion', 'is_active', 'modulos',
            'created_by', 'created_by_detail', 'created_at', 'updated_at'
        ]
    

class SedeListSerializer(serializers.ModelSerializer):
    ubicacion = serializers.SerializerMethodField()
    modulos_count = serializers.SerializerMethodField()
    empresa_detail = EmpresaSerializer(source='empresa', read_only=True)
    created_by_detail = serializers.SerializerMethodField()
    class Meta:
        model = Sede
        fields = [
            'id', 'nombre', 'codigo', 'direccion', 'ubicacion', 'empresa', 'empresa_detail',
            'is_active', 'modulos_count', 'created_by', 'created_by_detail', 'created_at'
        ]