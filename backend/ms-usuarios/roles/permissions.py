from rest_framework.permissions import BasePermission

class IsSysAdmin(BasePermission):
    message = "Solo el rol SYSADMIN puede realizar esta acción."
    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if not hasattr(user, 'role') or not user.role:
            return False
        return user.role.name == "SYSADMIN" and user.role.is_active

# class HasJWTPermission(BasePermission):
#     message = "No tiene permisos para realizar esta acción."
#     def __init__(self, codename: str):
#         self.codename = codename
#         super().__init__()
#     def has_permission(self, request, view):
#         user = request.user
#         if not user or not user.is_authenticated:
#             return False
#         role = None
#         if hasattr(user, 'role') and user.role:
#             role = user.role.name        
#         elif request.auth:
#             role = request.auth.get('role')
#         if role == 'SYSADMIN':
#             return True
#         if not request.auth:
#             return False
#         permissions_flat = request.auth.get('permissions_flat', [])
#         return self.codename in set(permissions_flat)
class HasJWTPermission(BasePermission):
    message = "No tiene permisos para realizar esta acción." 
    def __init__(self, codename: str):
        self.codename = codename 
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        role = None
        if hasattr(request.user, 'role') and request.user.role:
            role = request.user.role.name
        elif request.auth:
            role = request.auth.get('role') 
        if role == 'SYSADMIN':
            return True 
        if not request.auth:
            return False 
        raw = request.auth.get('permissions_flat')
        if isinstance(raw, list):
            perms = set(raw)
        elif isinstance(raw, str) and raw:
            perms = set(raw.split(','))
        else:
            return False 
        return self.codename in perms
    
# class HasJWTPermission(BasePermission):
#     message = "No tiene permisos para realizar esta acción."
#     def __init__(self, codename: str):
#         self.codename = codename
#     def has_permission(self, request, view):
#         if not request.user or not request.user.is_authenticated:
#             return False
#         if request.auth.get('role') == 'SYSADMIN':
#             return True
#         permissions_flat = request.auth.get('permissions_flat', [])
#         return self.codename in set(permissions_flat)

 
