# backend/ms-usuarios/authentication/backends.py
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken
from django.conf import settings
from django.contrib.auth import get_user_model

User = get_user_model()

class CookieJWTAuthentication(JWTAuthentication):
    def authenticate(self, request):
        cookie_name = getattr(settings, 'JWT_AUTH_COOKIE', 'sisconpat_access')
        raw_token = request.COOKIES.get(cookie_name)
        if raw_token is None:
            return None
        try:
            validated_token = self.get_validated_token(raw_token)
        except InvalidToken:
            return None
        return self.get_user(validated_token), validated_token


class AdminJWTAuthBackend:
    def authenticate(self, request, **kwargs):
        if not request:
            return None        
        cookie_name = getattr(settings, 'JWT_AUTH_COOKIE', 'sisconpat_access')
        raw_token = request.COOKIES.get(cookie_name)        
        if not raw_token:
            return None          
        try:     
            auth = JWTAuthentication()
            validated_token = auth.get_validated_token(raw_token)                 
            token_username = validated_token.get('username') 
            token_role = validated_token.get('role')      
            if token_role == 'SYSADMIN' and token_username:
                user = User.objects.filter(
                    username=token_username, 
                    role__name='SYSADMIN', 
                    is_staff=True
                ).first()                
                return user
        except Exception:
            return None
        return None
    def get_user(self, user_id):
        try:
            return User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return None