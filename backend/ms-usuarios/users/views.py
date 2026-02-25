from rest_framework import status
from rest_framework.viewsets import ViewSet
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated,AllowAny
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiTypes
from .services import UserService,DependencyService,BDEmpleadosService
from .serializers import (BDEmpleadosSerializer, UserListSerializer,UserDetailSerializer,UserCreateSerializer,UserUpdateSerializer,
                          DependencySerializer, DependencyCreateUpdateSerializer)

from rest_framework.decorators import action

class BDEmpleadosViewSet(ViewSet):
    permission_classes = [AllowAny]
    lookup_field = "dni"
    lookup_url_kwarg = "dni"
    @extend_schema(
        tags=['Users'],
        summary="Buscar empleado por DNI en BD Empleados",
        description="Retorna un empleado según su DNI desde la base de datos de empleados.",
        parameters=[
            OpenApiParameter(
                name="dni",
                description="DNI del empleado a buscar",
                required=True,
                type=OpenApiTypes.STR,
                location=OpenApiParameter.PATH
            )
        ]
    )
    def retrieve(self, request, dni=None):
        result = BDEmpleadosService.get_by_dni(dni)
        serializer = BDEmpleadosSerializer(result)
        return Response(serializer.data, status=status.HTTP_200_OK)

class DependencyViewSet(ViewSet):
    permission_classes = [AllowAny]
    @extend_schema(
        tags=['Users'],
        summary="Listar dependencias",
        description="Obtiene la lista de dependencias.",
        responses={200: DependencySerializer(many=True)}
    )
    def list(self, request):
        result = DependencyService.get_all_dependencies()
        if not result['success']:
            return Response(result, status=status.HTTP_400_BAD_REQUEST)   
        serializer = DependencySerializer(result["data"], many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)       
    @extend_schema(
        tags=['Users'],
        summary="Obtener dependencia por ID",
        description="Retorna el detalle completo de una dependencia.",
        responses={200: DependencySerializer}
    )
    def retrieve(self, request, pk=None):
        dependency = DependencyService.get_dependency_by_id(pk)
        if not dependency['success']:        
            return Response(dependency, status=status.HTTP_400_BAD_REQUEST)
        serializer = DependencySerializer(dependency["data"])
        return Response(serializer.data, status=status.HTTP_200_OK)
    @extend_schema(
        tags=['Users'],
        summary="Crear dependencia",
        description="Crea una nueva dependencia.",
        request=DependencyCreateUpdateSerializer,
        responses={201: DependencySerializer, 
                   400: OpenApiTypes.OBJECT}
    )
    def create(self, request):
        serializer = DependencyCreateUpdateSerializer(data=request.data)  
        serializer.is_valid(raise_exception=True)        
        try:
            result = DependencyService.create_dependency(serializer.validated_data)
            if not result['success']:
                return Response(result, status=status.HTTP_400_BAD_REQUEST)
            return Response(result, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"success": False, "error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    @extend_schema(
        tags=['Users'],
        summary="Actualizar dependencia",
        description="Actualiza parcialmente o completamente una dependencia.",
        request=DependencyCreateUpdateSerializer,
        responses={200: DependencySerializer}
    )
    def update(self, request, pk=None):
        serializer = DependencyCreateUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        response = DependencyService.update_dependency(pk,serializer.validated_data)
        if not response['success']:
            return Response(response, status=status.HTTP_400_BAD_REQUEST)
        return Response(response, status=status.HTTP_200_OK)
    @extend_schema(
        tags=['Users'],
        summary="Activar dependencia",
        description="Activa una dependencia (estado=True, is_active=True).",
        responses={200: OpenApiTypes.OBJECT}
    )
    @action(detail=True, methods=["patch"])
    def activate(self, request, pk=None):
        result = DependencyService.activate_dependency(pk)
        if not result['success']:
            return Response(result, status=status.HTTP_404_NOT_FOUND)        
        return Response(result, status=status.HTTP_200_OK)
    @extend_schema(
        tags=['Users'],
        summary="Desactivar dependencia",
        description="Desactiva una dependencia (estado=False, is_active=False).",
        responses={200: OpenApiTypes.OBJECT}
    )
    @action(detail=True, methods=["patch"])
    def deactivate(self, request, pk=None):        
        result = DependencyService.deactivate_dependency(pk)
        if not result['success']:
            return Response(result, status=status.HTTP_404_NOT_FOUND)        
        return Response(result, status=status.HTTP_200_OK)

class UserViewSet(ViewSet):
    permission_classes = [AllowAny]
    @extend_schema(
        tags=['Users'],
        summary="Listar usuarios filtrados",
        description="Obtiene la lista de usuarios con filtros dinámicos opcionales. "
                    "Se pueden combinar múltiples parámetros en la misma consulta.",
        parameters=[
            OpenApiParameter("search", OpenApiTypes.STR, description="Buscar por nombres, apellidos, DNI, username o email"),
            OpenApiParameter("es_usuario_sistema", OpenApiTypes.BOOL, description="Filtrar por tipo de usuario"),

            OpenApiParameter("is_active", OpenApiTypes.BOOL, description="Filtrar por activo/inactivo"),
            OpenApiParameter("role", OpenApiTypes.INT, description="Filtrar por ID de rol"),
            OpenApiParameter("dependencia", OpenApiTypes.INT, description="Filtrar por ID de dependencia"),
            OpenApiParameter("sedes", OpenApiTypes.INT, many=True,
                             description="Filtrar por múltiples IDs de sedes. Ej: ?sedes=1&sedes=2"),
            OpenApiParameter("cargo", OpenApiTypes.STR, description="Filtrar por cargo (icontains)"),
            OpenApiParameter("nombres", OpenApiTypes.STR, description="Filtrar por nombres (icontains)"),
            OpenApiParameter("apellidos", OpenApiTypes.STR, description="Filtrar por apellidos (icontains)"),
            OpenApiParameter("created_date", OpenApiTypes.DATE, description="Filtrar por fecha exacta (YYYY-MM-DD)"),
            OpenApiParameter("created_year", OpenApiTypes.INT, description="Filtrar por año específico"),
            OpenApiParameter("created_between", OpenApiTypes.STR,
                             description="Filtrar por rango de fechas. Formato: YYYY-MM-DD,YYYY-MM-DD"),
            OpenApiParameter("fecha_baja_between", OpenApiTypes.STR,
                             description="Filtrar por rango de fecha baja. Formato: YYYY-MM-DD,YYYY-MM-DD"),
        ],
        responses={200: UserListSerializer(many=True)}
    )
    @action(detail=False, methods=["get"])
    def filters(self, request):    
        filters = request.query_params.dict()
        result = UserService.filter_users(filters)
        if not result["success"]:
            return Response(result, status=status.HTTP_400_BAD_REQUEST)
        serializer = UserListSerializer(result["data"], many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    @extend_schema(
        tags=['Users'],
        summary="Listar usuarios",
        description="Obtiene la lista de usuarios con filtros opcionales.",
        parameters=[
            OpenApiParameter("search", OpenApiTypes.STR, description="Buscar por nombres, apellidos, DNI o username"),
            OpenApiParameter("es_usuario_sistema", OpenApiTypes.BOOL, description="Filtrar por tipo de usuario"),
            OpenApiParameter("is_active", OpenApiTypes.BOOL, description="Filtrar por estado"),
            OpenApiParameter("role", OpenApiTypes.INT, description="Filtrar por ID de rol"),
            OpenApiParameter("sede", OpenApiTypes.INT, description="Filtrar por ID de sede"),
            OpenApiParameter("dependencia", OpenApiTypes.INT, description="Filtrar por ID de dependencia"),
        ],
        responses={200: UserListSerializer(many=True)}
    )
    def list(self, request):
        result = UserService.list_users()
        if not result["success"]:
            return Response(result, status=status.HTTP_400_BAD_REQUEST)
        serializer = UserListSerializer(result["data"], many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    @extend_schema(
        tags=['Users'],
        summary="Obtener usuario por ID",
        description="Retorna el detalle completo de un usuario.",
        responses={200: UserDetailSerializer}
    )
    def retrieve(self, request, pk=None):
        user = UserService.get_user_by_id(pk)
        if not user['success']:
            return Response(user, status=status.HTTP_400_BAD_REQUEST)
        serializer = UserDetailSerializer(user["data"])
        return Response(serializer.data, status=status.HTTP_200_OK)
    @extend_schema(
        tags=['Users'],
        summary="Crear usuario",
        description="Crea un nuevo usuario. Si es usuario del sistema, se generará automáticamente username y password igual al DNI.",
        request=UserCreateSerializer,
        responses={201: UserDetailSerializer}
    )
    def create(self, request):
        serializer = UserCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        sede_ids = serializer.validated_data.pop("sedes", [])
        user = UserService.create_user(serializer.validated_data, sede_ids=sede_ids)
        if not user.get("success"):
            return Response(user, status=status.HTTP_400_BAD_REQUEST)
        return Response(user, status=status.HTTP_201_CREATED)        
    @extend_schema(
        tags=['Users'],
        summary="Actualizar usuario",
        description="Actualiza parcialmente o completamente un usuario.",
        request=UserUpdateSerializer,
        responses={200: UserDetailSerializer}
    )
    def update(self, request, pk=None):        
        serializer = UserUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        sede_ids = serializer.validated_data.pop("sedes", None)
        user = UserService.update_user(pk, serializer.validated_data, sede_ids=sede_ids)
        if not user.get("success"):
            return Response(user, status=status.HTTP_400_BAD_REQUEST)
        return Response(user, status=status.HTTP_200_OK)
    @extend_schema(
        tags=['Users'],
        summary="Activar usuario",
        description="Activa un usuario (estado=True, is_active=True).",
        responses={200: OpenApiTypes.OBJECT}
    )
    @action(detail=True, methods=["patch"])
    def activate(self, request,pk=None):
        user = UserService.activate_user(pk)
        if not user.get("success"):
            return Response(user, status=status.HTTP_404_NOT_FOUND)
        return Response(user, status=status.HTTP_200_OK)
    @extend_schema(
        tags=['Users'],
        summary="Desactivar usuario",
        description="Desactiva un usuario (estado=False, is_active=False).",
        responses={200: OpenApiTypes.OBJECT}
    )
    @action(detail=True, methods=["patch"])
    def deactivate(self, request, pk=None):
        user = UserService.deactivate_user(pk)
        if not user.get("success"):
            return Response(user, status=status.HTTP_404_NOT_FOUND)
        return Response(user, status=status.HTTP_200_OK)
  