## ms-reportes/shared/
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken
from django.conf import settings
from rest_framework_simplejwt.models import TokenUser


class CookieJWTAuthentication(JWTAuthentication):
    def authenticate(self, request):
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
        return TokenUser(validated_token)