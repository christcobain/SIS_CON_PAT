
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken
from django.conf import settings
from rest_framework_simplejwt.models import TokenUser
from django.contrib.auth import get_user_model

User = get_user_model()


class CookieJWTAuthentication(JWTAuthentication):
    def authenticate(self, request):
        # 1. Header Authorization: Bearer <token>  ← cross-domain (producción)
        header = self.get_header(request)
        if header is not None:
            raw_token = self.get_raw_token(header)
            if raw_token is not None:
                try:
                    validated_token = self.get_validated_token(raw_token)
                    return self.get_user(validated_token), validated_token
                except InvalidToken:
                    return None

        # 2. Cookie HttpOnly  ← mismo dominio (desarrollo local)
        raw_token = request.COOKIES.get(
            getattr(settings, 'JWT_AUTH_COOKIE', 'sisconpat_access')
        )
        if raw_token is None:
            return None
        try:
            validated_token = self.get_validated_token(raw_token)
        except InvalidToken:
            return None
        return self.get_user(validated_token), validated_token

    def get_user(self, validated_token):
        user = TokenUser(validated_token)
        user.get_session_auth_hash = lambda: None
        return user


class AdminJWTAuthBackend:
    def authenticate(self, request, **kwargs):
        if not request:
            return None
        raw_token = request.COOKIES.get(
            getattr(settings, 'JWT_AUTH_COOKIE', 'sisconpat_access')
        )
        if not raw_token:
            return None
        try:
            auth = JWTAuthentication()
            validated_token = auth.get_validated_token(raw_token)
            if validated_token.get('role') == 'SYSADMIN':
                return User.objects.filter(username='SYSADMIN', is_staff=True).first()
        except Exception:
            return None
        return None

    def get_user(self, user_id):
        try:
            return User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return None