import logging
from django.conf import settings
from supabase import create_client

logger = logging.getLogger(__name__)

# ── Cliente y bucket ──────────────────────────────────────────────────────────
def _client():
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
def _bucket():
    return getattr(settings, 'SUPABASE_STORAGE_BUCKET', 'transferencias-pdfs')
# ── TRANSFERENCIAS ────────────────────────────────────────────────────────────
def subir_pdf(pdf_bytes: bytes, nombre_archivo: str) -> str:
    ruta = f'transferencias/pdfs/{nombre_archivo}'
    _client().storage.from_(_bucket()).upload(
        path=ruta,
        file=pdf_bytes,
        file_options={'content-type': 'application/pdf', 'upsert': 'true'},
    )
    return ruta
def subir_pdf_firmado(archivo_bytes: bytes, nombre_archivo: str) -> str:
    ext = nombre_archivo.rsplit('.', 1)[-1].lower()
    tipos = {
        'pdf':  'application/pdf',
        'jpg':  'image/jpeg',
        'jpeg': 'image/jpeg',
        'png':  'image/png',
    }
    ruta = f'transferencias/firmados/{nombre_archivo}'
    _client().storage.from_(_bucket()).upload(
        path=ruta,
        file=archivo_bytes,
        file_options={
            'content-type': tipos.get(ext, 'application/octet-stream'),
            'upsert': 'true',
        },
    )
    return ruta
# ── MANTENIMIENTOS ────────────────────────────────────────────────────────────
def subir_pdf_mantenimiento(pdf_bytes: bytes, nombre_archivo: str) -> str:
    ruta = f'mantenimientos/pdfs/{nombre_archivo}'
    _client().storage.from_(_bucket()).upload(
        path=ruta,
        file=pdf_bytes,
        file_options={'content-type': 'application/pdf', 'upsert': 'true'},
    )
    return ruta
def subir_pdf_firmado_mantenimiento(archivo_bytes: bytes, nombre_archivo: str) -> str:
    ext = nombre_archivo.rsplit('.', 1)[-1].lower()
    tipos = {
        'pdf':  'application/pdf',
        'jpg':  'image/jpeg',
        'jpeg': 'image/jpeg',
        'png':  'image/png',
    }
    ruta = f'mantenimientos/firmados/{nombre_archivo}'
    _client().storage.from_(_bucket()).upload(
        path=ruta,
        file=archivo_bytes,
        file_options={
            'content-type': tipos.get(ext, 'application/octet-stream'),
            'upsert': 'true',
        },
    )
    return ruta
_TIPOS_IMAGEN = {
    'jpg':  'image/jpeg',
    'jpeg': 'image/jpeg',
    'png':  'image/png',
    'webp': 'image/webp',
    'gif':  'image/gif',
}
_EXT_IMAGEN_PERMITIDAS = set(_TIPOS_IMAGEN.keys())

def subir_imagen_mantenimiento(
    imagen_bytes: bytes,
    nombre_archivo: str,
) -> str:
    ext = nombre_archivo.rsplit('.', 1)[-1].lower()
    if ext not in _EXT_IMAGEN_PERMITIDAS:
        raise ValueError(
            f'Extensión ".{ext}" no permitida. '
            f'Use: {", ".join(sorted(_EXT_IMAGEN_PERMITIDAS))}.'
        )
    content_type = _TIPOS_IMAGEN[ext]
    ruta = f'mantenimientos/imagenes/{nombre_archivo}'
    _client().storage.from_(_bucket()).upload(
        path=ruta,
        file=imagen_bytes,
        file_options={
            'content-type': content_type,
            'upsert': 'true',       
        },
    )
    logger.info('Imagen de mantenimiento subida a Supabase: %s', ruta)
    return ruta
def eliminar_imagen_mantenimiento(ruta: str) -> None:
    try:
        _client().storage.from_(_bucket()).remove([ruta])
        logger.info('Imagen eliminada de Supabase: %s', ruta)
    except Exception as e:
        logger.warning('No se pudo eliminar imagen de Supabase (%s): %s', ruta, e)
# ── BAJAS ─────────────────────────────────────────────────────────────────────
def subir_pdf_baja(pdf_bytes: bytes, nombre_archivo: str) -> str:
    ruta = f'bajas/pdfs/{nombre_archivo}'
    _client().storage.from_(_bucket()).upload(
        path=ruta,
        file=pdf_bytes,
        file_options={'content-type': 'application/pdf', 'upsert': 'true'},
    )
    logger.info('PDF de baja subido a Supabase: %s', ruta)
    return ruta
 
def subir_docx_baja(docx_bytes: bytes, nombre_archivo: str) -> str:
    ruta = f'bajas/docx/{nombre_archivo}'
    _client().storage.from_(_bucket()).upload(
        path=ruta,
        file=docx_bytes,
        file_options={
            'content-type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'upsert': 'true',
        },
    )
    logger.info('DOCX de baja subido a Supabase: %s', ruta)
    return ruta
 
def subir_pdf_firmado_baja(archivo_bytes: bytes, nombre_archivo: str) -> str:
    ext = nombre_archivo.rsplit('.', 1)[-1].lower()
    tipos = {'pdf': 'application/pdf', 'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'png': 'image/png'}
    ruta = f'bajas/firmados/{nombre_archivo}'
    _client().storage.from_(_bucket()).upload(
        path=ruta,
        file=archivo_bytes,
        file_options={'content-type': tipos.get(ext, 'application/octet-stream'), 'upsert': 'true'},
    )
    logger.info('PDF firmado de baja subido a Supabase: %s', ruta)
    return ruta
# ── COMPARTIDO ────────────────────────────────────────────────────────────────
def descargar_pdf(ruta: str) -> bytes:
    return _client().storage.from_(_bucket()).download(ruta)

def obtener_url_pdf(ruta: str, expiracion_segundos: int = 3600) -> str:
    resp = _client().storage.from_(_bucket()).create_signed_url(
        path=ruta,
        expires_in=expiracion_segundos,
    )
    return resp.get('signedURL') or resp.get('signedUrl', '')

def obtener_url_imagen(ruta: str, expiracion_segundos: int = 3600) -> str:
    resp = _client().storage.from_(_bucket()).create_signed_url(
        path=ruta,
        expires_in=expiracion_segundos,
    )
    return resp.get('signedURL') or resp.get('signedUrl', '')
