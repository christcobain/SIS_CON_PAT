from pathlib import Path
from datetime import timedelta
from dotenv import load_dotenv
import os

# ===== PATH =====
BASE_DIR = Path(__file__).resolve().parent.parent.parent
env_file = BASE_DIR / '.env'
if env_file.exists():
    load_dotenv(env_file, encoding='utf-8-sig')
else:
    print(f'⚠️  No se encontró .env en {env_file}')

SECRET_KEY    = os.getenv('SECRET_KEY', 'django-insecure-cambiar-en-produccion')
ALLOWED_HOSTS = [h.strip() for h in os.getenv('ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',')]

DJANGO_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
]
THIRD_PARTY_APPS = [
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'django_filters',
    'drf_spectacular',
]
LOCAL_APPS = [
    'bienes.apps.BienesConfig',
    'mantenimientos.apps.MantenimientosConfig',
    'transferencias.apps.TransferenciasConfig',
    'bajas.apps.BajasConfig',
    'catalogos.apps.CatalogosConfig',
]
INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'shared.middleware.AdminAutoLoginMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]
AUTHENTICATION_BACKENDS = [
    'shared.backends.AdminJWTAuthBackend',
    'django.contrib.auth.backends.ModelBackend',
]
ROOT_URLCONF = 'config.urls'

TEMPLATES = [{
    'BACKEND': 'django.template.backends.django.DjangoTemplates',
    'DIRS': [BASE_DIR / 'templates'],
    'APP_DIRS': True,
    'OPTIONS': {'context_processors': [
        'django.template.context_processors.debug',
        'django.template.context_processors.request',
        'django.contrib.auth.context_processors.auth',
        'django.contrib.messages.context_processors.messages',
    ]},
}]


DATABASES = {
    'default': {
        'ENGINE':   os.getenv('DB_ENGINE', 'django.db.backends.postgresql'),
        'NAME':     os.getenv('DB_NAME'),
        'USER':     os.getenv('DB_USER'),
        'PASSWORD': os.getenv('DB_PASSWORD'),
        'HOST':     os.getenv('DB_HOST', 'localhost'),
        'PORT':     os.getenv('DB_PORT', '5432'),
        'CONN_MAX_AGE': 600,
        'OPTIONS': {
            'connect_timeout': 10,

            'sslmode': 'prefer',
        },
    }
}


SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME':  timedelta(minutes=int(os.getenv('JWT_ACCESS_TOKEN_LIFETIME_MINUTES', '480'))),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=int(os.getenv('JWT_REFRESH_TOKEN_LIFETIME_DAYS', '1'))),
    'AUTH_HEADER_TYPES': ('Bearer',),
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
    'SIGNING_KEY': os.getenv('JWT_SHARED_SECRET','SECRET_KEY'),
}
JWT_AUTH_COOKIE          = 'sisconpat_access'
JWT_AUTH_REFRESH_COOKIE  = 'sisconpat_refresh'
JWT_AUTH_COOKIE_SECURE   = os.getenv('JWT_COOKIE_SECURE', 'False').lower() == 'true'
JWT_AUTH_COOKIE_SAMESITE = os.getenv('JWT_COOKIE_SAMESITE', 'Lax')


MS_USUARIOS_BASE_URL = os.getenv('MS_USUARIOS_BASE_URL', 'http://127.0.0.1:8000/api/v1')
MS_SERVICE_NAME      = os.getenv('MS_SERVICE_NAME', 'ms-bienes')
SERVICE_SYNC_KEY     = os.getenv('SERVICE_SYNC_KEY', '')


REST_FRAMEWORK = {
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
    'DEFAULT_AUTHENTICATION_CLASSES': ('shared.backends.CookieJWTAuthentication',),
    'DEFAULT_PERMISSION_CLASSES': ['rest_framework.permissions.IsAuthenticated'],
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 15,
    'DEFAULT_RENDERER_CLASSES': ['rest_framework.renderers.JSONRenderer'],
}


CORS_ALLOWED_ORIGINS   = [o.strip() for o in os.getenv('CORS_ALLOWED_ORIGINS', 'http://localhost:5173').split(',')]
CORS_ALLOW_CREDENTIALS = True


LANGUAGE_CODE = 'es-pe'
TIME_ZONE     = 'America/Lima'
USE_I18N = True
USE_TZ   = True

STATIC_URL  = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
MEDIA_URL   = '/media/'
MEDIA_ROOT  = BASE_DIR / 'media'
MEDIA_ROOT.mkdir(parents=True, exist_ok=True)
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

INSTITUCION = {
    'nombre': 'Poder Judicial del Perú',
    'corte':  'Corte Superior de Justicia de Lima Norte',
    'codigo': 'CSJLN',
}

SPECTACULAR_SETTINGS = {
    'TITLE': 'API Bienes — Sistema de Control Patrimonial CSJLN',
    'DESCRIPTION': 'ms-bienes: registro, mantenimiento, transferencias y bajas de activos',
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': True,
    'SCHEMA_PATH_PREFIX': '/api/v1/',
}


SESSION_COOKIE_DOMAIN = None
SESSION_COOKIE_PATH   = '/'