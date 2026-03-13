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
    extend_schema, extend_schema_view,
    OpenApiParameter, OpenApiTypes, OpenApiResponse,
)
from shared.permissions import HasJWTPermission
from .services import TransferenciaService
from .serializers import (
    TransferenciaListSerializer,
    TransferenciaDetailSerializer,
    TrasladoSedeWriteSerializer,
    AsignacionInternaWriteSerializer,
    DevolucionSerializer,
    AprobacionSegurSerializer,
    CancelacionSerializer,
    ReenvioSerializer,
    RetornoSalidaSerializer,
    RetornoEntradaSerializer,
)

_PK  = OpenApiParameter('id', OpenApiTypes.INT, location=OpenApiParameter.PATH, description='ID de la transferencia')
_OK  = OpenApiResponse(description='Operación exitosa',            response=OpenApiTypes.OBJECT)
_ERR = OpenApiResponse(description='Error de validación (400)',    response=OpenApiTypes.OBJECT)
_403 = OpenApiResponse(description='Sin permisos (403)',           response=OpenApiTypes.OBJECT)
_404 = OpenApiResponse(description='Transferencia no encontrada',  response=OpenApiTypes.OBJECT)

_ESTADO_ENUM = ['PENDIENTE_APROBACION', 'EN_ESPERA_CONFORMIDAD', 'EN_RETORNO', 'ATENDIDO', 'DEVUELTO', 'CANCELADO']
_TIPO_ENUM   = ['TRASLADO_SEDE', 'ASIGNACION_INTERNA']


@extend_schema_view(
    list=extend_schema(
        tags=['Transferencias'],
        summary='Listar transferencias con filtros',
        description=(
            'Retorna las transferencias según el rol del usuario autenticado.\n\n'
            '- **SYSADMIN / analistaSistema / coordSistema**: ven todas las sedes.\n'
            '- **adminSede**: solo las de su sede origen.\n'
            '- **segurSede**: traslados de su sede como origen o destino.\n'
            '- **asistSistema**: las que registró + las que le asignaron.\n'
            '- **userCorte**: solo las asignadas a él.'
        ),
        parameters=[
            OpenApiParameter('tipo',               OpenApiTypes.STR, required=False, enum=_TIPO_ENUM,   description='Tipo de transferencia'),
            OpenApiParameter('estado',             OpenApiTypes.STR, required=False, enum=_ESTADO_ENUM, description='Estado de la transferencia'),
            OpenApiParameter('sede_origen_id',     OpenApiTypes.INT, required=False, description='ID sede origen'),
            OpenApiParameter('sede_destino_id',    OpenApiTypes.INT, required=False, description='ID sede destino'),
            OpenApiParameter('usuario_origen_id',  OpenApiTypes.INT, required=False, description='ID del registrador'),
            OpenApiParameter('usuario_destino_id', OpenApiTypes.INT, required=False, description='ID del destinatario'),
        ],
        responses={200: TransferenciaListSerializer(many=True), 401: _ERR, 403: _403},
    ),
    retrieve=extend_schema(
        tags=['Transferencias'],
        summary='Obtener detalle completo de una transferencia',
        description=(
            'Retorna la cabecera, todos los bienes con snapshot al momento '
            'del registro, y el historial completo de aprobaciones.'
        ),
        parameters=[_PK],
        responses={200: TransferenciaDetailSerializer, 403: _403, 404: _404},
    ),
)
class TransferenciaViewSet(ViewSet):
    def get_permissions(self):
        perms = {
            'list':                    [HasJWTPermission('ms-bienes:transferencias:view_transferencia')],
            'retrieve':                [HasJWTPermission('ms-bienes:transferencias:view_transferencia')],
            'mis_transferencias':      [HasJWTPermission('ms-bienes:transferencias:view_transferencia')],
            'documento':               [HasJWTPermission('ms-bienes:transferencias:view_transferencia')],
            'crear_traslado':          [HasJWTPermission('ms-bienes:transferencias:add_transferencia')],
            'crear_asignacion':        [HasJWTPermission('ms-bienes:transferencias:add_transferencia')],
            'aprobar_adminsede':       [HasJWTPermission('ms-bienes:transferencias:change_transferencia')],
            'devolver_adminsede':      [HasJWTPermission('ms-bienes:transferencias:change_transferencia')],
            'reenviar':                [HasJWTPermission('ms-bienes:transferencias:change_transferencia')],
            'cancelar':                [HasJWTPermission('ms-bienes:transferencias:delete_transferencia')],
            'confirmar_recepcion':     [IsAuthenticated()],
            'subir_firmado':           [HasJWTPermission('ms-bienes:transferencias:change_transferencia')],
            'aprobar_segur_salida':    [HasJWTPermission('ms-bienes:transferencias:change_transferenciadetalle')],
            'rechazar_segur_salida':   [HasJWTPermission('ms-bienes:transferencias:change_transferenciadetalle')],
            'aprobar_segur_entrada':   [HasJWTPermission('ms-bienes:transferencias:change_transferenciadetalle')],
            'rechazar_segur_entrada':  [HasJWTPermission('ms-bienes:transferencias:change_transferenciadetalle')],
            'aprobar_retorno_salida':  [HasJWTPermission('ms-bienes:transferencias:change_transferenciadetalle')],
            'aprobar_retorno_entrada': [HasJWTPermission('ms-bienes:transferencias:change_transferenciadetalle')],
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
        filters = {
            key: request.query_params.get(key)
            for key in [
                'tipo', 'estado', 'sede_origen_id', 'sede_destino_id',
                'usuario_origen_id', 'usuario_destino_id',
            ]
        }
        for k in ['sede_origen_id', 'sede_destino_id', 'usuario_origen_id', 'usuario_destino_id']:
            if filters[k]:
                try:
                    filters[k] = int(filters[k])
                except ValueError:
                    filters[k] = None

        result = TransferenciaService.listar(filters)
        return Response(
            TransferenciaListSerializer(result['data'], many=True).data,
            status=status.HTTP_200_OK,
        )

    def retrieve(self, request, pk=None):
        result = TransferenciaService.obtener(pk)
        return Response(
            TransferenciaDetailSerializer(result['data']).data,
            status=status.HTTP_200_OK,
        )
    @extend_schema(
        tags=['Transferencias'],
        summary='Mis transferencias',
        description=(
            'Cada rol ve sus transferencias correspondientes:\n\n'
            '- **analistaSistema / coordSistema**: las que registraron.\n'
            '- **adminSede**: todas las de su sede origen (pendientes e historial).\n'
            '- **segurSede**: traslados de su sede como origen o destino.\n'
            '- **asistSistema**: las que registró y las que le destinaron.\n'
            '- **userCorte**: solo las asignadas a él.'
        ),
        parameters=[
            OpenApiParameter('estado', OpenApiTypes.STR, required=False, enum=_ESTADO_ENUM),
            OpenApiParameter('tipo',   OpenApiTypes.STR, required=False, enum=_TIPO_ENUM),
        ],
        responses={200: TransferenciaListSerializer(many=True), 401: _ERR},
    )
    @action(detail=False, methods=['get'], url_path='mis-transferencias')
    def mis_transferencias(self, request):
        filters = {
            'estado': request.query_params.get('estado'),
            'tipo':   request.query_params.get('tipo'),
        }
        result = TransferenciaService.mis_transferencias(
            request.user.id,
            self._get_role(request),
            self._get_sede(request),
            filters,
        )
        return Response(
            TransferenciaListSerializer(result['data'], many=True).data,
            status=status.HTTP_200_OK,
        )
    @extend_schema(
        tags=['Transferencias'],
        summary='Descargar PDF del acta de transferencia',
        description=(
            'Retorna el PDF del acta de la transferencia.\n\n'
            'Prioridad:\n'
            '1. **PDF firmado** (scan físico subido por asistSistema), si existe.\n'
            '2. **PDF oficial** generado automáticamente al completar el proceso.\n\n'
            'Solo disponible cuando `estado = ATENDIDO`.\n\n'
            '- **ASIGNACION_INTERNA**: PDF generado al aprobar por adminSede.\n'
            '- **TRASLADO_SEDE**: PDF generado cuando el usuario destino confirmó recepción.'
        ),
        parameters=[_PK],
        responses={
            200: OpenApiResponse(description='Archivo PDF (application/pdf)', response=OpenApiTypes.BINARY),
            400: _ERR,
            403: _403,
            404: _404,
        },
    )
    @action(detail=True, methods=['get'], url_path='documento')
    def documento(self, request, pk=None):
        cookie    = self._get_token(request)
        pdf_bytes = TransferenciaService.obtener_documento(pk, cookie=cookie)
        response  = HttpResponse(pdf_bytes, content_type='application/pdf')
        response['Content-Disposition'] = f'inline; filename="TRF-{pk}.pdf"'
        return response

    @extend_schema(
        tags=['Transferencias'],
        summary='Registrar traslado entre sedes',
        description=(
            'Registra un traslado físico de bienes hacia otra sede.\n\n'
            '**Roles permitidos:** `analistaSistema`, `coordSistema`, `SYSADMIN`\n\n'
            '**Validaciones:**\n'
            '- Sede destino debe ser distinta a la sede del registrador.\n'
            '- Todos los bienes deben estar en la misma sede y módulo origen.\n'
            '- Los bienes deben estar en estado `ACTIVO` sin transferencias activas.\n\n'
            '**Estado inicial:** `PENDIENTE_APROBACION`'
        ),
        request=TrasladoSedeWriteSerializer,
        responses={201: _OK, 400: _ERR, 403: _403},
    )
    @action(detail=False, methods=['post'], url_path='traslado')
    def crear_traslado(self, request):
        ser = TrasladoSedeWriteSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        result = TransferenciaService.crear_traslado_sede(
            ser.validated_data,
            request.user.id,
            self._get_sede(request),
            self._get_role(request),
            self._get_token(request),
        )
        return Response(result, status=status.HTTP_201_CREATED)
    @extend_schema(
        tags=['Transferencias'],
        summary='Registrar asignación interna a usuario final',
        description=(
            'Asigna bienes a un usuario final dentro de la misma sede.\n\n'
            '**Roles permitidos:** `asistSistema`, `SYSADMIN`\n\n'
            '**Validaciones:**\n'
            '- `sede_destino_id` debe coincidir con la sede del asistSistema.\n'
            '- Los bienes deben estar en estado `ACTIVO` sin transferencias activas.\n\n'
            '**Estado inicial:** `PENDIENTE_APROBACION`'
        ),
        request=AsignacionInternaWriteSerializer,
        responses={201: _OK, 400: _ERR, 403: _403},
    )
    @action(detail=False, methods=['post'], url_path='asignacion')
    def crear_asignacion(self, request):
        ser = AsignacionInternaWriteSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        result = TransferenciaService.crear_asignacion_interna(
            ser.validated_data,
            request.user.id,
            self._get_sede(request),
            self._get_role(request),
            self._get_token(request),
        )
        return Response(result, status=status.HTTP_201_CREATED)
    @extend_schema(
        tags=['Transferencias'],
        summary='Aprobar transferencia (ADMINSEDE / COORDSISTEMA)',
        description=(
            'Aprueba la transferencia según su tipo:\n\n'
            '**ASIGNACION_INTERNA:**\n'
            '- Estado → `ATENDIDO`\n'
            '- Bienes actualizados con módulo/ubicación/custodio destino\n'
            '- PDF del acta generado y guardado automáticamente en `media/`\n\n'
            '**TRASLADO_SEDE:**\n'
            '- Registra aprobación lógica (estado permanece `PENDIENTE_APROBACION`)\n'
            '- Aún requiere aprobación física de SEGURSEDE\n\n'
            '**Roles:** `adminSede` (solo su sede), `coordSistema` (sede central), `SYSADMIN`'
        ),
        parameters=[_PK],
        responses={200: _OK, 400: _ERR, 403: _403, 404: _404},
    )
    @action(detail=True, methods=['patch'], url_path='aprobar-adminsede')
    def aprobar_adminsede(self, request, pk=None):
        result = TransferenciaService.aprobar_adminsede(
            pk,
            request.user.id,
            self._get_role(request),
            self._get_sede(request),self._get_modulo(request),cookie=self._get_token(request),)
        return Response(result, status=status.HTTP_200_OK)

    @extend_schema(
        tags=['Transferencias'],
        summary='Devolver transferencia (ADMINSEDE desaprueba)',
        description=(
            'Devuelve la transferencia al registrador con un motivo.\n\n'
            'Estado → `DEVUELTO`. Los bienes vuelven a `ACTIVO`.\n\n'
            'El registrador puede corregir y reenviar usando `PATCH /reenviar/`.'
        ),
        parameters=[_PK],
        request=DevolucionSerializer,
        responses={200: _OK, 400: _ERR, 403: _403, 404: _404},
    )
    @action(detail=True, methods=['patch'], url_path='devolver')
    def devolver_adminsede(self, request, pk=None):
        ser = DevolucionSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        result = TransferenciaService.devolver_adminsede(
            pk,
            request.user.id,
            ser.validated_data['motivo_devolucion'],
            self._get_role(request),
            self._get_sede(request),
            self._get_modulo(request),
        )
        return Response(result, status=status.HTTP_200_OK)
    @extend_schema(
        tags=['Transferencias'],
        summary='SEGURSEDE origen — Aprobar salida física',
        description=(
            'SEGURSEDE de la **sede origen** aprueba que el bien salió físicamente.\n\n'
            '**Requiere:** aprobación previa de ADMINSEDE.\n\n'
            'Estado permanece en `PENDIENTE_APROBACION`. '
            'Aún falta la aprobación de entrada en la sede destino.\n\n'
            '**Solo aplica a:** `TRASLADO_SEDE`'
        ),
        parameters=[_PK],
        responses={200: _OK, 400: _ERR, 403: _403, 404: _404},
    )
    @action(detail=True, methods=['patch'], url_path='aprobar-segur-salida')
    def aprobar_segur_salida(self, request, pk=None):
        result = TransferenciaService.aprobar_segur_salida(
            pk, request.user.id,
            self._get_role(request),
            self._get_sede(request),
        )
        return Response(result, status=status.HTTP_200_OK)
    @extend_schema(
        tags=['Transferencias'],
        summary='SEGURSEDE origen — Rechazar salida física',
        description=(
            'SEGURSEDE de la **sede origen** rechaza la salida física del bien.\n\n'
            'Estado → `DEVUELTO`. Los bienes vuelven a `ACTIVO`.\n\n'
            '**Solo aplica a:** `TRASLADO_SEDE`'
        ),
        parameters=[_PK],
        request=DevolucionSerializer,
        responses={200: _OK, 400: _ERR, 403: _403, 404: _404},
    )
    @action(detail=True, methods=['patch'], url_path='rechazar-segur-salida')
    def rechazar_segur_salida(self, request, pk=None):
        ser = DevolucionSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        result = TransferenciaService.rechazar_segur_salida(
            pk, request.user.id,
            ser.validated_data['motivo_devolucion'],
            self._get_role(request),
            self._get_sede(request),
        )
        return Response(result, status=status.HTTP_200_OK)
    @extend_schema(
        tags=['Transferencias'],
        summary='SEGURSEDE destino — Aprobar entrada física',
        description=(
            'SEGURSEDE de la **sede destino** confirma que el bien ingresó físicamente.\n\n'
            '**Requiere:** aprobación previa de salida física.\n\n'
            'Estado → `EN_ESPERA_CONFORMIDAD`. '
            'El usuario destinatario debe confirmar la recepción para completar el traslado.\n\n'
            '**Solo aplica a:** `TRASLADO_SEDE`'
        ),
        parameters=[_PK],
        request=AprobacionSegurSerializer,
        responses={200: _OK, 400: _ERR, 403: _403, 404: _404},
    )
    @action(detail=True, methods=['patch'], url_path='aprobar-segur-entrada')
    def aprobar_segur_entrada(self, request, pk=None):
        ser = AprobacionSegurSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        result = TransferenciaService.aprobar_segur_entrada(
            pk, request.user.id,
            ser.validated_data.get('observacion', ''),
            self._get_role(request),
            self._get_sede(request),
        )
        return Response(result, status=status.HTTP_200_OK)
    @extend_schema(
        tags=['Transferencias'],
        summary='SEGURSEDE destino — Rechazar entrada física',
        description=(
            'SEGURSEDE de la **sede destino** rechaza la entrada física del bien.\n\n'
            'Estado → `EN_RETORNO`. El bien debe retornar físicamente a la sede origen. '
            'Los bienes permanecen bloqueados hasta que el retorno sea confirmado.\n\n'
            '**Solo aplica a:** `TRASLADO_SEDE`'
        ),
        parameters=[_PK],
        request=DevolucionSerializer,
        responses={200: _OK, 400: _ERR, 403: _403, 404: _404},
    )
    @action(detail=True, methods=['patch'], url_path='rechazar-segur-entrada')
    def rechazar_segur_entrada(self, request, pk=None):
        ser = DevolucionSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        result = TransferenciaService.rechazar_segur_entrada(
            pk, request.user.id,
            ser.validated_data['motivo_devolucion'],
            self._get_role(request),
            self._get_sede(request),
        )
        return Response(result, status=status.HTTP_200_OK)
    @extend_schema(
        tags=['Transferencias'],
        summary='Confirmar recepción (usuario destinatario)',
        description=(
            'El **usuario destinatario** confirma que recibió físicamente los bienes.\n\n'
            '**Requiere:** estado `EN_ESPERA_CONFORMIDAD`.\n\n'
            'Al confirmar:\n'
            '- Estado → `ATENDIDO`\n'
            '- Bienes actualizados con nueva sede/módulo/ubicación/custodio\n'
            '- PDF del acta generado y guardado automáticamente en `media/`\n\n'
            '**Solo aplica a:** `TRASLADO_SEDE`\n\n'
            '**Permiso:** `IsAuthenticated` — el usuario debe ser el destinatario registrado.'
        ),
        parameters=[_PK],
        responses={200: _OK, 400: _ERR, 403: _403, 404: _404},
    )
    @action(detail=True, methods=['patch'], url_path='confirmar-recepcion')
    def confirmar_recepcion(self, request, pk=None):
        result = TransferenciaService.confirmar_recepcion(
            pk,
            request.user.id,
            cookie=self._get_token(request),
        )
        return Response(result, status=status.HTTP_200_OK)

    @extend_schema(
        tags=['Transferencias'],
        summary='SEGURSEDE destino — Confirmar salida de retorno',
        description=(
            'SEGURSEDE de la **sede destino** confirma que el bien salió físicamente '
            'de vuelta hacia la sede origen.\n\n'
            '**Requiere:** estado `EN_RETORNO`.\n\n'
            'Estado permanece en `EN_RETORNO`. '
            'Aún falta la confirmación de entrada en la sede origen.\n\n'
            '**Solo aplica a:** `TRASLADO_SEDE`'
        ),
        parameters=[_PK],
        request=RetornoSalidaSerializer,
        responses={200: _OK, 400: _ERR, 403: _403, 404: _404},
    )
    @action(detail=True, methods=['patch'], url_path='aprobar-retorno-salida')
    def aprobar_retorno_salida(self, request, pk=None):
        ser = RetornoSalidaSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        result = TransferenciaService.aprobar_retorno_salida(
            pk, request.user.id,
            ser.validated_data.get('motivo_retorno', ''),
            self._get_role(request),
            self._get_sede(request),
        )
        return Response(result, status=status.HTTP_200_OK)

    @extend_schema(
        tags=['Transferencias'],
        summary='SEGURSEDE origen — Confirmar entrada de retorno',
        description=(
            'SEGURSEDE de la **sede origen** confirma que el bien ingresó de vuelta.\n\n'
            '**Requiere:** estado `EN_RETORNO` + aprobación previa de retorno-salida.\n\n'
            'Al confirmar:\n'
            '- Estado → `DEVUELTO`\n'
            '- Bienes vuelven a `ACTIVO`\n'
            '- Todas las aprobaciones se limpian para permitir reenvío\n\n'
            '**Solo aplica a:** `TRASLADO_SEDE`'
        ),
        parameters=[_PK],
        request=RetornoEntradaSerializer,
        responses={200: _OK, 400: _ERR, 403: _403, 404: _404},
    )
    @action(detail=True, methods=['patch'], url_path='aprobar-retorno-entrada')
    def aprobar_retorno_entrada(self, request, pk=None):
        ser = RetornoEntradaSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        result = TransferenciaService.aprobar_retorno_entrada(
            pk, request.user.id,
            ser.validated_data.get('observacion', ''),
            self._get_role(request),
            self._get_sede(request),
        )
        return Response(result, status=status.HTTP_200_OK)
    @extend_schema(
        tags=['Transferencias'],
        summary='Cancelar transferencia',
        description=(
            'Cancela la transferencia sin requerir aprobación adicional.\n\n'
            '**Roles:** registrador original o `SYSADMIN`\n\n'
            '**No se puede cancelar** si estado = `ATENDIDO` o `CANCELADO`.\n\n'
            'Los bienes vuelven a `ACTIVO`.'
        ),
        parameters=[_PK],
        request=CancelacionSerializer,
        responses={200: _OK, 400: _ERR, 403: _403, 404: _404},
    )
    @action(detail=True, methods=['patch'], url_path='cancelar')
    def cancelar(self, request, pk=None):
        ser = CancelacionSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        result = TransferenciaService.cancelar(
            pk,
            request.user.id,
            ser.validated_data['motivo_cancelacion_id'],
            ser.validated_data.get('detalle_cancelacion', ''),
        )
        return Response(result, status=status.HTTP_200_OK)
    @extend_schema(
        tags=['Transferencias'],
        summary='Reenviar transferencia devuelta',
        description=(
            'El registrador original reenvía una transferencia en estado `DEVUELTO`.\n\n'
            'Todos los campos son **opcionales** — solo envía los que deseas corregir:\n\n'
            '- `bien_ids`: reemplaza los bienes del detalle (revalida disponibilidad)\n'
            '- `modulo_destino_id`, `ubicacion_destino_id`, etc.: actualiza datos de destino\n\n'
            'Si no envías ningún campo, reenvía con los mismos datos originales.\n\n'
            'El flujo de aprobaciones se **reinicia desde cero**.'
        ),
        parameters=[_PK],
        request=ReenvioSerializer,
        responses={200: _OK, 400: _ERR, 403: _403, 404: _404},
    )
    @action(detail=True, methods=['patch'], url_path='reenviar')
    def reenviar(self, request, pk=None):
        ser = ReenvioSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        result = TransferenciaService.reenviar(
            pk,
            request.user.id,
            self._get_role(request),
            self._get_sede(request),
            ser.validated_data,
            self._get_token(request),
        )
        return Response(result, status=status.HTTP_200_OK)
    @extend_schema(
        tags=['Transferencias'],
        summary='Subir documento físicamente firmado (ASIGNACION_INTERNA)',
        description=(
            'ASISTSISTEMA sube el scan o foto del acta firmada físicamente '
            'por el usuario destinatario.\n\n'
            '**Solo aplica a:** `ASIGNACION_INTERNA` en estado `ATENDIDO`.\n\n'
            '**Formato de la petición:** `multipart/form-data`\n\n'
            '**Campo requerido:** `archivo` (PDF, JPG o PNG)\n\n'
            'Una vez subido, el endpoint `GET /{id}/documento/` retornará '
            'este archivo firmado en lugar del PDF generado automáticamente.'
        ),
        parameters=[_PK],
        responses={200: _OK, 400: _ERR, 403: _403, 404: _404},
    )
    @action(detail=True, methods=['post'], url_path='subir-firmado',parser_classes=[MultiPartParser, FormParser],)
    def subir_firmado(self, request, pk=None):
        archivo = request.FILES.get('archivo')
        if not archivo:
            return Response(
                {"success": False, "error": "Se requiere el archivo."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        result = TransferenciaService.subir_firmado(pk, archivo, request.user.id)
        return Response(result, status=status.HTTP_200_OK)