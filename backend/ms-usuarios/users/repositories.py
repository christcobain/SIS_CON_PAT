from django.db import transaction
from django.db.models import Q, QuerySet
from typing import Optional, Dict, Any,List
from datetime import date
from .models import User,Dependencia,BDEmpleados

class BDEmpleadosRepository:
    @staticmethod
    def get_by_dni(dni: str) -> Optional[BDEmpleados]:
        return BDEmpleados.objects.filter(dni=dni).first()
    
class DependenciaRepository:
    @staticmethod
    def get_all() -> QuerySet:#queryset se usa para muchos o ningun registro
        return Dependencia.objects.order_by('id')
    @staticmethod
    def get_dependency_by_name(nombre: str) -> Optional[Dependencia]:#un solo obteno o ninguno
        return Dependencia.objects.filter(nombre__iexact=nombre).first()
    @staticmethod
    def get_by_id(dependencia_id: int) ->  Optional[Dependencia]:
        return Dependencia.objects.filter(pk=dependencia_id).first()
    @staticmethod
    def get_by_codigo(codigo: str) -> Optional[Dependencia]:
        return Dependencia.objects.filter(codigo=codigo).first()
    @staticmethod
    @transaction.atomic
    def create(data: Dict[str, Any]) -> Optional[Dependencia]:#si o si un objeto
        dependencia = Dependencia(**data)
        dependencia.save()
        return dependencia
    @staticmethod
    @transaction.atomic
    def update(dependencia: Dependencia, data: Dict[str, Any]) -> Dependencia:
        for key, value in data.items():
            setattr(dependencia, key, value)
        dependencia.save()
        return dependencia
    @staticmethod
    def activate(dependencia: Dependencia) -> Dependencia:
        dependencia.is_active = True
        dependencia.save(update_fields=['is_active'])
        return dependencia
    @staticmethod
    def deactivate(dependencia: Dependencia) -> Dependencia:
        dependencia.is_active = False
        dependencia.save(update_fields=['is_active'])
        return dependencia
    
class UserRepository:
    @staticmethod
    def base_queryset() -> QuerySet:
        return User.objects.select_related('role','dependencia', 'created_by').prefetch_related('sedes')
    @staticmethod
    def get_all():
        return UserRepository.base_queryset().all()
    @staticmethod
    def get_by_id(user_id: int) -> Optional[User]:
        return (UserRepository.base_queryset().filter(pk=user_id).first())
    @staticmethod
    def filter_users(
        dni: Optional[str] = None,
        cargo: Optional[str] = None,
        role_id: Optional[int] = None,
        sede_ids: Optional[List[int]] = None,
        dependencia_id: Optional[int] = None,
        es_usuario_sistema: Optional[bool] = None,
        fecha_desde: Optional[date] = None,
        fecha_hasta: Optional[date] = None,
        search: Optional[str] = None,
    ) -> QuerySet:
        filters = Q()
        if dni:
            filters &= Q(dni__icontains=dni)
        if cargo:
            filters &= Q(cargo__icontains=cargo)
        if role_id:
            filters &= Q(role_id=role_id)
        if sede_ids:
            filters &= Q(sedes__id__in=sede_ids)
        if dependencia_id:
            filters &= Q(dependencia_id=dependencia_id)
        if es_usuario_sistema is not None:
            filters &= Q(es_usuario_sistema=es_usuario_sistema)
        if fecha_desde:
            filters &= Q(date_joined__date__gte=fecha_desde)
        if fecha_hasta:
            filters &= Q(date_joined__date__lte=fecha_hasta)
        if search:
            filters &= (
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search) |
                Q(dni__icontains=search)
            )           
        return UserRepository.base_queryset().filter(filters).distinct()       
    @staticmethod
    @transaction.atomic
    def create(data: Dict[str, Any], sede_ids=None) -> User:
        password = data.pop('password', None)
        user = User(**data)
        if password:
            user.set_password(password)
        user.save()
        if sede_ids:
            user.sedes.set(sede_ids)
        return user
    @staticmethod
    @transaction.atomic
    def update(user: User, data: Dict[str, Any], sede_ids=None) -> User:
        password = data.pop('password', None)
        for key, value in data.items():
            setattr(user, key, value)
        if password:
            user.set_password(password)
        user.save()
        if sede_ids is not None:
            user.sedes.set(sede_ids)
        return user
    @staticmethod
    def activate(user: User) -> User:
        user.is_active = True
        user.save(update_fields=['is_active'])
        return user
    @staticmethod
    def deactivate(user: User) -> User:
        user.is_active = False
        user.save(update_fields=['is_active'])
        return user
