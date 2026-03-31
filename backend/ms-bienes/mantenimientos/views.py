from django.conf import settings
from django.http import HttpResponse

from rest_framework import status
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ViewSet

from drf_spectacular.utils import (
    extend_schema,
    extend_schema_view,
    OpenApiParameter,
    OpenApiTypes,
    OpenApiResponse,
)

from shared.permissions import HasJWTPermission
from .services import MantenimientoService
from .serializers import (
    MantenimientoListSerializer,
    MantenimientoDetailSerializer,
    MantenimientoCreateSerializer,
    EnviarAprobacionSerializer,
    AprobacionSerializer,
    DevolucionSerializer,
    CancelacionSerializer,
)


_PK  = OpenApiParameter(
    'id', OpenApiTypes.INT,
    location=OpenApiParameter.PATH,
    description='ID del mantenimiento.',
)
_OK  = OpenApiResponse(description='Operación exitosa.',         response=OpenApiTypes.OBJECT)
_ERR = OpenApiResponse(description='Error de validación (400).', response=OpenApiTypes.OBJECT)
_403 = OpenApiResponse(description='Sin permisos (403).',        response=OpenApiTypes.OBJECT)
_404 = OpenApiResponse(description='No encontrado (404).',       response=OpenApiTypes.OBJECT)

_ESTADO_ENUM = [
    'EN_PROCESO',
    'PENDIENTE_APROBACION',
    'APROBADO',
    'ATENDIDO',
    'DEVUELTO',
    'CANCELADO',
]


@extend_schema_view(
    list=extend_schema(
        tags=['Mantenimientos'],
        summary='Listar mantenimientos',
        description=(
            'Retorna mantenimientos filtrados según el rol del usuario autenticado.\n\n'
            '- **SYSADMIN / COORDSISTEMA**: todos los mantenimientos de todas las sedes.\n'
            '- **ADMINSEDE**: solo los de su propia sede.\n'
            '- **ASISTSISTEMA**: los que registró dentro de su sede.\n'
            '- **userCorte**: solo los mantenimientos donde es propietario de los bienes.'
        ),
        parameters=[
            OpenApiParameter(
                'estado', OpenApiTypes.STR,
                required=False, enum=_ESTADO_ENUM,
                description='Filtrar por estado del mantenimiento.',
            ),
            OpenApiParameter('sede_id',                OpenApiTypes.INT, required=False),
            OpenApiParameter('usuario_realiza_id',     OpenApiTypes.INT, required=False),
            OpenApiParameter('usuario_propietario_id', OpenApiTypes.INT, required=False),
        ],
        responses={200: MantenimientoListSerializer(many=True), 401: _ERR, 403: _403},
    ),
    retrieve=extend_schema(
        tags=['Mantenimientos'],
        summary='Obtener detalle de un mantenimiento',
        description=(
            'Retorna la cabecera, el detalle técnico de cada bien '
            '(estado inicial/final, diagnósticos, trabajos realizados), '
            'el historial de aprobaciones y las imágenes de evidencia.'
        ),
        parameters=[_PK],
        responses={200: MantenimientoDetailSerializer, 403: _403, 404: _404},
    ),
    create=extend_schema(
        tags=['Mantenimientos'],
        summary='Registrar nuevo mantenimiento',
        description=(
            'ASISTSISTEMA registra un mantenimiento en estado **EN_PROCESO**.\n\n'
            '**Validaciones críticas:**\n'
            '- Todos los bienes deben estar activos (`is_active=True`).\n'
            '- Todos los bienes deben pertenecer al mismo `usuario_asignado_id`.\n\n'
            'El sistema captura automáticamente:\n'
            '- `estado_funcionamiento_inicial` de cada bien desde `bien.estado_funcionamiento`.\n'
            '- `fecha_inicio_mant` = fecha actual.\n'
            '- `usuario_propietario_id` = `bien.usuario_asignado_id`.\n\n'
            'La sede y módulo se obtienen del token JWT.'
        ),
        request=MantenimientoCreateSerializer,
        responses={
            201: MantenimientoDetailSerializer,
            400: _ERR,
            403: _403,
        },
    ),
)
class MantenimientoViewSet(ViewSet):
    def get_permissions(self):
        perms = {
            'list':               [HasJWTPermission('ms-bienes:mantenimientos:view_mantenimiento')],
            'retrieve':           [HasJWTPermission('ms-bienes:mantenimientos:view_mantenimiento')],
            'mis_mantenimientos': [HasJWTPermission('ms-bienes:mantenimientos:view_mantenimiento')],
            'create':             [HasJWTPermission('ms-bienes:mantenimientos:add_mantenimiento')],
            'enviar_aprobacion':  [HasJWTPermission('ms-bienes:mantenimientos:add_mantenimiento')],
            'pendientes_aprobacion': [HasJWTPermission('ms-bienes:mantenimientos:change_mantenimiento')],
            'subir_imagen':       [HasJWTPermission('ms-bienes:mantenimientos:add_mantenimientoimagen')],
            'aprobar':            [HasJWTPermission('ms-bienes:mantenimientos:change_mantenimiento')],
            'devolver':           [HasJWTPermission('ms-bienes:mantenimientos:change_mantenimiento')],
            'cancelar':           [HasJWTPermission('ms-bienes:mantenimientos:delete_mantenimiento')],
            'subir_pdf_firmado':  [HasJWTPermission('ms-bienes:mantenimientos:add_mantenimiento')],
            'documento':          [HasJWTPermission('ms-bienes:mantenimientos:view_mantenimientoimagen')],
        }
        return perms.get(self.action, [IsAuthenticated()])

    def _get_token(self, request) -> str:
        cookie_name = getattr(settings, 'JWT_AUTH_COOKIE', 'sisconpat_access')
        return request.COOKIES.get(cookie_name, '')

    def _get_role(self, request) -> str:
        return request.auth.get('role', '') if request.auth else ''

    def _get_sede(self, request) -> int:
        sedes = request.auth.get('sedes_ids', []) if request.auth else []
        if not sedes:
            raise ValidationError('El usuario no tiene sede asignada.')
        return sedes[0]

    def _get_modulo(self, request):
        return request.auth.get('modulo_id', None) if request.auth else None

    def list(self, request):
        filtros = {k: v for k, v in request.query_params.items()}
        qs = MantenimientoService.listar(
            filtros,
            self._get_token(request),
        )
        return Response(
            MantenimientoListSerializer(qs, many=True).data,
            status=status.HTTP_200_OK,
        )

    def retrieve(self, request, pk=None):
        m = MantenimientoService.obtener(pk, self._get_token(request))
        return Response(
            MantenimientoDetailSerializer(m).data,
            status=status.HTTP_200_OK,
        )
    def create(self, request):
        ser = MantenimientoCreateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        mant = MantenimientoService.crear(
            data=ser.validated_data,
            usuario_realiza_id=request.user.id,
            sede_id=self._get_sede(request),
            modulo_id=self._get_modulo(request),
        )
        return Response(mant,status=status.HTTP_201_CREATED)
    

    @extend_schema(
        tags=['Mantenimientos'],
        summary='Mis mantenimientos',
        description=(
            'Retorna solo los mantenimientos relevantes para el rol del usuario:\n\n'
            '- **COORDSISTEMA / SYSADMIN**: todos.\n'
            '- **ADMINSEDE**: los de su sede.\n'
            '- **ASISTSISTEMA**: los que registró o los de su sede.\n'
            '- **userCorte**: solo los de sus propios bienes.'
        ),
        parameters=[
            OpenApiParameter(
                'estado', OpenApiTypes.STR,
                required=False, enum=_ESTADO_ENUM,
            ),
        ],
        responses={200: MantenimientoListSerializer(many=True), 401: _ERR},
    )
    @action(detail=False, methods=['get'], url_path='mis-mantenimientos')
    def mis_mantenimientos(self, request):
        filters = {'estado': request.query_params.get('estado')}
        qs = MantenimientoService.mis_mantenimientos(
            usuario_id=request.user.id,
            role=self._get_role(request),
            sede_id=self._get_sede(request),
            filters=filters,
            token=self._get_token(request),
        )
        return Response(
            MantenimientoListSerializer(qs, many=True).data,
            status=status.HTTP_200_OK,
        )
    @extend_schema(
        tags=['Mantenimientos'],
        summary='Enviar a aprobación (ASISTSISTEMA)',
        description=(
            'ASISTSISTEMA completa el informe técnico de cada bien y envía a aprobación.\n\n'
            '**Estados válidos:** `EN_PROCESO` → `PENDIENTE_APROBACION` '
            '| `DEVUELTO` → `PENDIENTE_APROBACION`\n\n'
            'Para cada bien en `detalles_tecnicos` debe indicar:\n'
            '- `bien_id`: ID del bien (debe pertenecer a este mantenimiento).\n'
            '- `estado_funcionamiento_final_id`: estado del bien tras el mantenimiento.\n'
            '- `trabajo_realizado`: descripción del trabajo ejecutado (mínimo 5 caracteres).\n'
            '- `diagnostico_final`: diagnóstico del técnico (mínimo 5 caracteres).\n'
            '- `diagnostico_inicial` y `observacion_detalle`: opcionales.\n\n'
            'Se actualiza `fecha_termino_mant` automáticamente.'
        ),
        parameters=[_PK],
        request=EnviarAprobacionSerializer,
        responses={200: _OK, 400: _ERR, 403: _403, 404: _404},
    )
    @action(detail=True, methods=['patch'], url_path='enviar-aprobacion')
    def enviar_aprobacion(self, request, pk=None):
        ser = EnviarAprobacionSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        result = MantenimientoService.enviar_a_aprobacion(
            pk=pk,
            usuario_id=request.user.id,
            detalles_tecnicos=ser.validated_data['detalles_tecnicos'],
        )
        return Response(result, status=status.HTTP_200_OK)
    @extend_schema(
        tags=['Mantenimientos'],
        summary='Lista de pendientes de aprobacion.',
        description=(
            'Aprueba el mantenimiento según su sede.'
            
        ),
        responses={200: _OK, 400: _ERR, 403: _403, 404: _404},
    )
    @action(detail=False, methods=['get'], url_path='pendientes-aprobacion')
    def pendientes_aprobacion(self, request):
        role    = self._get_role(request)
        sede_id = self._get_sede(request)
        modulo_id = self._get_modulo(request)
        qs = MantenimientoService.listar_pendientes_aprobacion(role, sede_id, modulo_id, self._get_token(request))
        return Response(MantenimientoListSerializer(qs, many=True).data)
    @extend_schema(
        tags=['Mantenimientos'],
        summary='Aprobar mantenimiento (ADMINSEDE / COORDSISTEMA)',
        description=(
            'El aprobador revisa el informe técnico y lo aprueba.\n\n'
            '**Estado:** `PENDIENTE_APROBACION` → `APROBADO`\n\n'
            'Al aprobar el sistema genera automáticamente el PDF del acta de mantenimiento '
            'listo para ser impreso y firmado físicamente por el propietario de los bienes.\n\n'
            'Una vez aprobado, el endpoint `GET /{id}/documento/` estará disponible '
            'para descargar el PDF y proceder con la firma física.\n\n'
            '**Restricciones de rol:**\n'
            '- `ADMINSEDE`: solo puede aprobar mantenimientos de su propia sede.\n'
            '- `COORDSISTEMA` / `SYSADMIN`: pueden aprobar de cualquier sede.'
        ),
        parameters=[_PK],
        request=AprobacionSerializer,
        responses={200: _OK, 400: _ERR, 403: _403, 404: _404},
    )
    @action(detail=True, methods=['patch'], url_path='aprobar')
    def aprobar(self, request, pk=None):
        ser = AprobacionSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        result = MantenimientoService.aprobar(
            pk=pk,
            aprobador_id=request.user.id,
            role=self._get_role(request),
            sede_id=self._get_sede(request),
            modulo_id=self._get_modulo(request),
            observacion=ser.validated_data.get('observacion', ''),
            cookie=self._get_token(request),
        )
        return Response(result, status=status.HTTP_200_OK)
    @extend_schema(
        tags=['Mantenimientos'],
        summary='Devolver mantenimiento (ADMINSEDE desaprueba)',
        description=(
            'El aprobador devuelve el informe con un motivo detallado.\n\n'
            '**Estado:** `PENDIENTE_APROBACION` → `DEVUELTO`\n\n'
            'El `ASISTSISTEMA` puede corregir el informe técnico y '
            'reenviar usando `PATCH /{id}/enviar-aprobacion/`.\n\n'
            '**Restricciones de rol:** mismas que en aprobar.'
        ),
        parameters=[_PK],
        request=DevolucionSerializer,
        responses={200: _OK, 400: _ERR, 403: _403, 404: _404},
    )
    @action(detail=True, methods=['patch'], url_path='devolver')
    def devolver(self, request, pk=None):
        ser = DevolucionSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        result = MantenimientoService.devolver(
            pk=pk,
            aprobador_id=request.user.id,
            role=self._get_role(request),
            sede_id=self._get_sede(request),
            modulo_id=self._get_modulo(request),
            motivo=ser.validated_data['motivo_devolucion'],
        )
        return Response(result, status=status.HTTP_200_OK)
    @extend_schema(
        tags=['Mantenimientos'],
        summary='Cancelar mantenimiento',
        description=(
            'Cancela el mantenimiento en cualquier estado activo.\n\n'
            '**No se puede cancelar** si estado = `ATENDIDO` o `CANCELADO`.\n\n'
            'El registro queda como historial con estado `CANCELADO`.'
        ),
        parameters=[_PK],
        request=CancelacionSerializer,
        responses={200: _OK, 400: _ERR, 403: _403, 404: _404},
    )
    @action(detail=True, methods=['patch'], url_path='cancelar')
    def cancelar(self, request, pk=None):
        ser = CancelacionSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        result = MantenimientoService.cancelar(
            pk=pk,
            usuario_id=request.user.id,
            role=self._get_role(request),
            motivo_cancelacion_id=ser.validated_data['motivo_cancelacion_id'],
            detalle=ser.validated_data.get('detalle_cancelacion', ''),
        )
        return Response(result, status=status.HTTP_200_OK)
    @extend_schema(
        tags=['Mantenimientos'],
        summary='Subir imagen de evidencia fotográfica',
        description=(
            'Carga una imagen de evidencia del trabajo realizado.\n\n'
            '**Solo disponible cuando:** estado = `EN_PROCESO` o `DEVUELTO`.\n\n'
            '**Formato:** `multipart/form-data`\n\n'
            '**Campos:**\n'
            '- `imagen` *(requerido)*: archivo de imagen (JPG, PNG, etc.).\n'
            '- `descripcion` *(opcional)*: descripción breve de la imagen.\n\n'
            'Se pueden subir múltiples imágenes con llamadas sucesivas.'
        ),
        parameters=[_PK],
        responses={201: _OK, 400: _ERR, 403: _403, 404: _404},
    )
    @action(detail=True, methods=['post'],url_path='imagenes',parser_classes=[MultiPartParser, FormParser],)
    def subir_imagen(self, request, pk=None):
        imagen = request.FILES.get('imagen')
        if not imagen:
            return Response(
                {'success': False, 'error': 'Se requiere el campo "imagen".'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        result = MantenimientoService.subir_imagen(
            pk=pk,
            imagen=imagen,
            descripcion=request.data.get('descripcion', ''),
            usuario_id=request.user.id,
        )
        return Response(result, status=status.HTTP_201_CREATED)

    @extend_schema(
        tags=['Mantenimientos'],
        summary='Descargar PDF del acta de mantenimiento',
        description=(
            'Retorna el PDF del acta de mantenimiento para impresión y firma.\n\n'
            '**Disponible cuando:** estado = `APROBADO` o `ATENDIDO`.\n\n'
            '**Flujo de uso:**\n'
            '1. El `ADMINSEDE` aprueba el mantenimiento → el PDF se genera automáticamente.\n'
            '2. El `ASISTSISTEMA` descarga el PDF con este endpoint.\n'
            '3. El PDF se imprime y el propietario de los bienes lo firma físicamente.\n'
            '4. El `ASISTSISTEMA` escanea el documento firmado y lo sube con '
            '`POST /{id}/pdf-firmado/`.\n'
            '5. Al subir el PDF firmado el proceso cierra automáticamente (estado → ATENDIDO).\n\n'
            '**Prioridad de archivo retornado:**\n'
            '1. PDF firmado (si ya fue subido).\n'
            '2. PDF generado al aprobar.\n'
            '3. PDF generado al vuelo (fallback).'
        ),
        parameters=[_PK],
        responses={
            200: OpenApiResponse(
                description='Archivo PDF (application/pdf).',
                response=OpenApiTypes.BINARY,
            ),
            400: _ERR,
            403: _403,
            404: _404,
        },
    )
    @action(detail=True, methods=['get'], url_path='documento')
    def documento(self, request, pk=None):
        pdf_bytes = MantenimientoService.obtener_documento(
            pk=pk,
            cookie=self._get_token(request),
        )
        response = HttpResponse(pdf_bytes, content_type='application/pdf')
        response['Content-Disposition'] = f'inline; filename="MNT-{pk}.pdf"'
        return response

    @extend_schema(
        tags=['Mantenimientos'],
        summary='Subir PDF firmado y cerrar proceso (ASISTSISTEMA)',
        description=(
            'ASISTSISTEMA sube el PDF del acta firmado físicamente por el propietario.\n\n'
            '**Solo disponible cuando:** estado = `APROBADO`.\n\n'
            '**Formato:** `multipart/form-data`\n\n'
            '**Campo requerido:** `archivo` (PDF, JPG o PNG del documento firmado).\n\n'
            '**Al subir el archivo el sistema:**\n'
            '1. Guarda el documento firmado en `media/mantenimientos/pdfs/firmados/`.\n'
            '2. Actualiza `estado_funcionamiento` de cada bien al valor final indicado '
            'en el informe técnico.\n'
            '3. Actualiza `fecha_ultimo_mantenimiento` en cada bien.\n'
            '4. Cambia el estado del mantenimiento a **ATENDIDO** (proceso cerrado).\n\n'
            'Este es el **último paso** del flujo de mantenimiento. '
            'Una vez en ATENDIDO el proceso no puede ser modificado.'
        ),
        parameters=[_PK],
        responses={200: _OK, 400: _ERR, 403: _403, 404: _404},
    )
    @action(detail=True, methods=['post'],url_path='pdf-firmado',parser_classes=[MultiPartParser, FormParser],)
    def subir_pdf_firmado(self, request, pk=None):
        archivo = request.FILES.get('archivo')
        if not archivo:
            return Response(
                {'success': False, 'error': 'Se requiere el campo "archivo".'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        result = MantenimientoService.subir_pdf_firmado(
            pk=pk,
            archivo=archivo,
            usuario_id=request.user.id,
            role=self._get_role(request),
        )
        return Response(result, status=status.HTTP_200_OK)