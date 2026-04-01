from rest_framework import status
from rest_framework.viewsets import ViewSet
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated,AllowAny
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiTypes
from shared.permissions import HasJWTPermission
from .services import CatalogoService
from .serializers import (CatCategoriaBienSerializer, CatalogoWriteSerializer,
    CatTipoBienSerializer,catTipoTarjetaVideoSerializer, CatMarcaSerializer, CatRegimenTenenciaSerializer,
    CatEstadoBienSerializer, CatEstadoFuncionamientoSerializer,
    CatMotivoBajaSerializer, CatMotivoTransferenciaSerializer,CatMotivoMantenimientoSerializer,
    CatMotivoCancelacionSerializer, CatTipoComputadoraSerializer,
    CatTipoDiscoSerializer, CatArquitecturaBitsSerializer,
    CatTipoMonitorSerializer, CatTipoEscanerSerializer,
    CatInterfazConexionSerializer, CatTipoImpresionSerializer,
    CatTamanoCárroSerializer,
)
from .models import (CatCategoriaBien,      CatTipoBien,CatTipoTarjetaVideo, CatMarca, CatRegimenTenencia, CatEstadoBien,
    CatEstadoFuncionamiento, CatMotivoBaja, CatMotivoTransferencia,CatMotivoMantenimiento,
    CatMotivoCancelacion, CatTipoComputadora, CatTipoDisco,
    CatArquitecturaBits, CatTipoMonitor, CatTipoEscaner,
    CatInterfazConexion, CatTipoImpresion, CatTamanoCarro,
)

CATALOGO_MAP = {
    'categoria-bien': (CatCategoriaBien, CatCategoriaBienSerializer),
    'tipo-bien':             (CatTipoBien,             CatTipoBienSerializer),
    'tipo_tarjeta_video':    (CatTipoTarjetaVideo, catTipoTarjetaVideoSerializer),
    'marca':                 (CatMarca,                CatMarcaSerializer),
    'regimen-tenencia':      (CatRegimenTenencia,      CatRegimenTenenciaSerializer),
    'estado-bien':           (CatEstadoBien,            CatEstadoBienSerializer),
    'estado-funcionamiento': (CatEstadoFuncionamiento,  CatEstadoFuncionamientoSerializer),
    'motivo-baja':           (CatMotivoBaja,            CatMotivoBajaSerializer),
    'motivo-mantenimiento':  (CatMotivoMantenimiento,   CatMotivoMantenimientoSerializer),
    'motivo-transferencia':  (CatMotivoTransferencia,   CatMotivoTransferenciaSerializer),
    'motivo-cancelacion':    (CatMotivoCancelacion,     CatMotivoCancelacionSerializer),
    'tipo-computadora':      (CatTipoComputadora,       CatTipoComputadoraSerializer),
    'tipo-disco':            (CatTipoDisco,             CatTipoDiscoSerializer),
    'arq-bits':              (CatArquitecturaBits,      CatArquitecturaBitsSerializer),
    'tipo-monitor':          (CatTipoMonitor,           CatTipoMonitorSerializer),
    'tipo-escaner':          (CatTipoEscaner,           CatTipoEscanerSerializer),
    'interfaz-conexion':     (CatInterfazConexion,      CatInterfazConexionSerializer),
    'tipo-impresion':        (CatTipoImpresion,         CatTipoImpresionSerializer),
    'tamano-carro':          (CatTamanoCarro,           CatTamanoCárroSerializer),
}
_SLUGS_DESC = ', '.join(CATALOGO_MAP.keys())

def _resolve(slug: str):
    entry = CATALOGO_MAP.get(slug)
    if not entry:
        return None, None
    return entry

class CatalogoViewSet(ViewSet):
    def get_permissions(self):
        perms = {
            'list':       [HasJWTPermission('ms-bienes:catalogos:view_catcategoriabien')],
            'retrieve':   [HasJWTPermission('ms-bienes:catalogos:view_catcategoriabien')],
            'create':     [HasJWTPermission('ms-bienes:catalogos:vadd_catcategoriabien')],
            'update':     [HasJWTPermission('ms-bienes:catalogos:change_catcategoriabien')],
            'activate':   [HasJWTPermission('ms-bienes:catalogos:change_catcategoriabien')],
            'deactivate': [HasJWTPermission('ms-bienes:catalogos:change_catcategoriabien')],
        }
        return perms.get(self.action, [IsAuthenticated()])
    def _get_slug(self, request, **kwargs) -> str:
        return (
            kwargs.get('catalogo_slug')
            or request.resolver_match.kwargs.get('catalogo_slug')
        )
    @extend_schema(
        tags=['Catálogos'],
        summary="Listar registros de un catálogo",
        description=(
            "Retorna los registros del catálogo indicado por `catalogo_slug`.\n\n"
            f"**Slugs disponibles:** {_SLUGS_DESC}"
        ),
        parameters=[
            OpenApiParameter(
                'catalogo_slug', OpenApiTypes.STR,
                location=OpenApiParameter.PATH,
                description="Slug del catálogo a consultar.",
            ),
            OpenApiParameter(
                'all', OpenApiTypes.BOOL,
                description="Si `true`, incluye registros inactivos. Por defecto solo activos.",
            ),
        ],
        responses={200: CatalogoWriteSerializer(many=True)},
    )
    def list(self, request, **kwargs):
        # print(f"--- DEBUG CATALOGO ---")
        # print(f"Usuario: {request.user}")
        # print(f"¿Está autenticado?: {request.user.is_authenticated}")
        # print(f"Auth (Token Payload): {request.auth}")
        
        slug = self._get_slug(request, **kwargs)
        model, serializer_class = _resolve(slug)
        if not model:
            return Response(
                {"success": False, "error": f'Catálogo "{slug}" no encontrado.'},
                status=status.HTTP_404_NOT_FOUND,
            )
        
        result = CatalogoService.listar(model)
        serializer=serializer_class(result["data"], many=True)
        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )
    @extend_schema(
        tags=['Catálogos'],
        summary="Obtener registro de catálogo por ID",
        responses={200: CatalogoWriteSerializer},
    )
    def retrieve(self, request, **kwargs):
        slug = self._get_slug(request, **kwargs)
        pk   = kwargs.get('pk')
        model, serializer_class = _resolve(slug)
        if not model:
            return Response(
                {"success": False, "error": f'Catálogo "{slug}" no encontrado.'},
                status=status.HTTP_404_NOT_FOUND,
            )
        result = CatalogoService.obtener_por_id(model, pk)
        serializer=serializer_class(result["data"])
        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )
    @extend_schema(
        tags=['Catálogos'],
        summary="Crear registro en un catálogo",
        parameters=[
            OpenApiParameter('catalogo_slug', OpenApiTypes.STR, location=OpenApiParameter.PATH),
        ],
        request=CatalogoWriteSerializer,
        responses={201: CatalogoWriteSerializer, 400: OpenApiTypes.OBJECT},
    )
    def create(self, request, **kwargs):
        slug = self._get_slug(request, **kwargs)
        model, serializer_class = _resolve(slug)
        if not model:
            return Response(
                {"success": False, "error": f'Catálogo "{slug}" no encontrado.'},
                status=status.HTTP_404_NOT_FOUND,
            )
        ser = CatalogoWriteSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        result = CatalogoService.crear(model, ser.validated_data)
        return Response(
            {"success": True, "message": result['message'],
             "data": serializer_class(result['data']).data},
            status=status.HTTP_201_CREATED,
        )
    @extend_schema(
        tags=['Catálogos'],
        summary="Actualizar registro de un catálogo",
        request=CatalogoWriteSerializer,
        responses={200: CatalogoWriteSerializer, 400: OpenApiTypes.OBJECT},
    )
    def update(self, request, **kwargs):
        slug = self._get_slug(request, **kwargs)
        pk   = kwargs.get('pk')
        model, serializer_class = _resolve(slug)
        if not model:
            return Response(
                {"success": False, "error": f'Catálogo "{slug}" no encontrado.'},
                status=status.HTTP_404_NOT_FOUND,
            )
        ser = CatalogoWriteSerializer(data=request.data, partial=True)
        ser.is_valid(raise_exception=True)
        result = CatalogoService.actualizar(model, pk, ser.validated_data)
        return Response(
            {"success": True, "message": result['message'],
             "data": serializer_class(result['data']).data},
            status=status.HTTP_200_OK,
        )
    @extend_schema(
        tags=['Catálogos'],
        summary="Activar registro de un catálogo",
        parameters=[
            OpenApiParameter('catalogo_slug', OpenApiTypes.STR, location=OpenApiParameter.PATH),
        ],
        responses={200: OpenApiTypes.OBJECT},
    )
    @action(detail=True, methods=['patch'])
    def activate(self, request, **kwargs):
        slug = self._get_slug(request, **kwargs)
        pk   = kwargs.get('pk')
        model, _ = _resolve(slug)
        if not model:
            return Response(
                {"success": False, "error": f'Catálogo "{slug}" no encontrado.'},
                status=status.HTTP_404_NOT_FOUND,
            )
        result = CatalogoService.activar(model, pk)
        return Response(result, status=status.HTTP_200_OK)
    @extend_schema(
        tags=['Catálogos'],
        summary="Desactivar registro de un catálogo",
        parameters=[
            OpenApiParameter('catalogo_slug', OpenApiTypes.STR, location=OpenApiParameter.PATH),
        ],
        responses={200: OpenApiTypes.OBJECT},
    )
    @action(detail=True, methods=['patch'])
    def deactivate(self, request, **kwargs):
        slug = self._get_slug(request, **kwargs)
        pk   = kwargs.get('pk')
        model, _ = _resolve(slug)
        if not model:
            return Response(
                {"success": False, "error": f'Catálogo "{slug}" no encontrado.'},
                status=status.HTTP_404_NOT_FOUND,
            )
        result = CatalogoService.desactivar(model, pk)
        return Response(result, status=status.HTTP_200_OK)
    
    
    