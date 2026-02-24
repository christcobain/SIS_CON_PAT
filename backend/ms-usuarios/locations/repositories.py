from .models import Sede, Modulo, Area, Departamento, Provincia, Distrito,Empresa,Choices
from django.db.models import QuerySet
from django.db import transaction
from typing import Optional, Dict, Any

class DepartamentoRepository:
    @staticmethod
    def get_all()-> QuerySet:
        qs = Departamento.objects.order_by('id')
        return qs
    @staticmethod
    def get_by_id(departamento_id:int)->  Optional[Departamento]:
        return Departamento.objects.filter(pk=departamento_id).first()
    @staticmethod
    def get_by_name(nombre: str) -> Optional[Departamento]:
        return Departamento.objects.filter(nombre__iexact=nombre).first()
    @staticmethod
    @transaction.atomic
    def create(data: Dict[str, Any]) -> Optional[Departamento]:
        departamento = Departamento(**data)
        departamento.save()
        return departamento
    @staticmethod
    @transaction.atomic
    def update(departamento: Departamento, data: Dict[str, Any]) -> Departamento:
        for key, value in data.items():
            setattr(departamento, key, value)
        departamento.save()
        return departamento
    @staticmethod
    def activate(departamento: Departamento) -> Departamento:
        departamento.is_active = True
        departamento.save(update_fields=['is_active'])
        return departamento
    @staticmethod
    def deactivate(departamento: Departamento) -> Departamento:
        departamento.is_active = False
        departamento.save(update_fields=['is_active'])
        return departamento
    
class ProvinciaRepository:
    @staticmethod
    def get_all(is_active=None, search=None):
        qs = Provincia.objects.select_related('departamento').prefetch_related('distritos')
        if is_active is not None:
            qs = qs.filter(is_active=is_active)
        if search:
            qs = qs.filter(nombre__icontains=search)
        return qs
    @staticmethod
    def get_by_id(provincia_id:int)->  Optional[Provincia]:
        return Provincia.objects.filter(pk=provincia_id).first()
    @staticmethod
    def get_by_name(nombre: str) -> Optional[Provincia]:
        return Provincia.objects.filter(nombre__iexact=nombre).first()
    @staticmethod
    @transaction.atomic
    def create(data: Dict[str, Any]) -> Optional[Provincia]:
        provincia = Provincia(**data)
        provincia.save()
        return provincia
    @staticmethod
    @transaction.atomic
    def update(provincia: Provincia, data: Dict[str, Any]) -> Provincia:
        for key, value in data.items():
            setattr(provincia, key, value)
        provincia.save()
        return provincia
    @staticmethod
    def activate(provincia: Provincia) -> Provincia:
        provincia.is_active = True
        provincia.save(update_fields=['is_active'])
        return provincia
    @staticmethod
    def deactivate(provincia: Provincia) -> Provincia:
        provincia.is_active = False
        provincia.save(update_fields=['is_active'])
        return provincia

class DistritoRepository:
    @staticmethod
    def get_all(is_active=None, search=None):
        qs = Distrito.objects.select_related('provincia__departamento').prefetch_related('sedes')
        if is_active is not None:
            qs = qs.filter(is_active=is_active)
        if search:
            qs = qs.filter(nombre__icontains=search)
        return qs
    @staticmethod
    def get_by_id(distrito_id:int)->  Optional[Distrito]:
        return Distrito.objects.filter(pk=distrito_id).first()
    @staticmethod
    def get_by_name(nombre: str) -> Optional[Distrito]:
        return Distrito.objects.filter(nombre__iexact=nombre).first()
    @staticmethod
    @transaction.atomic
    def create(data: Dict[str, Any]) -> Optional[Distrito]:
        distrito = Distrito(**data)
        distrito.save()
        return distrito
    @staticmethod
    @transaction.atomic
    def update(distrito: Distrito, data: Dict[str, Any]) -> Distrito:
        for key, value in data.items():
            setattr(distrito, key, value)
        distrito.save()
        return distrito
    @staticmethod
    def activate(distrito: Distrito) -> Distrito:
        distrito.is_active = True
        distrito.save(update_fields=['is_active'])
        return distrito
    @staticmethod
    def deactivate(distrito: Distrito) -> Distrito:
        distrito.is_active = False
        distrito.save(update_fields=['is_active'])
        return distrito

class EmpresaRepository:
    @staticmethod
    def get_all(is_active=None, search=None):
        qs = Empresa.objects.prefetch_related( 'sedes')
        if is_active is not None:
            qs = qs.filter(is_active=is_active)
        if search:
            qs = qs.filter(nombre__icontains=search)
        return qs
    @staticmethod
    def get_by_id(distrito_id:int)->  Optional[Empresa]:
        return Empresa.objects.filter(pk=distrito_id).first()
    @staticmethod
    def get_by_name(nombre: str) -> Optional[Empresa]:
        return Empresa.objects.filter(nombre__iexact=nombre).first()
    @staticmethod
    @transaction.atomic
    def create(data: Dict[str, Any]) -> Optional[Empresa]:
        empresa = Empresa(**data)
        empresa.save()
        return empresa
    @staticmethod
    @transaction.atomic
    def update(empresa: Empresa, data: Dict[str, Any]) -> Empresa:
        for key, value in data.items():
            setattr(empresa, key, value)
        empresa.save()
        return empresa
    @staticmethod
    def activate(empresa: Empresa) -> Empresa:
        empresa.is_active = True
        empresa.save(update_fields=['is_active'])
        return empresa
    @staticmethod
    def deactivate(empresa: Empresa) -> Empresa:
        empresa.is_active = False
        empresa.save(update_fields=['is_active'])
        return empresa

class SedeRepository:
    @staticmethod
    def get_all(estado=None, search=None):
        qs = Sede.objects.select_related('distrito__provincia__departamento').prefetch_related('modulos')
        if estado is not None:
            qs = qs.filter(estado=estado)
        if search:
            qs = qs.filter(nombre__icontains=search)
        return qs
    @staticmethod
    def get_by_id(sede_id):
        return Sede.objects.select_related('distrito__provincia__departamento').get(pk=sede_id)
    @staticmethod
    def get_by_name(nombre: str) -> Optional[Sede]:
        return Sede.objects.filter(nombre__iexact=nombre).first()
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

class ChoicesRepository:
    @staticmethod
    def get_all()-> QuerySet:
        qs = Choices.objects.order_by('id')
        return qs
    @staticmethod
    def get_by_id(distrito_id:int)->  Optional[Choices]:
        return Choices.objects.filter(pk=distrito_id).first()
    @staticmethod
    def get_by_name(nombre: str) -> Optional[Choices]:
        return Choices.objects.filter(nombre__iexact=nombre).first()
    @staticmethod
    @transaction.atomic
    def create(data: Dict[str, Any]) -> Optional[Choices]:
        result = Choices(**data)
        result.save()
        return result
    @staticmethod
    @transaction.atomic
    def update(result: Choices, data: Dict[str, Any]) -> Choices:
        for key, value in data.items():
            setattr(result, key, value)
        result.save()
        return result
    @staticmethod
    def activate(result: Choices) -> Choices:
        result.is_active = True
        result.save(update_fields=['is_active'])
        return result
    @staticmethod
    def deactivate(result: Choices) -> Choices:
        result.is_active = False
        result.save(update_fields=['is_active'])
        return result
    
class ModuloRepository:
    @staticmethod
    def get_all(is_active=None, search=None):
        qs = Modulo.objects.select_related(
            'sede__distrito__provincia__departamento', 'codigo' 
        ).prefetch_related(
            'areas'  
        )
        if is_active is not None:
            qs = qs.filter(is_active=is_active)
        if search:
            qs = qs.filter(nombre__icontains=search)
        return qs
    @staticmethod
    def get_by_id(sede_id):
        return Modulo.objects.select_related('sede__distrito__provincia__departamento').get(pk=sede_id)
    @staticmethod
    def get_by_name(nombre: str) -> Optional[Modulo]:
        return Modulo.objects.filter(nombre__iexact=nombre).first()
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

class AreaRepository:
    @staticmethod
    def get_all(is_active=None, search=None):
        qs = Area.objects.select_related(
            'modulo__sede__distrito__provincia__departamento', 
            'modulo__codigo'
        )
        if is_active is not None:
            qs = qs.filter(is_active=is_active)
        if search:
            qs = qs.filter(nombre__icontains=search)
        return qs
    @staticmethod
    def get_by_id(sede_id):
        return Area.objects.select_related('dulo__sede__distrito__provincia__departamento').get(pk=sede_id)
    @staticmethod
    def get_by_name(nombre: str) -> Optional[Area]:
        return Area.objects.filter(nombre__iexact=nombre).first()
    @staticmethod
    @transaction.atomic
    def create(data: Dict[str, Any]) -> Optional[Area]:
        result = Area(**data)
        result.save()
        return result
    @staticmethod
    @transaction.atomic
    def update(result: Area, data: Dict[str, Any]) -> Area:
        for key, value in data.items():
            setattr(result, key, value)
        result.save()
        return result
    @staticmethod
    def activate(result: Area) -> Area:
        result.is_active = True
        result.save(update_fields=['is_active'])
        return result
    @staticmethod
    def deactivate(result: Area) -> Area:
        result.is_active = False
        result.save(update_fields=['is_active'])
        return result
