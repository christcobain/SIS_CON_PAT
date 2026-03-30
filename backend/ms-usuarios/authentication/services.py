import hashlib
from django.contrib.auth import get_user_model
from typing import Optional, Dict, Any, List
from django.utils import timezone
from rest_framework.exceptions import ValidationError,NotFound

from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from .repositories import (
    PasswordPolicyRepository, PasswordHistoryRepository,
    CredentialRepository, LoginSessionRepository, LoginAttemptRepository,
)


class PasswordPolicyService:
    @staticmethod
    def get_active():
        return PasswordPolicyRepository.get_active()
    @staticmethod
    def get_all():
        return PasswordPolicyRepository.get_all()
    @staticmethod
    def get_by_id(pk: int)-> Dict[str, Any]:
        policy = PasswordPolicyRepository.get_by_id(pk)
        if not policy:
            raise ValidationError(f'Política no encontrada.') 
        return {"success": True, "data": policy}        
    @staticmethod
    def create(data: Dict[str, Any], created_by=None):     
        data['created_by'] = created_by
        policy = PasswordPolicyRepository.create(data)
        return {"success": True, "message": "Politica Creada Exitosamente"}
    @staticmethod
    def update(pk, data: Dict[str, Any]):
        policy = PasswordPolicyRepository.get_by_id(pk)
        if not policy:
            return {"success": False, "error": "Política no encontrada."}
        updated = PasswordPolicyRepository.update(policy, data)
        return {"success": True, "message": "Politica Actualizada Exitosamente"}
    @staticmethod
    def activate(pk:int) -> Dict[str, Any]:
        policy = PasswordPolicyRepository.get_by_id(pk)
        if not policy:
            raise ValidationError(f'Política no encontrada.') 
        PasswordPolicyRepository.activate(policy)
        return {"success": True, "message": "Política Activada exitosamente."}
    @staticmethod
    def deactivate(pk:int) -> Dict[str, Any]:
        policy = PasswordPolicyRepository.get_by_id(pk)
        if not policy:
            raise ValidationError(f'Política no encontrada.') 
        if not policy.is_active:
            raise ValidationError(f'Política no encontrada.') 
        PasswordPolicyRepository.deactivate(policy)
        return {"success": True, "message": "Política Desactivada exitosamente."}
    @staticmethod
    def validate_password(password: str) -> List[str]:
        return PasswordPolicyRepository.validate_password(password)

class PasswordHistoryService:
    @staticmethod
    def get_recent(user, limit: int):
        return PasswordHistoryRepository.get_recent(user=user, limit=limit)
    @staticmethod
    def create(user, plain_password: str):
        return PasswordHistoryRepository.create(user, plain_password)
    @staticmethod
    def is_password_in_history(user, plain_password: str, limit: int = 5) -> bool:
        return PasswordHistoryRepository.is_password_in_history(user, plain_password, limit)

class CredentialService:
    @staticmethod
    def get_by_user(user):
        return CredentialRepository.get_by_user(user)
    @staticmethod
    def get_by_username(username):
        return CredentialRepository.get_by_username(username)
    @staticmethod
    def get_all(dni: str = None, is_locked: bool = None, is_active: bool = None):
        return CredentialRepository.get_all(dni=dni, is_locked=is_locked, is_active=is_active)
    @staticmethod
    def create(user):
        existing = CredentialRepository.get_by_user(user)
        if existing and existing.is_active:
            raise ValidationError(f'El usuario ya tiene credenciales asignadas.') 
        temp_password = user.dni  
        PasswordHistoryService.create(user, temp_password)
        CredentialRepository.create(
            user=user,
            last_password_change=timezone.now(),
            force_password_change=True,
        )
        return True
    @staticmethod
    def reset_by_admin(username: str, new_password: str = None) -> Dict[str, Any]:
        credential  = CredentialService.get_by_username(username=username)
        if not credential :
            raise ValidationError("Usuario no encontrado.")
        user = credential.user         
        password_to_set = new_password if new_password else user.username
        user.set_password(password_to_set)
        user.save()
        if not credential:
            raise ValidationError("Usuario sin credenciales configuradas.")
        credential.force_password_change = True
        credential.failed_attempts = 0
        credential.is_locked = False
        credential.last_password_change = timezone.now()
        credential.save(update_fields=[
            "force_password_change",
            "failed_attempts",
            "is_locked",
            "last_password_change",
        ])
        return {
            "success": True,
            "message": "Contraseña reseteada correctamente."
        }
    @staticmethod
    def unlock(username: str) -> Dict[str, Any]:
        credential = CredentialService.get_by_username(username=username)
        if not credential:
            raise ValidationError("Usuario no encontrado.")
        if not credential.is_locked:
            raise ValidationError("La cuenta no está bloqueada.")
        CredentialRepository.unlock(credential)
        return {"success": True, "message": "Cuenta desbloqueada exitosamente."}
    @staticmethod
    def change_password_by_user(username: str, current_password: str, new_password: str) -> Dict[str, Any]:
        user = authenticate(username=username, password=current_password)
        if not user:
            raise ValidationError("Contraseña actual incorrecta.")
        errors = PasswordPolicyService.validate_password(new_password)
        if errors:
            raise ValidationError(errors)
        cantidad=PasswordPolicyService.get_active().history_count
        if PasswordHistoryService.is_password_in_history(user, new_password):
            raise ValidationError(f'La contraseña no puede ser igual a las ${cantidad} últimas usadas.')
        user.set_password(new_password)
        user.save()
        PasswordHistoryService.create(user, new_password)
        credential = CredentialRepository.get_by_user(user)
        if credential:
            CredentialRepository.after_password_change(credential)
        LoginSessionRepository.logout_all_user_sessions(user)
        return {
            "success": True,
            "message": "Contraseña reseteada exitosamente."
        }  
    @staticmethod
    def increment_failed_attempts(username):
        credential  = CredentialService.get_by_username(username)
        if not credential :
            return None
        return CredentialRepository.increment_failed_attempts(credential)
    @staticmethod
    def update_multiple_sessions(username: str, option_id: int):
        if option_id not in [1, 2]:
            raise ValidationError("Opción inválida.")
        credential  = CredentialService.get_by_username(username)
        if not credential :
            raise ValidationError(f'Usuario {username} no encontrado.')       
        allow = True if option_id == 1 else False
        CredentialRepository.set_multiple_sessions(credential , allow)
        return {
            "success": True,
            "allow_multiple_sessions": allow
        }
    @staticmethod
    def activate(user_id: int) -> Dict[str, Any]:
        result = CredentialRepository.get_by_id(user_id)
        if not result:
            raise ValidationError('Credencial no encontrada.')
        if result.is_active:
            raise ValidationError('Usuario cuenta con Credencial de accesos activada.')
        CredentialRepository.activate(result)
        # return {"success": True, "message": "Credencial Activada exitosamente."}
        return
    @staticmethod
    def deactivate_user(user_id: int) -> Dict[str, Any]:
        result = CredentialRepository.get_by_id(user_id)
        if not result:
            raise ValidationError('Credencial no encontrada.')
        if not result.is_active:
            raise ValidationError('Usuario cuenta con Credencial de accesos desactivada.')
        CredentialRepository.deactivate(result)
        # return {"success": True, "message": "Credencial desactivada exitosamente."}
        return
    @staticmethod
    def is_password_expired(user) -> bool:
        return CredentialRepository.is_password_expired(user)
    @staticmethod
    def days_until_expiry(user) -> Optional[int]:
        return CredentialRepository.days_until_expiry(user)
    @staticmethod
    def needs_password_warning(user) -> bool:
        return CredentialRepository.needs_password_warning(user)

class LoginAttemptService:
    @staticmethod
    def get_all(dni: str = None, success: bool = None, attempt_type: str = None, limit: int = 200):
        return LoginAttemptRepository.get_all(
            dni=dni, success=success, attempt_type=attempt_type, limit=limit
        )
    @staticmethod
    def create(username, ip_address, device_info, attempt_type, success, error_message=''):
        return LoginAttemptRepository.create(
            username, ip_address, device_info, attempt_type, success, error_message
        )
    @staticmethod
    def count_failed_attempts(username: str, minutes: int) -> int:
        return LoginAttemptRepository.count_failed_attempts(username, minutes)

class LoginSessionService:
    @staticmethod
    def _hash_token(token: str) -> str:
        return hashlib.sha256(str(token).encode()).hexdigest()
    @staticmethod
    def _build_permissions(user) -> Dict:
        if not user.role:
            return {}
        return user.role.build_jwt_permissions()
    @staticmethod
    def get_active_sessions(dni: str = None):
        result=LoginSessionRepository.get_active_sessions(dni=dni)
        if not result:
            raise NotFound("No hay Sesiones Activas")
        return result   
    @staticmethod
    def get_all_sessions(dni: str = None, status: str = None, limit: int = 100):
        return LoginSessionRepository.get_all_sessions(dni=dni, status=status, limit=limit)
    @staticmethod
    def login(username: str, password: str, ip_address: str, device_info: str) -> Dict[str, Any]:
        credential = CredentialService.get_by_username(username)
        if not credential:
            LoginAttemptService.create(
                username, ip_address, device_info,
                'user_not_found', False, 'Usuario no existe en credenciales'
            )
            raise ValidationError('Usuario no existe.')     
        user = credential.user 
        role_name = user.role.name if user.role else None
        if not credential.is_active:
            LoginAttemptService.create(
                username, ip_address, device_info,
                'inactive', False, 'Usuario inactivo'
            )
            raise ValidationError('Usuario inactivo.')
        if credential.is_locked and role_name != "SYSADMIN":
            LoginAttemptService.create(
                username, ip_address, device_info,
                'locked', False, 'Cuenta bloqueada'
            )
            raise ValidationError('Cuenta bloqueada. Contacte al administrador.')         
        authenticated_user = authenticate(username=username, password=password) 
        if not authenticated_user:
            if role_name != "SYSADMIN":
                credential = CredentialService.increment_failed_attempts(username)
                if credential.is_locked:
                    LoginAttemptService.create(
                        username, ip_address, device_info,
                        'locked', False, 'Cuenta bloqueada'
                    )
                    raise ValidationError('Cuenta bloqueada. Contacte al administrador.')
            LoginAttemptService.create(
                username, ip_address, device_info,
                'invalid_password', False, 'Credenciales inválidas'
            )
            raise ValidationError('Credenciales inválidas.')        
        if not credential:
                raise ValidationError(f'Usuario sin credenciales configuradas.')
        if not credential.is_active:
                LoginAttemptService.create(username, ip_address, device_info, 'user_inactive', False, 'Usuario inactivo')
                raise ValidationError(f'Usuario inactivo.')
        if credential.is_locked:
                LoginAttemptService.create(username, ip_address, device_info, 'locked', False, 'Cuenta bloqueada')
                raise ValidationError(f'Cuenta bloqueada. Contacte al administrador.')
        if credential.force_password_change:
                LoginAttemptService.create(username, ip_address, device_info, 'force_password_change', False, 'Cambio requerido')
                raise ValidationError(f'Debe cambiar su contraseña antes de continuar.')
        is_password_expired=CredentialService.is_password_expired(user)
        if is_password_expired:
                LoginAttemptService.create(username, ip_address, device_info, 'password_expired', False, 'Contraseña expirada')
                raise ValidationError(is_password_expired)
        sesion_activa = LoginSessionRepository.get_active_session_by_user(user)
        if sesion_activa:
            if not credential.allow_multiple_sessions:
                LoginAttemptService.create(username, ip_address, device_info, 'multiple_sessions', False, 'Sesión activa existente')
                raise ValidationError(
                    'Ya tiene una sesión activa. '
                    'Cierre la sesión actual o habilite múltiples sesiones.'
                )
        if not credential.allow_multiple_sessions:
                LoginSessionRepository.logout_all_user_sessions(user)
        refresh = RefreshToken.for_user(user)
        permissions_grouped = LoginSessionService._build_permissions(user)
        permissions_flat = [
                f'{ms}:{app}:{cod}'
                for ms, apps in permissions_grouped.items()
                for app, cods in apps.items()
                for cod in cods
            ]
        sedes = list(user.sedes.values('id', 'nombre'))
        extra_claims = {
            'role':             user.role.name if user.role else None,
            'permissions':      permissions_grouped,
            'permissions_flat': permissions_flat,
            'sedes_ids':        [s['id'] for s in sedes],
            'sedes':            sedes, 
            'modulo_id':        user.modulo_id,
            'modulo_nombre':    user.modulo.nombre if user.modulo else '', 
            'username':          user.username,
            'nombres':          user.first_name, 
            'apellidos':        user.last_name,  
            'cargo':            user.cargo,      
        }
        for key, value in extra_claims.items():
                refresh[key]              = value
                refresh.access_token[key] = value
        session = LoginSessionRepository.create(
                user, ip_address, device_info,
                LoginSessionService._hash_token(str(refresh)),
            )
        LoginAttemptService.create(user.username, ip_address, device_info, 'success', True, 'Exitoso')
        return {
                'success':                  True,
                'id':                       user.id,
                'username':                 user.username,
                'nombres':                  user.first_name,
                'apellidos':                user.last_name,
                'cargo':                    user.cargo,
                'role':                     user.role.name if user.role else None,
                'permissions':              permissions_grouped,
                'permissions_flat':         permissions_flat,
                'sedes':                    sedes,
                'modulo_id':                user.modulo_id, 
                'modulo_nombre'             : user.modulo.nombre if user.modulo else None,
                'empresa_id':               user.empresa_id,       
                'empresa_nombre':           user.empresa.nombre if user.empresa else None,
                'access':                   str(refresh.access_token),
                'refresh':                  str(refresh),
                'session_id':               session.id,
                'password_expires_in_days': CredentialService.days_until_expiry(user),
                'needs_password_warning':   CredentialService.needs_password_warning(user),
            }                    
    @staticmethod
    def logout(user, refresh_token: str = None, ip_address: str = '', device_info: str = '') -> Dict[str, Any]:
        if not refresh_token:
            raise ValidationError(f'No se proporcionó refresh token.')
        try:
            RefreshToken(refresh_token).blacklist()
        except TokenError:
            pass
        LoginSessionRepository.logout_all_user_sessions(user)
        LoginAttemptService.create(user.username, ip_address, device_info, 'success', True, 'Logout')
        return {'success': True, 'message': 'Sesión cerrada correctamente.'}
    @staticmethod
    def refresh(refresh_token: str) -> Dict[str, Any]:
        from rest_framework_simplejwt.tokens import RefreshToken as RFToken
        token = RFToken(refresh_token)
        user_id = token.payload.get('user_id')
        from users.models import User as UserModel
        user = UserModel.objects.select_related('role', 'modulo', 'empresa').get(pk=user_id)
        permissions_grouped = LoginSessionService._build_permissions(user)
        permissions_flat = [
            f'{ms}:{app}:{cod}'
            for ms, apps in permissions_grouped.items()
            for app, cods in apps.items()
            for cod in cods
        ]
        sedes = list(user.sedes.values('id', 'nombre'))
        new_refresh = RFToken.for_user(user)
        extra_claims = {
            'role':             user.role.name if user.role else None,
            'permissions':      permissions_grouped,
            'permissions_flat': permissions_flat,
            'sedes_ids':        [s['id'] for s in sedes],
            'sedes':            sedes, 
            'modulo_id':        user.modulo_id,
            'modulo_nombre':    user.modulo.nombre if user.modulo else '', 
            'nombres':          user.first_name, 
            'apellidos':        user.last_name, 
            'username':          user.username,
            'cargo':            user.cargo,    
        }
        for key, value in extra_claims.items():
            new_refresh[key] = value
            new_refresh.access_token[key] = value
        return {
            'success': True,
            'id': user.id,
            'nombres': user.first_name,
            'apellidos': user.last_name,
            'role': user.role.name if user.role else None,
            'permissions': permissions_grouped,
            'permissions_flat': permissions_flat,
            'sedes': sedes,
            'modulo_id': user.modulo_id,
            'modulo_nombre': user.modulo.nombre if user.modulo else None,
            'empresa_id': user.empresa_id,
            'empresa_nombre': user.empresa.nombre if user.empresa else None,
            'access': str(new_refresh.access_token),
            'refresh': str(new_refresh),
            'password_expires_in_days': CredentialService.days_until_expiry(user),
            'needs_password_warning': CredentialService.needs_password_warning(user),
        }
    