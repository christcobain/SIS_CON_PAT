from django.contrib import auth
from django.conf import settings
from rest_framework import status
from rest_framework.viewsets import ViewSet
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from django.core.exceptions import ValidationError
from rest_framework.decorators import action
from users.models import User
from rest_framework.exceptions import NotFound
from rest_framework_simplejwt.exceptions import TokenError
from drf_spectacular.utils import extend_schema, OpenApiResponse
from .services import ( LoginSessionService, CredentialService,LoginAttemptService,
    PasswordPolicyService,PasswordHistoryService )
from .serializers import (PasswordPolicySerializer,PasswordHistoryQuerySerializer,PasswordHistorySerializer,
                          LoginRequestSerializer,LoginResponseSerializer,ActiveSessionSerializer,
                          MultipleSessionSerializer,LoginAttemptSerializer,
                          AdminResetPasswordSerializer,LoginSessionHistorialSerializer,CredentialListSerializer,UnlockCredentialSerializer,
                          UserChangePasswordSerializer,SuccessResponseSerializer, ErrorResponseSerializer)
from roles.permissions import IsSysAdmin
from django.contrib.auth import get_user_model
from roles.permissions import HasJWTPermission


User = get_user_model()

def _get_client_ip(request) -> str:
    x_forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
    return x_forwarded.split(',')[0].strip() if x_forwarded else request.META.get('REMOTE_ADDR', '0.0.0.0')
def _get_device_info(request) -> str:
    return request.META.get('HTTP_USER_AGENT', 'Unknown')[:500]
def _set_cookies(response, access_token: str, refresh_token: str) -> Response:
    secure   = getattr(settings, 'JWT_AUTH_COOKIE_SECURE')
    samesite = getattr(settings, 'JWT_AUTH_COOKIE_SAMESITE')
    access_lifetime  = int(settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME'].total_seconds())
    refresh_lifetime = int(settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME'].total_seconds())
    kwargs = {'httponly': True, 'secure': secure, 'samesite': samesite, 'path': '/'}
    response.set_cookie(settings.JWT_AUTH_COOKIE,         access_token,  max_age=access_lifetime,  **kwargs)
    response.set_cookie(settings.JWT_AUTH_REFRESH_COOKIE, refresh_token, max_age=refresh_lifetime, **kwargs)
    return response

class LoginViewSet(ViewSet):    
    permission_classes= [AllowAny]
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
    def create(self, request):
        serializer = LoginRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = LoginSessionService.login(
            username=    serializer.validated_data['username'],
            password    = serializer.validated_data['password'],
            ip_address  = _get_client_ip(request),
            device_info = _get_device_info(request),
        )
        if not result.get('success'):
            return Response({'error': result.get('message')}, status=status.HTTP_401_UNAUTHORIZED)
        user_data = {
            'id':                  result['id'],
            'username':            result['username'],
            'nombres':                  result['nombres'],
            'apellidos':                result['apellidos'],
            'cargo':                    result['cargo'],
            'role':                     result['role'],
            'permissions':              result['permissions'],
            'permissions_flat':         result['permissions_flat'],
            'sedes':                    result['sedes'],
            'modulo_id':                result.get('modulo_id'), 
            'modulo_nombre'         : result.get('modulo_nombre'), 
            'empresa_id':               result.get('empresa_id'),   
            'empresa_nombre':           result.get('empresa_nombre'), 
            'password_expires_in_days': result.get('password_expires_in_days'),
            'needs_password_warning':   result.get('needs_password_warning', False),
            'access':                   result['access'],
        }
        response = Response(user_data, status=status.HTTP_200_OK)
        return _set_cookies(response, result['access'], result['refresh'])
class CredentialViewSet(ViewSet):
    def get_permissions(self):
        perms = {
            'list':   [HasJWTPermission('ms-usuarios:authentication:view_credential')],
            'unlock': [HasJWTPermission('ms-usuarios:authentication:add_credential')],
        }
        return perms.get(self.action, [IsAuthenticated()])
    def list(self, request):
        def parse_bool(val):
            if val is None: return None
            return val.lower() in ('true', '1')
        result = CredentialService.get_all(
            dni=request.query_params.get('dni'),
            is_locked=parse_bool(request.query_params.get('is_locked')),
            is_active=parse_bool(request.query_params.get('is_active')),
        )
        return Response(CredentialListSerializer(result, many=True).data)

    @action(detail=False, methods=['post'], url_path='unlock')
    def unlock(self, request):
        ser = UnlockCredentialSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        try:
            result = CredentialService.unlock(ser.validated_data['username'])
            return Response(result, status=status.HTTP_200_OK)
        except ValidationError as e:
            return Response({'error': str(e.message)}, status=status.HTTP_400_BAD_REQUEST)

class LoginSessionViewSet(ViewSet): 
    def get_permissions(self):
        perms = {            
            'list':  [HasJWTPermission('ms-usuarios:authentication:view_loginsession')],          
        }
        return perms.get(self.action, [IsAuthenticated()])
    @extend_schema(
        tags=['Autenticación'],
        summary='Ver sesión Activa',
        description='Ver todas las sesiones o login activos, tambien se puede filtrar asi: api/v1/auth/login/sessions/?dni=12345678',
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
    def list(self, request):
        dni = request.query_params.get("dni")
        result = LoginSessionService.get_active_sessions(dni=dni)
        serializer = ActiveSessionSerializer(result, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

class LoginSessionHistorialViewSet(ViewSet):
    def get_permissions(self):
        return [HasJWTPermission('ms-usuarios:authentication:view_loginsession')]
    def list(self, request):
        dni    = request.query_params.get('dni')
        status_filter = request.query_params.get('status')
        limit  = int(request.query_params.get('limit', 100))
        result = LoginSessionService.get_all_sessions(dni=dni, status=status_filter, limit=limit)
        return Response(LoginSessionHistorialSerializer(result, many=True).data)

class LoginAttemptViewSet(ViewSet):
    def get_permissions(self):
        return [HasJWTPermission('ms-usuarios:authentication:view_loginattempt')]
    def list(self, request):
        dni          = request.query_params.get('dni')
        success_raw  = request.query_params.get('success')
        attempt_type = request.query_params.get('attempt_type')
        limit        = int(request.query_params.get('limit', 200))
        success = None
        if success_raw is not None:
            success = success_raw.lower() in ('true', '1', 'yes')
        result = LoginAttemptService.get_all(
            dni=dni, success=success, attempt_type=attempt_type, limit=limit
        )
        return Response(LoginAttemptSerializer(result, many=True).data)
 
class LogoutViewSet(ViewSet):    
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
    def create(self, request):
        refresh_token = request.COOKIES.get(settings.JWT_AUTH_REFRESH_COOKIE)
        result = LoginSessionService.logout(
            user          = request.user,
            refresh_token = refresh_token,
            ip_address    = _get_client_ip(request),
            device_info   = _get_device_info(request),
        )
        response = Response(
            {'success': result['success'], 'message': result['message']},
            status=status.HTTP_200_OK if result['success'] else status.HTTP_400_BAD_REQUEST,
        )
        if result['success']:
            auth.logout(request)
            response.delete_cookie(settings.JWT_AUTH_COOKIE, path='/')
            response.delete_cookie(settings.JWT_AUTH_REFRESH_COOKIE, path='/')
            session_cookie_name = getattr(settings, 'SESSION_COOKIE_NAME', 'sessionid')
            response.delete_cookie(session_cookie_name, path='/')            
            response.delete_cookie('csrftoken', path='/')
        return response

class RefreshTokenViewSet(ViewSet):
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
    def create(self, request):
        refresh_token = request.COOKIES.get(settings.JWT_AUTH_REFRESH_COOKIE)
        if not refresh_token:
            return Response({'error': 'No hay refresh token.'}, status=status.HTTP_401_UNAUTHORIZED)
        try:
            result = LoginSessionService.refresh(refresh_token)
            user_data = {
                'id':                  result['id'],
                'nombres':                  result['nombres'],
                'apellidos':                result['apellidos'],
                'role':                     result['role'],
                'permissions':              result['permissions'],
                'sedes':                    result['sedes'],
                'modulo_id':                result.get('modulo_id'), 
                'modulo_nombre': result.get('modulo_nombre'), 
                'empresa_id':               result.get('empresa_id'),   
                'empresa_nombre':           result.get('empresa_nombre'), 
                'password_expires_in_days': result.get('password_expires_in_days'),
                'needs_password_warning':   result.get('needs_password_warning', False),
                'access':                   result['access'],
            }
            response = Response(user_data, status=status.HTTP_200_OK)
            return _set_cookies(response, result['access'], result['refresh'])
        except TokenError:
            return Response({'error': 'Token inválido o expirado.'}, status=status.HTTP_401_UNAUTHORIZED)

class MultipleSessionViewSet(ViewSet):
    def get_permissions(self):
        perms = {            
            'create':  [HasJWTPermission('ms-usuarios:authentication:add_credential')],          
        }
        return perms.get(self.action, [IsAuthenticated()])
    @extend_schema(
        tags=['Autenticación'],
        summary='Multiple sesión',
        description='Activa o Inactiva el acceso a múltiples sesiones (varias PCs)',
        request=MultipleSessionSerializer,
        responses={
            200: OpenApiResponse(response=SuccessResponseSerializer),
            401: OpenApiResponse(
                response=ErrorResponseSerializer,
                description='Error en permiso'
            ),
        }
    )
    def create(self, request):
        serializer = MultipleSessionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        username = serializer.validated_data.get("username")
        option_id = serializer.validated_data.get("option_id")
        if not username or not option_id:
            return Response("username y option_id son requeridos.",status=status.HTTP_400_BAD_REQUEST)
        result = CredentialService.update_multiple_sessions(
            username=username,
            option_id=int(option_id)
        )
        return Response(result, status=status.HTTP_200_OK)
    
class ChangePasswordViewSet(ViewSet):
    def get_permissions(self):
        perms = {            
            'create':  [AllowAny()],          
        }
        return perms.get(self.action, [IsAuthenticated()])
    @extend_schema(
        tags=['Autenticación'],
        summary='SYSADMIN-Cambiar contraseña',
        description='SYSADMIN es quien cambia la contraseña del usuario autenticado',
        request=AdminResetPasswordSerializer,
        responses={
            200: OpenApiResponse(
                response=AdminResetPasswordSerializer,
                description='Contraseña cambiada'
            ),
            400: OpenApiResponse(
                response=ErrorResponseSerializer,
                description='Error en validación'
            ),
        }
    )
    def create(self, request):
        serializer = AdminResetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        username = serializer.validated_data["username"]
        new_password = serializer.validated_data.get("new_password")
        result = CredentialService.reset_by_admin(
                    username=username,
                    new_password=new_password
                )
        response= Response(result, status=status.HTTP_200_OK)
        return response    
            
class chancePasswordUserViewSet(ViewSet):
    def get_permissions(self):
        self.permission_classes = [AllowAny]
        return super().get_permissions()
    @extend_schema(
        tags=['Autenticación'],
        summary='User-Cambiar contraseña',
        description='User es quien cambia su propia contraseña',
        request=UserChangePasswordSerializer,
        responses={
            200: OpenApiResponse(
                response=UserChangePasswordSerializer,
                description='Contraseña cambiada'
            ),
            400: OpenApiResponse(
                response=ErrorResponseSerializer,
                description='Error en validación'
            ),
        }
    )
    def create(self, request):
        serializer = UserChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        username = serializer.validated_data["username"]
        current_password = serializer.validated_data["current_password"]
        new_password = serializer.validated_data["new_password"]
        result = CredentialService.change_password_by_user(
            username=username,
            current_password=current_password,
            new_password=new_password
        )
        response = Response(result, status=status.HTTP_200_OK)
        response.delete_cookie(settings.JWT_AUTH_COOKIE, path="/")
        response.delete_cookie(settings.JWT_AUTH_REFRESH_COOKIE, path="/")
        return response
    
class PasswordPolicyView(ViewSet):
    def get_permissions(self):
        perms = {            
            'list':               [ HasJWTPermission('ms-usuarios:authentication:view_passwordpolicy')],
            'retrieve':           [HasJWTPermission('ms-usuarios:authentication:view_passwordpolicy')],
            'create':  [HasJWTPermission('ms-usuarios:authentication:add_passwordpolicy')],
            'update':             [HasJWTPermission('ms-usuarios:authentication:change_passwordpolicy')],
            'activate':        [ HasJWTPermission('ms-usuarios:authentication:change_passwordpolicy')],
            'dectivate':   [HasJWTPermission('ms-usuarios:authentication:change_passwordpolicy')],
            'active':   [HasJWTPermission('ms-usuarios:authentication:add_passwordpolicy')],            
        }
        return perms.get(self.action, [IsAuthenticated()])
    @extend_schema(
        tags=['Autenticación'],
        summary="Listado de políticas de contraseña",
        description="Lista todas las políticas de contraseña registradas. Solo SYSADMIN.",
        responses={
            200: PasswordPolicySerializer(many=True)
        }
    )
    def list(self, request):
        policies = PasswordPolicyService.get_all()
        return Response(PasswordPolicySerializer(policies, many=True).data)
    @extend_schema(
        tags=['Autenticación'],
        summary="Detalle de política de contraseña",
        description="Obtiene el detalle de una política específica. Solo SYSADMIN.",
        responses={
            200: PasswordPolicySerializer,
            404: ErrorResponseSerializer
        }
    )
    def retrieve(self, request, pk=None):
        result = PasswordPolicyService.get_by_id(pk)
        if not result['success']:
            return Response(result, status=status.HTTP_404_NOT_FOUND)
        return Response(PasswordPolicySerializer(result['data']).data)
    
    @extend_schema(
        tags=['Autenticación'],
        summary="Crear política de contraseña",
        description="Crea una nueva política de contraseña. Solo SYSADMIN.",
        request=PasswordPolicySerializer,
        responses={
            201: PasswordPolicySerializer,
            400: ErrorResponseSerializer
        }
    )
    def create(self, request):
        serializer = PasswordPolicySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        data['created_by'] = request.user
        policy = PasswordPolicyService.create(data)
        return Response(policy,status=status.HTTP_201_CREATED)
    @extend_schema(
        tags=['Autenticación'],
        summary="Actualizar política de contraseña",
        description="Actualiza parcialmente una política existente. Solo SYSADMIN.",
        request=PasswordPolicySerializer,
        responses={
            200: PasswordPolicySerializer,
            400: ErrorResponseSerializer,
            404: ErrorResponseSerializer
        }
    )
    def update(self, request, pk=None):
        ser = PasswordPolicySerializer(data=request.data, partial=True)
        ser.is_valid(raise_exception=True)
        result = PasswordPolicyService.update(pk, ser.validated_data)
        if not result['success']:
            return Response(result, status=status.HTTP_400_BAD_REQUEST)
        return Response(result,status=status.HTTP_200_OK)    
    @extend_schema(
        tags=['Autenticación'],
        summary="Activar política de contraseña",
        description="Activa una política de contraseña específica. Solo SYSADMIN.",
        responses={
            200: SuccessResponseSerializer,
            404: ErrorResponseSerializer
        }
    )
    @action(detail=True, methods=['put'])
    def activate(self, request, pk=None):
        result = PasswordPolicyService.activate(pk)   
        if not result['success']:
            return Response(result, status=status.HTTP_404_NOT_FOUND)  
        return Response(result, status=status.HTTP_200_OK)
    @extend_schema(
        tags=['Autenticación'],
        summary="Desactivar política de contraseña",
        description="Desactiva una política de contraseña específica. Solo SYSADMIN.",
        responses={
            200: SuccessResponseSerializer,
            404: ErrorResponseSerializer
        }
    )
    @action(detail=True, methods=['delete'])
    def deactivate(self, request, pk=None):
        result = PasswordPolicyService.deactivate(pk)   
        if not result['success']:
            return Response(result, status=status.HTTP_404_NOT_FOUND)  
        return Response(result, status=status.HTTP_200_OK)
    @extend_schema(
        tags=['Autenticación'],
        summary="Obtener política activa",
        description="Obtiene la política de contraseña actualmente activa.",
        responses={
            200: PasswordPolicySerializer,
            404: ErrorResponseSerializer
        }
    )
    @action(detail=False, methods=['get'])
    def active(self, request):
        policy = PasswordPolicyService.get_active()
        if not policy:
            return Response(
                {'detail': 'No hay política activa.'},status=status.HTTP_404_NOT_FOUND)
        return Response(PasswordPolicySerializer(policy).data)

class PasswordHistoryView(ViewSet):
    def get_permissions(self):
        perms = {
            'create':  [HasJWTPermission('ms-usuarios:authentication:add_passwordhistory')],
        }
        return perms.get(self.action, [IsAuthenticated()])
    @extend_schema(
        tags=["Autenticación"],
        summary="Obtener historial reciente de contraseñas",
        description="Devuelve el historial reciente de contraseñas de un usuario específico.",
        request=PasswordHistoryQuerySerializer,
        responses={
            200: PasswordHistorySerializer(many=True),
            400: dict,
            404: dict,
        }
    )
    def create(self, request):
        serializer = PasswordHistoryQuerySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user_id = serializer.validated_data["user_id"]
        limit = serializer.validated_data["limit"]
        user = User.objects.filter(pk=user_id).first()
        if not user:
            return Response(
                {"detail": "Usuario no encontrado."},
                status=status.HTTP_404_NOT_FOUND
            )
        histories = PasswordHistoryService.get_recent(user=user, limit=limit)
        return Response(
            PasswordHistorySerializer(histories, many=True).data,
            status=status.HTTP_200_OK
        )