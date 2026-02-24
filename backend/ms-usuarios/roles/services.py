from .repositories import RoleRepository, PermissionRepository
from django.core.exceptions import ValidationError
from .models import Role

class RoleService:
    @staticmethod
    def list_roles(filters=None):
        return RoleRepository.get_all(filters)

    @staticmethod
    def get_role(role_id):
        try:
            return RoleRepository.get_by_id(role_id)
        except Exception:
            raise ValidationError(f'Rol con ID {role_id} no encontrado.')

    @staticmethod
    def create_role(data, permission_ids=None):
        if Role.objects.filter(code=data.get('code')).exists():
            raise ValidationError('Ya existe un rol con ese código.')
        return RoleRepository.create(data, permission_ids)

    @staticmethod
    def update_role(role_id, data, permission_ids=None):
        role = RoleService.get_role(role_id)
        return RoleRepository.update(role, data, permission_ids)

    @staticmethod
    def toggle_estado(role_id):
        role = RoleService.get_role(role_id)
        return RoleRepository.toggle_estado(role)

    @staticmethod
    def assign_permissions(role_id, permission_ids):
        role = RoleService.get_role(role_id)
        role.permissions.set(permission_ids)
        return role

    @staticmethod
    def remove_permission(role_id, permission_id):
        role = RoleService.get_role(role_id)
        role.permissions.remove(permission_id)
        return role


class PermissionService:
    @staticmethod
    def list_permissions(module=None):
        return PermissionRepository.get_all(module)

    @staticmethod
    def create_permission(data):
        return PermissionRepository.create(data)