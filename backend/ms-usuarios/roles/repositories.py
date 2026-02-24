from .models import Role, Permission


class RoleRepository:
    @staticmethod
    def get_all(filters=None):
        qs = Role.objects.prefetch_related('permissions').all()
        if filters:
            if 'estado' in filters:
                qs = qs.filter(estado=filters['estado'])
            if 'search' in filters:
                qs = qs.filter(name__icontains=filters['search'])
        return qs

    @staticmethod
    def get_by_id(role_id):
        return Role.objects.prefetch_related('permissions').get(pk=role_id)

    @staticmethod
    def create(data, permission_ids=None):
        role = Role.objects.create(**data)
        if permission_ids:
            role.permissions.set(permission_ids)
        return role

    @staticmethod
    def update(role, data, permission_ids=None):
        for key, value in data.items():
            setattr(role, key, value)
        role.save()
        if permission_ids is not None:
            role.permissions.set(permission_ids)
        return role

    @staticmethod
    def toggle_estado(role):
        role.estado = not role.estado
        role.save(update_fields=['estado'])
        return role


class PermissionRepository:
    @staticmethod
    def get_all(module=None):
        qs = Permission.objects.all()
        if module:
            qs = qs.filter(module=module)
        return qs

    @staticmethod
    def get_by_id(perm_id):
        return Permission.objects.get(pk=perm_id)

    @staticmethod
    def create(data):
        return Permission.objects.create(**data)