from typing import Optional, Dict, Any, List
from django.db.models import QuerySet
from django.contrib.auth import authenticate
from .repositories import (
    PasswordPolicyRepository,
    CredentialRepository,
    PasswordHistoryRepository,
    LoginSessionRepository,
    LoginAttemptRepository
)
from users.services import UserService
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
import hashlib
from django.utils import timezone


class PasswordPolicyService:
    @staticmethod
    def get_active() -> Optional[Any]:
        return PasswordPolicyRepository.get_active()
    @staticmethod
    def get_all() -> QuerySet:
        return PasswordPolicyRepository.get_all()
    @staticmethod
    def create(data: Dict[str, Any]) -> Any:
        return PasswordPolicyRepository.create(data)
    @staticmethod
    def update(instance: Any, data: Dict[str, Any]) -> Any:
        return PasswordPolicyRepository.update(instance, data)
    @staticmethod
    def activate(policy: Any):
        PasswordPolicyRepository.activate(policy)
    @staticmethod
    def deactivate_all():
        PasswordPolicyRepository.deactivate_all()
    @staticmethod
    def validate_password(password: str) -> bool:
        return PasswordPolicyRepository.validate_password(password)
    @staticmethod
    def get_active_policy(cls) -> Optional[Any]:
        return PasswordPolicyRepository.get_active_policy(cls)

class PasswordHistoryService:
    @staticmethod
    def create(user, hashed_password: str) -> Any:
        return PasswordHistoryRepository.create(user, hashed_password)
    @staticmethod
    def get_recent(user, limit: int) -> List[Any]:
        return PasswordHistoryRepository.get_recent(user, limit)
    @staticmethod
    def is_password_in_history_method(user, plain_password: str, limit: int = 3) -> bool:

        return PasswordHistoryRepository.is_password_in_history(user, plain_password, limit)

class CredentialService:
    @staticmethod
    def get_user_credential(user) -> Optional[Any]:
        return CredentialRepository.get_user_credential(user)    
    @staticmethod
    def create(user) -> Any:
        usuario=CredentialService.get_user_credential(user)
        if usuario.dni==user.dni and usuario.active:
            return {
                "success": False,
                "error": "El usuario ya tiene credenciales asignadas."                
            } 
            
        PasswordHistoryService.create(user=user.dni, hashed_password=user.dni )
        return CredentialRepository.create(user=user,last_password_change=timezone.now())
    
    @staticmethod
    def increment_failed_attempts(user):
        CredentialRepository.increment_failed_attempts(user)
    @staticmethod
    def reset_password(user, new_password: str) -> Dict[str, Any]:    
        errors = PasswordPolicyService.validate_password(new_password)
        if errors:
            return {
                "success": False,
                "error": errors
            }        
        if PasswordHistoryService.is_password_in_history_method(user, new_password):
            return {
                "success": False,
                "error": "La nueva contraseña no puede ser igual a las últimas 3 contraseñas usadas."
            }
        PasswordHistoryService.create(user, new_password)
        CredentialService.force_password_change(user, False)
        CredentialService.update_password_change_date(user)
        CredentialService.reset_attempts(user)
        LoginSessionRepository.logout_all_user_sessions(user)        
        return {
            "success": True,
            "message": "Contraseña actualizada correctamente. Inicie sesión nuevamente."
        }
    @staticmethod
    def force_password_change(user, value: bool = True):
        CredentialRepository.force_password_change(user, value)
    @staticmethod
    def update_password_change_date(user):
        CredentialRepository.update_password_change_date(user)
    @staticmethod
    def reset_attempts(user):
        CredentialRepository.reset_attempts(user)
    @staticmethod
    def is_password_expired(user) -> bool:
        return CredentialRepository.is_password_expired(user)
    @staticmethod
    def days_until_expiry(user):
        return CredentialRepository.days_until_expiry(user)
    @staticmethod
    def needs_password_warning(user) -> bool:
        return CredentialRepository.needs_password_warning(user)
    
class LoginSessionService:
    @staticmethod
    def _hash_token(token):
        return hashlib.sha256(str(token).encode()).hexdigest()
    @staticmethod
    def filter(**kwargs):
        user = kwargs.get('user')
        if user is not None:
            return LoginSessionRepository.get_active_sessions(user)
        raise NotImplementedError('Use repository methods for complex queries (LoginSessionRepository)')
    @staticmethod
    def get_active_sessions(user_id) -> QuerySet:
        return LoginSessionRepository.get_active_sessions(user_id)
    @staticmethod
    def logout_all_user_sessions(user_id, except_session_id=None):
        return LoginSessionRepository.logout_all_user_sessions(user_id, except_session_id)    
    @staticmethod
    def login(username: str, password: str, ip_address: str, device_info: str) -> Dict[str, Any]:
        user = authenticate(username=username, password=password)
        if not user:
            LoginAttemptService.create(username, 
                                       ip_address, 
                                       device_info, 
                                       'invalid_password', 
                                       False, 
                                       'Contraseña inválidas')
            return {'success': False, 'message': 'Credenciales inválidas.'}    
        credential = CredentialService.get_user_credential(user=user)        
        if not credential.active:
            LoginAttemptService.create(username, 
                                       ip_address, 
                                       device_info, 
                                       'user_inactive', 
                                       False, 
                                       'Usuario inactivo')
            return {'success': False, 
                    'message': 'Usuario inactivo.'}        
        if credential.is_locked:
            LoginAttemptService.create(username, 
                                       ip_address,
                                       device_info, 
                                       'locked', 
                                       False, 
                                       'Cuenta bloqueada')
            return {'success': False, 
                    'message': 'Cuenta bloqueada. Solicite desbloqear al Admin. de Sistema.'}
        if credential.force_password_change:
            LoginAttemptService.create(username, 
                                       ip_address, 
                                       device_info, 
                                       'force_password_change', 
                                       False, 
                                       'Cambio de contraseña requerido')
            return {'success': False, 
                    'message': 'Cambio de contraseña requerido. Por favor, cambie su contraseña.'}
        if CredentialService.is_password_expired(user):
            LoginAttemptService.create(username,
                                       ip_address,
                                       device_info,
                                       'password_expired',
                                       False,
                                       'Contraseña expirada'
            )
            return {'success': False, 
                    'message': 'Contraseña expirada. Debe de cambiar por nueva contraseña.'}
        if not getattr(user, "allow_multiple_sessions", True):
            LoginSessionRepository.logout_all_user_sessions(user)                 
        refresh = RefreshToken.for_user(user)
        access = refresh.access_token
        session = LoginSessionRepository.create(user, 
                                                ip_address, 
                                                device_info, 
                                                LoginSessionService._hash_token(refresh))
        LoginAttemptService.create(
                                   user.username,
                                   ip_address,
                                   device_info,
                                   'success',
                                   True,
                                   'Exitoso')
        usuario=UserService.get_user_by_dni(username)
        return {
            'success': True,            
            'nombres': usuario.nombres,
            'apellidos': usuario.last_name,
            'role': usuario.role.name if usuario.role else None,
            'permissions': list(
                usuario.role.permissions.values_list('codename', flat=True)
            ) if usuario.role else [],
            'sedes': list(usuario.sedes.values('id', 'nombre', 'codigo')),        
            'dependencia': usuario.dependencia.nombre if usuario.dependencia else None,
            'access': str(access),
            'refresh': str(refresh),
            'session_id': session.id,
                'password_expires_in_days': CredentialService.days_until_expiry(user),
                'needs_password_warning': CredentialService.needs_password_warning(user)    

        }
    @staticmethod
    def logout(user, refresh_token: str = None,ip_address: str = '', 
               device_info: str = ''):
        if refresh_token:
            try:
                token = RefreshToken(refresh_token)
                token.blacklist()
            except TokenError:
                pass
        else:
            return {
                'success': False,
                'message': 'No hay refresh token para invalidar'
            }
        cerrarsesion=LoginSessionRepository.logout_all_user_sessions(user)
        if not cerrarsesion:
            return {
                'success': False,
                'message': 'Error al cerrar sesión'
            }
        LoginAttemptService.create(
            username=user.username,
            ip_address=ip_address,
            device_info=device_info,
            attempt_type='logout',
            success=True,
            error_message=''
        )
        return {
            'success': True,
            'message': 'Sesión cerrada'
        }
    @staticmethod
    def refresh(refresh_token: str):        
        if not refresh_token: 
            raise TokenError('No refresh token') 
        refresh = RefreshToken(refresh_token) 
        access = refresh.access_token 
        user_id = refresh['user_id']  
        usuario = UserService.get_user_by_id(user_id)
        return {
            'success': True,
            'nombres': usuario.nombres,
            'apellidos': usuario.last_name,
            'role': usuario.role.name if usuario.role else None,
            'permissions': list(usuario.role.permissions.values_list('codename', flat=True)) if usuario.role else [],
            'sedes': list(usuario.sedes.values('id','nombre','codigo')),
            'dependencia': usuario.dependencia.nombre if usuario.dependencia else None,
            'access': str(access),
            'refresh': str(refresh),
            'password_expires_in_days': CredentialService.days_until_expiry(usuario),
            'needs_password_warning': CredentialService.needs_password_warning(usuario)
        }
        

class LoginAttemptService:
    @staticmethod
    def create(
        username: str,
        ip_address: str,
        device_info: str,
        attempt_type: str,
        success: bool,
        error_message: str = ""
    ) -> Any:
        return LoginAttemptRepository.create(
            username,
            ip_address,
            device_info,
            attempt_type,
            success,
            error_message
        )
    @staticmethod
    def get_recent_attempts(username: str, minutes: int) -> QuerySet:
        return LoginAttemptRepository.get_recent_attempts(username, minutes)
    @staticmethod
    def count_failed_attempts(username: str, minutes: int) -> int:
        return LoginAttemptRepository.count_failed_attempts(username, minutes)
