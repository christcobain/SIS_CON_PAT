from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework import status
from rest_framework_simplejwt.exceptions import TokenError
from drf_spectacular.utils import extend_schema, OpenApiResponse
from .serializers import (
    LoginRequestSerializer,
    LoginResponseSerializer,
    ChangePasswordRequestSerializer,
    ChangePasswordResponseSerializer,
    SuccessResponseSerializer,
    ErrorResponseSerializer
)
from .services import (
    LoginSessionService,
    CredentialService
)


def _set_cookies(response, access_token, refresh_token):
    cookie_secure = getattr(settings, 'JWT_AUTH_COOKIE_SECURE', False)
    cookie_samesite = getattr(settings, 'JWT_AUTH_COOKIE_SAMESITE', 'Lax')
    access_lifetime = int(settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME'].total_seconds())
    refresh_lifetime = int(settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME'].total_seconds()) 
    response.set_cookie(
        key=settings.JWT_AUTH_COOKIE,
        value=str(access_token),
        httponly=True,
        secure=cookie_secure,
        samesite=cookie_samesite,
        max_age=access_lifetime,
        path='/'
    )    
    response.set_cookie(
        key=settings.JWT_AUTH_REFRESH_COOKIE,
        value=str(refresh_token),
        httponly=True,
        secure=cookie_secure,
        samesite=cookie_samesite,
        max_age=refresh_lifetime,
        path='/'
    )    
    return response
def _get_client_ip(request):
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        return x_forwarded_for.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR', '0.0.0.0')
def _get_device_info(request):
    return request.META.get('HTTP_USER_AGENT', 'Unknown')

class LoginView(APIView):
    permission_classes = [AllowAny]    
    @extend_schema(
        tags=['Autenticación'],
        summary='Iniciar sesión',
        description='Autentica un usuario y establece JWT tokens en cookies HTTP-only',
        request=LoginRequestSerializer,
        responses={
            200: OpenApiResponse(
                response=LoginResponseSerializer,
                description='Autenticación exitosa'
            ),
            401: OpenApiResponse(
                response=ErrorResponseSerializer,
                description='Credenciales inválidas o usuario inactivo'
            ),
        }
    )
    def post(self, request):
        serializer = LoginRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)        
        username = serializer.validated_data['username']
        password = serializer.validated_data['password']
        ip_address = _get_client_ip(request)
        device_info = _get_device_info(request)        
        result = LoginSessionService.login(
            username=username,
            password=password,
            ip_address=ip_address,
            device_info=device_info
        )
        if not result.get('success'):
            return Response({'error': result.get('error') or result.get('message')},
                status=status.HTTP_401_UNAUTHORIZED)

        user_data = {
            'nombres': result['nombres'],
            'apellidos': result['apellidos'],
            'role': result['role'],                
            'permissions': result['permissions'],
            'sedes': result['sedes'],
            'dependencia': result['dependencia'],
            'password_expires_in_days': result.get('password_expires_in_days'),
            'needs_password_warning': result.get('needs_password_warning')
        }
        response = Response(user_data, status=status.HTTP_200_OK)
        return _set_cookies(response, result['access'], result['refresh'])

class LogoutView(APIView):
    permission_classes = [IsAuthenticated]    
    @extend_schema(
        tags=['Autenticación'],
        summary='Cerrar sesión',
        description='Invalida la sesión actual y elimina tokens',
        responses={
            200: OpenApiResponse(
                response=SuccessResponseSerializer,
                description='Sesión cerrada'
            ),
        }
    )
    def post(self, request):
        user = request.user
        ip_address = _get_client_ip(request)
        device_info = _get_device_info(request)
        refresh_token = request.COOKIES.get(settings.JWT_AUTH_REFRESH_COOKIE)
        result=LoginSessionService.logout(user, refresh_token,
                                   ip_address, device_info)        
        if not result.get('success'):
            return Response({'error': result.get('error') or result.get('message')},
                status=status.HTTP_400_BAD_REQUEST)
        response = Response(result,status=status.HTTP_200_OK)
        if result.get('success'):
            response.delete_cookie(settings.JWT_AUTH_COOKIE, path='/')
            response.delete_cookie(settings.JWT_AUTH_REFRESH_COOKIE, path='/')        
        return response

class RefreshTokenView(APIView):
    permission_classes = [AllowAny]    
    @extend_schema(
        tags=['Autenticación'],
        summary='Renovar token',
        description='Genera nuevo access token usando refresh token',
        responses={
            200: OpenApiResponse(
                response=SuccessResponseSerializer,
                description='Token renovado'
            ),
            401: OpenApiResponse(
                response=ErrorResponseSerializer,
                description='Token inválido o expirado'
            ),
        }
    )
    def post(self, request):
        refresh_token = request.COOKIES.get(settings.JWT_AUTH_REFRESH_COOKIE)        
        if not refresh_token:
            return Response(
                {'error': 'No hay refresh token'},status=status.HTTP_401_UNAUTHORIZED)        
        try:
            result = LoginSessionService.refresh(refresh_token)            
            user_data = {
                'nombre_completo': f"{result['nombres']} {result['apellidos']}",
                'role': result['role'],
                'permissions': result['permissions'],
                'sedes': result['sedes'],
                'dependencia': result['dependencia'],
                'password_expires_in_days': result.get('password_expires_in_days'),
                'needs_password_warning': result.get('needs_password_warning')
            }
            response = Response(user_data, status=status.HTTP_200_OK)
            return _set_cookies(response, result['access'], result['refresh'])            
        except TokenError:
            return Response(
                {'error': 'Token inválido o expirado'},
                status=status.HTTP_401_UNAUTHORIZED
            )

class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]    
    @extend_schema(
        tags=['Autenticación'],
        summary='Cambiar contraseña',
        description='Cambia la contraseña del usuario autenticado',
        request=ChangePasswordRequestSerializer,
        responses={
            200: OpenApiResponse(
                response=ChangePasswordResponseSerializer,
                description='Contraseña cambiada'
            ),
            400: OpenApiResponse(
                response=ErrorResponseSerializer,
                description='Error en validación'
            ),
        }
    )
    def post(self, request):
        serializer = ChangePasswordRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)        
        new_password = serializer.validated_data['new_password']
        result = CredentialService.reset_password(request.user, new_password)
        if not result.get('success'):
            return Response(
                {'error': result.get('error')},
                status=status.HTTP_400_BAD_REQUEST
            )        
        return Response({
            'success': result.success,
            'message': result.get('message'),
            'requires_relogin': True
        }, status=status.HTTP_200_OK)

# class MeView(APIView):
#     permission_classes = [IsAuthenticated]    
#     @extend_schema(
#         tags=['Usuario'],
#         summary='Obtener perfil',
#         description='Retorna información del usuario actual',
#         responses={
#             200: OpenApiResponse(
#                 response=UserDetailResponseSerializer,
#                 description='Información del usuario'
#             ),
#         }
#     )
#     def get(self, request):
#         user = request.user        
#         return Response({
#             'nombre_completo': user.nombres + " " + user.apellidos,
#             'role': user.role.code if user.role else None,                
#             'permissions': user.permissions,
#             'sedes': user.sedes,
#             'dependencia': user.dependencia,
#         })