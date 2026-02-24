from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .services import RoleService, PermissionService
from .serializers import RoleSerializer, RoleListSerializer, PermissionSerializer
from .models import Permission


class RoleViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    def list(self, request):
        filters = {k: v for k, v in request.query_params.items()}
        roles = RoleService.list_roles(filters)
        serializer = RoleListSerializer(roles, many=True)
        return Response({'success': True, 'data': serializer.data})

    def retrieve(self, request, pk=None):
        role = RoleService.get_role(pk)
        serializer = RoleSerializer(role)
        return Response({'success': True, 'data': serializer.data})

    def create(self, request):
        serializer = RoleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        role = serializer.save()
        return Response({'success': True, 'data': RoleSerializer(role).data}, status=status.HTTP_201_CREATED)

    def update(self, request, pk=None):
        role = RoleService.get_role(pk)
        serializer = RoleSerializer(role, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        role = serializer.save()
        return Response({'success': True, 'data': RoleSerializer(role).data})

    @action(detail=True, methods=['patch'], url_path='toggle-estado')
    def toggle_estado(self, request, pk=None):
        role = RoleService.toggle_estado(pk)
        return Response({'success': True, 'estado': role.estado})

    @action(detail=True, methods=['post'], url_path='assign-permissions')
    def assign_permissions(self, request, pk=None):
        permission_ids = request.data.get('permission_ids', [])
        role = RoleService.assign_permissions(pk, permission_ids)
        return Response({'success': True, 'data': RoleSerializer(role).data})

    @action(detail=True, methods=['delete'], url_path='remove-permission/(?P<perm_id>[^/.]+)')
    def remove_permission(self, request, pk=None, perm_id=None):
        role = RoleService.remove_permission(pk, perm_id)
        return Response({'success': True, 'data': RoleSerializer(role).data})


class PermissionViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    def list(self, request):
        module = request.query_params.get('module')
        permissions = PermissionService.list_permissions(module)
        serializer = PermissionSerializer(permissions, many=True)
        return Response({'success': True, 'data': serializer.data})

    def create(self, request):
        serializer = PermissionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        perm = PermissionService.create_permission(serializer.validated_data)
        return Response({'success': True, 'data': PermissionSerializer(perm).data}, status=status.HTTP_201_CREATED)