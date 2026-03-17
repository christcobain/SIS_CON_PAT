from rest_framework import serializers
from .models import (CatCategoriaBien,  CatTipoBien,CatTipoTarjetaVideo, CatMarca, CatRegimenTenencia, CatEstadoBien,
    CatEstadoFuncionamiento, CatMotivoBaja, CatMotivoTransferencia,CatMotivoMantenimiento,
    CatMotivoCancelacion, CatTipoComputadora, CatTipoDisco,
    CatArquitecturaBits, CatTipoMonitor, CatTipoEscaner,
    CatInterfazConexion, CatTipoImpresion, CatTamanoCarro,
)


class CatalogoBaseSerializer(serializers.ModelSerializer):
    """Serializador de lectura genérico para todos los catálogos."""
    class Meta:
        fields = ['id', 'nombre', 'descripcion', 'is_active']
class CatCategoriaBienSerializer(serializers.ModelSerializer):
    class Meta:
        model  = CatCategoriaBien
        fields = ['id', 'nombre', 'descripcion', 'is_active']
class CatalogoWriteSerializer(serializers.Serializer):
    """Serializador de escritura genérico para crear / actualizar catálogos."""
    nombre      = serializers.CharField(max_length=100)
    descripcion = serializers.CharField(required=False, allow_blank=True, default='')

    def validate_nombre(self, value):
        return value.strip().upper()


class CatTipoBienSerializer(CatalogoBaseSerializer):
    class Meta(CatalogoBaseSerializer.Meta):
        model = CatTipoBien
class catTipoTarjetaVideoSerializer(CatalogoBaseSerializer):
    class Meta(CatalogoBaseSerializer.Meta):
        model = CatTipoTarjetaVideo
class CatMarcaSerializer(CatalogoBaseSerializer):
    class Meta(CatalogoBaseSerializer.Meta):
        model = CatMarca

class CatRegimenTenenciaSerializer(CatalogoBaseSerializer):
    class Meta(CatalogoBaseSerializer.Meta):
        model = CatRegimenTenencia

class CatEstadoBienSerializer(CatalogoBaseSerializer):
    class Meta(CatalogoBaseSerializer.Meta):
        model = CatEstadoBien

class CatEstadoFuncionamientoSerializer(CatalogoBaseSerializer):
    class Meta(CatalogoBaseSerializer.Meta):
        model = CatEstadoFuncionamiento

class CatMotivoBajaSerializer(CatalogoBaseSerializer):
    class Meta(CatalogoBaseSerializer.Meta):
        model = CatMotivoBaja
class CatMotivoTransferenciaSerializer(CatalogoBaseSerializer):
    class Meta(CatalogoBaseSerializer.Meta):
        model = CatMotivoTransferencia
class CatMotivoMantenimientoSerializer(CatalogoBaseSerializer):
    class Meta(CatalogoBaseSerializer.Meta):
        model = CatMotivoMantenimiento

class CatMotivoCancelacionSerializer(CatalogoBaseSerializer):
    class Meta(CatalogoBaseSerializer.Meta):
        model = CatMotivoCancelacion

class CatTipoComputadoraSerializer(CatalogoBaseSerializer):
    class Meta(CatalogoBaseSerializer.Meta):
        model = CatTipoComputadora

class CatTipoDiscoSerializer(CatalogoBaseSerializer):
    class Meta(CatalogoBaseSerializer.Meta):
        model = CatTipoDisco

class CatArquitecturaBitsSerializer(CatalogoBaseSerializer):
    class Meta(CatalogoBaseSerializer.Meta):
        model = CatArquitecturaBits

class CatTipoMonitorSerializer(CatalogoBaseSerializer):
    class Meta(CatalogoBaseSerializer.Meta):
        model = CatTipoMonitor

class CatTipoEscanerSerializer(CatalogoBaseSerializer):
    class Meta(CatalogoBaseSerializer.Meta):
        model = CatTipoEscaner

class CatInterfazConexionSerializer(CatalogoBaseSerializer):
    class Meta(CatalogoBaseSerializer.Meta):
        model = CatInterfazConexion

class CatTipoImpresionSerializer(CatalogoBaseSerializer):
    class Meta(CatalogoBaseSerializer.Meta):
        model = CatTipoImpresion

class CatTamanoCárroSerializer(CatalogoBaseSerializer):
    class Meta(CatalogoBaseSerializer.Meta):
        model = CatTamanoCarro