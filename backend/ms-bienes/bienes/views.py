from rest_framework import status
from rest_framework.viewsets import ViewSet
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiTypes
from django.conf import settings
from shared.permissions import HasJWTPermission
from rest_framework.exceptions import ValidationError
from .services import BienService
from .serializers import BienListSerializer,  BienWriteSerializer
from catalogos.models import CatTipoBien

class BienViewSet(ViewSet):
    def get_permissions(self):
        perms = {
            'list':               [ HasJWTPermission('ms-bienes:bienes:view_bien')],
            'retrieve':           [HasJWTPermission('ms-bienes:bienes:view_bien')],
            'create':             [HasJWTPermission('ms-bienes:bienes:add_bien')],
            'update':             [HasJWTPermission('ms-bienes:bienes:change_bien')],
            'por_usuario':        [ HasJWTPermission('ms-bienes:bienes:view_bien')],
            'disponibles_sede':   [HasJWTPermission('ms-bienes:bienes:view_bien')],
        }
        return perms.get(self.action, [IsAuthenticated()])
    def _get_token(self, request) -> str:
        cookie_name = getattr(settings, 'JWT_AUTH_COOKIE', 'sisconpat_access')
        return request.COOKIES.get(cookie_name)
    def _get_sede(self, request) -> int:
        sedes = request.auth.get('sedes_ids', []) if request.auth else []
        if not sedes:
            raise ValidationError('El usuario no tiene sede asignada.')
        return sedes[0]
    @extend_schema(
        tags=['Bienes'],
        summary="Listar bienes con filtros",
        description=(
            "Retorna el inventario de bienes activos con filtros combinables. "
            "COORDSISTEMA ve todos los bienes de todas las sedes. "
            "ASISTSISTEMA/ADMINSEDE ven los de su propia sede."
        ),
        parameters=[
            OpenApiParameter('sede_id',                   OpenApiTypes.INT,  description="Filtrar por sede"),
            OpenApiParameter('modulo_id',                 OpenApiTypes.INT,  description="Filtrar por módulo"),
            OpenApiParameter('ubicacion_id',              OpenApiTypes.INT,  description="Filtrar por ubicación/área"),
            OpenApiParameter('empresa_id',                OpenApiTypes.INT,  description="Filtrar por empresa/corte"),
            OpenApiParameter('usuario_asignado_id',       OpenApiTypes.INT,  description="Filtrar por custodio actual"),
            OpenApiParameter('tipo_bien_id',              OpenApiTypes.INT,  description="Filtrar por tipo de bien"),
            OpenApiParameter('estado_funcionamiento_id',  OpenApiTypes.INT,  description="Filtrar por estado de funcionamiento"),
            OpenApiParameter('search',                    OpenApiTypes.STR,  description="Buscar por código patrimonial, N° serie o modelo"),
        ],
        responses={200: BienListSerializer(many=True)},
    )
    def list(self, request):
        filters = {
            key: request.query_params.get(key)
            for key in [
                'sede_id', 'modulo_id', 'ubicacion_id', 'empresa_id',
                'usuario_asignado_id', 'tipo_bien_id', 'estado_funcionamiento_id', 'search',
            ]
        }
        for key in filters:
            if filters[key] and key != 'search':
                try:
                    filters[key] = int(filters[key])
                except ValueError:
                    filters[key] = None
 
        role    = request.auth.get('role', '') if request.auth else ''
        sede_id = self._get_sede(request)
        result  = BienService.listar(filters, token=self._get_token(request), role=role, sede_id=sede_id)
        return Response(BienListSerializer(result['data'], many=True).data, status=status.HTTP_200_OK)
    @extend_schema(
        tags=['Bienes'],
        summary="Obtener detalle completo de un bien",
        description=(
            "Retorna el bien con todos sus atributos y el detalle técnico "
            "según su tipo (CPU, Monitor, Impresora, Scanner o Switch)."
        ),
        responses={200: BienListSerializer},
    )
    def retrieve(self, request, pk=None):
        result = BienService.obtener(pk, token=self._get_token(request))
        return Response(BienListSerializer(result['data']).data, status=status.HTTP_200_OK)
    @extend_schema(
        tags=['Bienes'],
        summary="Registrar nuevo bien patrimonial",
        description=(
            "Registra un bien en la sede/módulo/ubicación del usuario que lo registra. "
            "El usuario registrador queda como custodio inicial. "
            "Si el tipo de bien es CPU, MONITOR, IMPRESORA, SCANNER o SWITCH, "
            "incluir el objeto `detalle` con los campos técnicos correspondientes."
        ),
        request=BienWriteSerializer,
        responses={201: BienListSerializer, 400: OpenApiTypes.OBJECT},
    )
    def create(self, request):
        ser = BienWriteSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        token = self._get_token(request)
        result = BienService.crear(
            data=ser.validated_data, 
            usuario_registra_id=request.user.id, 
            token=token
        )
        return Response(result, status=status.HTTP_201_CREATED)
    @extend_schema(
        tags=['Bienes'],
        summary="Actualizar datos de un bien",
        description=(
            "Actualiza los campos del bien y/o su detalle técnico. "
            "No permite modificar bienes dados de baja (is_active=False). "
            "La localización puede modificarse solo si se valida en ms-usuarios."
        ),
        parameters=[
            OpenApiParameter('pk', OpenApiTypes.INT, location=OpenApiParameter.PATH,
                             description="ID del bien a actualizar"),
        ],
        request=BienWriteSerializer,
        responses={200: BienListSerializer, 400: OpenApiTypes.OBJECT},
    )
    def update(self, request, pk=None):
        ser = BienWriteSerializer(data=request.data, partial=True)
        ser.is_valid(raise_exception=True)        
        token = self._get_token(request)
        result = BienService.actualizar(pk, ser.validated_data, token=token)
        return Response(result, status=status.HTTP_200_OK)
    @extend_schema(
        tags=['Bienes'],
        summary="Listar bienes asignados a un usuario (kit)",
        description=(
            "Retorna todos los bienes activos cuyo custodio actual es el usuario indicado. "
            "Útil para visualizar el kit completo (CPU + Monitor + Teclado + Mouse) "
            "de un usuario jurisdiccional o administrativo."
        ),
        parameters=[
            OpenApiParameter('usuario_id', OpenApiTypes.INT, location=OpenApiParameter.PATH,
                             description="ID del usuario en ms-usuarios"),
        ],
        responses={200: BienListSerializer(many=True)},
    )
    @action(detail=False, methods=['get'], url_path='usuario/(?P<usuario_id>[0-9]+)')
    def por_usuario(self, request, usuario_id=None):
        result = BienService.listar_por_usuario(int(usuario_id))
        serializer=BienListSerializer(result['data'], many=True)
        return Response(serializer.data,status=status.HTTP_200_OK,)
    @extend_schema(
        tags=['Bienes'],
        summary="Bienes disponibles en una sede (sin usuario asignado)",
        description=(
            "Retorna bienes activos de la sede indicada que aún no tienen "
            "usuario final asignado. Usado por ASISTSISTEMA para seleccionar "
            "bienes en una Asignación Interna."
        ),
        parameters=[
            OpenApiParameter('sede_id', OpenApiTypes.INT, location=OpenApiParameter.PATH,
                             description="ID de la sede en ms-usuarios"),
        ],
        responses={200: BienListSerializer(many=True)},
    )
    @action(detail=False, methods=['get'], url_path='disponibles/(?P<sede_id>[0-9]+)')
    def disponibles_sede(self, request, sede_id=None):
        token = self._get_token(request)
        result = BienService.listar_disponibles_en_sede(int(sede_id), request.user.id,token=token)
        serializer=BienListSerializer(result['data'], many=True)
        return Response(serializer.data,status=status.HTTP_200_OK,)