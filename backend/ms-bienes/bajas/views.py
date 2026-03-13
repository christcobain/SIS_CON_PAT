from rest_framework import status
from rest_framework.viewsets import ViewSet
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiTypes

from shared.backends import CookieJWTAuthentication
from shared.permissions import HasJWTPermission

from .services import BajaService
from .serializers import (
    BajaListSerializer, BajaDetailSerializer, BajaCreateSerializer,
    DevolucionSerializer, CancelacionSerializer,
)


def _get_sede_from_token(request) -> int:
    sedes = request.auth.get('sedes', []) if request.auth else []
    if not sedes:
        from rest_framework.exceptions import ValidationError
        raise ValidationError('El usuario no tiene sede asignada.')
    return sedes[0]


class BajaViewSet(ViewSet):
    def get_permissions(self):
        perms = {
            'list':     [HasJWTPermission('ms-bienes:bajas:view_baja')],
            'retrieve': [HasJWTPermission('ms-bienes:bajas:view_baja')],
            'create':   [HasJWTPermission('ms-bienes:bajas:add_baja')],
            'aprobar':  [HasJWTPermission('ms-bienes:bajas:change_baja')],
            'devolver': [HasJWTPermission('ms-bienes:bajas:change_baja')],
            'cancelar': [HasJWTPermission('ms-bienes:bajas:delete_baja')],
        }
        return perms.get(self.action, [IsAuthenticated()])
    @extend_schema(
        tags=['Bajas'],
        summary="Listar bajas con filtros",
        description=(
            "COORDSISTEMA ve bajas de todas las sedes. "
            "ASISTSISTEMA ve solo las bajas de su propia sede."
        ),
        parameters=[
            OpenApiParameter('estado',             OpenApiTypes.STR,  description="PENDIENTE_APROBACION | ATENDIDO | DEVUELTO | CANCELADO"),
            OpenApiParameter('sede_elabora_id',    OpenApiTypes.INT,  description="ID de sede del ASISTSISTEMA que elaboró"),
            OpenApiParameter('usuario_elabora_id', OpenApiTypes.INT,  description="ID del ASISTSISTEMA que registró la baja"),
        ],
        responses={200: BajaListSerializer(many=True)},
    )
    def list(self, request):
        filters = {
            key: request.query_params.get(key)
            for key in ['estado', 'sede_elabora_id', 'usuario_elabora_id']
        }
        for k in ['sede_elabora_id', 'usuario_elabora_id']:
            if filters[k]:
                try:
                    filters[k] = int(filters[k])
                except ValueError:
                    filters[k] = None

        result = BajaService.listar(filters)
        return Response(
            {"success": True, "data": BajaListSerializer(result['data'], many=True).data},
            status=status.HTTP_200_OK,
        )
    @extend_schema(
        tags=['Bajas'],
        summary="Obtener detalle de una baja",
        description=(
            "Retorna el informe técnico completo con todos los bienes del detalle "
            "(snapshot: tipo, marca, modelo, N° serie, código patrimonial, estado) "
            "y el estado de aprobación."
        ),
        parameters=[
            OpenApiParameter('pk', OpenApiTypes.INT, location=OpenApiParameter.PATH),
        ],
        responses={200: BajaDetailSerializer},
    )
    def retrieve(self, request, pk=None):
        result = BajaService.obtener(pk)
        return Response(
            {"success": True, "data": BajaDetailSerializer(result['data']).data},
            status=status.HTTP_200_OK,
        )
    @extend_schema(
        tags=['Bajas'],
        summary="Registrar informe de baja",
        description=(
            "ASISTSISTEMA registra el informe de baja. "
            "Solo se aceptan bienes con estado de funcionamiento AVERIADO o INOPERATIVO. "
            "Cada bien debe incluir su `motivo_baja_id` y opcionalmente el "
            "`mantenimiento_id` que sustenta la baja. "
            "El número de informe se genera automáticamente (BAJ-YYYYMMDD-NNNN). "
            "La sede se obtiene del token JWT."
        ),
        request=BajaCreateSerializer,
        responses={201: BajaDetailSerializer, 400: OpenApiTypes.OBJECT},
    )
    def create(self, request):
        ser = BajaCreateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        sede_id = _get_sede_from_token(request)
        result = BajaService.crear(ser.validated_data, request.user.id, sede_id)
        return Response(
            {"success": True, "message": result['message'],
             "data": BajaDetailSerializer(result['data']).data},
            status=status.HTTP_201_CREATED,
        )
    @extend_schema(
        tags=['Bajas'],
        summary="Aprobar baja (COORDSISTEMA)",
        description=(
            "COORDSISTEMA aprueba el informe de baja. Estado pasa a ATENDIDO. "
            "El servicio marca cada bien como `is_active=False`, registra "
            "`fecha_baja` y actualiza `motivo_baja_id` en cada bien."
        ),
        parameters=[OpenApiParameter('pk', OpenApiTypes.INT, location=OpenApiParameter.PATH)],
        responses={200: OpenApiTypes.OBJECT},
    )
    @action(detail=True, methods=['patch'], url_path='aprobar')
    def aprobar(self, request, pk=None):
        result = BajaService.aprobar(pk, request.user.id)
        return Response(result, status=status.HTTP_200_OK)
    @extend_schema(
        tags=['Bajas'],
        summary="Devolver baja (COORDSISTEMA desaprueba)",
        description=(
            "COORDSISTEMA devuelve el informe con un motivo. "
            "Estado pasa a DEVUELTO. ASISTSISTEMA puede corregir y reenviar "
            "(al guardar vuelve a PENDIENTE_APROBACION)."
        ),
        parameters=[OpenApiParameter('pk', OpenApiTypes.INT, location=OpenApiParameter.PATH)],
        request=DevolucionSerializer,
        responses={200: OpenApiTypes.OBJECT},
    )
    @action(detail=True, methods=['patch'], url_path='devolver')
    def devolver(self, request, pk=None):
        ser = DevolucionSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        result = BajaService.devolver(pk, ser.validated_data['motivo_devolucion'])
        return Response(result, status=status.HTTP_200_OK)
    @extend_schema(
        tags=['Bajas'],
        summary="Cancelar baja (ASISTSISTEMA)",
        description=(
            "ASISTSISTEMA cancela la baja sin requerir aprobación. "
            "No se puede cancelar si ya está en estado ATENDIDO o CANCELADO."
        ),
        parameters=[OpenApiParameter('pk', OpenApiTypes.INT, location=OpenApiParameter.PATH)],
        request=CancelacionSerializer,
        responses={200: OpenApiTypes.OBJECT},
    )
    @action(detail=True, methods=['patch'], url_path='cancelar')
    def cancelar(self, request, pk=None):
        ser = CancelacionSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        result = BajaService.cancelar(
            pk,
            ser.validated_data['motivo_cancelacion_id'],
            ser.validated_data.get('detalle_cancelacion', ''),
        )
        return Response(result, status=status.HTTP_200_OK)