from rest_framework.permissions import BasePermission

class IsSysAdmin(BasePermission):
    message = "Solo el rol SYSADMIN puede realizar esta acción."
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return getattr(request.auth, 'get', lambda k, d=None: d)('role') == 'SYSADMIN'

class HasJWTPermission(BasePermission):
    message = "No tiene permisos para realizar esta acción."
    def __init__(self, codename: str):
        self.codename = codename
    # def has_permission(self, request, view):
    #     if not request.user or not request.user.is_authenticated:
    #         return False
    #     if request.auth.get('role') == 'SYSADMIN':
    #         return True
    #     return self.codename in set(request.auth.get('permissions_flat', []))   
    # message = "No tiene permisos para realizar esta acción."
    # codename: str = ''
    # @classmethod
    # def require(cls, codename: str) -> type:
    #     return type(
    #         f'HasJWTPermission_{codename}',
    #         (cls,),
    #         {'codename': codename},
    #     ) 
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.auth.get('role') == 'SYSADMIN':
            return True
        return self.codename in set(request.auth.get('permissions_flat', []))
 