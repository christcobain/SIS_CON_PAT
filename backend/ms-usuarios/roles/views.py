import logging
from rest_framework import status
from drf_spectacular.utils import (extend_schema,OpenApiParameter,OpenApiResponse)
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ViewSet
from .serializers import (PermissionSerializer, RoleListSerializer, RoleDetailSerializer,
                          CreateRoleSerializer, UpdateRoleSerializer,MultiplePermissionSerializer, 
                          RolePermissionDetailSerializer)
from .services import PermissionService, RoleService
from roles.permissions import HasJWTPermission


_log = logging.getLogger('roles.views')

class PermissionTreeViewSet(ViewSet):
    def get_permissions(self):
        perms = {
            'list': [HasJWTPermission('ms-usuarios:roles:view_role')],
        }
        return perms.get(self.action, [IsAuthenticated()])
    @extend_schema(
        summary="Árbol completo de permisos",
        description="Retorna la estructura jerárquica de permisos agrupados por microservicio y app_label.",
        responses={
            200: OpenApiResponse(description="Estructura del árbol de permisos"),
        },
        tags=["Roles"]
    )
    def list(self, request):
        service = PermissionService()
        return Response(service.tree())

class PermissionListViewSet(ViewSet):
    def get_permissions(self):
        perms = {
            'list': [HasJWTPermission('ms-usuarios:roles:view_role')],
        }
        return perms.get(self.action, [IsAuthenticated()])
    @extend_schema(
        summary="Listado de permisos",
        description="Lista permisos con filtros opcionales por microservicio, app_label y estado.",
        parameters=[
            OpenApiParameter(
                name="ms",
                description="Nombre del microservicio (ej: ms-bienes)",
                required=False,
                type=str
            ),
            OpenApiParameter(
                name="app_label",
                description="Nombre del app Django dentro del microservicio",
                required=False,
                type=str
            ),
            OpenApiParameter(
                name="active_only",
                description="Filtrar solo permisos activos (default=true)",
                required=False,
                type=bool
            ),
        ],
        responses={200: PermissionSerializer(many=True)},
        tags=["Roles"]
    )
    def list(self, request):
        service = PermissionService()
        qs = service.listar(
            active_only=request.query_params.get('active_only', 'true') != 'false',
            ms_name=request.query_params.get('ms'),
            app_label=request.query_params.get('app_label'),
        )
        return Response(PermissionSerializer(qs, many=True).data)

class KnownMicroservicesViewSet(ViewSet):
    def get_permissions(self):
        perms = {
            'list': [HasJWTPermission('ms-usuarios:roles:view_role')],
        }
        return perms.get(self.action, [IsAuthenticated()])
    @extend_schema(
        summary="Microservicios conocidos",
        description="Devuelve la lista de microservicios detectados dinámicamente desde la tabla de permisos.",
        responses={200: OpenApiResponse(description="Lista de nombres de microservicios")},
        tags=["Roles"]
    )
    def list(self, request):
        service = PermissionService()
        return Response(service.microservices())

class RoleViewSet(ViewSet):
    def get_permissions(self):
        perms = {
            'filters':           [HasJWTPermission('ms-usuarios:roles:view_role')],
            'list':           [HasJWTPermission('ms-usuarios:roles:view_role')],
            'retrieve':       [HasJWTPermission('ms-usuarios:roles:view_role')],
            'create':         [HasJWTPermission('ms-usuarios:roles:add_role')],
            'partial_update':           [HasJWTPermission('ms-usuarios:roles:change_role')],
            'activate':        [HasJWTPermission('ms-usuarios:roles:change_role')],  
            'deactivate':           [HasJWTPermission('ms-usuarios:roles:change_role')],
            'role_permissions':           [HasJWTPermission('ms-usuarios:roles:change_role')],
            'sync_permissions':           [HasJWTPermission('ms-usuarios:roles:add_rolepermission')],
        }
        return perms.get(self.action, [IsAuthenticated()])
    lookup_field = "id"
    lookup_url_kwarg = "pk"
    @extend_schema(
        summary="Listado de roles",
        description="Lista todos los roles.",
        responses={200: RoleListSerializer(many=True)},
        tags=["Roles"]
    )
    def list(self, request):
        print('roles== ',request.auth)
        result = RoleService().listar()
        if not result['success']:
            return Response(result, status=status.HTTP_400_BAD_REQUEST)        
        serializer=RoleListSerializer(result["data"], many=True)          
        return Response(serializer.data, status=status.HTTP_200_OK)
    @extend_schema(
        summary="Detalle de rol",
        description="Obtiene el detalle completo de un rol, incluyendo permisos.",
        responses={200: RoleDetailSerializer},
        tags=["Roles"]
    )
    def retrieve(self, request, pk=None):
        role = RoleService().obtener(pk)
        return Response(RoleDetailSerializer(role).data)
    @extend_schema(
        summary="Crear rol",
        description="Crea un nuevo rol. Solo SYSADMIN.",
        request=CreateRoleSerializer,
        responses={201: RoleDetailSerializer},
        tags=["Roles"]
    )
    def create(self, request):
        serializer = CreateRoleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        pids = data.pop('permission_ids', [])
        creado_por=request.user
        role = RoleService.crear(data, pids, creado_por)
        return Response(role,status=status.HTTP_201_CREATED)
    @extend_schema(
        summary="Actualizar rol",
        description="Actualiza datos o permisos de un rol. Solo SYSADMIN.",
        request=UpdateRoleSerializer,
        responses={200: RoleDetailSerializer},
        tags=["Roles"]
    )
    def partial_update(self, request, pk=None):
        serializer= UpdateRoleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        pids = data.pop('permission_ids', None)
        role = RoleService().actualizar(pk, data, pids, actualizado_por=request.user)
        return Response(role,status=status.HTTP_201_CREATED)
    @extend_schema(
        summary="Activar rol",
        description="Activa un rol. Solo SYSADMIN.",
        responses={200: RoleDetailSerializer},
        tags=["Roles"]
    )
    @action(detail=True, methods=["put"])
    def activate(self, request, pk=None):
        result = RoleService.activate(pk)   
        if not result['success']:
            return Response(result, status=status.HTTP_404_NOT_FOUND)        
        return Response(result, status=status.HTTP_200_OK)
    @extend_schema(
        summary="Desactivar rol",
        description="Desactiva un rol. Solo SYSADMIN.",
        responses={200: RoleDetailSerializer},
        tags=["Roles"]
    )
    @action(detail=True, methods=["delete"])
    def deactivate(self, request, pk=None):
        result = RoleService.deactivate(pk)
        if not result['success']:
            return Response(result, status=status.HTTP_404_NOT_FOUND)        
        return Response(result, status=status.HTTP_200_OK) 
    @extend_schema(
        summary="Permisos del rol",
        description="Lista solo los permisos asignados a un rol.",
        responses={200: RolePermissionDetailSerializer(many=True)},
        tags=["Roles"]
    )
    @action(detail=True, methods=["get"])
    def role_permissions(self, request, pk=None):
        rps = RoleService.permisos_del_rol(pk)
        return Response(RolePermissionDetailSerializer(rps, many=True).data)
    @extend_schema(
        summary="Sincroniza permisos a rol",
        description="Asigna o retira uno o varios permisos a un rol. Solo SYSADMIN.",
        request=MultiplePermissionSerializer,
        responses={201: RolePermissionDetailSerializer},
        tags=["Roles"]
    )
    @action(detail=True, methods=["put"])
    def sync_permissions(self, request, pk=None):
        serializer = MultiplePermissionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        creado_por=request.user
        role_permissions = RoleService.sync_permissions(
            pk,
            serializer.validated_data["permission_ids"],
            creado_por)
        return Response(role_permissions,status=status.HTTP_201_CREATED)
   