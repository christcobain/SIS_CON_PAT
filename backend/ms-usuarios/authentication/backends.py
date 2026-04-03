from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken
from django.conf import settings as django_settings

from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken
from django.conf import settings
from rest_framework_simplejwt.models import TokenUser


class CookieJWTAuthentication(JWTAuthentication):
    def authenticate(self, request):
        cookie_name = getattr(django_settings, 'JWT_AUTH_COOKIE', 'sisconpat_access')
        raw_token = request.COOKIES.get(cookie_name)
        if raw_token is None:
            return None
        try:
            validated_token = self.get_validated_token(raw_token)
        except InvalidToken:
            return None
        return self.get_user(validated_token), validated_token



