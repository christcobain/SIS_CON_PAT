from typing import Dict, Any, Type
from django.db import transaction
from rest_framework.exceptions import ValidationError, NotFound
from .repositories import CatalogoRepository
from .models import CatalogoBase


class CatalogoService:
    @staticmethod
    def listar(model: Type[CatalogoBase], solo_activos: bool = True) -> Dict[str, Any]:
        qs = (
            CatalogoRepository.get_activos(model)
            if solo_activos
            else CatalogoRepository.get_all(model)
        )
        if not qs:
            raise NotFound(f'Lista vacía.')
        return {"success": True, "data": qs}
    @staticmethod
    def obtener_por_id(model: Type[CatalogoBase], pk: int) -> Dict[str, Any]:
        instance = CatalogoRepository.get_by_id(model, pk)
        if not instance:
            raise NotFound(f'{model.__name__} con id={pk} no encontrado.')
        return {"success": True, "data": instance}
    @staticmethod
    @transaction.atomic
    def crear(model: Type[CatalogoBase], data: dict) -> Dict[str, Any]:
        nombre = data.get('nombre', '').strip().upper()
        if not nombre:
            raise ValidationError('El campo nombre es requerido.')
        existente = CatalogoRepository.get_by_nombre(model, nombre)
        if existente:
            estado = 'Activo' if existente.is_active else 'Inactivo'
            raise ValidationError(
                f'Ya existe un registro {estado} con el nombre "{nombre}".'
            )
        instance = CatalogoRepository.create(model, {**data, 'nombre': nombre})
        return {"success": True, "message": "Registro creado exitosamente.", "data": instance}
    @staticmethod
    @transaction.atomic
    def actualizar(model: Type[CatalogoBase], pk: int, data: dict) -> Dict[str, Any]:
        instance = CatalogoRepository.get_by_id(model, pk)
        if not instance:
            raise NotFound(f'{model.__name__} con id={pk} no encontrado.')

        nuevo_nombre = data.get('nombre', '').strip().upper()
        if nuevo_nombre and nuevo_nombre != instance.nombre:
            existente = CatalogoRepository.get_by_nombre(model, nuevo_nombre)
            if existente and existente.pk != pk:
                raise ValidationError(
                    f'Ya existe otro registro con el nombre "{nuevo_nombre}".'
                )
        updated = CatalogoRepository.update(instance, {**data, 'nombre': nuevo_nombre or instance.nombre})
        return {"success": True, "message": "Registro actualizado exitosamente.", "data": updated}
    @staticmethod
    def activar(model: Type[CatalogoBase], pk: int) -> Dict[str, Any]:
        instance = CatalogoRepository.get_by_id(model, pk)
        if not instance:
            raise NotFound(f'{model.__name__} con id={pk} no encontrado.')
        if instance.is_active:
            raise ValidationError('El registro ya se encuentra activo.')
        CatalogoRepository.activate(instance)
        return {"success": True, "message": "Registro activado exitosamente."}
    @staticmethod
    def desactivar(model: Type[CatalogoBase], pk: int) -> Dict[str, Any]:
        instance = CatalogoRepository.get_by_id(model, pk)
        if not instance:
            raise NotFound(f'{model.__name__} con id={pk} no encontrado.')
        if not instance.is_active:
            raise ValidationError('El registro ya se encuentra inactivo.')
        CatalogoRepository.deactivate(instance)
        return {"success": True, "message": "Registro desactivado exitosamente."}