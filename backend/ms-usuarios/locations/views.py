from rest_framework import status
from rest_framework.viewsets import ViewSet
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated,AllowAny
from .services import (SedeService, ModuloService,DepartamentoService,
                       ProvinciaService,DistritoService,UbicacionService)
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiTypes
from .serializers import (
    DepartamentoSerializer,ProvinciaSerializer,DistritoSerializer,SedeSerializer,SedeCreateUpdateSerializer,
    ModuloSerializer,ModuloCreateUpdateSerializer,UbicacionSerializer,UbicacionCreateUpdateSerializer
)
class DepartamentoViewSet(ViewSet):
    permission_classes = [AllowAny]
    @extend_schema(
        tags=['Locations'],
        summary="Listar departamentos",
        description="Obtiene la lista de todos los departamentos con sus provincias y distritos.",
        responses={200: DepartamentoSerializer(many=True)}
    )
    def list(self, request):
        result = DepartamentoService.get_all()
        if not result["success"]:
            return Response(result, status=status.HTTP_400_BAD_REQUEST)
        serializer = DepartamentoSerializer(result["data"], many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    @extend_schema(
        tags=['Locations'],
        summary="Obtener departamento por ID",
        description="Retorna el detalle de un departamento específico.",
        responses={200: DepartamentoSerializer}
    )
    def retrieve(self, request, pk=None):
        result = DepartamentoService.get__by_id(pk)
        if not result['success']:
            return Response(result, status=status.HTTP_400_BAD_REQUEST)
        serializer = DepartamentoSerializer(result["data"])
        return Response(serializer.data, status=status.HTTP_200_OK)

class ProvinciaViewSet(ViewSet):
    permission_classes = [AllowAny]
    @extend_schema(
        tags=['Locations'],
        summary="Listar provincias",
        responses={200: ProvinciaSerializer(many=True)})   
    def list(self, request):
        result = ProvinciaService.get_all()
        if not result['success']:
            return Response(result, status=status.HTTP_400_BAD_REQUEST)        
        serializer=ProvinciaSerializer(result["data"], many=True)          
        return Response(serializer.data, status=status.HTTP_200_OK)
    @extend_schema(
        tags=['Locations'],
        summary="Obtener provincia por ID",
        responses={200: ProvinciaSerializer}
    )
    def retrieve(self, request, pk=None):
        result = ProvinciaService.get__by_id(pk)
        if not result["success"]:
            return Response(result, status=status.HTTP_400_BAD_REQUEST)  
        serializer = ProvinciaSerializer(result["data"])
        return Response(serializer.data, status=status.HTTP_200_OK)

class DistritoViewSet(ViewSet):
    permission_classes = [AllowAny]
    @extend_schema(
        tags=['Locations'],
        summary="Listar distritos",
        responses={200: DistritoSerializer(many=True)})
    def list(self, request):
        result = DistritoService.get_all()
        if not result['success']:
            return Response(result, status=status.HTTP_400_BAD_REQUEST)        
        serializer=DistritoSerializer(result["data"], many=True)          
        return Response(serializer.data, status=status.HTTP_200_OK)
    @extend_schema(
        tags=['Locations'],
        summary="Obtener distrito por ID",
        responses={200: DistritoSerializer}
    )
    def retrieve(self, request, pk=None):
        result = DistritoService.get__by_id(pk)
        if not result["success"]:
            return Response(result, status=status.HTTP_400_BAD_REQUEST)  
        serializer = DistritoSerializer(result["data"])
        return Response(serializer.data, status=status.HTTP_200_OK)

class SedeViewSet(ViewSet):
    permission_classes = [AllowAny]
    @extend_schema(
        tags=['Locations'],
        summary="Listar sedes",
        description="Obtiene la lista de sedes",
        responses={200: SedeSerializer(many=True)}
    )
    def list(self, request):
        result = SedeService.get_all()
        if not result['success']:
            return Response(result, status=status.HTTP_400_BAD_REQUEST)        
        serializer=SedeSerializer(result["data"], many=True)          
        return Response(serializer.data, status=status.HTTP_200_OK)
    @extend_schema(
        tags=['Locations'],
        summary="Obtener sede por ID",
        description="Retorna el detalle de una sede específica.",
        responses={200: SedeSerializer})
    def retrieve(self, request, pk=None):
        result = SedeService.get__by_id(pk)
        if not result['success']:
            return Response(result, status=status.HTTP_400_BAD_REQUEST)        
        serializer=SedeSerializer(result["data"])          
        return Response(serializer.data, status=status.HTTP_200_OK)
    @extend_schema(
        tags=['Locations'],
        summary="Crear sede",
        description="Crea una nueva sede.",
        request=SedeCreateUpdateSerializer,
        responses={201: SedeSerializer, 
                   400: OpenApiTypes.OBJECT            
        }
    )
    def create(self, request):
        serializer = SedeCreateUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = SedeService.create(serializer.validated_data)
        if not result['success']:
            return Response(result, status=status.HTTP_400_BAD_REQUEST)
        return Response(result, status=status.HTTP_201_CREATED)
    @extend_schema(
        tags=['Locations'],
        summary="Actualizar sede",
        description="Actualiza una sede.",
        request=SedeCreateUpdateSerializer,
        responses={201: SedeSerializer}
    )
    def update(self, request, pk=None):
        serializer = SedeCreateUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        result = SedeService.update(pk, serializer.validated_data)
        if not result['success']:
            return Response(result, status=status.HTTP_400_BAD_REQUEST)
        return Response(result, status=status.HTTP_200_OK)
    @extend_schema(
        tags=['Locations'],
        summary="Activar sede",
        description="Activar una sede",
        responses={200: OpenApiTypes.OBJECT}
    )
    @action(detail=True, methods=["patch"])
    def activate(self, request, pk=None):
        result = SedeService.activate(pk)   
        if not result['success']:
            return Response(result, status=status.HTTP_404_NOT_FOUND)        
        return Response(result, status=status.HTTP_200_OK)
    @extend_schema(
        tags=['Locations'],
        summary="Desactivar sede",
        description="Desactivar una sede",
        responses={200: OpenApiTypes.OBJECT}
    )
    @action(detail=True, methods=["patch"])
    def deactivate(self, request, pk=None):
        result = SedeService.deactivate_dependency(pk)
        if not result['success']:
            return Response(result, status=status.HTTP_404_NOT_FOUND)        
        return Response(result, status=status.HTTP_200_OK)
        
class ModuloViewSet(ViewSet):
    permission_classes = [AllowAny]
    @extend_schema(
        tags=['Locations'],
        summary="Listar modulos",
        description="Obtiene la lista de modulos",
        responses={200: ModuloSerializer(many=True)}
    )
    def list(self, request):
        result = ModuloService.get_all()
        if not result['success']:
            return Response(result, status=status.HTTP_400_BAD_REQUEST)        
        serializer=ModuloSerializer(result["data"], many=True)          
        return Response(serializer.data, status=status.HTTP_200_OK)
    @extend_schema(
        tags=['Locations'],
        summary="Obtener modulo por ID",
        description="Retorna el detalle de un modulo específico.",
        responses={200: ModuloSerializer})
    def retrieve(self, request, pk=None):
        result = ModuloService.get__by_id(pk)
        if not result['success']:
            return Response(result, status=status.HTTP_400_BAD_REQUEST)        
        serializer=ModuloSerializer(result["data"])          
        return Response(serializer.data, status=status.HTTP_200_OK)
    @extend_schema(
        tags=['Locations'],
        summary="Crear Modulo",
        description="Crea un nuevo Modulo.",
        request=ModuloCreateUpdateSerializer,
        responses={201: ModuloSerializer, 
                   400: OpenApiTypes.OBJECT            
        }
    )
    def create(self, request):
        serializer = ModuloCreateUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = ModuloService.create(serializer.validated_data)
        if not result['success']:
            return Response(result, status=status.HTTP_400_BAD_REQUEST)
        return Response(result, status=status.HTTP_201_CREATED)
    @extend_schema(
        tags=['Locations'],
        summary="Actualizar Modulo",
        description="Actualiza un Modulo.",
        request=ModuloCreateUpdateSerializer,
        responses={201: ModuloSerializer}
    )
    def update(self, request, pk=None):
        serializer = ModuloCreateUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        result = ModuloService.update(pk, serializer.validated_data)
        if not result['success']:
            return Response(result, status=status.HTTP_400_BAD_REQUEST)
        return Response(result, status=status.HTTP_200_OK)
    @extend_schema(
        tags=['Locations'],
        summary="Activar modulo",
        description="Activar un modulo",
        responses={200: OpenApiTypes.OBJECT}
    )
    @action(detail=True, methods=["patch"])
    def activate(self, request, pk=None):
        result = ModuloService.activate(pk)   
        if not result['success']:
            return Response(result, status=status.HTTP_404_NOT_FOUND)        
        return Response(result, status=status.HTTP_200_OK)
    @extend_schema(
        tags=['Locations'],
        summary="Desactivar modulo",
        description="Desactivar un modulo",
        responses={200: OpenApiTypes.OBJECT}
    )
    @action(detail=True, methods=["patch"])
    def deactivate(self, request, pk=None):
        result = ModuloService.deactivate_dependency(pk)
        if not result['success']:
            return Response(result, status=status.HTTP_404_NOT_FOUND)        
        return Response(result, status=status.HTTP_200_OK)
        
class UbicacionViewSet(ViewSet):
    permission_classes = [AllowAny]
    @extend_schema(
        tags=['Locations'],
        summary="Listar ubicaciones",
        description="Obtiene la lista de ubicaciones",
        responses={200: UbicacionSerializer(many=True)}
    )
    def list(self, request):
        result = UbicacionService.get_all()
        if not result['success']:
            return Response(result, status=status.HTTP_400_BAD_REQUEST)        
        serializer=UbicacionSerializer(result["data"], many=True)          
        return Response(serializer.data, status=status.HTTP_200_OK)
    @extend_schema(
        tags=['Locations'],
        summary="Obtener ubicacion por ID",
        description="Retorna el detalle de una ubicacion específico.",
        responses={200: UbicacionSerializer})
    def retrieve(self, request, pk=None):
        result = UbicacionService.get__by_id(pk)
        if not result['success']:
            return Response(result, status=status.HTTP_400_BAD_REQUEST)        
        serializer=UbicacionSerializer(result["data"])          
        return Response(serializer.data, status=status.HTTP_200_OK)
    @extend_schema(
        tags=['Locations'],
        summary="Crear ubicaciones",
        description="Crea una nueva ubicacion.",
        request=UbicacionCreateUpdateSerializer,
        responses={201: UbicacionSerializer, 
                   400: OpenApiTypes.OBJECT            
        }
    )
    def create(self, request):
        serializer = UbicacionCreateUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = UbicacionService.create(serializer.validated_data)
        if not result['success']:
            return Response(result, status=status.HTTP_400_BAD_REQUEST)
        return Response(result, status=status.HTTP_201_CREATED)
    @extend_schema(
        tags=['Locations'],
        summary="Actualizar ubicaciones",
        description="Actualiza una ubicacion.",
        request=UbicacionCreateUpdateSerializer,
        responses={201: UbicacionSerializer}
    )
    def update(self, request, pk=None):
        serializer = UbicacionCreateUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        result = UbicacionService.update(pk, serializer.validated_data)
        if not result['success']:
            return Response(result, status=status.HTTP_400_BAD_REQUEST)
        return Response(result, status=status.HTTP_200_OK)
    @extend_schema(
        tags=['Locations'],
        summary="Activar ubicaciones",
        description="Activar una ubicacion",
        responses={200: OpenApiTypes.OBJECT}
    )
    @action(detail=True, methods=["patch"])
    def activate(self, request, pk=None):
        result = UbicacionService.activate(pk)   
        if not result['success']:
            return Response(result, status=status.HTTP_404_NOT_FOUND)        
        return Response(result, status=status.HTTP_200_OK)
    @extend_schema(
        tags=['Locations'],
        summary="Desactivar ubicaciones",
        description="Desactivar una ubicacion",
        responses={200: OpenApiTypes.OBJECT}
    )
    @action(detail=True, methods=["patch"])
    def deactivate(self, request, pk=None):
        result = UbicacionService.deactivate_dependency(pk)
        if not result['success']:
            return Response(result, status=status.HTTP_404_NOT_FOUND)        
        return Response(result, status=status.HTTP_200_OK)
        
