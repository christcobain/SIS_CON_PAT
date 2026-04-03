from typing import Optional, List, Dict, Any
from django.db.models import QuerySet
from django.utils import timezone
from django.contrib.auth.hashers import check_password, make_password
from .models import PasswordPolicy, PasswordHistory, Credential, LoginSession, LoginAttempt


class PasswordPolicyRepository:
    @staticmethod
    def get_active() -> Optional[PasswordPolicy]:
        return PasswordPolicy.objects.filter(is_active=True).order_by('-id').first()
    @staticmethod
    def get_all() -> QuerySet:
        return PasswordPolicy.objects.all()
    @staticmethod
    def get_by_id(id: int) -> Dict[str, Any]:
        return (PasswordPolicy.objects.filter(pk=id).first())
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
        PasswordPolicy.objects.update(is_active=False)
        policy.is_active = True
        policy.save(update_fields=['is_active'])
    @staticmethod
    def deactivate(policy: PasswordPolicy):
        PasswordPolicy.objects.update(is_active=False)
        policy.is_active = False
        policy.save(update_fields=['is_active'])
    @staticmethod
    def validate_password(password: str) -> List[str]:
        policy = PasswordPolicyRepository.get_active()
        if not policy:
            return []
        return policy.validate_password(password)


class PasswordHistoryRepository:
    @staticmethod
    def create(user, plain_password: str) -> PasswordHistory:
        return PasswordHistory.objects.create(
            user=user,
            hashed_password=make_password(plain_password),
        )
    @staticmethod
    def get_recent(user, limit: int) -> QuerySet:
        return PasswordHistory.objects.filter(user=user).order_by('-created_at')[:limit]
    @staticmethod
    def is_password_in_history(user, plain_password: str, limit: int = 5) -> bool:
        policy = PasswordPolicyRepository.get_active()
        count = policy.history_count if policy else limit
        recent = PasswordHistoryRepository.get_recent(user, count)
        return any(
            check_password(plain_password, entry.hashed_password)
            for entry in recent
        )


class CredentialRepository:
    MAX_FAILED_ATTEMPTS = 5
    @staticmethod
    def get_by_user(user) -> Optional[Credential]:
        return Credential.objects.filter(user=user).select_related('user').first()
    @staticmethod
    def get_by_username(username) -> Optional[Credential]:
        return (
            Credential.objects
            .select_related("user")
            .filter(user__username=username)
            .first()
        )
    @staticmethod
    def get_by_id(user_id: int) -> Optional[Credential]:
        return (Credential.objects.filter(user_id=user_id).first())

    @staticmethod
    def get_all(dni: str = None, is_locked: bool = None, is_active: bool = None) -> QuerySet:
        qs = Credential.objects.select_related('user').order_by('-updated_at')
        if dni:
            qs = qs.filter(user__dni__icontains=dni)
        if is_locked is not None:
            qs = qs.filter(is_locked=is_locked)
        if is_active is not None:
            qs = qs.filter(is_active=is_active)
        return qs

    @staticmethod
    def create(user, **kwargs) -> Credential:
        return Credential.objects.create(user=user, **kwargs)
    @staticmethod
    def after_password_change(credential):
        credential.force_password_change = False
        credential.last_password_change = timezone.now()
        credential.failed_attempts = 0
        credential.is_locked = False
        credential.save(update_fields=[
            "force_password_change",
            "last_password_change",
            "failed_attempts",
            "is_locked",
        ])
    @staticmethod
    def increment_failed_attempts(credential):
        credential.failed_attempts += 1
        if credential.failed_attempts >= CredentialRepository.MAX_FAILED_ATTEMPTS:
            credential.is_locked = True
        credential.updated_at = timezone.now()
        credential.save(update_fields=["failed_attempts", "is_locked", "updated_at"])
        return credential
    @staticmethod
    def activate(user):
        user.is_active = True
        user.save(update_fields=['is_active'])
        return user
    @staticmethod
    def deactivate(user):
        user.is_active = False
        user.save(update_fields=['is_active'])
        return user
    @staticmethod
    def set_multiple_sessions(credential, allow: bool):
        credential.allow_multiple_sessions = allow
        credential.save(update_fields=["allow_multiple_sessions"])
    @staticmethod
    def unlock(credential) -> Credential:
        credential.is_locked = False
        credential.failed_attempts = 0
        credential.save(update_fields=["is_locked", "failed_attempts", "updated_at"])
        return credential
    @staticmethod
    def is_password_expired(user) -> bool:
        credential = CredentialRepository.get_by_user(user)
        return credential.is_password_expired() if credential else False
    @staticmethod
    def days_until_expiry(user) -> Optional[int]:
        credential = CredentialRepository.get_by_user(user)
        return credential.days_until_expiry() if credential else None
    @staticmethod
    def needs_password_warning(user) -> bool:
        credential = CredentialRepository.get_by_user(user)
        return credential.needs_password_warning() if credential else False


class LoginSessionRepository:
    @staticmethod
    def create(user, ip_address: str, device_info: str, jwt_token_hash: str) -> LoginSession:
        return LoginSession.objects.create(
            user=user,
            ip_address=ip_address,
            device_info=device_info,
            jwt_token_hash=jwt_token_hash,
            status='active',
        )
    @staticmethod
    def get_active_session_by_user(user) -> Optional['LoginSession']:
        return LoginSession.objects.filter(user=user, status='active').first()
    @staticmethod
    def get_active_sessions(dni: str = None):
        qs = LoginSession.objects.filter(status="active").select_related("user")
        if dni:
            qs = qs.filter(user__dni=dni)
        return qs
    @staticmethod
    def get_all_sessions(
        dni: str = None,
        status: str = None,
        limit: int = 100,
    ) -> QuerySet:
        qs = LoginSession.objects.select_related('user').order_by('-login_at')
        if dni:
            qs = qs.filter(user__dni__icontains=dni)
        if status:
            qs = qs.filter(status=status)
        return qs[:limit]
    @staticmethod
    def close(session: LoginSession):
        session.status = 'logout'
        session.logout_at = timezone.now()
        session.save(update_fields=['status', 'logout_at'])
    @staticmethod
    def logout_all_user_sessions(user, except_session_id=None):
        qs = LoginSession.objects.filter(user=user, status='active')
        if except_session_id:
            qs = qs.exclude(id=except_session_id)
        qs.update(status='logout', logout_at=timezone.now())


class LoginAttemptRepository:
    @staticmethod
    def create(
        username: str, ip_address: str, device_info: str,
        attempt_type: str, success: bool, error_message: str = '',
    ) -> LoginAttempt:
        return LoginAttempt.objects.create(
            username=username,
            ip_address=ip_address,
            device_info=device_info,
            attempt_type=attempt_type,
            success=success,
            error_message=error_message,
        )
    @staticmethod
    def get_recent_attempts(username: str, minutes: int) -> QuerySet:
        threshold = timezone.now() - timezone.timedelta(minutes=minutes)
        return LoginAttempt.objects.filter(username=username, attempted_at__gte=threshold)
    @staticmethod
    def count_failed_attempts(username: str, minutes: int) -> int:
        threshold = timezone.now() - timezone.timedelta(minutes=minutes)
        return LoginAttempt.objects.filter(
            username=username, success=False, attempted_at__gte=threshold,
        ).count()
    @staticmethod
    def get_all(
        dni: str = None,
        success: bool = None,
        attempt_type: str = None,
        limit: int = 200,
    ) -> QuerySet:
        qs = LoginAttempt.objects.order_by('-attempted_at')
        if dni:
            qs = qs.filter(dni__icontains=dni)
        if success is not None:
            qs = qs.filter(success=success)
        if attempt_type:
            qs = qs.filter(attempt_type=attempt_type)
        return qs[:limit]