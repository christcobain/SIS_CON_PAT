import logging
from django.db import transaction
from rest_framework.exceptions import ValidationError, NotFound
from .repositories import PermissionRepository, RoleRepository, RolePermissionRepository
from typing import  Dict, Any    

_log = logging.getLogger('apps.roles')

class PermissionService:
    @staticmethod
    def listar(active_only=True, ms_name=None, app_label=None):
        return PermissionRepository.get_all(active_only=active_only, ms_name=ms_name, app_label=app_label)
    @staticmethod
    def tree() -> list:
        return PermissionRepository.tree_for_frontend()
    @staticmethod
    def microservices() -> list:
        return PermissionRepository.known_microservices()

class RoleService:
    @staticmethod
    def listar( ):
        result= RoleRepository.get_all().order_by("id")
        if not result:
                raise ValidationError(f'No hay Roles registradas.')   
        return {
            "success": True,
            "data": result
        }
    @staticmethod
    def obtener(pk: int):
        role = RoleRepository.get_by_id(pk)
        if not role:
            raise NotFound(f'Rol {pk} no encontrado.')
        return role
    @staticmethod
    def crear(data: dict, permission_ids: list, creado_por) -> Any:
        if RoleRepository.exists_name(data.get('name', '')):
            raise ValidationError({'name': 'Ya existe un rol con ese nombre.'})
        RoleService._validate_permissions(permission_ids)
        role = RoleRepository.create(data, permission_ids, creado_por)
        _log.info(f'Rol creado: {role.name} por {creado_por}')
        return {
            "success":True,
            "message":"Rol creado exitosamente."
        }
    @staticmethod
    def actualizar(pk: int, data: dict, permission_ids, actualizado_por) -> Any:
        role = RoleService.obtener(pk)
        name = data.get('name', role.name)
        if RoleRepository.exists_name(name, exclude_pk=pk):
            raise ValidationError({'name': 'Ya existe otro rol con ese nombre.'})
        role = RoleRepository.update(role, data)
        if permission_ids is not None:
            RoleService._validate_permissions(permission_ids)
            RolePermissionRepository.replace_all(role, permission_ids, created_by=actualizado_por)
        _log.info(f'Rol actualizado: {role.name} por {actualizado_por}')
        return {
            "success":True,
            "message":"Rol Actualizado exitosamente."
        }
    @staticmethod
    def activate(_id:int) -> Dict[str, Any]:
        role=RoleRepository.get_by_id(_id)
        if not role:
            raise ValidationError(f'Rol no encontrado.') 
        if role.is_active:
            raise ValidationError(f'El Rol ya se encuentra activo.') 
        RoleRepository.activate(role)
        return {
            "success": True,
            "message": "Rol activado exitosamente."
        }
    @staticmethod
    def deactivate(_id:int) -> Dict[str, Any]:
        role=RoleRepository.get_by_id(_id)
        if role.name == 'SYSADMIN':
            raise ValidationError({'detail': 'No se puede desactivar el rol SYSADMIN.'})
        if not role:
            raise ValidationError(f'Rol no encontrado.') 
        if not role.is_active:
            raise ValidationError(f'Rol ya se encuentra inactivo.')
        RoleRepository.deactivate(role)
        return {
            "success": True,
            "message": "Role desactivado exitosamente."
        }    
    @staticmethod
    def sync_permissions( role_pk: int, permission_ids: list[int], created_by:int):
        role = RoleService.obtener(role_pk)
        if role.name == "SYSADMIN":
            raise ValidationError({"detail": "No se pueden modificar los permisos del rol SYSADMIN."})
        permission_ids = list(set(permission_ids))
        permissions = PermissionRepository.get_by_ids(permission_ids)
        if permissions.count() != len(permission_ids):
            raise NotFound("Uno o más permisos no existen o están inactivos.")
        RolePermissionRepository.sync(role, permission_ids, created_by)
        return {
            "success": True,
            "message": "Permisos sincronizados exitosamente."        
        }
    @staticmethod
    def permisos_del_rol(pk: int):
        role = RoleService.obtener(pk)
        return RolePermissionRepository.get_by_role(role).order_by("id")
    @staticmethod
    def _validate_permissions(ids: list) -> None:
        missing = PermissionRepository.missing_ids(ids)
        if missing:
            raise ValidationError({'permission_ids': f'IDs no válidos o inactivos: {missing}'})
