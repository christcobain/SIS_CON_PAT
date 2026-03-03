import hashlib
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
# from users.models import User


class PasswordPolicyService:
    @staticmethod
    def get_active():
        return PasswordPolicyRepository.get_active()
    @staticmethod
    def get_all():
        return PasswordPolicyRepository.get_all()
    @staticmethod
    def get_by_id(id: int)-> Dict[str, Any]:
        return PasswordPolicyRepository.get_by_id(id)         
    @staticmethod
    def create(data: Dict[str, Any]):
        PasswordPolicyRepository.create(data)
        return {
                "success": True,
                "message": "Politica Creada Exitosamente"
            }
    @staticmethod
    def update(instance, data: Dict[str, Any]):
        try:
            updated = PasswordPolicyRepository.update(instance, data)
            return {
                "success": True,
                "message": "Politica Actualizada"
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    @staticmethod
    def activate(_id:int) -> Dict[str, Any]:
        policy = PasswordPolicyService.get_all().filter(pk=_id).first()
        if not policy:
            return {
            "success": False,
            "error": "Politica no encontrada."
        }
        if policy.is_active:
            return {
                "success": False,
                "error": "La Politica ya se encuentra activa."                
            } 
        PasswordPolicyRepository.activate(policy)
        return {
            "success": True,
            "message": "Politica Activada exitosamente."
        }
    @staticmethod
    def deactivate(_id:int) -> Dict[str, Any]:
        policy = PasswordPolicyService.get_all().filter(pk=_id).first()
        if not policy:
            return {
            "success": False,
            "error": "Politica no encontrada."
        }
        if not policy.is_active:
            return {
                "success": False,
                "error": "La Politica ya se encuentra Inactiva."                
            } 
        PasswordPolicyRepository.deactivate(policy)
        return {
            "success": True,
            "message": "Politica Desactivada exitosamente."
        }
    @staticmethod
    def validate_password(password: str) -> List[str]:
        return PasswordPolicyRepository.validate_password(password)

class PasswordHistoryService:
    @staticmethod
    def get_recent(user, limit:int):
        return PasswordHistoryRepository.get_recent(user=user,limit=limit)   
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
        user = CredentialService.get_by_username(username=username)
        if not user:
            raise ValidationError("Usuario no encontrado.")
        password_to_set = new_password if new_password else user.username
        user.set_password(password_to_set)
        user.save(update_fields=["password"])
        credential = CredentialRepository.get_by_user(user)
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
    def change_password_by_user(username: str, current_password: str, new_password: str) -> Dict[str, Any]:
        user = authenticate(username=username, password=current_password)
        if not user:
            raise ValidationError("Contraseña actual incorrecta.")
        errors = PasswordPolicyService.validate_password(new_password)
        if errors:
            raise ValidationError(errors)
        if PasswordHistoryService.is_password_in_history(user, new_password):
            raise ValidationError("La contraseña no puede ser igual a las 5 últimas usadas.")
        user.set_password(new_password)
        user.save(update_fields=["password"])
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
        user = CredentialService.get_by_username(username=username)
        if not user:
            return None
        credential = CredentialRepository.get_by_user(user)
        if not credential:
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
    def activate(user_id:int) -> Dict[str, Any]:
        result=CredentialRepository.get_by_id(user_id)
        if not result:
            raise ValidationError(f'Credencial no encontrada.') 
        if result.is_active:
            raise ValidationError(f'Credencial ya se encuentra activa.')  
        CredentialRepository.activate(result)
        return {
            "success": True,
            "message": "Credencial Activada exitosamente."
        }
    @staticmethod
    def deactivate_user(user_id:int) -> Dict[str, Any]:
        result=CredentialRepository.get_by_id(user_id)
        if not result:
            raise ValidationError(f'Credencial no encontrada.') 
        if not result.is_active:
            raise ValidationError(f'Credencial ya se encuentra desactivada.')
        CredentialRepository.deactivate(result)
        return {
            "success": True,
            "message": "Credencial desactivada exitosamente."
        }
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
    def login(username: str, password: str, ip_address: str, device_info: str) -> Dict[str, Any]:
        user = authenticate(username=username, password=password)      
        if not user:
            credential = CredentialService.increment_failed_attempts(username)
            if credential and credential.is_locked:
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
        credential = CredentialService.get_by_user(user)
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
        if CredentialService.is_password_expired(user):
                LoginAttemptService.create(username, ip_address, device_info, 'password_expired', False, 'Contraseña expirada')
                raise ValidationError(f'Contraseña expirada. Debe cambiarla.')
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
                'nombres':                  user.first_name,
                'apellidos':                user.last_name,
                'role':                     user.role.name if user.role else None,
                'permissions':              permissions_grouped,
                'sedes':                    sedes,
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
        if not refresh_token:
            raise TokenError('No refresh token')
        refresh = RefreshToken(refresh_token)
        access  = refresh.access_token
        user_id = refresh.get('user_id')
        from users.models import User
        try:
            user = User.objects.select_related('role', 'dependencia').prefetch_related('sedes').get(pk=user_id)
        except User.DoesNotExist:
            raise TokenError('Usuario no encontrado')
        permissions_grouped = LoginSessionService._build_permissions(user)
        sedes = list(user.sedes.values('id', 'nombre', 'codigo'))
        return {
            'success':                  True,
            'nombres':                  user.first_name,
            'apellidos':                user.last_name,
            'role':                     user.role.name if user.role else None,
            'permissions':              permissions_grouped,
            'sedes':                    sedes,
            'dependencia':              user.dependencia.nombre if getattr(user, 'dependencia', None) else None,
            'access':                   str(access),
            'refresh':                  str(refresh),
            'password_expires_in_days': CredentialService.days_until_expiry(user),
            'needs_password_warning':   CredentialService.needs_password_warning(user),
        }
    @staticmethod
    def get_active_sessions(dni: str | None = None):
        result=LoginSessionRepository.get_active_sessions(dni=dni)
        if not result:
            raise NotFound("No hay Sesiones Activas")
        return result