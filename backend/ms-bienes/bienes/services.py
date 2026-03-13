import requests
from typing import Dict, Any, Optional
from django.db import transaction
from django.conf import settings
from rest_framework.exceptions import ValidationError, NotFound, PermissionDenied
from .repositories import BienRepository, DETALLE_REPO_MAP

class MsUsuariosClient:
    @classmethod
    def _base_url(cls) -> str:
        return getattr(settings, 'MS_USUARIOS_BASE_URL', 'http://127.0.0.1:8000/api/v1')
    @classmethod
    def _cookie_name(cls) -> str:
        return getattr(settings, 'JWT_AUTH_COOKIE', 'sisconpat_access')
    @classmethod
    def _get(cls, path: str, token: str = None) -> tuple[Optional[dict], int]:
        cookies = {cls._cookie_name(): token} if token else {}
        try:
            resp = requests.get(f'{cls._base_url()}{path}',cookies=cookies,timeout=5,)
            # print('URL llamada:', f'{cls._base_url()}{path}')
            # print('STATUS:', resp.status_code)
            if resp.status_code == 200:
                return resp.json(), 200
            return None, resp.status_code
        except requests.RequestException as e:
            print('REQUEST EXCEPTION:', type(e).__name__, str(e))
            return None, 503
    @classmethod
    def validar_empresa(cls, empresa_id: int, token: str = None) -> dict:
        data, status_code = cls._get(f'/locations/empresas/{empresa_id}/', token)
        if status_code == 401:
            raise ValidationError(f'status:{status_code}.ms-usuarios/validar_empresa. Token inválido o expirado.')
        if status_code == 403:
            raise ValidationError(f'status:{status_code}.ms-usuarios/validar_empresa. Usuario autenticado pero sin autorización.')
        if status_code == 404:
            raise ValidationError(f'status:{status_code}.ms-usuarios/validar_empresa. La empresa con id={empresa_id} no existe.')
        if status_code == 503:
            raise ValidationError(f'Status: {status_code}. ms-usuarios/validar_empresa no disponible. Intente más tarde.')
        return data
    @classmethod
    def validar_sede(cls, sede_id: int, token: str = None) -> dict:
        data, status_code = cls._get(f'/locations/sedes/{sede_id}/', token)
        if status_code == 401:
            raise ValidationError(f'status:{status_code}.ms-usuarios/validar_sede. Token inválido o expirado.')
        if status_code == 403:
            raise ValidationError(f'status:{status_code}. ms-usuarios/validar_sede. Usuario autenticado pero sin autorización.')
        if status_code == 404:
            raise ValidationError(f'status:{status_code}. ms-usuarios/validar_sede. La sede con id={sede_id} no existe.')
        if status_code == 503:
            raise ValidationError(f'Status: {status_code}. ms-usuarios/validar_sede no disponible. Intente más tarde.')
        return data
    @classmethod
    def validar_modulo(cls, modulo_id: int, token: str = None) -> dict:
        data, status_code = cls._get(f'/locations/modulos/{modulo_id}/', token)
        if status_code == 401:
            raise ValidationError(f'status:{status_code}.ms-usuarios/validar_modulo. Token inválido o expirado.')
        if status_code == 403:
            raise ValidationError(f'status:{status_code}. ms-usuarios/validar_modulo. Usuario autenticado pero sin autorización.')
        if status_code == 404:
            raise ValidationError(f'status:{status_code}. ms-usuarios/validar_modulo. Modulo con id={modulo_id} no existe.')
        if status_code == 503:
            raise ValidationError(f'Status: {status_code}. ms-usuarios/validar_modulo no disponible. Intente más tarde.')
        return data
    @classmethod
    def validar_ubicacion(cls, ubicacion_id: int, token: str = None) -> dict:
        data, status_code = cls._get(f'/locations/ubicaciones/{ubicacion_id}/', token)
        if status_code == 401:
            raise ValidationError(f'status:{status_code}.ms-usuarios/validar_ubicacion. Token inválido o expirado.')
        if status_code == 403:
            raise ValidationError(f'status:{status_code}. ms-usuarios/validar_ubicacion. Usuario autenticado pero sin autorización.')
        if status_code == 404:
            raise ValidationError(f'status:{status_code}. ms-usuarios/validar_ubicacion. Ubicacion con id={ubicacion_id} no existe en.')
        if status_code == 503:
            raise ValidationError(f'Status: {status_code}. ms-usuarios/validar_ubicacion no disponible. Intente más tarde.')        
        return data
    @classmethod
    def validar_usuario(cls, usuario_id: int, token: str = None) -> dict:
        data, status_code = cls._get(f'/users/users/{usuario_id}/', token)
        if status_code == 401:
            raise ValidationError(f'status:{status_code}.ms-usuarios/validar_usuario. Token inválido o expirado.')
        if status_code == 403:
            raise ValidationError(f'status:{status_code}. ms-usuarios/validar_usuario. Usuario autenticado pero sin autorización.')
        if status_code == 404:
            raise ValidationError(f'status:{status_code}. ms-usuarios/validar_usuario. Ubicacion con id={usuario_id} no existe en.')
        if status_code == 503:
            raise ValidationError(f'Status: {status_code}. ms-usuarios/validar_usuario no disponible. Intente más tarde.')
        if not data.get('is_active', False):
            raise ValidationError(f'El usuario con id={usuario_id} está inactivo.')
        return data
class BienService:
    @staticmethod
    def _validar_unicidad_serie(numero_serie: str, exclude_pk: int = None):
        if numero_serie and numero_serie.upper() != 'S/N':
            existe = BienRepository.get_by_numero_serie(numero_serie, exclude_pk)
            if existe:
                raise ValidationError(
                    f'Ya existe un bien con número de serie "{numero_serie}".'
                )
    @staticmethod
    def _validar_unicidad_codigo(codigo: str, exclude_pk: int = None):
        if codigo and codigo.upper() != 'S/N':
            existe = BienRepository.get_by_codigo_patrimonial(codigo, exclude_pk)
            if existe:
                raise ValidationError(
                    f'Ya existe un bien con código patrimonial "{codigo}".'
                )    
    @staticmethod
    def _validar_localizacion(data: dict, token: str = None):
        MsUsuariosClient.validar_empresa(data['empresa_id'], token)
        MsUsuariosClient.validar_sede(data['sede_id'], token)
        if data.get('modulo_id'):
            MsUsuariosClient.validar_modulo(data['modulo_id'], token)
        if data.get('ubicacion_id'):
            MsUsuariosClient.validar_ubicacion(data['ubicacion_id'], token)
    @staticmethod
    def _crear_detalle(bien, tipo_nombre: str, detalle_data: dict):
        tipo = tipo_nombre.upper()
        repo = DETALLE_REPO_MAP.get(tipo)
        if repo and detalle_data:
            repo.create(bien, detalle_data)
    @staticmethod
    def _actualizar_detalle(bien, tipo_nombre: str, detalle_data: dict):
        tipo = tipo_nombre.upper()
        repo = DETALLE_REPO_MAP.get(tipo)
        if not repo or not detalle_data:
            return
        detalle = repo.get_by_bien(bien)
        if detalle:
            repo.update(detalle, detalle_data)
        else:
            repo.create(bien, detalle_data)
    @staticmethod
    def listar(filters: Dict[str, Any], role: str = None, sede_id: int = None) -> Dict[str, Any]:
        ROLES_VE_TODOS = {'SYSADMIN', 'analistaSistema', 'coordSistema'}
        if role == 'asistSistema' and sede_id:
            filters['sede_id'] = sede_id
        elif role not in ROLES_VE_TODOS and sede_id:
            filters['sede_id'] = sede_id
        qs = BienRepository.filter(filters)
        return {"success": True, "data": qs}
    @staticmethod
    def obtener(pk: int) -> Dict[str, Any]:
        bien = BienRepository.get_by_id(pk)
        if not bien:
            raise NotFound(f'Bien no encontrado.')
        return {"success": True, "data": bien}
    @staticmethod
    def listar_por_usuario(usuario_id: int) -> Dict[str, Any]:
        qs = BienRepository.get_bienes_by_usuario(usuario_id)
        if not qs:
            raise NotFound(f'Usuario no cuenta con bienes asignados.')
        return {"success": True, "data": qs}
    @staticmethod
    @transaction.atomic
    def crear(data: Dict[str, Any], usuario_registra_id: int, token: str = None) -> Dict[str, Any]:
        tipo_nombre  = data.pop('tipo_bien_nombre', '')
        detalle_data = data.pop('detalle', {})
        BienService._validar_unicidad_serie(data.get('numero_serie'))
        BienService._validar_unicidad_codigo(data.get('codigo_patrimonial'))
        BienService._validar_localizacion(data, token)
        data['usuario_registra_id'] = usuario_registra_id
        if not data.get('usuario_asignado_id'):
            data['usuario_asignado_id'] = usuario_registra_id
        bien = BienRepository.create(data)
        BienService._crear_detalle(bien, tipo_nombre, detalle_data)
        return {"success": True, "message": "Bien registrado exitosamente.", "data": bien}
    @staticmethod
    @transaction.atomic
    def actualizar(pk: int, data: Dict[str, Any], token: str = None) -> Dict[str, Any]:
        bien = BienRepository.get_by_id(pk)
        if not bien:
            raise NotFound(f'Bien con id={pk} no encontrado.')
        if not bien.is_active:
            raise ValidationError('No se puede modificar un bien dado de baja.')
        tipo_nombre  = data.pop('tipo_bien_nombre', bien.tipo_bien.nombre)
        detalle_data = data.pop('detalle', {})
        BienService._validar_unicidad_serie(data.get('numero_serie'), exclude_pk=pk)
        BienService._validar_unicidad_codigo(data.get('codigo_patrimonial'), exclude_pk=pk)
        if data.get('sede_id') or data.get('modulo_id') or data.get('ubicacion_id'):
            BienService._validar_localizacion({
                'empresa_id':   data.get('empresa_id', bien.empresa_id),
                'sede_id':      data.get('sede_id', bien.sede_id),
                'modulo_id':    data.get('modulo_id', bien.modulo_id),
                'ubicacion_id': data.get('ubicacion_id', bien.ubicacion_id),
            }, token)
        bien = BienRepository.update(bien, data)
        BienService._actualizar_detalle(bien, tipo_nombre, detalle_data)
        return {"success": True, "message": "Bien actualizado exitosamente.", "data": bien}
    @staticmethod
    def listar_disponibles_en_sede(sede_id: int, usuario_solicitante_id: int, token: str = None) -> Dict[str, Any]:
        MsUsuariosClient.validar_sede(sede_id, token)
        qs = BienRepository.get_bienes_disponibles_en_sede(sede_id)
        return {"success": True, "data": qs}
    