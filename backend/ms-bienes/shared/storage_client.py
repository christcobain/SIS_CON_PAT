import logging
from django.conf import settings
from supabase import create_client
logger = logging.getLogger(__name__)


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
    """Sube el PDF firmado de transferencia. Ruta: transferencias/firmados/"""
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
    """Sube el PDF generado del acta de mantenimiento. Ruta: mantenimientos/pdfs/"""
    ruta = f'mantenimientos/pdfs/{nombre_archivo}'
    _client().storage.from_(_bucket()).upload(
        path=ruta,
        file=pdf_bytes,
        file_options={'content-type': 'application/pdf', 'upsert': 'true'},
    )
    return ruta
def subir_pdf_firmado_mantenimiento(archivo_bytes: bytes, nombre_archivo: str) -> str:
    """Sube el PDF firmado del acta de mantenimiento. Ruta: mantenimientos/firmados/"""
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

# ── COMPARTIDO ────────────────────────────────────────────────────────────────
def descargar_pdf(ruta: str) -> bytes:
    """Descarga cualquier archivo del bucket por su ruta relativa."""
    return _client().storage.from_(_bucket()).download(ruta)

def obtener_url_pdf(ruta: str, expiracion_segundos: int = 3600) -> str:
    """Retorna una URL firmada temporal para visualización directa en el navegador."""
    resp = _client().storage.from_(_bucket()).create_signed_url(
        path=ruta,
        expires_in=expiracion_segundos,
    )
    return resp.get('signedURL') or resp.get('signedUrl', '')