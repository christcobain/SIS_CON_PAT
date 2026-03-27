from typing import Dict, Any
from django.db import transaction
from rest_framework.exceptions import ValidationError, NotFound
from shared.clients import MsUsuariosClient
from .repositories import (
    BienRepository,
    DETALLE_REPO_MAP,
)

TIPOS_CON_DETALLE = {'CPU', 'MONITOR', 'IMPRESORA', 'SCANNER', 'SWITCH'}

class BienService:
    @staticmethod
    def get_user_name(user_id, token: str = '') -> str | None:
        if not user_id:
            return None
        try:
            usuario = MsUsuariosClient.validar_usuario(user_id, token)
            return f"{usuario.get('first_name', '')} {usuario.get('last_name', '')}".strip() or None
        except Exception:
            return None
    @staticmethod
    def _enriquecer(bien, token: str = ''):
        try:
            empresa = MsUsuariosClient.validar_empresa(bien.empresa_id, token)
            bien.empresa_nombre = empresa.get('nombre') if empresa else None
        except Exception:
            bien.empresa_nombre = None
        try:
            sede = MsUsuariosClient.validar_sede(bien.sede_id, token)
            bien.sede_nombre = sede.get('nombre') if sede else None
        except Exception:
            bien.sede_nombre = None
        if bien.modulo_id:
            try:
                modulo = MsUsuariosClient.validar_modulo(bien.modulo_id, token)
                bien.modulo_nombre = modulo.get('nombre') if modulo else None
            except Exception:
                bien.modulo_nombre = None
        else:
            bien.modulo_nombre = None
        if bien.ubicacion_id:
            try:
                ubicacion = MsUsuariosClient.validar_ubicacion(bien.ubicacion_id, token)
                bien.ubicacion_nombre = ubicacion.get('nombre') if ubicacion else None
            except Exception:
                bien.ubicacion_nombre = None
        else:
            bien.ubicacion_nombre = None
        bien.usuario_asignado_nombre = BienService.get_user_name(bien.usuario_asignado_id, token)
        bien.usuario_registra_nombre = BienService.get_user_name(bien.usuario_registra_id, token)
        return bien
    @staticmethod
    def listar(filters: Dict[str, Any], token: str = '', role: str = None, sede_id: int = None) -> Dict[str, Any]:
        ROLES_VE_TODOS = {'SYSADMIN', 'analistaSistema', 'coordSistema'}
        if role not in ROLES_VE_TODOS and sede_id:
            filters['sede_id'] = sede_id

        qs = BienRepository.filter(filters)
        return {'success': True, 'data': qs}
    @staticmethod
    def obtener(pk: int, token: str = '') -> Dict[str, Any]:
        bien = BienRepository.get_by_id(pk)
        if not bien:
            raise ValidationError('Bien no existe.')
        BienService._enriquecer(bien, token)
        return {'success': True, 'data': bien}
    @staticmethod
    def listar_por_usuario(usuario_id: int, token: str = '') -> Dict[str, Any]:
        qs = BienRepository.get_bienes_by_usuario(usuario_id)
        return {'success': True, 'data': qs}
    @staticmethod
    def listar_disponibles_en_sede(sede_id: int, usuario_id: int = None, token: str = '') -> Dict[str, Any]:
        qs = BienRepository.get_bienes_disponibles_en_sede(sede_id)
        return {'success': True, 'data': qs}
    @staticmethod
    def _validar_unicidad_serie(numero_serie: str, exclude_pk: int = None):
        if not numero_serie or numero_serie.upper() in ('S/N', ''):
            return
        qs = BienRepository.filter({'numero_serie': numero_serie,'is_active': None})
        if exclude_pk:
            qs = qs.exclude(pk=exclude_pk)
        if qs.exists():
            raise ValidationError(f'Ya existe un bien con N° de serie "{numero_serie}".')
    @staticmethod
    def _validar_unicidad_codigo(codigo: str, exclude_pk: int = None):
        if not codigo or codigo.upper() in ('S/C', ''):
            return
        qs = BienRepository.filter({'codigo_patrimonial': codigo, 'is_active': True})
        if exclude_pk:
            qs = qs.exclude(pk=exclude_pk)
        if qs.exists():
            raise ValidationError(f'Ya existe un bien con código patrimonial "{codigo}".')
    @staticmethod
    def _validar_localizacion(data: dict, token: str = ''):
        if not token:
            return
        if data.get('empresa_id'):
            MsUsuariosClient.validar_empresa(data['empresa_id'], token)
        if data.get('sede_id'):
            MsUsuariosClient.validar_sede(data['sede_id'], token)
        if data.get('modulo_id'):
            MsUsuariosClient.validar_modulo(data['modulo_id'], token)
        if data.get('ubicacion_id'):
            MsUsuariosClient.validar_ubicacion(data['ubicacion_id'], token)
    @staticmethod
    def _detectar_tipo(tipo_nombre: str) -> str | None:
        n = tipo_nombre.upper()
        for t in TIPOS_CON_DETALLE:
            if t in n:
                return t
        return None
    @staticmethod
    def _crear_detalle(bien, tipo_nombre: str, detalle_data: dict):
        if not detalle_data:
            return
        tipo = BienService._detectar_tipo(tipo_nombre)
        repo = DETALLE_REPO_MAP.get(tipo) if tipo else None
        if repo:
            repo.create(bien, detalle_data)
    @staticmethod
    def _actualizar_detalle(bien, tipo_nombre: str, detalle_data: dict):
        if not detalle_data:
            return
        tipo = BienService._detectar_tipo(tipo_nombre)
        repo = DETALLE_REPO_MAP.get(tipo) if tipo else None
        if not repo:
            return
        existente = repo.get_by_bien(bien)
        if existente:
            repo.update(existente, detalle_data)
        else:
            repo.create(bien, detalle_data)
    @staticmethod
    @transaction.atomic
    def crear(data: Dict[str, Any], usuario_registra_id: int, token: str = '') -> Dict[str, Any]:
        detalle_data = data.pop('detalle', {})
        BienService._validar_unicidad_serie(data.get('numero_serie'))
        BienService._validar_unicidad_codigo(data.get('codigo_patrimonial'))
        data['usuario_registra_id'] = usuario_registra_id
        if not data.get('usuario_asignado_id'):
            data['usuario_asignado_id'] = usuario_registra_id
        bien = BienRepository.create(data)
        tipo_nombre = bien.tipo_bien.nombre if bien.tipo_bien else ""
        if detalle_data:
            BienService._crear_detalle(bien, tipo_nombre, detalle_data)
        return {'success': True, 'message': 'Bien registrado exitosamente.'}
    @staticmethod
    @transaction.atomic
    def actualizar(pk: int, data: Dict[str, Any], token: str = '') -> Dict[str, Any]:
        bien = BienRepository.get_by_id(pk)
        if not bien:
            raise NotFound(f'Bien con id={pk} no encontrado.')
        if not bien.is_active:
            raise ValidationError('No se puede modificar un bien dado de baja.')
        detalle_data = data.pop('detalle', {})
        BienService._validar_unicidad_serie(data.get('numero_serie'), exclude_pk=pk)
        BienService._validar_unicidad_codigo(data.get('codigo_patrimonial'), exclude_pk=pk)
        bien_actualizado = BienRepository.update(bien, data)
        tipo_nombre = bien_actualizado.tipo_bien.nombre if bien_actualizado.tipo_bien else ""
        if detalle_data:
            BienService._actualizar_detalle(bien_actualizado, tipo_nombre, detalle_data)
        MsUsuariosClient.invalidar_cache()
        return {'success': True, 'message': 'Bien actualizado exitosamente.'}