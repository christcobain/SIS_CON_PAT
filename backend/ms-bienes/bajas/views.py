import os
from pathlib import Path

from django.conf import settings
from django.http import FileResponse, Http404

from rest_framework import status
from rest_framework.viewsets import ViewSet
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import ValidationError
from rest_framework.parsers import MultiPartParser, FormParser

from drf_spectacular.utils import (
    extend_schema,
    OpenApiParameter,
    OpenApiTypes,
    OpenApiExample,
)

from shared.backends import CookieJWTAuthentication
from shared.permissions import HasJWTPermission

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



def _get_sede_id_from_token(request) -> int:
    sedes = request.auth.get('sedes_ids', []) if request.auth else []
    if not sedes:
        raise ValidationError('El usuario no tiene sede asignada en el token JWT.')
    return int(sedes[0]) 
 
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
        nombres = request.auth.get('nombres', '')
        apellidos = request.auth.get('apellidos', '')
        return f"{nombres} {apellidos}".strip()
    return "Usuario Desconocido"
 
def _get_cargo_from_token(request) -> str:
    return request.auth.get('cargo', '') if request.auth else '' 
 
def _get_role(request) -> str:
    return request.auth.get('role', '') if request.auth else ''
_R400 = {400: OpenApiTypes.OBJECT}
_R404 = {404: OpenApiTypes.OBJECT}


class BajaViewSet(ViewSet):
    def get_permissions(self):
        mapa = {
            'list':                    [HasJWTPermission('ms-bienes:bajas:view_baja')],
            'retrieve':                [HasJWTPermission('ms-bienes:bajas:view_baja')],
            'create':                  [HasJWTPermission('ms-bienes:bajas:add_baja')],
            'reenviar':                [HasJWTPermission('ms-bienes:bajas:add_baja')],
            'aprobar':                 [HasJWTPermission('ms-bienes:bajas:change_baja')],
            'devolver':                [HasJWTPermission('ms-bienes:bajas:change_baja')],
            'cancelar':                [HasJWTPermission('ms-bienes:bajas:delete_baja')],
            'descargar_pdf':           [HasJWTPermission('ms-bienes:bajas:view_baja')],
            'subir_pdf_firmado':       [HasJWTPermission('ms-bienes:bajas:add_baja')],
            'bienes_para_baja':        [HasJWTPermission('ms-bienes:bajas:add_baja')],
            'mantenimientos_del_bien': [HasJWTPermission('ms-bienes:bajas:add_baja')],
        }
        return mapa.get(self.action, [IsAuthenticated()])

    @extend_schema(
        tags=['Bajas'],
        operation_id='bajas_list',
        summary='Listar informes de baja',
        description=(
            'Retorna la lista de informes de baja con filtros opcionales.\n\n'
            '**Visibilidad por rol:**\n'
            '- `SYSADMIN` / `COORDSISTEMA`: ven todas las sedes.\n'
            '- `ASISTSISTEMA` / `ADMINSEDE`: deben filtrar por su `sede_elabora_id` '
            'para ver únicamente las bajas de su sede.\n\n'
            '**Estados posibles:** `PENDIENTE_APROBACION`, `ATENDIDO`, `DEVUELTO`, `CANCELADO`.'
        ),
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
        description=(
            'Retorna el informe técnico completo:\n\n'
            '- Datos de la baja (estado, fechas, cargos, secciones del informe).\n'
            '- `detalles`: lista de bienes con snapshot de tipo, marca, modelo, '
            'N° serie, código patrimonial, estado de funcionamiento, diagnóstico '
            'técnico e imágenes de evidencia seleccionadas.\n'
            '- `aprobaciones`: historial completo de acciones.\n'
            '- `pdf_path`: usar `/bajas/{id}/descargar-pdf/` para descargar el documento.'
        ),
        parameters=[
            OpenApiParameter('id', OpenApiTypes.INT, location=OpenApiParameter.PATH),
        ],
        responses={200: BajaDetailSerializer, **_R404},
    )
    def retrieve(self, request, pk=None):
        result = BajaService.obtener(int(pk))
        return Response(BajaDetailSerializer(result['data']).data, status=status.HTTP_200_OK)

    @extend_schema(
        tags=['Bajas'],
        operation_id='bajas_create',
        summary='Registrar informe de baja (ASISTSISTEMA)',
        description=(
            'ASISTSISTEMA registra el informe técnico de baja. El sistema:\n\n'
            '1. Valida que cada bien tenga estado de funcionamiento '
            '**INOPERATIVO**, **OBSOLETO** o **IRRECUPERABLE**.\n'
            '2. Si se indica `mantenimiento_id`, verifica que esté ATENDIDO '
            'y que el `estado_funcionamiento_final` también sea crítico. '
            'Copia automáticamente los diagnósticos al detalle de la baja.\n'
            '3. Si se indican `imagenes_incluidas` (IDs de MantenimientoImagen), '
            'se vinculan como evidencia.\n'
            '4. Genera automáticamente el documento Word y lo convierte a PDF.\n'
            '5. Estado inicial: `PENDIENTE_APROBACION`.\n'
            '6. El número de informe se genera automáticamente: `BAJ-YYYY-NNNN`.\n'
            '7. La sede y módulo del elaborador se obtienen del token JWT.\n\n'
            '`usuario_destino_id` debe ser el ID del Coordinador de Informática al que '
            'va dirigido el informe. Proporcionar `nombre_destino` y `cargo_destino` '
            'para que queden impresos en el documento.'
        ),
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
            sede_elabora_id=_get_sede_id_from_token(request),
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
        description=(
            'ASISTSISTEMA puede corregir las secciones narrativas y reenviar '
            'el informe cuando está en estado `DEVUELTO`.\n\n'
            '- Solo se actualizan los campos narrativos que se envíen.\n'
            '- El documento DOCX y PDF se regeneran automáticamente.\n'
            '- Estado pasa a `PENDIENTE_APROBACION`.\n'
            '- Se registra acción `ENVIADO` en el historial.'
        ),
        parameters=[
            OpenApiParameter('id', OpenApiTypes.INT, location=OpenApiParameter.PATH),
        ],
        request=BajaReenviarSerializer,
        responses={200: BajaDetailSerializer, **_R400, **_R404},
    )
    @action(detail=True, methods=['patch'], url_path='reenviar')
    def reenviar(self, request, pk=None):
        ser = BajaReenviarSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        result = BajaService.reenviar(
            int(pk),
            ser.validated_data,
            request.user.id,
        )
        return Response(
    {
        'success': True,
        'message': result['message'],
        'data':    BajaDetailSerializer(result['data']).data
    }
)

    @extend_schema(
        tags=['Bajas'],
        operation_id='bajas_aprobar',
        summary='Aprobar informe de baja (COORDSISTEMA)',
        description=(
            'COORDSISTEMA aprueba el informe técnico.\n\n'
            '- Estado pasa a `ATENDIDO`.\n'
            '- Cada bien del informe queda con `is_active=False`, `fecha_baja` y `motivo_baja_id`.\n'
            '- Se registra acción `APROBADO` en el historial.\n'
            '- El nombre y cargo del coordinador se capturan del token JWT.'
        ),
        parameters=[
            OpenApiParameter('id', OpenApiTypes.INT, location=OpenApiParameter.PATH),
        ],
        responses={200: OpenApiTypes.OBJECT, **_R400, **_R404},
    )
    @action(detail=True, methods=['patch'], url_path='aprobar')
    def aprobar(self, request, pk=None):
        result = BajaService.aprobar(
            int(pk),
            request.user.id,
            _get_nombre_completo(request),
            _get_cargo_from_token(request),
        )
        return Response(result, status=status.HTTP_200_OK)

    @extend_schema(
        tags=['Bajas'],
        operation_id='bajas_devolver',
        summary='Devolver informe a corrección (COORDSISTEMA)',
        description=(
            'COORDSISTEMA devuelve el informe indicando el motivo de rechazo.\n\n'
            '- Estado pasa a `DEVUELTO`.\n'
            '- Se registra acción `DEVUELTO` en el historial.\n'
            '- ASISTSISTEMA puede corregir y reenviar con `/reenviar/`.\n\n'
            '`motivo_devolucion` mínimo 5 caracteres.'
        ),
        parameters=[
            OpenApiParameter('id', OpenApiTypes.INT, location=OpenApiParameter.PATH),
        ],
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
            int(pk),
            ser.validated_data['motivo_devolucion'],
            request.user.id,
        )
        return Response(result, status=status.HTTP_200_OK)

    @extend_schema(
        tags=['Bajas'],
        operation_id='bajas_cancelar',
        summary='Cancelar informe de baja',
        description=(
            'Cancela el informe antes de que sea aprobado.\n\n'
            '- No cancelable en estado `ATENDIDO` o `CANCELADO`.\n'
            '- Los bienes permanecen activos en inventario.\n'
            '- Se registra acción `CANCELADO` en el historial.'
        ),
        parameters=[
            OpenApiParameter('id', OpenApiTypes.INT, location=OpenApiParameter.PATH),
        ],
        request=CancelacionSerializer,
        responses={200: OpenApiTypes.OBJECT, **_R400, **_R404},
    )
    @action(detail=True, methods=['patch'], url_path='cancelar')
    def cancelar(self, request, pk=None):
        ser = CancelacionSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        result = BajaService.cancelar(
            int(pk),
            ser.validated_data['motivo_cancelacion_id'],
            ser.validated_data.get('detalle_cancelacion', ''),
            request.user.id,
        )
        return Response(result, status=status.HTTP_200_OK)
    @extend_schema(
        tags=['Bajas'],
        operation_id='bajas_descargar_pdf',
        summary='Descargar PDF del informe de baja',
        description=(
            'Descarga el PDF del informe.\n\n'
            '- Sin parámetros: devuelve el PDF generado automáticamente (`pdf_path`).\n'
            '- Con `?firmado=1`: devuelve el PDF firmado (`pdf_firmado_path`), si existe.\n\n'
            'Retorna `Content-Type: application/pdf` con `Content-Disposition: attachment`.'
        ),
        parameters=[
            OpenApiParameter('id',      OpenApiTypes.INT,  location=OpenApiParameter.PATH),
            OpenApiParameter('firmado', OpenApiTypes.INT,  location=OpenApiParameter.QUERY,
                             required=False, description='1 para descargar el PDF firmado'),
        ],
        responses={200: OpenApiTypes.BINARY, 404: OpenApiTypes.OBJECT},
    )
    @action(detail=True, methods=['get'], url_path='descargar-pdf')
    def descargar_pdf(self, request, pk=None):
        baja    = BajaService.descargar_pdf(int(pk))
        firmado = request.query_params.get('firmado') == '1' 
        if firmado:
            if not baja.pdf_firmado_path:
                raise Http404('No existe PDF firmado para esta baja.')
            ruta_rel = baja.pdf_firmado_path
        else:
            if not baja.pdf_path:
                raise Http404('Archivo PDF no encontrado en el servidor.')
            ruta_rel = baja.pdf_path 
        pdf_abs = Path(settings.MEDIA_ROOT) / ruta_rel
        if not pdf_abs.exists():
            raise Http404('Archivo PDF no encontrado en el servidor.') 
        response = FileResponse(open(str(pdf_abs), 'rb'),content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{pdf_abs.name}"'
        return response
    @extend_schema(
        tags=['Bajas'],
        operation_id='bajas_subir_pdf_firmado',
        summary='Subir documento físico firmado (COORDSISTEMA)',
        description=(
            'Permite adjuntar el documento impreso y firmado físicamente '
            'después de que la baja esté en estado `ATENDIDO`.\n\n'
            '- Reemplaza el `pdf_path` con la ruta del archivo firmado.\n'
            '- Se registra en el historial de aprobaciones.\n'
            '- El archivo puede ser PDF, JPG, JPEG o PNG.\n\n'
            'Campo del formulario: `archivo` (multipart/form-data).'
        ),
        parameters=[
            OpenApiParameter('id', OpenApiTypes.INT, location=OpenApiParameter.PATH),
        ],
        responses={200: OpenApiTypes.OBJECT, **_R400, **_R404},
    )
    @action(detail=True,methods=['post'],url_path='pdf-firmado',parser_classes=[MultiPartParser, FormParser],)
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
        description=(
            'Retorna todos los bienes activos de la sede del ASISTSISTEMA con estado '
            '**INOPERATIVO**, **OBSOLETO** o **IRRECUPERABLE**.\n\n'
            'Por cada bien incluye `mantenimientos_disponibles`: mantenimientos ATENDIDOS '
            'cuyo diagnóstico final dejó el bien en estado crítico, con diagnósticos '
            'completos e imágenes de evidencia.\n\n'
            '**Uso en el modal de creación:**\n'
            '1. El frontend lista los bienes disponibles.\n'
            '2. El usuario selecciona los bienes a incluir.\n'
            '3. Para cada bien puede vincular un mantenimiento para pre-poblar el diagnóstico.\n'
            '4. El usuario selecciona imágenes de evidencia del mantenimiento.\n\n'
            'La sede se obtiene automáticamente del token JWT.'
        ),
        responses={200: BienParaBajaSerializer(many=True), **_R400},
    )
    @action(detail=False, methods=['get'], url_path='bienes-para-baja')
    def bienes_para_baja(self, request):
        sede_id = _get_sede_id_from_token(request)
        data    = BajaService.obtener_bienes_para_baja(sede_id)
        return Response(BienParaBajaSerializer(data, many=True).data, status=status.HTTP_200_OK)

    @extend_schema(
        tags=['Bajas'],
        operation_id='bajas_mantenimientos_del_bien',
        summary='Mantenimientos disponibles para dar de baja un bien específico',
        description=(
            'Retorna los mantenimientos **ATENDIDOS** del bien especificado cuyo '
            '`estado_funcionamiento_final` sea **INOPERATIVO**, **OBSOLETO** o **IRRECUPERABLE**.\n\n'
            'Para cada mantenimiento devuelve diagnósticos completos e imágenes de evidencia.\n\n'
            'Este endpoint es complementario a `bienes-para-baja`. Útil cuando el usuario '
            'necesita consultar los mantenimientos de un bien específico por separado, '
            'sin recargar toda la lista de bienes.'
        ),
        parameters=[
            OpenApiParameter(
                'bien_id', OpenApiTypes.INT,
                location=OpenApiParameter.QUERY,
                required=True,
                description='ID del bien a evaluar.',
            ),
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