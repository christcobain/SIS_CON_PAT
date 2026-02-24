from rest_framework import status
from rest_framework.viewsets import ViewSet
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .services import SedeService, ModuloService, AreaService
from .serializers import (SedeSerializer, SedeListSerializer,
                          ModuloSerializer, AreaSerializer)


class SedeViewSet(ViewSet):
    permission_classes = [IsAuthenticated]
    def list(self, request):
        sedes = SedeService.list_sedes(request.query_params)
        serializer = SedeListSerializer(sedes, many=True)
        return Response({'success': True, 'data': serializer.data})

    def retrieve(self, request, pk=None):
        sede = SedeService.get_sede(pk)
        serializer = SedeSerializer(sede)
        return Response({'success': True, 'data': serializer.data})

    def create(self, request):
        serializer = SedeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        sede = SedeService.create_sede(serializer.validated_data)
        return Response({'success': True, 'data': SedeSerializer(sede).data}, status=status.HTTP_201_CREATED)
    def update(self, request, pk=None):
        sede = SedeService.get_sede(pk)
        serializer = SedeSerializer(sede, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        sede = SedeService.update_sede(pk, serializer.validated_data)
        return Response({'success': True, 'data': SedeSerializer(sede).data})
    @action(detail=True, methods=['patch'], url_path='toggle-estado')
    def toggle_estado(self, request, pk=None):
        sede = SedeService.toggle_estado(pk)
        return Response({'success': True, 'estado': sede.estado})

    @action(detail=True, methods=['get'], url_path='modulos')
    def get_modulos(self, request, pk=None):
        modulos = ModuloService.list_by_sede(pk)
        serializer = ModuloSerializer(modulos, many=True)
        return Response({'success': True, 'data': serializer.data})


class ModuloViewSet(ViewSet):
    permission_classes = [IsAuthenticated]
    def create(self, request):
        serializer = ModuloSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        modulo = ModuloService.create_modulo(serializer.validated_data)
        return Response({'success': True, 'data': ModuloSerializer(modulo).data}, status=status.HTTP_201_CREATED)
    @action(detail=True, methods=['patch'], url_path='toggle-estado')
    def toggle_estado(self, request, pk=None):
        modulo = ModuloService.toggle_estado(pk)
        return Response({'success': True, 'estado': modulo.estado})
    @action(detail=True, methods=['get'], url_path='areas')
    def get_areas(self, request, pk=None):
        areas = AreaService.list_by_modulo(pk)
        serializer = AreaSerializer(areas, many=True)
        return Response({'success': True, 'data': serializer.data})

class AreaViewSet(ViewSet):
    permission_classes = [IsAuthenticated]
    def create(self, request):
        serializer = AreaSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        area = AreaService.create_area(serializer.validated_data)
        return Response({'success': True, 'data': AreaSerializer(area).data}, status=status.HTTP_201_CREATED)
    @action(detail=True, methods=['patch'], url_path='toggle-estado')
    def toggle_estado(self, request, pk=None):
        area = AreaService.toggle_estado(pk)
        return Response({'success': True, 'estado': area.estado})