from django.db import transaction
from django.db.models import Q, QuerySet
from typing import Optional, Dict, Any
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
        return User.objects.select_related(
            'role',
            'dependencia',
            'created_by'
        ).prefetch_related('sedes')
    @staticmethod
    def apply_filters(qs: QuerySet, filters: Dict[str, Any]) -> QuerySet:
        if not filters:
            return qs
        for field, value in filters.items():
            if value in [None, ""]:
                continue
            if field in ["es_usuario_sistema", "is_active"]:
                qs = qs.filter(**{field: value})
            elif field in ["role", "dependencia"]:
                qs = qs.filter(**{f"{field}__id": value})
            elif field == "sedes":
                if isinstance(value, list):
                    qs = qs.filter(sedes__id__in=value)
                else:
                    qs = qs.filter(sedes__id=value)
            elif field in ["cargo", "first_name", "last_name"]:
                qs = qs.filter(**{f"{field}__icontains": value})
            elif field == "search":
                qs = qs.filter(
                    Q(first_name__icontains=value) |
                    Q(last_name__icontains=value) |
                    Q(dni__icontains=value) |
                    Q(username__icontains=value) |
                    Q(institucional_email__icontains=value)
                )
            elif field == "created_between":
                start, end = value
                qs = qs.filter(date_joined__date__range=[start, end])
            elif field == "created_date":
                qs = qs.filter(date_joined__date=value)
            elif field == "created_year":
                qs = qs.filter(date_joined__year=value)
            elif field == "fecha_baja_between":
                start, end = value
                qs = qs.filter(fecha_baja__range=[start, end])
        return qs.distinct()
    @staticmethod
    def get_all() -> QuerySet:
        return User.objects.order_by('first_name', 'last_name')
    @staticmethod
    def get_by_id(user_id: int) -> Optional[User]:
        return User.objects.filter(pk=user_id).first()
    @staticmethod
    def get_by_dni(dni: str) -> Optional[User]:
        return User.objects.filter(dni=dni).first()
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
