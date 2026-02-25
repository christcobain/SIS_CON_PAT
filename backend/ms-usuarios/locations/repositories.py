from .models import Sede, Modulo,  Departamento, Provincia, Distrito,TipoUbicacion,Ubicacion
from django.db.models import QuerySet
from django.db import transaction
from typing import Optional, Dict, Any

class DepartamentoRepository:
    @staticmethod
    def base_queryset() -> QuerySet:
        return (Departamento.objects.select_related('created_by').prefetch_related(
                'provincias',
                'provincias__distritos',
                'provincias__distritos__sedes')
        )
    @staticmethod
    def get_all():
        return DepartamentoRepository.base_queryset().all()
    @staticmethod
    def get_by_id(pk: int):
        return (DepartamentoRepository.base_queryset().filter(pk=pk).first())
    
class ProvinciaRepository:
    @staticmethod
    def base_queryset() -> QuerySet:
        return (Provincia.objects.select_related('departamento', 'created_by')
            .prefetch_related('distritos','distritos__sedes'))
    @staticmethod
    def get_all():
        return ProvinciaRepository.base_queryset().all()
    @staticmethod
    def get_by_id(pk: int):
        return (ProvinciaRepository.base_queryset().filter(pk=pk).first())    

class DistritoRepository:
    @staticmethod
    def base_queryset() -> QuerySet:
        return ( Distrito.objects.select_related('provincia','provincia__departamento','created_by')
            .prefetch_related('sedes'))
    @staticmethod
    def get_all():
        return DistritoRepository.base_queryset().all()
    @staticmethod
    def get_by_id(id: int):
        return (DistritoRepository.base_queryset().filter(pk=id).first())

class SedeRepository:
    @staticmethod
    def base_queryset() -> QuerySet:
        return (Sede.objects.select_related('distrito','distrito__provincia','distrito__provincia__departamento','created_by')
            .prefetch_related('modulos'))
    @staticmethod
    def get_all():
        return SedeRepository.base_queryset().all()
    @staticmethod
    def get_by_id(id: int):
        return (SedeRepository.base_queryset().filter(pk=id).first())    
    @staticmethod
    def get_by_name(nombre: str) :
        return SedeRepository.base_queryset().filter(nombre__iexact=nombre).first()
    @staticmethod
    @transaction.atomic
    def create(data: Dict[str, Any]) -> Optional[Sede]:
        sede = Sede(**data)
        sede.save()
        return sede
    @staticmethod
    @transaction.atomic
    def update(sede: Sede, data: Dict[str, Any]) -> Sede:
        for key, value in data.items():
            setattr(sede, key, value)
        sede.save()
        return sede
    @staticmethod
    def activate(sede: Sede) -> Sede:
        sede.is_active = True
        sede.save(update_fields=['is_active'])
        return sede
    @staticmethod
    def deactivate(sede: Sede) -> Sede:
        sede.is_active = False
        sede.save(update_fields=['is_active'])
        return sede

class ModuloRepository:
    @staticmethod
    def base_queryset() -> QuerySet:
        return (Modulo.objects.select_related('sede','sede__distrito','sede__distrito__provincia',
                'sede__distrito__provincia__departamento','created_by').prefetch_related('ubicaciones'))
    @staticmethod
    def get_all():
        return ModuloRepository.base_queryset().all()
    @staticmethod
    def get_by_id(pk: int):
        return (ModuloRepository.base_queryset().filter(pk=pk).first())    
    @staticmethod
    def get_by_name(nombre: str):
        return ModuloRepository.base_queryset().filter(nombre__iexact=nombre).first()
    @staticmethod
    @transaction.atomic
    def create(data: Dict[str, Any]) -> Optional[Modulo]:
        result = Modulo(**data)
        result.save()
        return result
    @staticmethod
    @transaction.atomic
    def update(result: Modulo, data: Dict[str, Any]) -> Modulo:
        for key, value in data.items():
            setattr(result, key, value)
        result.save()
        return result
    @staticmethod
    def activate(result: Modulo) -> Modulo:
        result.is_active = True
        result.save(update_fields=['is_active'])
        return result
    @staticmethod
    def deactivate(result: Modulo) -> Modulo:
        result.is_active = False
        result.save(update_fields=['is_active'])
        return result

class TipoUbicacionRepository:
    @staticmethod
    def base_queryset() -> QuerySet:
        return (TipoUbicacion.objects.select_related('created_by').prefetch_related('ubicaciones'))
    @staticmethod
    def get_all():
        return TipoUbicacionRepository.base_queryset().all()
    @staticmethod
    def get_by_id(pk: int):
        return (TipoUbicacionRepository.base_queryset().filter(pk=pk).first())
    @staticmethod
    def get_by_name(nombre: str):
        return TipoUbicacionRepository.base_queryset().filter(nombre__iexact=nombre).first()
    @staticmethod
    @transaction.atomic
    def create(data: Dict[str, Any]) -> Optional[TipoUbicacion]:
        result = TipoUbicacion(**data)
        result.save()
        return result
    @staticmethod
    @transaction.atomic
    def update(result: TipoUbicacion, data: Dict[str, Any]) -> TipoUbicacion:
        for key, value in data.items():
            setattr(result, key, value)
        result.save()
        return result
    @staticmethod
    def activate(result: TipoUbicacion) -> TipoUbicacion:
        result.is_active = True
        result.save(update_fields=['is_active'])
        return result
    @staticmethod
    def deactivate(result: TipoUbicacion) -> TipoUbicacion:
        result.is_active = False
        result.save(update_fields=['is_active'])
        return result
 
class UbicacionRepository:
    @staticmethod
    def base_queryset() -> QuerySet:
        return (
            Ubicacion.objects
            .select_related(
                'modulo',
                'modulo__sede',
                'modulo__sede__distrito',
                'modulo__sede__distrito__provincia',
                'modulo__sede__distrito__provincia__departamento',
                'tipoubicacion',
                'created_by'
            )
        )
    @staticmethod
    def get_all():
        return UbicacionRepository.base_queryset().all()
    @staticmethod
    def get_by_id(pk: int):
        return (UbicacionRepository.base_queryset().filter(pk=pk).first())
    @staticmethod
    def get_by_name(nombre: str):
        return UbicacionRepository.base_queryset().filter(nombre__iexact=nombre).first()
    @staticmethod
    @transaction.atomic
    def create(data: Dict[str, Any]) -> Optional[Ubicacion]:
        result = Ubicacion(**data)
        result.save()
        return result
    @staticmethod
    @transaction.atomic
    def update(result: Ubicacion, data: Dict[str, Any]) -> Ubicacion:
        for key, value in data.items():
            setattr(result, key, value)
        result.save()
        return result
    @staticmethod
    def activate(result: Ubicacion) -> Ubicacion:
        result.is_active = True
        result.save(update_fields=['is_active'])
        return result
    @staticmethod
    def deactivate(result: Ubicacion) -> Ubicacion:
        result.is_active = False
        result.save(update_fields=['is_active'])
        return result
    