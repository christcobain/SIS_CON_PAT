from typing import Optional, Type
from django.db.models import QuerySet
from .models import (
    CatTipoBien,CatTipoTarjetaVideo, CatMarca, CatRegimenTenencia, CatEstadoBien,
    CatEstadoFuncionamiento, CatMotivoBaja, CatMotivoTransferencia,
    CatMotivoCancelacion, CatTipoComputadora, CatTipoDisco,
    CatArquitecturaBits, CatTipoMonitor, CatTipoEscaner,
    CatInterfazConexion, CatTipoImpresion, CatTamanoCarro, CatalogoBase,
)

class CatalogoRepository:
    @staticmethod
    def get_all(model: Type[CatalogoBase]) -> QuerySet:
        return model.objects.all().order_by('id')
    @staticmethod
    def get_activos(model: Type[CatalogoBase]) -> QuerySet:
        return model.objects.order_by('id')
    @staticmethod
    def get_by_id(model: Type[CatalogoBase], pk: int) -> Optional[CatalogoBase]:
        return model.objects.filter(pk=pk).first()
    @staticmethod
    def get_by_nombre(model: Type[CatalogoBase], nombre: str) -> Optional[CatalogoBase]:
        return model.objects.filter(nombre__iexact=nombre.strip()).first()
    @staticmethod
    def create(model: Type[CatalogoBase], data: dict) -> CatalogoBase:
        return model.objects.create(
            nombre=data['nombre'].strip().upper(),
            descripcion=data.get('descripcion', ''),
        )
    @staticmethod
    def update(instance: CatalogoBase, data: dict) -> CatalogoBase:
        if 'nombre' in data:
            instance.nombre = data['nombre'].strip().upper()
        if 'descripcion' in data:
            instance.descripcion = data.get('descripcion', '')
        instance.save(update_fields=['nombre', 'descripcion'])
        return instance
    @staticmethod
    def activate(instance: CatalogoBase) -> None:
        instance.is_active = True
        instance.save(update_fields=['is_active'])
    @staticmethod
    def deactivate(instance: CatalogoBase) -> None:
        instance.is_active = False
        instance.save(update_fields=['is_active'])

class CatTipoBienRepository(CatalogoRepository):
    MODEL = CatTipoBien
class catTipoTarjetaVideoRepository(CatalogoRepository):
    MODEL = CatTipoTarjetaVideo
class CatMarcaRepository(CatalogoRepository):
    MODEL = CatMarca
class CatRegimenTenenciaRepository(CatalogoRepository):
    MODEL = CatRegimenTenencia
class CatEstadoBienRepository(CatalogoRepository):
    MODEL = CatEstadoBien
class CatEstadoFuncionamientoRepository(CatalogoRepository):
    MODEL = CatEstadoFuncionamiento
class CatMotivoBajaRepository(CatalogoRepository):
    MODEL = CatMotivoBaja
class CatMotivoTransferenciaRepository(CatalogoRepository):
    MODEL = CatMotivoTransferencia
class CatMotivoCancelacionRepository(CatalogoRepository):
    MODEL = CatMotivoCancelacion
class CatTipoComputadoraRepository(CatalogoRepository):
    MODEL = CatTipoComputadora
class CatTipoDiscoRepository(CatalogoRepository):
    MODEL = CatTipoDisco
class CatArquitecturaBitsRepository(CatalogoRepository):
    MODEL = CatArquitecturaBits
class CatTipoMonitorRepository(CatalogoRepository):
    MODEL = CatTipoMonitor
class CatTipoEscanerRepository(CatalogoRepository):
    MODEL = CatTipoEscaner
class CatInterfazConexionRepository(CatalogoRepository):
    MODEL = CatInterfazConexion
class CatTipoImpresionRepository(CatalogoRepository):
    MODEL = CatTipoImpresion
class CatTamanoCárroRepository(CatalogoRepository):
    MODEL = CatTamanoCarro