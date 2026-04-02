import logging
from django.conf import settings
from supabase import create_client
logger = logging.getLogger(__name__)


def _client():

    return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
def _bucket():
    return getattr(settings, 'SUPABASE_STORAGE_BUCKET', 'transferencias-pdfs')
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
    tipos = {'pdf': 'application/pdf', 'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'png': 'image/png'}
    ruta = f'transferencias/firmados/{nombre_archivo}'
    _client().storage.from_(_bucket()).upload(
        path=ruta,
        file=archivo_bytes,
        file_options={'content-type': tipos.get(ext, 'application/octet-stream'), 'upsert': 'true'},
    )
    return ruta
def descargar_pdf(ruta: str) -> bytes:
    return _client().storage.from_(_bucket()).download(ruta)
def obtener_url_pdf(ruta: str, expiracion_segundos: int = 3600) -> str:
    resp = _client().storage.from_(_bucket()).create_signed_url(
        path=ruta,
        expires_in=expiracion_segundos,
    )
    return resp.get('signedURL') or resp.get('signedUrl', '')