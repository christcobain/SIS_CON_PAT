from typing import Optional, Dict, Any,List
from django.db.models import QuerySet
from django.utils import timezone
from .models import LoginSession, LoginAttempt, PasswordPolicy, PasswordHistory, Credential
from django.contrib.auth.hashers import check_password
from users.models import User
from users.repositories import UserRepository

class PasswordPolicyRepository:
    @staticmethod
    def get_active() -> Optional[PasswordPolicy]:
        return PasswordPolicy.get_active_policy()
    @staticmethod
    def get_all() -> QuerySet:
        return PasswordPolicy.objects.all()
    @staticmethod
    def create(data: Dict[str, Any]) -> PasswordPolicy:
        return PasswordPolicy.objects.create(**data)
    @staticmethod
    def update(instance: PasswordPolicy, data: Dict[str, Any]) -> PasswordPolicy:
        for key, value in data.items():
            setattr(instance, key, value)
        instance.save()
        return instance
    @staticmethod
    def activate(policy: PasswordPolicy):
        PasswordPolicyRepository.deactivate_all()
        policy.active = True
        policy.save(update_fields=["active"])
    @staticmethod
    def deactivate_all():
        PasswordPolicy.objects.update(active=False)
    @staticmethod
    def get_active_policy(cls) -> Optional[Any]:
        return PasswordPolicy.get_active_policy(cls)
    @staticmethod
    def validate_password(password: str) -> bool:
        return PasswordPolicyRepository.get_active_policy(password)
       
class PasswordHistoryRepository:
    @staticmethod
    def create(user, hashed_password: str) -> PasswordHistory:
        return PasswordHistory.objects.create(
            user=user,
            hashed_password=hashed_password
        )
    @staticmethod
    def get_recent(user, limit: int) -> List[PasswordHistory]:
        return PasswordHistory.objects.filter(user=user).order_by('-created_at')[:limit]
    @staticmethod
    def is_password_in_history(user, plain_password: str, limit: int = 3) -> bool:
        recent = PasswordHistoryRepository.get_recent(user, limit)
        for history_entry in recent:
            if user.check_password(plain_password):                
                if check_password(plain_password, history_entry.hashed_password):
                    return True
        return False

class CredentialRepository:
    MAX_FAILED_ATTEMPTS = 4
    @staticmethod
    def get_user_credential(user) -> Optional[Credential]:
        return Credential.objects.filter(user=user).first()
    @staticmethod
    def create(user, **kwargs) -> Credential:
        return Credential.objects.create(user=user, **kwargs)
    @staticmethod
    def increment_failed_attempts(user):
        credential = CredentialRepository.get_user_credential(user)
        credential.failed_attempts += 1
        if credential.failed_attempts >= CredentialRepository.MAX_FAILED_ATTEMPTS:
            credential.is_locked = True
            credential.lock_until = timezone.now()
        credential.save(update_fields=["failed_attempts", "is_locked", "lock_until"])
    @staticmethod
    def reset_attempts(user):        
        LoginSessionRepository.logout_all_user_sessions(user)   
    @staticmethod
    def reset_password(user,new_password):
        user = UserRepository.get_by_dni(user.dniid)
        Credential.objects.filter(user=user).update(
            force_password_change=True,
            last_password_change=timezone.now(),
            failed_attempts=0,
            is_locked=False,
            lock_until=None
        )        
        user.set_password(new_password)
        user.save(update_fields=["password"])
            
    @staticmethod
    def force_password_change(user, value: bool = True):
        Credential.objects.filter(user=user).update(
            force_password_change=value
        )
    @staticmethod
    def update_password_change_date(user):
        Credential.objects.filter(user=user).update(
            last_password_change=timezone.now()
        )    
    @staticmethod
    def activate(user):
        Credential.objects.filter(user=user).update(
            active=True
        )    
    @staticmethod
    def deactivate(user):
        Credential.objects.filter(user=user).update(
            active=False
        )
    @staticmethod
    def is_password_expired(user) -> bool:
        credential = CredentialRepository.get_user_credential(user)
        return credential.is_password_expired()
    @staticmethod
    def days_until_expiry(user):
        credential = CredentialRepository.get_user_credential(user)
        return credential.days_until_expiry()
    @staticmethod
    def needs_password_warning(user) -> bool:
        credential = CredentialRepository.get_user_credential(user)
        return credential.needs_password_warning()

class LoginSessionRepository:
    @staticmethod
    def create(user, ip_address: str, device_info: str, jwt_token_hash: str):
        return LoginSession.objects.create(
            user=user,
            ip_address=ip_address,
            device_info=device_info,
            jwt_token_hash=jwt_token_hash,
            status="active"
        )
    @staticmethod
    def get_active_sessions(user) -> QuerySet:
        return LoginSession.objects.filter(user=user, status="active")
    @staticmethod
    def close(session: LoginSession):
        session.status = "logout"
        session.logout_at = timezone.now()
        session.save(update_fields=["status", "logout_at"])
    @staticmethod
    def logout_all_user_sessions(user, except_session_id=None):
        qs = LoginSession.objects.filter(user=user, status__in=['active', 'success'])
        if except_session_id:
            qs = qs.exclude(id=except_session_id)
        qs.update(status='logout', logout_at=timezone.now())

class LoginAttemptRepository:
    @staticmethod
    def create(
        username: str,
        ip_address: str,
        device_info: str,
        attempt_type: str,
        success: bool,
        error_message: str = ""
    ) -> LoginAttempt:
        return LoginAttempt.objects.create(
            username=username,
            ip_address=ip_address,
            device_info=device_info,
            attempt_type=attempt_type,
            success=success,
            error_message=error_message
        )
    @staticmethod
    def get_recent_attempts(username: str, minutes: int) -> QuerySet:
        threshold = timezone.now() - timezone.timedelta(minutes=minutes)
        return LoginAttempt.objects.filter(
            username=username,
            attempted_at__gte=threshold
        )
    @staticmethod
    def count_failed_attempts(username: str, minutes: int) -> int:
        threshold = timezone.now() - timezone.timedelta(minutes=minutes)
        return LoginAttempt.objects.filter(
            username=username,
            success=False,
            attempted_at__gte=threshold
        ).count()
