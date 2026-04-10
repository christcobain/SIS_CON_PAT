from django.conf import settings
from rest_framework import status
from rest_framework.viewsets import ViewSet
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated,OR
from rest_framework.exceptions import ValidationError
from rest_framework.parsers import MultiPartParser, FormParser

from django.http import HttpResponse

from drf_spectacular.utils import (
    extend_schema,
    OpenApiParameter,
    OpenApiTypes,
    OpenApiExample,
)

from shared.backends import CookieJWTAuthentication
from shared.permissions import HasJWTPermission
from shared import storage_client

from .services import BajaService
from .serializers import (
    BajaListSerializer,
    BajaDetailSerializer,
    BajaCreateSerializer,
    BajaReenviarSerializer,
    DevolucionSerializer,
    CancelacionSerializer,
    MantenimientoParaBajaSerializer,
    BienParaBajaSerializer,
)

def _get_token(request) -> str:
        cookie_name = getattr(settings, 'JWT_AUTH_COOKIE', 'sisconpat_access')
        token = request.COOKIES.get(cookie_name)
        if not token:
            auth_header = request.headers.get('Authorization', '')
            if auth_header.startswith('Bearer '):
                token = auth_header.split(' ', 1)[1]
        return token
def _get_sede(request) -> int:
        sedes = request.auth.get('sedes_ids', []) if request.auth else []
        if not sedes:
            raise ValidationError('El usuario no tiene sede asignada.')
        return sedes[0]

def _get_sede_nombre_from_token(request) -> str:
    sedes = request.auth.get('sedes', []) if request.auth else []
    if sedes and isinstance(sedes[0], dict):
        return sedes[0].get('nombre', '')
    return ''

def _get_modulo_id_from_token(request):
    return request.auth.get('modulo_id') if request.auth else None

def _get_modulo_nombre_from_token(request) -> str:
    return request.auth.get('modulo_nombre', '') if request.auth else ''

def _get_nombre_completo(request) -> str:
    if request.auth:
        nombres   = request.auth.get('nombres', '')
        apellidos = request.auth.get('apellidos', '')
        return f'{nombres} {apellidos}'.strip()
    return 'Usuario Desconocido'

def _get_cargo_from_token(request) -> str:
    return request.auth.get('cargo', '') if request.auth else ''

def _get_role(request) -> str:
    return request.auth.get('role', '') if request.auth else ''

_R400 = {400: OpenApiTypes.OBJECT}
_R404 = {404: OpenApiTypes.OBJECT}


class BajaViewSet(ViewSet):
    def get_permissions(self):
        view_b   = HasJWTPermission('ms-bienes:bajas:view_baja')
        view_bd  = HasJWTPermission('ms-bienes:bajas:view_bajadetalle')
        view_ba  = HasJWTPermission('ms-bienes:bajas:view_bajaaprobacion')
        add_b    = HasJWTPermission('ms-bienes:bajas:add_baja')
        add_bd   = HasJWTPermission('ms-bienes:bajas:add_bajadetalle')
        add_ba   = HasJWTPermission('ms-bienes:bajas:add_bajaaprobacion')
        chg_b    = HasJWTPermission('ms-bienes:bajas:change_baja')
        del_b    = HasJWTPermission('ms-bienes:bajas:delete_baja'),
        del_md   = HasJWTPermission('ms-bienes:bajas:delete_baja')
        perms = {
            'list':                    [OR(view_b,view_ba)],
            'retrieve':                [OR(view_b,view_ba)],
            'create':                  [add_b],
            'reenviar':                [add_b],
            'pendientes_aprobacion':    [OR(add_b,add_ba)],
            'aprobar':                 [add_ba],
            'devolver':                [add_ba],
            'cancelar':                [add_b],
            'descargar_pdf':           [add_b],
            'subir_pdf_firmado':       [add_b],
            'bienes_para_baja':        [add_b],
            'mantenimientos_del_bien': [add_b],
        }
        return perms.get(self.action, [IsAuthenticated()])

    @extend_schema(
        tags=['Bajas'],
        operation_id='bajas_list',
        summary='Listar informes de baja',
        parameters=[
            OpenApiParameter('estado_baja',        OpenApiTypes.STR, description='PENDIENTE_APROBACION | ATENDIDO | DEVUELTO | CANCELADO'),
            OpenApiParameter('sede_elabora_id',    OpenApiTypes.INT, description='ID de la sede que elaboró la baja.'),
            OpenApiParameter('usuario_elabora_id', OpenApiTypes.INT, description='ID del asistente que registró la baja.'),
        ],
        responses={200: BajaListSerializer(many=True)},
    )
    def list(self, request):
        filters = {
            'estado_baja':        request.query_params.get('estado_baja'),
            'sede_elabora_id':    request.query_params.get('sede_elabora_id'),
            'usuario_elabora_id': request.query_params.get('usuario_elabora_id'),
        }
        for key in ('sede_elabora_id', 'usuario_elabora_id'):
            if filters[key]:
                try:
                    filters[key] = int(filters[key])
                except ValueError:
                    filters[key] = None
        result = BajaService.listar(filters)
        return Response(BajaListSerializer(result['data'], many=True).data, status=status.HTTP_200_OK)

    @extend_schema(
        tags=['Bajas'],
        operation_id='bajas_retrieve',
        summary='Obtener detalle completo de un informe de baja',
        parameters=[OpenApiParameter('id', OpenApiTypes.INT, location=OpenApiParameter.PATH)],
        responses={200: BajaDetailSerializer, **_R404},
    )
    def retrieve(self, request, pk=None):
        result = BajaService.obtener(int(pk))
        return Response(BajaDetailSerializer(result['data']).data, status=status.HTTP_200_OK)

    @extend_schema(
        tags=['Bajas'],
        operation_id='bajas_create',
        summary='Registrar informe de baja (ASISTSISTEMA)',
        request=BajaCreateSerializer,
        responses={201: BajaDetailSerializer, **_R400},
    )
    def create(self, request):
        ser = BajaCreateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        result = BajaService.crear(
            data=ser.validated_data,
            usuario_elabora_id=request.user.id,
            nombre_elabora=_get_nombre_completo(request),
            cargo_elabora_token=_get_cargo_from_token(request),
            sede_elabora_id=_get_sede(request),
            sede_nombre=_get_sede_nombre_from_token(request),
            modulo_elabora_id=_get_modulo_id_from_token(request),
            modulo_elabora_nombre=_get_modulo_nombre_from_token(request),
            rol=_get_role(request),
        )
        return Response(result, status=status.HTTP_201_CREATED)

    @extend_schema(
        tags=['Bajas'],
        operation_id='bajas_reenviar',
        summary='Reenviar informe a aprobación tras corrección (ASISTSISTEMA)',
        parameters=[OpenApiParameter('id', OpenApiTypes.INT, location=OpenApiParameter.PATH)],
        request=BajaReenviarSerializer,
        responses={200: BajaDetailSerializer, **_R400, **_R404},
    )
    @action(detail=True, methods=['patch'], url_path='reenviar')
    def reenviar(self, request, pk=None):
        ser = BajaReenviarSerializer(data=request.data)
        ser.is_valid(raise_exception=True)   
        result = BajaService.reenviar(pk=pk, 
                                      data=ser.validated_data,
                                      usuario_id=request.user.id,
                                      role=_get_role(request),
                                      token=_get_token(request) )
        return Response({
            'success': True,
            'message': result['message'],
            'data':    BajaDetailSerializer(result['data']).data,
        })

    @extend_schema(
        tags=['Bajas'],
        summary='Pendientes de aprobación Bajas',
        description=(
            'Liasta las Bajas en estado `PENDIENTE_APROBACION` '
            'filtrando por sede del usuario autenticado.\n\n'
            '- **SYSADMIN**: todos los pendientes.\n'
            '- **COORDSISTEMA**: de todas las sedes'
            '- **ASISTSISTEMA**: de su propia sede'
        ),
        responses={200: BajaListSerializer(many=True)},
    )
    @action(detail=False, methods=['get'], url_path='pendientes-aprobacion')
    def pendientes_aprobacion(self,request):
        qs=BajaService.listar_pendientes_aprobacion(
            user_id=request.user.id,
            role=_get_role(request),
            sede_id=_get_sede(request),
            token=_get_token(request),
            )
        return Response(BajaListSerializer(qs,many=True).data)


    @extend_schema(
        tags=['Bajas'],
        operation_id='bajas_aprobar',
        summary='Aprobar informe de baja (COORDSISTEMA)',
        parameters=[OpenApiParameter('id', OpenApiTypes.INT, location=OpenApiParameter.PATH)],
        responses={200: OpenApiTypes.OBJECT, **_R400, **_R404},
    )
    @action(detail=True, methods=['patch'], url_path='aprobar')
    def aprobar(self, request, pk=None):
        result = BajaService.aprobar(
            pk=pk,
            coordsistema_id=request.user.id,
            nombre_coord=_get_nombre_completo(request),
            cargo_coord=_get_cargo_from_token(request),
            role=_get_role(request),
        )
        return Response(result, status=status.HTTP_200_OK)

    @extend_schema(
        tags=['Bajas'],
        operation_id='bajas_devolver',
        summary='Devolver informe a corrección (COORDSISTEMA)',
        parameters=[OpenApiParameter('id', OpenApiTypes.INT, location=OpenApiParameter.PATH)],
        request=DevolucionSerializer,
        responses={200: OpenApiTypes.OBJECT, **_R400, **_R404},
        examples=[
            OpenApiExample(
                'Devolución',
                value={'motivo_devolucion': 'Falta incluir el mantenimiento MNT-2026-0014 como sustento técnico.'},
                request_only=True,
            ),
        ],
    )
    @action(detail=True, methods=['patch'], url_path='devolver')
    def devolver(self, request, pk=None):
        ser = DevolucionSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        result = BajaService.devolver(
            pk=pk, 
            motivo=ser.validated_data['motivo_devolucion'], 
            usuario_id=request.user.id,
            role=_get_role(request),
            )
        return Response(result, status=status.HTTP_200_OK)

    @extend_schema(
        tags=['Bajas'],
        operation_id='bajas_cancelar',
        summary='Cancelar informe de baja',
        parameters=[OpenApiParameter('id', OpenApiTypes.INT, location=OpenApiParameter.PATH)],
        request=CancelacionSerializer,
        responses={200: OpenApiTypes.OBJECT, **_R400, **_R404},
    )
    @action(detail=True, methods=['patch'], url_path='cancelar')
    def cancelar(self, request, pk=None):
        ser = CancelacionSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        result = BajaService.cancelar(
            pk=pk,
            motivo_cancelacion_id=ser.validated_data['motivo_cancelacion_id'],
            detalle=ser.validated_data.get('detalle_cancelacion', ''),
            usuario_id=request.user.id,
            role=_get_role(request),
        )
        return Response(result, status=status.HTTP_200_OK)

    @extend_schema(
        tags=['Bajas'],
        operation_id='bajas_descargar_pdf',
        summary='Descargar PDF del informe de baja desde Supabase Storage',
        description=(
            'Descarga el PDF del informe desde Supabase Storage.\n\n'
            '- Sin parámetros: devuelve el PDF generado automáticamente (`pdf_path`).\n'
            '- Con `?firmado=1`: devuelve el PDF firmado (`pdf_firmado_path`), si existe.\n\n'
            'Genera una URL firmada de Supabase con expiración de 60 segundos y redirige.'
        ),
        parameters=[
            OpenApiParameter('id',      OpenApiTypes.INT, location=OpenApiParameter.PATH),
            OpenApiParameter('firmado', OpenApiTypes.INT, location=OpenApiParameter.QUERY,
                             required=False, description='1 para descargar el PDF firmado'),
        ],
        responses={200: OpenApiTypes.BINARY, 404: OpenApiTypes.OBJECT},
    )
    @action(detail=True, methods=['get'], url_path='descargar-pdf')
    def descargar_pdf(self, request, pk=None):
        es_firmado = request.query_params.get('firmado') == '1'        
        pdf_bytes = BajaService.descargar_pdf(pk, firmado=es_firmado)
        response  = HttpResponse(pdf_bytes, content_type='application/pdf')
        response['Content-Disposition'] = f'inline; filename="MNT-{pk}.pdf"'
        return response    

    @extend_schema(
        tags=['Bajas'],
        operation_id='bajas_subir_pdf_firmado',
        summary='Subir documento físico firmado a Supabase Storage',
        description=(
            'Sube el documento impreso y firmado a Supabase Storage en la ruta '
            '`bajas/firmados/`. Acepta PDF, JPG, JPEG o PNG.\n\n'
            'Campo del formulario: `archivo` (multipart/form-data).'
        ),
        parameters=[OpenApiParameter('id', OpenApiTypes.INT, location=OpenApiParameter.PATH)],
        responses={200: OpenApiTypes.OBJECT, **_R400, **_R404},
    )
    @action(detail=True, methods=['post'], url_path='pdf-firmado',parser_classes=[MultiPartParser, FormParser])
    def subir_pdf_firmado(self, request, pk=None):
        archivo = request.FILES.get('archivo')
        if not archivo:
            return Response(
                {'success': False, 'error': 'Se requiere el campo "archivo".'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        result = BajaService.subir_pdf_firmado(
            pk=int(pk),
            archivo=archivo,
            usuario_id=request.user.id,
            role=_get_role(request),
        )
        return Response(result, status=status.HTTP_200_OK)

    @extend_schema(
        tags=['Bajas'],
        operation_id='bajas_bienes_para_baja',
        summary='Listar bienes disponibles para dar de baja (ASISTSISTEMA)',
        responses={200: BienParaBajaSerializer(many=True), **_R400},
    )
    @action(detail=False, methods=['get'], url_path='bienes-para-baja')
    def bienes_para_baja(self, request):
        sede_id = _get_sede(request)
        data    = BajaService.obtener_bienes_para_baja(sede_id)
        return Response(BienParaBajaSerializer(data, many=True).data, status=status.HTTP_200_OK)

    @extend_schema(
        tags=['Bajas'],
        operation_id='bajas_mantenimientos_del_bien',
        summary='Mantenimientos disponibles para dar de baja un bien específico',
        parameters=[
            OpenApiParameter('bien_id', OpenApiTypes.INT, location=OpenApiParameter.QUERY,
                             required=True, description='ID del bien a evaluar.'),
        ],
        responses={200: MantenimientoParaBajaSerializer(many=True), **_R400},
    )
    @action(detail=False, methods=['get'], url_path='mantenimientos-del-bien')
    def mantenimientos_del_bien(self, request):
        bien_id_raw = request.query_params.get('bien_id')
        if not bien_id_raw:
            raise ValidationError({'bien_id': 'Este parámetro es requerido.'})
        try:
            bien_id = int(bien_id_raw)
        except ValueError:
            raise ValidationError({'bien_id': 'Debe ser un entero válido.'})
        data = BajaService.obtener_mantenimientos_para_baja(bien_id)
        return Response(MantenimientoParaBajaSerializer(data, many=True).data, status=status.HTTP_200_OK)