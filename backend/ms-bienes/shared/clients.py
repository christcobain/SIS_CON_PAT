import requests
import logging
import time
from typing import Optional
from django.conf import settings
from rest_framework.exceptions import ValidationError

logger = logging.getLogger(__name__)

_cache: dict = {}
_TTL = 30
def _cache_get(key):
    entry = _cache.get(key)
    if entry and time.monotonic() - entry['ts'] < _TTL:
        return entry['val']
    return None
def _cache_set(key, val):
    _cache[key] = {'val': val, 'ts': time.monotonic()}
class MsUsuariosClient:
    @classmethod
    def _base_url(cls) -> str:
        return getattr(settings, 'MS_USUARIOS_BASE_URL', 'http://127.0.0.1:8000/api/v1')
    @classmethod
    def _cookie_name(cls) -> str:
        return getattr(settings, 'JWT_AUTH_COOKIE', 'sisconpat_access')
    @classmethod
    def _get(cls, path: str, token: str = '') -> tuple[Optional[dict], int]:
        cookies = {cls._cookie_name(): token} if token else {}
        try:
            resp = requests.get(f'{cls._base_url()}{path}', cookies=cookies, timeout=5)
            if resp.status_code == 200:
                return resp.json(), 200
            return None, resp.status_code
        except requests.RequestException as e:
            logger.warning('MsUsuariosClient GET %s — %s: %s', path, type(e).__name__, e)
            return None, 503
    @classmethod
    def _raise_si_error(cls, data, status_code: int, entidad: str, pk: int):
        if status_code == 200:
            return
        mensajes = {
            401: f'ms-usuarios/{entidad} id={pk}: Token inválido o expirado.',
            403: f'ms-usuarios/{entidad} id={pk}: Sin autorización.',
            404: f'ms-usuarios/{entidad} id={pk}: No existe.',
            503: f'ms-usuarios/{entidad}: Servicio no disponible.',
        }
        raise ValidationError(mensajes.get(status_code, f'ms-usuarios/{entidad}: Error {status_code}.'))
    @classmethod
    def _fetch(cls, path: str, entidad: str, pk: int, token: str) -> dict:
        key = (path, token)
        cached = _cache_get(key)
        if cached is not None:
            return cached
        data, sc = cls._get(path, token)
        cls._raise_si_error(data, sc, entidad, pk)
        _cache_set(key, data or {})
        return data or {}
    @classmethod
    def validar_empresa(cls, empresa_id: int, token: str = '') -> dict:
        return cls._fetch(f'/locations/empresas/{empresa_id}/', 'empresa', empresa_id, token)
    @classmethod
    def validar_sede(cls, sede_id: int, token: str = '') -> dict:
        return cls._fetch(f'/locations/sedes/{sede_id}/', 'sede', sede_id, token)
    @classmethod
    def validar_modulo(cls, modulo_id: int, token: str = '') -> dict:
        return cls._fetch(f'/locations/modulos/{modulo_id}/', 'módulo', modulo_id, token)
    @classmethod
    def validar_ubicacion(cls, ubicacion_id: int, token: str = '') -> dict:
        return cls._fetch(f'/locations/ubicaciones/{ubicacion_id}/', 'ubicación', ubicacion_id, token)
    @classmethod
    def validar_usuario(cls, usuario_id: int, token: str = '') -> dict:
        return cls._fetch(f'/users/users/{usuario_id}/', 'usuario', usuario_id, token)
    @classmethod
    def invalidar_cache(cls):
        _cache.clear()