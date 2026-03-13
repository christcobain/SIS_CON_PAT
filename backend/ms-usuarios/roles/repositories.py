from .models import Permission, Role, RolePermission
from django.db.models import QuerySet, Prefetch


class PermissionRepository:
    @staticmethod
    def get_all(active_only: bool = True,ms_name: str = None,app_label: str = None,) -> QuerySet:
        qs = Permission.objects.all()
        if active_only:
            qs = qs.filter(is_active=True)
        if ms_name:
            qs = qs.filter(microservice_name=ms_name)
        if app_label:
            qs = qs.filter(app_label=app_label)
        return qs.order_by('microservice_name', 'app_label', 'codename')
    @staticmethod
    def get_by_ids(ids: list) -> QuerySet:
        return Permission.objects.filter(pk__in=ids, is_active=True)
    @staticmethod
    def missing_ids(ids: list) -> list:
        """IDs que no existen o están inactivos."""
        found = set(
            Permission.objects.filter(pk__in=ids, is_active=True)
            .values_list('pk', flat=True)
        )
        return [i for i in ids if i not in found]
    @staticmethod
    def known_microservices() -> list:
        return list(Permission.objects
            .filter(is_active=True)
            .values_list('microservice_name', flat=True)
            .distinct()
            .order_by('microservice_name')
        )
    @staticmethod
    def tree_for_frontend() -> list:
        """
        Árbol MS → app_label → permisos para el componente de asignación del frontend.
        El admin ve un árbol con checkboxes, nunca IDs crudos.

        [
            {
                "ms_name": "ms-bienes",
                "apps": [
                    {
                        "app_label": "bienes",
                        "permissions": [
                            {"id": 1, "codename": "view_bien",   "name": "Can view bien"},
                            {"id": 2, "codename": "add_bien",    "name": "Can add bien"},
                            {"id": 3, "codename": "change_bien", "name": "Can change bien"},
                            {"id": 4, "codename": "delete_bien", "name": "Can delete bien"},
                        ]
                    },
                    {"app_label": "mantenimiento", "permissions": [...]},
                ]
            },
            {"ms_name": "ms-reportes", "apps": [...]}
        ]
        """
        qs = (Permission.objects
            .filter(is_active=True)
            .order_by('microservice_name', 'app_label', 'codename')
            .values('id', 'microservice_name', 'app_label', 'codename', 'name', 'model_name')
        )
        ms_map = {}
        for row in qs:
            ms  = row['microservice_name']
            app = row['app_label']
            if ms not in ms_map:
                ms_map[ms] = {}
            if app not in ms_map[ms]:
                ms_map[ms][app] = []
            ms_map[ms][app].append({
                'id':       row['id'],
                'codename': row['codename'],
                'name':     row['name'],
            })
        return [
            {
                'ms_name': ms,
                'apps': [
                    {'app_label': app, 'permissions': perms}
                    for app, perms in apps.items()
                ],
            }
            for ms, apps in ms_map.items()
        ]

class RoleRepository:
    @staticmethod
    def get_all() -> QuerySet:
        qs = Role.objects.prefetch_related(
            Prefetch('permissions',queryset=Permission.objects.filter(is_active=True))
        )
        return qs
    @staticmethod
    def get_by_id(pk: int):
        return (
            Role.objects
            .prefetch_related(
                Prefetch('permissions', queryset=Permission.objects.filter(is_active=True)),
                'role_permissions__created_by',
            )
            .filter(pk=pk)
            .first()
        )
    @staticmethod
    def exists_name(name: str, exclude_pk: int = None) -> bool:
        qs = Role.objects.filter(name=name)
        if exclude_pk:
            qs = qs.exclude(pk=exclude_pk)
        return qs.exists()
    @staticmethod
    def create(data: dict, permission_ids: list, created_by) -> 'Role':
        data['created_by'] = created_by
        role = Role.objects.create(**data)
        if permission_ids:
            RolePermissionRepository.replace_all(role, permission_ids, created_by=created_by)
        return role
    @staticmethod
    def update(instance, data: dict):
        for k, v in data.items():
            setattr(instance, k, v)
        instance.save()
        return instance
    @staticmethod
    def activate(rol: Role) -> Role:
        rol.is_active = True
        rol.save(update_fields=['is_active'])
        return rol
    @staticmethod
    def deactivate(rol: Role) -> Role:
        rol.is_active = False
        rol.save(update_fields=['is_active'])
        return rol

class RolePermissionRepository:
    @staticmethod
    def get_by_role(role) -> QuerySet:
        return (
            RolePermission.objects
            .select_related('permission', 'created_by')
            .filter(role=role)
            .order_by('permission__microservice_name', 'permission__app_label')
        ) 
    @staticmethod
    def replace_all(role, permission_ids: list, created_by=None) -> None:
        existing = set(RolePermission.objects.filter(role=role).values_list('permission_id', flat=True))
        new_ids = set(permission_ids)
        RolePermission.objects.filter(role=role, permission_id__in=existing - new_ids).delete()
        RolePermission.objects.bulk_create(
            [RolePermission(role=role, permission_id=pid, created_by=created_by)
             for pid in new_ids - existing],
            ignore_conflicts=True,
        )
    @staticmethod
    def sync(role, permission_ids: list[int], created_by):
        current_ids = set(
            RolePermission.objects.filter(role=role)
            .values_list("permission_id", flat=True)
        )
        new_ids = set(permission_ids)
        to_add = new_ids - current_ids
        to_remove = current_ids - new_ids
        if to_remove:
            RolePermission.objects.filter(
                role=role,
                permission_id__in=to_remove
            ).delete()
        role_permissions = []
        for permission_id in to_add:
            rp = RolePermission.objects.create(
                role=role,
                permission_id=permission_id,
                created_by=created_by
            )
            role_permissions.append(rp)

        return RolePermission.objects.filter(role=role)
    @staticmethod
    def activate(roleperm: RolePermission) -> RolePermission:
        roleperm.is_active = True
        roleperm.save(update_fields=['is_active'])
        return roleperm
    @staticmethod
    def deactivate(roleperm: RolePermission) -> RolePermission:
        roleperm.is_active = False
        roleperm.save(update_fields=['is_active'])
        return roleperm
    
    
    