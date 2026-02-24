# 🏛️ SISCONPAT — Sistema de Control Patrimonial del Poder Judicial
## Corte Superior de Justicia de Lima Norte
### Guía Completa — React 19 + Django 6 + Microservicios

---

## ARQUITECTURA GENERAL

```
┌─────────────────────────────────────────────────────────────────┐
│                     CLIENTE (Browser)                            │
│              React 19 + Vite + TailwindCSS v3                   │
│         (Puerto 5173 en dev / Nginx en producción)              │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTPS + JWT en HttpOnly Cookies
           ┌───────────────┼───────────────┐
           ▼               ▼               ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ MS-USUARIOS  │  │  MS-BIENES   │  │ MS-REPORTES  │
│  Django 6    │  │  Django 6    │  │  Django 6    │
│  Puerto 8001 │  │  Puerto 8002 │  │  Puerto 8003 │
└──────┬───────┘  └──────┬───────┘  └──────┬───────┘
       │                 │                 │
       ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  sigap_users │  │ sigap_bienes │  │sigap_reportes│
│  PostgreSQL  │  │  PostgreSQL  │  │  PostgreSQL  │
└──────────────┘  └──────────────┘  └──────────────┘
```

### Microservicios
| Microservicio | Puerto | Responsabilidad | Base de Datos |
|---|---|---|---|
| **ms-usuarios** | 8001 | Usuarios, Roles, Permisos, Sede/Módulo/Área, Auth JWT | sigap_users |
| **ms-bienes** | 8002 | Bienes, Mantenimiento, Traslados, Baja de bienes | sigap_bienes |
| **ms-reportes** | 8003 | Reportes, Auditorías, Exportaciones PDF/Excel | sigap_reportes |

---

## ÍNDICE DE ARCHIVOS DE ESTA GUÍA

```
00_GUIA_PRINCIPAL.md          ← Este archivo (overview + arquitectura)
01_PREREQUISITOS.md           ← Instalación de herramientas base
02_BASES_DE_DATOS.md          ← Crear 3 DBs en PostgreSQL
03_MS_USUARIOS.md             ← Microservicio usuarios completo (modelos + capas)
04_MS_BIENES.md               ← Microservicio bienes completo (modelos + capas)
05_MS_REPORTES.md             ← Microservicio reportes completo (modelos + capas)
06_FRONTEND_SETUP.md          ← Instalación y configuración React 19
07_FRONTEND_ESTRUCTURA.md     ← Archivos completos del frontend
08_FRONTEND_PAGINAS.md        ← Código de páginas: Usuarios, Roles, Sedes, Bienes...
09_GIT_WORKFLOW.md            ← Git, ramas, GitHub
```

---

## ESTRUCTURA DE CARPETAS RAÍZ

```
sigap/
├── ms-usuarios/        ← Microservicio 1: Django 6
├── ms-bienes/          ← Microservicio 2: Django 6
├── ms-reportes/        ← Microservicio 3: Django 6
├── frontend/           ← React 19 + Vite
├── docker-compose.yml  ← (Opcional, para futuro)
├── .gitignore
└── README.md
```
# 01 — PREREQUISITOS E INSTALACIÓN DE HERRAMIENTAS

## A) HERRAMIENTAS BASE

```bash
# 1. Node.js 22 LTS (compatible con React 19)
# Descargar desde: https://nodejs.org/en/download
node --version    # v22.x.x
npm --version     # 10.x.x

# 2. Python 3.12+ (compatible con Django 6)
# Descargar desde: https://python.org/downloads
python --version  # Python 3.12.x

# 3. Git
# Descargar desde: https://git-scm.com
git --version     # git version 2.x.x

# 4. PostgreSQL 16
# Descargar desde: https://postgresql.org/download
psql --version    # psql (PostgreSQL) 16.x
```

---

## B) CONFIGURAR GIT + GITHUB

```bash
# Identidad global
git config --global user.name  "Tu Nombre Completo"
git config --global user.email "tu@email.com"
git config --global core.autocrlf input   # Mac/Linux
git config --global core.autocrlf true    # Windows

# Crear carpeta raíz del proyecto
mkdir sigap && cd sigap

# Inicializar repositorio
git init

# .gitignore raíz
cat > .gitignore << 'EOF'
# Python / Django
__pycache__/
*.py[cod]
*.pyo
venv/
env/
.env
*.sqlite3
media/
staticfiles/
.pytest_cache/

# Node / React
node_modules/
dist/
.cache/
*.local

# VSCode
.vscode/settings.json

# OS
.DS_Store
Thumbs.db
EOF

echo "# SIGAP - Sistema de Gestión de Activos del Poder Judicial" > README.md

git add .
git commit -m "chore: inicializar repositorio SIGAP"

# Conectar con GitHub (crear repositorio vacío en github.com primero)
git remote add origin https://github.com/TU_USUARIO/sigap.git
git branch -M main
git push -u origin main
```

---

# 02 — CREAR LAS 3 BASES DE DATOS EN POSTGRESQL

```sql
-- Abrir terminal y conectarse:
psql -U postgres

-- === BASE DE DATOS 1: Microservicio Usuarios ===
CREATE USER sigap_users_usr WITH PASSWORD 'SigapUsers2024!';
CREATE DATABASE sigap_users OWNER sigap_users_usr;
GRANT ALL PRIVILEGES ON DATABASE sigap_users TO sigap_users_usr;

-- === BASE DE DATOS 2: Microservicio Bienes ===
CREATE USER sigap_bienes_usr WITH PASSWORD 'SigapBienes2024!';
CREATE DATABASE sigap_bienes OWNER sigap_bienes_usr;
GRANT ALL PRIVILEGES ON DATABASE sigap_bienes TO sigap_bienes_usr;

-- === BASE DE DATOS 3: Microservicio Reportes ===
CREATE USER sigap_reportes_usr WITH PASSWORD 'SigapReportes2024!';
CREATE DATABASE sigap_reportes OWNER sigap_reportes_usr;
GRANT ALL PRIVILEGES ON DATABASE sigap_reportes TO sigap_reportes_usr;

\q
```

---

# 03 — MICROSERVICIO 1: ms-usuarios (Puerto 8001)

## Responsabilidades:
- Autenticación JWT (vía HttpOnly Cookies)
- CRUD Usuarios del sistema y usuarios institucionales
- CRUD Roles y Permisos
- CRUD Sede / Módulo / Área
- Consulta externa de datos de personal (DNI → datos RRHH)

## Paso 1: Crear proyecto Django 6

```bash
cd sigap

# Crear entorno virtual para ms-usuarios
python -m venv ms-usuarios/venv

# Activar
# Windows:
ms-usuarios\venv\Scripts\activate
# Mac/Linux:
source ms-usuarios/venv/bin/activate

# Instalar dependencias
pip install django==6.0
pip install djangorestframework==3.16.0
pip install djangorestframework-simplejwt==5.4.0
pip install django-cors-headers==4.4.0
pip install psycopg2-binary==2.9.9
pip install python-decouple==3.8
pip install django-filter==24.3
pip install Pillow==10.4.0
pip install django-extensions==3.2.3

# Guardar
pip freeze > ms-usuarios/requirements.txt

# Crear proyecto Django dentro de ms-usuarios/
django-admin startproject config ms-usuarios/
cd ms-usuarios/

# Crear apps
python manage.py startapp apps/authentication
python manage.py startapp apps/users
python manage.py startapp apps/roles
python manage.py startapp apps/locations
```

## Paso 2: Estructura del ms-usuarios

```
ms-usuarios/
├── venv/
├── config/
│   ├── __init__.py
│   ├── settings/
│   │   ├── __init__.py
│   │   ├── base.py
│   │   ├── dev.py
│   │   └── prod.py
│   ├── urls.py
│   ├── wsgi.py
│   └── asgi.py
├── apps/
│   ├── authentication/     ← JWT login/logout/refresh
│   │   ├── views.py
│   │   ├── serializers.py
│   │   └── urls.py
│   ├── users/
│   │   ├── models.py
│   │   ├── repositories.py  ← Capa acceso a datos
│   │   ├── services.py      ← Lógica de negocio
│   │   ├── serializers.py
│   │   ├── views.py
│   │   └── urls.py
│   ├── roles/
│   │   ├── models.py
│   │   ├── repositories.py
│   │   ├── services.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   └── urls.py
│   └── locations/
│       ├── models.py
│       ├── repositories.py
│       ├── services.py
│       ├── serializers.py
│       ├── views.py
│       └── urls.py
├── .env
├── requirements.txt
└── manage.py
```

## Paso 3: .env del ms-usuarios

```bash
# ms-usuarios/.env
DJANGO_SETTINGS_MODULE=config.settings.dev
SECRET_KEY=ms-usuarios-secret-key-cambiar-en-produccion-xk29dl
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:5173

DB_NAME=sigap_users
DB_USER=sigap_users_usr
DB_PASSWORD=SigapUsers2024!
DB_HOST=localhost
DB_PORT=5432

# JWT
JWT_ACCESS_TOKEN_LIFETIME_MINUTES=480
JWT_REFRESH_TOKEN_LIFETIME_DAYS=1
JWT_COOKIE_SECURE=False
JWT_COOKIE_SAMESITE=Lax
```

## Paso 4: config/settings/base.py

```python
# ms-usuarios/config/settings/base.py
from pathlib import Path
from decouple import config
from datetime import timedelta

BASE_DIR = Path(__file__).resolve().parent.parent.parent
SECRET_KEY = config('SECRET_KEY')
ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='').split(',')

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
    'rest_framework_simplejwt.token_blacklist',
    'corsheaders',
    'django_filters',
    'django_extensions',
]

LOCAL_APPS = [
    'apps.authentication',
    'apps.users',
    'apps.roles',
    'apps.locations',
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'
AUTH_USER_MODEL = 'users.User'

TEMPLATES = [{'BACKEND': 'django.template.backends.django.DjangoTemplates',
    'DIRS': [], 'APP_DIRS': True,
    'OPTIONS': {'context_processors': [
        'django.template.context_processors.debug',
        'django.template.context_processors.request',
        'django.contrib.auth.context_processors.auth',
        'django.contrib.messages.context_processors.messages',
    ]},
}]

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': config('DB_NAME'),
        'USER': config('DB_USER'),
        'PASSWORD': config('DB_PASSWORD'),
        'HOST': config('DB_HOST', default='localhost'),
        'PORT': config('DB_PORT', default='5432'),
    }
}

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'apps.authentication.backends.CookieJWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 15,
    'EXCEPTION_HANDLER': 'apps.authentication.exceptions.custom_exception_handler',
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=config('JWT_ACCESS_TOKEN_LIFETIME_MINUTES', default=480, cast=int)),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=config('JWT_REFRESH_TOKEN_LIFETIME_DAYS', default=1, cast=int)),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'AUTH_HEADER_TYPES': ('Bearer',),
}

# JWT en HttpOnly Cookies
JWT_AUTH_COOKIE = 'sigap_access'
JWT_AUTH_REFRESH_COOKIE = 'sigap_refresh'
JWT_AUTH_COOKIE_SECURE = config('JWT_COOKIE_SECURE', default=False, cast=bool)
JWT_AUTH_COOKIE_HTTP_ONLY = True
JWT_AUTH_COOKIE_SAMESITE = config('JWT_COOKIE_SAMESITE', default='Lax')

CORS_ALLOWED_ORIGINS = config('CORS_ALLOWED_ORIGINS', default='').split(',')
CORS_ALLOW_CREDENTIALS = True  # CRÍTICO para cookies

LANGUAGE_CODE = 'es-pe'
TIME_ZONE = 'America/Lima'
USE_I18N = True
USE_TZ = True

STATIC_URL = '/static/'
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Institución
INSTITUCION = {
    'nombre': 'Poder Judicial del Perú',
    'corte': 'Corte Superior de Justicia de Lima Norte',
    'codigo': 'CSJLN',
}
```

## Paso 5: config/settings/dev.py

```python
# ms-usuarios/config/settings/dev.py
from .base import *

DEBUG = True
INSTALLED_APPS += ['debug_toolbar']
MIDDLEWARE += ['debug_toolbar.middleware.DebugToolbarMiddleware']
INTERNAL_IPS = ['127.0.0.1']
CORS_ALLOW_ALL_ORIGINS = False
```

## Paso 6: config/settings/prod.py

```python
# ms-usuarios/config/settings/prod.py
from .base import *

DEBUG = False
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
JWT_AUTH_COOKIE_SECURE = True
JWT_AUTH_COOKIE_SAMESITE = 'Strict'
ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='').split(',')
STATIC_ROOT = BASE_DIR / 'staticfiles'
```

## Paso 7: config/urls.py

```python
# ms-usuarios/config/urls.py
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/auth/', include('apps.authentication.urls')),
    path('api/v1/users/', include('apps.users.urls')),
    path('api/v1/roles/', include('apps.roles.urls')),
    path('api/v1/locations/', include('apps.locations.urls')),
]
```

---

## CÓDIGO COMPLETO: apps/authentication/

### backends.py — Autenticación por Cookie

```python
# ms-usuarios/apps/authentication/backends.py
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken
from django.conf import settings


class CookieJWTAuthentication(JWTAuthentication):
    """Lee el JWT Access Token desde la HttpOnly Cookie en vez del header."""

    def authenticate(self, request):
        cookie_name = getattr(settings, 'JWT_AUTH_COOKIE', 'sigap_access')
        raw_token = request.COOKIES.get(cookie_name)
        if raw_token is None:
            return None
        try:
            validated_token = self.get_validated_token(raw_token)
        except InvalidToken:
            return None
        return self.get_user(validated_token), validated_token
```

### exceptions.py

```python
# ms-usuarios/apps/authentication/exceptions.py
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)
    if response is not None:
        response.data = {
            'success': False,
            'error': response.data,
            'status_code': response.status_code,
        }
    return response
```

### serializers.py

```python
# ms-usuarios/apps/authentication/serializers.py
from rest_framework import serializers


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    password = serializers.CharField(write_only=True)


class TokenResponseSerializer(serializers.Serializer):
    user_id  = serializers.IntegerField()
    username = serializers.CharField()
    full_name = serializers.CharField()
    role     = serializers.CharField()
    permissions = serializers.ListField(child=serializers.CharField())
```

### views.py

```python
# ms-usuarios/apps/authentication/views.py
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from django.contrib.auth import authenticate
from .serializers import LoginSerializer


def _set_cookies(response, access_token, refresh_token):
    cookie_secure   = getattr(settings, 'JWT_AUTH_COOKIE_SECURE', False)
    cookie_samesite = getattr(settings, 'JWT_AUTH_COOKIE_SAMESITE', 'Lax')
    response.set_cookie(
        key=settings.JWT_AUTH_COOKIE,
        value=str(access_token),
        httponly=True,
        secure=cookie_secure,
        samesite=cookie_samesite,
        max_age=int(settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME'].total_seconds()),
    )
    response.set_cookie(
        key=settings.JWT_AUTH_REFRESH_COOKIE,
        value=str(refresh_token),
        httponly=True,
        secure=cookie_secure,
        samesite=cookie_samesite,
        max_age=int(settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME'].total_seconds()),
    )
    return response


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = authenticate(
            username=serializer.validated_data['username'],
            password=serializer.validated_data['password'],
        )
        if not user or not user.is_active:
            return Response({'error': 'Credenciales inválidas o usuario inactivo.'}, status=status.HTTP_401_UNAUTHORIZED)

        refresh = RefreshToken.for_user(user)
        access  = refresh.access_token

        user_data = {
            'user_id':  user.id,
            'username': user.username,
            'full_name': user.get_full_name(),
            'role': user.role.code if user.role else None,
            'permissions': list(user.role.permissions.values_list('codename', flat=True)) if user.role else [],
            'sedes': list(user.sedes.values('id', 'nombre', 'codigo')),
        }
        response = Response({'success': True, 'user': user_data}, status=status.HTTP_200_OK)
        return _set_cookies(response, access, refresh)


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.COOKIES.get(settings.JWT_AUTH_REFRESH_COOKIE)
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
        except TokenError:
            pass
        response = Response({'success': True, 'message': 'Sesión cerrada.'}, status=status.HTTP_200_OK)
        response.delete_cookie(settings.JWT_AUTH_COOKIE)
        response.delete_cookie(settings.JWT_AUTH_REFRESH_COOKIE)
        return response


class RefreshTokenView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        refresh_token = request.COOKIES.get(settings.JWT_AUTH_REFRESH_COOKIE)
        if not refresh_token:
            return Response({'error': 'No hay refresh token.'}, status=status.HTTP_401_UNAUTHORIZED)
        try:
            refresh = RefreshToken(refresh_token)
            access  = refresh.access_token
            response = Response({'success': True}, status=status.HTTP_200_OK)
            return _set_cookies(response, access, refresh)
        except TokenError:
            return Response({'error': 'Token inválido o expirado.'}, status=status.HTTP_401_UNAUTHORIZED)


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response({
            'user_id':  user.id,
            'username': user.username,
            'full_name': user.get_full_name(),
            'email': user.email,
            'role': user.role.code if user.role else None,
            'role_name': user.role.name if user.role else None,
            'permissions': list(user.role.permissions.values_list('codename', flat=True)) if user.role else [],
            'sedes': list(user.sedes.values('id', 'nombre', 'codigo')),
            'estado': user.estado,
        })
```

### urls.py

```python
# ms-usuarios/apps/authentication/urls.py
from django.urls import path
from .views import LoginView, LogoutView, RefreshTokenView, MeView

urlpatterns = [
    path('login/',   LoginView.as_view(),        name='login'),
    path('logout/',  LogoutView.as_view(),        name='logout'),
    path('refresh/', RefreshTokenView.as_view(),  name='refresh'),
    path('me/',      MeView.as_view(),            name='me'),
]
```

---

## CÓDIGO COMPLETO: apps/roles/

### models.py

```python
# ms-usuarios/apps/roles/models.py
from django.db import models


class Permission(models.Model):
    """Permiso atómico del sistema."""
    codename    = models.CharField(max_length=100, unique=True)
    name        = models.CharField(max_length=200)
    module      = models.CharField(max_length=100, help_text='Módulo al que pertenece (users, bienes, etc.)')
    action      = models.CharField(max_length=50, help_text='ver, registrar, actualizar, eliminar, aprobar')
    description = models.TextField(blank=True)
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'roles_permission'
        ordering = ['module', 'action']
        verbose_name = 'Permiso'
        verbose_name_plural = 'Permisos'

    def __str__(self):
        return f'{self.module}.{self.action}'


class Role(models.Model):
    """Perfil/Rol del sistema de gestión de activos."""
    CODE_CHOICES = [
        ('SYSADMIN',     'Administrador del Sistema'),
        ('COORDSISTEMA', 'Coordinador de Sistemas'),
        ('ASISTSISTEMA', 'Asistente de Sistemas'),
        ('ADMINSEDE',    'Administrador de Sede'),
        ('SEGURSEDE',    'Seguridad de Sede'),
        ('USUARIOCORTE', 'Usuario de Corte'),
    ]
    code        = models.CharField(max_length=30, unique=True, choices=CODE_CHOICES)
    name        = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    permissions = models.ManyToManyField(Permission, blank=True, related_name='roles')
    estado      = models.BooleanField(default=True)
    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'roles_role'
        ordering = ['name']
        verbose_name = 'Rol'
        verbose_name_plural = 'Roles'

    def __str__(self):
        return self.name
```

### repositories.py

```python
# ms-usuarios/apps/roles/repositories.py
from .models import Role, Permission


class RoleRepository:
    @staticmethod
    def get_all(filters=None):
        qs = Role.objects.prefetch_related('permissions').all()
        if filters:
            if 'estado' in filters:
                qs = qs.filter(estado=filters['estado'])
            if 'search' in filters:
                qs = qs.filter(name__icontains=filters['search'])
        return qs

    @staticmethod
    def get_by_id(role_id):
        return Role.objects.prefetch_related('permissions').get(pk=role_id)

    @staticmethod
    def create(data, permission_ids=None):
        role = Role.objects.create(**data)
        if permission_ids:
            role.permissions.set(permission_ids)
        return role

    @staticmethod
    def update(role, data, permission_ids=None):
        for key, value in data.items():
            setattr(role, key, value)
        role.save()
        if permission_ids is not None:
            role.permissions.set(permission_ids)
        return role

    @staticmethod
    def toggle_estado(role):
        role.estado = not role.estado
        role.save(update_fields=['estado'])
        return role


class PermissionRepository:
    @staticmethod
    def get_all(module=None):
        qs = Permission.objects.all()
        if module:
            qs = qs.filter(module=module)
        return qs

    @staticmethod
    def get_by_id(perm_id):
        return Permission.objects.get(pk=perm_id)

    @staticmethod
    def create(data):
        return Permission.objects.create(**data)
```

### services.py

```python
# ms-usuarios/apps/roles/services.py
from .repositories import RoleRepository, PermissionRepository
from django.core.exceptions import ValidationError


class RoleService:
    @staticmethod
    def list_roles(filters=None):
        return RoleRepository.get_all(filters)

    @staticmethod
    def get_role(role_id):
        try:
            return RoleRepository.get_by_id(role_id)
        except Exception:
            raise ValidationError(f'Rol con ID {role_id} no encontrado.')

    @staticmethod
    def create_role(data, permission_ids=None):
        if Role.objects.filter(code=data.get('code')).exists():
            raise ValidationError('Ya existe un rol con ese código.')
        return RoleRepository.create(data, permission_ids)

    @staticmethod
    def update_role(role_id, data, permission_ids=None):
        role = RoleService.get_role(role_id)
        return RoleRepository.update(role, data, permission_ids)

    @staticmethod
    def toggle_estado(role_id):
        role = RoleService.get_role(role_id)
        return RoleRepository.toggle_estado(role)

    @staticmethod
    def assign_permissions(role_id, permission_ids):
        role = RoleService.get_role(role_id)
        role.permissions.set(permission_ids)
        return role

    @staticmethod
    def remove_permission(role_id, permission_id):
        role = RoleService.get_role(role_id)
        role.permissions.remove(permission_id)
        return role


# Importar al final para evitar circular imports
from .models import Role


class PermissionService:
    @staticmethod
    def list_permissions(module=None):
        return PermissionRepository.get_all(module)

    @staticmethod
    def create_permission(data):
        return PermissionRepository.create(data)
```

### serializers.py

```python
# ms-usuarios/apps/roles/serializers.py
from rest_framework import serializers
from .models import Role, Permission


class PermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Permission
        fields = ['id', 'codename', 'name', 'module', 'action', 'description']


class RoleSerializer(serializers.ModelSerializer):
    permissions = PermissionSerializer(many=True, read_only=True)
    permission_ids = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Permission.objects.all(),
        write_only=True, required=False, source='permissions'
    )

    class Meta:
        model  = Role
        fields = ['id', 'code', 'name', 'description', 'permissions', 'permission_ids', 'estado', 'created_at']

    def create(self, validated_data):
        permissions = validated_data.pop('permissions', [])
        role = Role.objects.create(**validated_data)
        role.permissions.set(permissions)
        return role

    def update(self, instance, validated_data):
        permissions = validated_data.pop('permissions', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if permissions is not None:
            instance.permissions.set(permissions)
        return instance


class RoleListSerializer(serializers.ModelSerializer):
    permission_count = serializers.SerializerMethodField()

    class Meta:
        model  = Role
        fields = ['id', 'code', 'name', 'description', 'estado', 'permission_count', 'created_at']

    def get_permission_count(self, obj):
        return obj.permissions.count()
```

### views.py

```python
# ms-usuarios/apps/roles/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .services import RoleService, PermissionService
from .serializers import RoleSerializer, RoleListSerializer, PermissionSerializer
from .models import Permission


class RoleViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    def list(self, request):
        filters = {k: v for k, v in request.query_params.items()}
        roles = RoleService.list_roles(filters)
        serializer = RoleListSerializer(roles, many=True)
        return Response({'success': True, 'data': serializer.data})

    def retrieve(self, request, pk=None):
        role = RoleService.get_role(pk)
        serializer = RoleSerializer(role)
        return Response({'success': True, 'data': serializer.data})

    def create(self, request):
        serializer = RoleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        role = serializer.save()
        return Response({'success': True, 'data': RoleSerializer(role).data}, status=status.HTTP_201_CREATED)

    def update(self, request, pk=None):
        role = RoleService.get_role(pk)
        serializer = RoleSerializer(role, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        role = serializer.save()
        return Response({'success': True, 'data': RoleSerializer(role).data})

    @action(detail=True, methods=['patch'], url_path='toggle-estado')
    def toggle_estado(self, request, pk=None):
        role = RoleService.toggle_estado(pk)
        return Response({'success': True, 'estado': role.estado})

    @action(detail=True, methods=['post'], url_path='assign-permissions')
    def assign_permissions(self, request, pk=None):
        permission_ids = request.data.get('permission_ids', [])
        role = RoleService.assign_permissions(pk, permission_ids)
        return Response({'success': True, 'data': RoleSerializer(role).data})

    @action(detail=True, methods=['delete'], url_path='remove-permission/(?P<perm_id>[^/.]+)')
    def remove_permission(self, request, pk=None, perm_id=None):
        role = RoleService.remove_permission(pk, perm_id)
        return Response({'success': True, 'data': RoleSerializer(role).data})


class PermissionViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    def list(self, request):
        module = request.query_params.get('module')
        permissions = PermissionService.list_permissions(module)
        serializer = PermissionSerializer(permissions, many=True)
        return Response({'success': True, 'data': serializer.data})

    def create(self, request):
        serializer = PermissionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        perm = PermissionService.create_permission(serializer.validated_data)
        return Response({'success': True, 'data': PermissionSerializer(perm).data}, status=status.HTTP_201_CREATED)
```

### urls.py

```python
# ms-usuarios/apps/roles/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RoleViewSet, PermissionViewSet

router = DefaultRouter()
router.register(r'roles', RoleViewSet, basename='role')
router.register(r'permissions', PermissionViewSet, basename='permission')

urlpatterns = [path('', include(router.urls))]
```

---

## CÓDIGO COMPLETO: apps/locations/

### models.py

```python
# ms-usuarios/apps/locations/models.py
from django.db import models


class Departamento(models.Model):
    nombre = models.CharField(max_length=100, unique=True)
    codigo = models.CharField(max_length=10, unique=True)

    class Meta:
        db_table = 'locations_departamento'
        ordering = ['nombre']


class Provincia(models.Model):
    departamento = models.ForeignKey(Departamento, on_delete=models.CASCADE, related_name='provincias')
    nombre = models.CharField(max_length=100)
    codigo = models.CharField(max_length=10)

    class Meta:
        db_table = 'locations_provincia'
        ordering = ['nombre']


class Distrito(models.Model):
    provincia = models.ForeignKey(Provincia, on_delete=models.CASCADE, related_name='distritos')
    nombre = models.CharField(max_length=100)
    codigo = models.CharField(max_length=10)

    class Meta:
        db_table = 'locations_distrito'
        ordering = ['nombre']


class Sede(models.Model):
    """Sede física de la Corte Superior de Justicia de Lima Norte."""
    nombre    = models.CharField(max_length=200)
    codigo    = models.CharField(max_length=20, unique=True)
    direccion = models.CharField(max_length=300)
    distrito  = models.ForeignKey(Distrito, on_delete=models.SET_NULL, null=True, related_name='sedes')
    estado    = models.BooleanField(default=True)
    telefono  = models.CharField(max_length=20, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'locations_sede'
        ordering = ['nombre']
        verbose_name = 'Sede'

    def __str__(self):
        return self.nombre


class Modulo(models.Model):
    """Módulo jurisdiccional dentro de una sede (NCPP, Civil, etc.)."""
    MODULO_CHOICES = [
        ('NCPP', 'Nuevo Código Procesal Penal'),
        ('CIVIL', 'Civil'),
        ('FLAGRANCIA', 'Flagrancia'),
        ('VCM', 'Violencia Contra la Mujer'),
        ('LABORAL', 'Laboral'),
        ('COMERCIAL', 'Comercial'),
        ('ADMINISTRATIVO', 'Administrativo'),
    ]
    sede   = models.ForeignKey(Sede, on_delete=models.CASCADE, related_name='modulos')
    codigo = models.CharField(max_length=30, choices=MODULO_CHOICES)
    nombre = models.CharField(max_length=200)
    estado = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table  = 'locations_modulo'
        ordering  = ['nombre']
        unique_together = ['sede', 'codigo']
        verbose_name = 'Módulo'

    def __str__(self):
        return f'{self.sede.nombre} - {self.nombre}'


class Area(models.Model):
    """Área dentro de un módulo (Juzgado, Pool Especialistas, etc.)."""
    modulo    = models.ForeignKey(Modulo, on_delete=models.CASCADE, related_name='areas')
    nombre    = models.CharField(max_length=200)
    tipo_area = models.CharField(max_length=50, choices=[
        ('JURISDICCIONAL', 'Jurisdiccional'),
        ('ADMINISTRATIVA', 'Administrativa'),
    ], default='JURISDICCIONAL')
    estado    = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'locations_area'
        ordering = ['nombre']
        verbose_name = 'Área'

    def __str__(self):
        return f'{self.modulo.sede.nombre} / {self.modulo.nombre} / {self.nombre}'
```

### repositories.py

```python
# ms-usuarios/apps/locations/repositories.py
from .models import Sede, Modulo, Area, Departamento, Provincia, Distrito


class SedeRepository:
    @staticmethod
    def get_all(estado=None, search=None):
        qs = Sede.objects.select_related('distrito__provincia__departamento').prefetch_related('modulos')
        if estado is not None:
            qs = qs.filter(estado=estado)
        if search:
            qs = qs.filter(nombre__icontains=search)
        return qs

    @staticmethod
    def get_by_id(sede_id):
        return Sede.objects.select_related('distrito__provincia__departamento').get(pk=sede_id)

    @staticmethod
    def create(data):
        return Sede.objects.create(**data)

    @staticmethod
    def update(sede, data):
        for k, v in data.items():
            setattr(sede, k, v)
        sede.save()
        return sede

    @staticmethod
    def toggle_estado(sede):
        sede.estado = not sede.estado
        sede.save(update_fields=['estado'])
        return sede


class ModuloRepository:
    @staticmethod
    def get_by_sede(sede_id):
        return Modulo.objects.filter(sede_id=sede_id).prefetch_related('areas')

    @staticmethod
    def create(data):
        return Modulo.objects.create(**data)

    @staticmethod
    def toggle_estado(modulo):
        modulo.estado = not modulo.estado
        modulo.save(update_fields=['estado'])
        return modulo


class AreaRepository:
    @staticmethod
    def get_by_modulo(modulo_id):
        return Area.objects.filter(modulo_id=modulo_id)

    @staticmethod
    def create(data):
        return Area.objects.create(**data)

    @staticmethod
    def toggle_estado(area):
        area.estado = not area.estado
        area.save(update_fields=['estado'])
        return area
```

### services.py

```python
# ms-usuarios/apps/locations/services.py
from .repositories import SedeRepository, ModuloRepository, AreaRepository
from .models import Modulo, Area


class SedeService:
    @staticmethod
    def list_sedes(filters=None):
        estado = filters.get('estado') if filters else None
        search = filters.get('search') if filters else None
        if estado is not None:
            estado = estado == 'true' or estado is True
        return SedeRepository.get_all(estado=estado, search=search)

    @staticmethod
    def get_sede(sede_id):
        return SedeRepository.get_by_id(sede_id)

    @staticmethod
    def create_sede(data):
        return SedeRepository.create(data)

    @staticmethod
    def update_sede(sede_id, data):
        sede = SedeService.get_sede(sede_id)
        return SedeRepository.update(sede, data)

    @staticmethod
    def toggle_estado(sede_id):
        sede = SedeService.get_sede(sede_id)
        return SedeRepository.toggle_estado(sede)


class ModuloService:
    @staticmethod
    def list_by_sede(sede_id):
        return ModuloRepository.get_by_sede(sede_id)

    @staticmethod
    def create_modulo(data):
        return ModuloRepository.create(data)

    @staticmethod
    def toggle_estado(modulo_id):
        try:
            modulo = Modulo.objects.get(pk=modulo_id)
            return ModuloRepository.toggle_estado(modulo)
        except Modulo.DoesNotExist:
            raise Exception('Módulo no encontrado.')


class AreaService:
    @staticmethod
    def list_by_modulo(modulo_id):
        return AreaRepository.get_by_modulo(modulo_id)

    @staticmethod
    def create_area(data):
        return AreaRepository.create(data)

    @staticmethod
    def toggle_estado(area_id):
        try:
            area = Area.objects.get(pk=area_id)
            return AreaRepository.toggle_estado(area)
        except Area.DoesNotExist:
            raise Exception('Área no encontrada.')
```

### serializers.py

```python
# ms-usuarios/apps/locations/serializers.py
from rest_framework import serializers
from .models import Sede, Modulo, Area, Departamento, Provincia, Distrito


class DistritoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Distrito
        fields = ['id', 'nombre', 'codigo']


class ProvinciaSerializer(serializers.ModelSerializer):
    distritos = DistritoSerializer(many=True, read_only=True)

    class Meta:
        model = Provincia
        fields = ['id', 'nombre', 'codigo', 'distritos']


class DepartamentoSerializer(serializers.ModelSerializer):
    provincias = ProvinciaSerializer(many=True, read_only=True)

    class Meta:
        model = Departamento
        fields = ['id', 'nombre', 'codigo', 'provincias']


class AreaSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Area
        fields = ['id', 'nombre', 'tipo_area', 'estado', 'created_at']


class ModuloSerializer(serializers.ModelSerializer):
    areas = AreaSerializer(many=True, read_only=True)

    class Meta:
        model  = Modulo
        fields = ['id', 'sede', 'codigo', 'nombre', 'estado', 'areas', 'created_at']


class SedeSerializer(serializers.ModelSerializer):
    modulos    = ModuloSerializer(many=True, read_only=True)
    distrito_detail = DistritoSerializer(source='distrito', read_only=True)
    ubicacion  = serializers.SerializerMethodField()

    class Meta:
        model  = Sede
        fields = ['id', 'nombre', 'codigo', 'direccion', 'distrito', 'distrito_detail',
                  'ubicacion', 'telefono', 'estado', 'modulos', 'created_at']

    def get_ubicacion(self, obj):
        if obj.distrito:
            prov = obj.distrito.provincia
            dept = prov.departamento
            return f'{obj.direccion}, {obj.distrito.nombre}, {prov.nombre}, {dept.nombre}'
        return obj.direccion


class SedeListSerializer(serializers.ModelSerializer):
    ubicacion = serializers.SerializerMethodField()
    modulos_count = serializers.SerializerMethodField()

    class Meta:
        model  = Sede
        fields = ['id', 'nombre', 'codigo', 'direccion', 'ubicacion', 'estado', 'modulos_count']

    def get_ubicacion(self, obj):
        if obj.distrito:
            return f'{obj.distrito.nombre}, {obj.distrito.provincia.nombre}'
        return ''

    def get_modulos_count(self, obj):
        return obj.modulos.filter(estado=True).count()
```

### views.py

```python
# ms-usuarios/apps/locations/views.py
from rest_framework import status
from rest_framework.viewsets import ViewSet
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .services import SedeService, ModuloService, AreaService
from .serializers import (SedeSerializer, SedeListSerializer,
                          ModuloSerializer, AreaSerializer)


class SedeViewSet(ViewSet):
    permission_classes = [IsAuthenticated]

    def list(self, request):
        sedes = SedeService.list_sedes(request.query_params)
        serializer = SedeListSerializer(sedes, many=True)
        return Response({'success': True, 'data': serializer.data})

    def retrieve(self, request, pk=None):
        sede = SedeService.get_sede(pk)
        serializer = SedeSerializer(sede)
        return Response({'success': True, 'data': serializer.data})

    def create(self, request):
        serializer = SedeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        sede = SedeService.create_sede(serializer.validated_data)
        return Response({'success': True, 'data': SedeSerializer(sede).data}, status=status.HTTP_201_CREATED)

    def update(self, request, pk=None):
        sede = SedeService.get_sede(pk)
        serializer = SedeSerializer(sede, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        sede = SedeService.update_sede(pk, serializer.validated_data)
        return Response({'success': True, 'data': SedeSerializer(sede).data})

    @action(detail=True, methods=['patch'], url_path='toggle-estado')
    def toggle_estado(self, request, pk=None):
        sede = SedeService.toggle_estado(pk)
        return Response({'success': True, 'estado': sede.estado})

    @action(detail=True, methods=['get'], url_path='modulos')
    def get_modulos(self, request, pk=None):
        modulos = ModuloService.list_by_sede(pk)
        serializer = ModuloSerializer(modulos, many=True)
        return Response({'success': True, 'data': serializer.data})


class ModuloViewSet(ViewSet):
    permission_classes = [IsAuthenticated]

    def create(self, request):
        serializer = ModuloSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        modulo = ModuloService.create_modulo(serializer.validated_data)
        return Response({'success': True, 'data': ModuloSerializer(modulo).data}, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['patch'], url_path='toggle-estado')
    def toggle_estado(self, request, pk=None):
        modulo = ModuloService.toggle_estado(pk)
        return Response({'success': True, 'estado': modulo.estado})

    @action(detail=True, methods=['get'], url_path='areas')
    def get_areas(self, request, pk=None):
        areas = AreaService.list_by_modulo(pk)
        serializer = AreaSerializer(areas, many=True)
        return Response({'success': True, 'data': serializer.data})


class AreaViewSet(ViewSet):
    permission_classes = [IsAuthenticated]

    def create(self, request):
        serializer = AreaSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        area = AreaService.create_area(serializer.validated_data)
        return Response({'success': True, 'data': AreaSerializer(area).data}, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['patch'], url_path='toggle-estado')
    def toggle_estado(self, request, pk=None):
        area = AreaService.toggle_estado(pk)
        return Response({'success': True, 'estado': area.estado})
```

### urls.py (locations)

```python
# ms-usuarios/apps/locations/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SedeViewSet, ModuloViewSet, AreaViewSet

router = DefaultRouter()
router.register(r'sedes',   SedeViewSet,   basename='sede')
router.register(r'modulos', ModuloViewSet, basename='modulo')
router.register(r'areas',   AreaViewSet,   basename='area')

urlpatterns = [path('', include(router.urls))]
```

---

## CÓDIGO COMPLETO: apps/users/

### models.py

```python
# ms-usuarios/apps/users/models.py
from django.contrib.auth.models import AbstractUser
from django.db import models
from apps.roles.models import Role
from apps.locations.models import Sede, Modulo, Area


class User(AbstractUser):
    """Usuario del sistema SIGAP."""
    dni           = models.CharField(max_length=8, unique=True)
    nombres       = models.CharField(max_length=100)
    apellidos     = models.CharField(max_length=100)
    escalafon     = models.CharField(max_length=20, blank=True)
    cargo         = models.CharField(max_length=100, blank=True)
    telefono      = models.CharField(max_length=20, blank=True)
    role          = models.ForeignKey(Role, on_delete=models.SET_NULL, null=True, blank=True, related_name='users')
    sedes         = models.ManyToManyField(Sede, blank=True, related_name='usuarios_sistema')
    es_usuario_sistema = models.BooleanField(default=True)
    estado        = models.BooleanField(default=True)
    fecha_baja    = models.DateField(null=True, blank=True)
    created_at    = models.DateTimeField(auto_now_add=True)
    updated_at    = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'users_user'
        verbose_name = 'Usuario'

    def get_full_name(self):
        return f'{self.nombres} {self.apellidos}'.strip() or self.username


class UsuarioInstitucional(models.Model):
    """
    Personal de la institución que NO accede al sistema
    pero puede tener bienes asignados.
    """
    ESCALAFON_CHOICES = [
        ('MAGISTRADO', 'Magistrado'),
        ('ESPECIALISTA', 'Especialista'),
        ('ASISTENTE', 'Asistente'),
        ('ADMINISTRATIVO', 'Administrativo'),
        ('SERVICIO', 'Servicio'),
    ]
    dni       = models.CharField(max_length=8, unique=True)
    nombres   = models.CharField(max_length=100)
    apellidos = models.CharField(max_length=100)
    escalafon = models.CharField(max_length=50, choices=ESCALAFON_CHOICES, blank=True)
    cargo     = models.CharField(max_length=150, blank=True)
    sede      = models.ForeignKey(Sede,   on_delete=models.SET_NULL, null=True, blank=True)
    modulo    = models.ForeignKey(Modulo, on_delete=models.SET_NULL, null=True, blank=True)
    area      = models.ForeignKey(Area,   on_delete=models.SET_NULL, null=True, blank=True)
    estado    = models.BooleanField(default=True)
    fecha_registro    = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    fecha_baja        = models.DateField(null=True, blank=True)

    class Meta:
        db_table = 'users_usuario_institucional'
        ordering = ['apellidos', 'nombres']
        verbose_name = 'Usuario Institucional'

    def get_full_name(self):
        return f'{self.nombres} {self.apellidos}'

    def __str__(self):
        return f'{self.get_full_name()} - {self.cargo}'
```

### repositories.py

```python
# ms-usuarios/apps/users/repositories.py
from .models import User, UsuarioInstitucional
from django.db.models import Q


class UserRepository:
    @staticmethod
    def get_all(filters=None):
        qs = User.objects.select_related('role').prefetch_related('sedes').filter(es_usuario_sistema=True)
        if filters:
            if 'estado' in filters:
                qs = qs.filter(estado=filters['estado'] == 'true')
            if 'role' in filters:
                qs = qs.filter(role__code=filters['role'])
            if 'sede' in filters:
                qs = qs.filter(sedes__id=filters['sede'])
            if 'search' in filters:
                s = filters['search']
                qs = qs.filter(Q(nombres__icontains=s) | Q(apellidos__icontains=s) |
                               Q(dni__icontains=s) | Q(username__icontains=s))
        return qs.distinct()

    @staticmethod
    def get_by_id(user_id):
        return User.objects.select_related('role').prefetch_related('sedes').get(pk=user_id)

    @staticmethod
    def create(data, sede_ids=None):
        password = data.pop('password')
        user = User(**data)
        user.set_password(password)
        user.save()
        if sede_ids:
            user.sedes.set(sede_ids)
        return user

    @staticmethod
    def update(user, data, sede_ids=None):
        password = data.pop('password', None)
        for k, v in data.items():
            setattr(user, k, v)
        if password:
            user.set_password(password)
        user.save()
        if sede_ids is not None:
            user.sedes.set(sede_ids)
        return user

    @staticmethod
    def toggle_estado(user):
        user.estado = not user.estado
        user.is_active = user.estado
        user.save(update_fields=['estado', 'is_active'])
        return user


class UsuarioInstitucionalRepository:
    @staticmethod
    def get_all(filters=None):
        qs = UsuarioInstitucional.objects.select_related('sede', 'modulo', 'area')
        if filters:
            if 'search' in filters:
                s = filters['search']
                qs = qs.filter(Q(nombres__icontains=s) | Q(apellidos__icontains=s) | Q(dni__icontains=s))
            if 'sede' in filters:
                qs = qs.filter(sede_id=filters['sede'])
            if 'estado' in filters:
                qs = qs.filter(estado=filters['estado'] == 'true')
        return qs

    @staticmethod
    def get_by_dni(dni):
        return UsuarioInstitucional.objects.filter(dni=dni).first()

    @staticmethod
    def create(data):
        return UsuarioInstitucional.objects.create(**data)

    @staticmethod
    def update(usuario, data):
        for k, v in data.items():
            setattr(usuario, k, v)
        usuario.save()
        return usuario
```

### services.py

```python
# ms-usuarios/apps/users/services.py
from .repositories import UserRepository, UsuarioInstitucionalRepository
from django.core.exceptions import ValidationError


class UserService:
    @staticmethod
    def list_users(filters=None):
        return UserRepository.get_all(filters)

    @staticmethod
    def get_user(user_id):
        try:
            return UserRepository.get_by_id(user_id)
        except Exception:
            raise ValidationError(f'Usuario {user_id} no encontrado.')

    @staticmethod
    def create_user(data, sede_ids=None):
        if User.objects.filter(dni=data.get('dni')).exists():
            raise ValidationError('Ya existe un usuario con ese DNI.')
        if User.objects.filter(username=data.get('username')).exists():
            raise ValidationError('El nombre de usuario ya está en uso.')
        return UserRepository.create(data, sede_ids)

    @staticmethod
    def update_user(user_id, data, sede_ids=None):
        user = UserService.get_user(user_id)
        return UserRepository.update(user, data, sede_ids)

    @staticmethod
    def toggle_estado(user_id):
        user = UserService.get_user(user_id)
        return UserRepository.toggle_estado(user)

    @staticmethod
    def change_role(user_id, role_id):
        from apps.roles.models import Role
        user = UserService.get_user(user_id)
        role = Role.objects.get(pk=role_id)
        user.role = role
        user.save(update_fields=['role'])
        return user

    @staticmethod
    def change_sedes(user_id, sede_ids):
        user = UserService.get_user(user_id)
        user.sedes.set(sede_ids)
        return user


# Import al final
from .models import User


class UsuarioInstitucionalService:
    @staticmethod
    def list_usuarios(filters=None):
        return UsuarioInstitucionalRepository.get_all(filters)

    @staticmethod
    def search_by_dni(dni):
        usuario = UsuarioInstitucionalRepository.get_by_dni(dni)
        if not usuario:
            raise ValidationError(f'No se encontró usuario institucional con DNI {dni}.')
        return usuario

    @staticmethod
    def create_usuario(data):
        return UsuarioInstitucionalRepository.create(data)

    @staticmethod
    def update_sede(usuario_id, sede_id, modulo_id=None, area_id=None):
        from .models import UsuarioInstitucional
        try:
            usuario = UsuarioInstitucional.objects.get(pk=usuario_id)
        except UsuarioInstitucional.DoesNotExist:
            raise ValidationError('Usuario institucional no encontrado.')
        usuario.sede_id   = sede_id
        usuario.modulo_id = modulo_id
        usuario.area_id   = area_id
        usuario.save()
        return usuario
```

### serializers.py

```python
# ms-usuarios/apps/users/serializers.py
from rest_framework import serializers
from .models import User, UsuarioInstitucional
from apps.roles.serializers import RoleListSerializer
from apps.locations.serializers import SedeListSerializer, ModuloSerializer, AreaSerializer


class UserSerializer(serializers.ModelSerializer):
    role_detail  = RoleListSerializer(source='role', read_only=True)
    sedes_detail = SedeListSerializer(source='sedes', many=True, read_only=True)
    sede_ids     = serializers.PrimaryKeyRelatedField(many=True, write_only=True,
                       queryset=__import__('apps.locations.models', fromlist=['Sede']).Sede.objects.all(),
                       source='sedes', required=False)
    full_name = serializers.SerializerMethodField()

    class Meta:
        model  = User
        fields = ['id', 'username', 'password', 'dni', 'nombres', 'apellidos',
                  'email', 'telefono', 'cargo', 'escalafon',
                  'role', 'role_detail', 'sedes_detail', 'sede_ids',
                  'es_usuario_sistema', 'estado', 'full_name',
                  'fecha_baja', 'created_at', 'updated_at']
        extra_kwargs = {'password': {'write_only': True, 'required': False}}

    def get_full_name(self, obj):
        return obj.get_full_name()

    def create(self, validated_data):
        sedes = validated_data.pop('sedes', [])
        password = validated_data.pop('password', None)
        user = User(**validated_data)
        if password:
            user.set_password(password)
        user.save()
        user.sedes.set(sedes)
        return user

    def update(self, instance, validated_data):
        sedes = validated_data.pop('sedes', None)
        password = validated_data.pop('password', None)
        for attr, val in validated_data.items():
            setattr(instance, attr, val)
        if password:
            instance.set_password(password)
        instance.save()
        if sedes is not None:
            instance.sedes.set(sedes)
        return instance


class UserListSerializer(serializers.ModelSerializer):
    role_name = serializers.CharField(source='role.name', read_only=True)
    full_name = serializers.SerializerMethodField()

    class Meta:
        model  = User
        fields = ['id', 'username', 'dni', 'full_name', 'nombres', 'apellidos',
                  'cargo', 'role_name', 'estado', 'created_at']

    def get_full_name(self, obj):
        return obj.get_full_name()


class UsuarioInstitucionalSerializer(serializers.ModelSerializer):
    sede_nombre   = serializers.CharField(source='sede.nombre',   read_only=True)
    modulo_nombre = serializers.CharField(source='modulo.nombre', read_only=True)
    area_nombre   = serializers.CharField(source='area.nombre',   read_only=True)
    full_name     = serializers.SerializerMethodField()

    class Meta:
        model  = UsuarioInstitucional
        fields = ['id', 'dni', 'nombres', 'apellidos', 'full_name',
                  'escalafon', 'cargo',
                  'sede', 'sede_nombre', 'modulo', 'modulo_nombre',
                  'area', 'area_nombre', 'estado',
                  'fecha_registro', 'fecha_actualizacion', 'fecha_baja']

    def get_full_name(self, obj):
        return obj.get_full_name()
```

### views.py

```python
# ms-usuarios/apps/users/views.py
from rest_framework import status
from rest_framework.viewsets import ViewSet
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .services import UserService, UsuarioInstitucionalService
from .serializers import UserSerializer, UserListSerializer, UsuarioInstitucionalSerializer


class UserViewSet(ViewSet):
    permission_classes = [IsAuthenticated]

    def list(self, request):
        users = UserService.list_users(request.query_params)
        serializer = UserListSerializer(users, many=True)
        return Response({'success': True, 'data': serializer.data,
                         'total': users.count()})

    def retrieve(self, request, pk=None):
        user = UserService.get_user(pk)
        return Response({'success': True, 'data': UserSerializer(user).data})

    def create(self, request):
        serializer = UserSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response({'success': True, 'data': UserSerializer(user).data},
                        status=status.HTTP_201_CREATED)

    def update(self, request, pk=None):
        user = UserService.get_user(pk)
        serializer = UserSerializer(user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response({'success': True, 'data': UserSerializer(user).data})

    @action(detail=True, methods=['patch'], url_path='toggle-estado')
    def toggle_estado(self, request, pk=None):
        user = UserService.toggle_estado(pk)
        return Response({'success': True, 'estado': user.estado,
                         'message': f'Usuario {"activado" if user.estado else "desactivado"}.'})

    @action(detail=True, methods=['patch'], url_path='change-role')
    def change_role(self, request, pk=None):
        role_id = request.data.get('role_id')
        if not role_id:
            return Response({'error': 'role_id requerido.'}, status=400)
        user = UserService.change_role(pk, role_id)
        return Response({'success': True, 'data': UserSerializer(user).data})

    @action(detail=True, methods=['patch'], url_path='change-sedes')
    def change_sedes(self, request, pk=None):
        sede_ids = request.data.get('sede_ids', [])
        user = UserService.change_sedes(pk, sede_ids)
        return Response({'success': True, 'data': UserSerializer(user).data})


class UsuarioInstitucionalViewSet(ViewSet):
    permission_classes = [IsAuthenticated]

    def list(self, request):
        usuarios = UsuarioInstitucionalService.list_usuarios(request.query_params)
        serializer = UsuarioInstitucionalSerializer(usuarios, many=True)
        return Response({'success': True, 'data': serializer.data})

    def create(self, request):
        serializer = UsuarioInstitucionalSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        usuario = UsuarioInstitucionalService.create_usuario(serializer.validated_data)
        return Response({'success': True, 'data': UsuarioInstitucionalSerializer(usuario).data},
                        status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'], url_path='search-dni')
    def search_by_dni(self, request):
        dni = request.query_params.get('dni', '')
        try:
            usuario = UsuarioInstitucionalService.search_by_dni(dni)
            return Response({'success': True, 'data': UsuarioInstitucionalSerializer(usuario).data})
        except Exception as e:
            return Response({'success': False, 'error': str(e)}, status=404)

    @action(detail=True, methods=['patch'], url_path='update-sede')
    def update_sede(self, request, pk=None):
        sede_id   = request.data.get('sede_id')
        modulo_id = request.data.get('modulo_id')
        area_id   = request.data.get('area_id')
        usuario = UsuarioInstitucionalService.update_sede(pk, sede_id, modulo_id, area_id)
        return Response({'success': True, 'data': UsuarioInstitucionalSerializer(usuario).data})
```

### urls.py (users)

```python
# ms-usuarios/apps/users/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet, UsuarioInstitucionalViewSet

router = DefaultRouter()
router.register(r'sistema',        UserViewSet,                basename='user')
router.register(r'institucionales', UsuarioInstitucionalViewSet, basename='usuario-institucional')

urlpatterns = [path('', include(router.urls))]
```

## Paso 8: Ejecutar ms-usuarios

```bash
cd ms-usuarios
source venv/bin/activate   # o venv\Scripts\activate en Windows
export DJANGO_SETTINGS_MODULE=config.settings.dev  # Windows: set DJANGO_SETTINGS_MODULE=...
# Paso 2: Establecer la variable de entorno correcta en Windows PowerShell
$env:DJANGO_SETTINGS_MODULE = "config.settings.dev"
# Verificar que quedó seteada
echo $env:DJANGO_SETTINGS_MODULE

python manage.py makemigrations authentication users roles locations
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver 0.0.0.0:8001
```

---

# 04 — MICROSERVICIO 2: ms-bienes (Puerto 8002)

## Paso 1: Crear proyecto

```bash
cd sigap
python -m venv ms-bienes/venv
source ms-bienes/venv/bin/activate

pip install django==6.0
pip install djangorestframework==3.16.0
pip install djangorestframework-simplejwt==5.4.0
pip install django-cors-headers==4.4.0
pip install psycopg2-binary==2.9.9
pip install python-decouple==3.8
pip install django-filter==24.3
pip install Pillow==10.4.0
pip install reportlab==4.2.0
pip install requests==2.32.3

pip freeze > ms-bienes/requirements.txt
django-admin startproject config ms-bienes/
cd ms-bienes/
python manage.py startapp apps/catalogs
python manage.py startapp apps/assets
python manage.py startapp apps/maintenance
python manage.py startapp apps/transfers
python manage.py startapp apps/decommission
```

## Paso 2: .env del ms-bienes

```bash
# ms-bienes/.env
DJANGO_SETTINGS_MODULE=config.settings.dev
SECRET_KEY=ms-bienes-secret-key-cambiar-produccion-9xk2dl
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:5173

DB_NAME=sigap_bienes
DB_USER=sigap_bienes_usr
DB_PASSWORD=SigapBienes2024!
DB_HOST=localhost
DB_PORT=5432

# URL del microservicio de usuarios para validar tokens
MS_USUARIOS_URL=http://localhost:8001/api/v1
JWT_COOKIE_NAME=sigap_access
```

## Paso 3: Autenticación remota (valida token con ms-usuarios)

```python
# ms-bienes/apps/core/authentication.py
import requests
from django.conf import settings
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed


class RemoteJWTAuthentication(BaseAuthentication):
    """Valida el JWT consultando al ms-usuarios y retorna el payload del usuario."""

    def authenticate(self, request):
        cookie_name = getattr(settings, 'JWT_COOKIE_NAME', 'sigap_access')
        token = request.COOKIES.get(cookie_name)
        if not token:
            return None
        try:
            ms_url = settings.MS_USUARIOS_URL
            resp = requests.get(
                f'{ms_url}/auth/me/',
                cookies={cookie_name: token},
                timeout=5,
            )
            if resp.status_code != 200:
                raise AuthenticationFailed('Token inválido o sesión expirada.')
            user_data = resp.json()
            return (RemoteUser(user_data), token)
        except requests.RequestException:
            raise AuthenticationFailed('No se pudo validar la sesión. Intente de nuevo.')


class RemoteUser:
    """Usuario simulado con datos del ms-usuarios."""
    def __init__(self, data):
        user = data.get('user', data)
        self.id          = user.get('user_id')
        self.username    = user.get('username')
        self.full_name   = user.get('full_name')
        self.role        = user.get('role')
        self.permissions = user.get('permissions', [])
        self.sedes       = [s['id'] for s in user.get('sedes', [])]
        self.is_authenticated = True
        self.is_active   = True

    def has_perm(self, perm):
        return perm in self.permissions

    def __str__(self):
        return self.username
```

## Paso 4: Modelos de ms-bienes

### apps/catalogs/models.py

```python
# ms-bienes/apps/catalogs/models.py
from django.db import models


class Marca(models.Model):
    nombre = models.CharField(max_length=100, unique=True)
    estado = models.BooleanField(default=True)

    class Meta:
        db_table = 'catalog_marca'
        ordering = ['nombre']


class TipoBien(models.Model):
    codigo = models.CharField(max_length=30, unique=True)
    nombre = models.CharField(max_length=100)
    estado = models.BooleanField(default=True)

    class Meta:
        db_table = 'catalog_tipo_bien'
        ordering = ['nombre']


class TipoMonitor(models.Model):
    nombre = models.CharField(max_length=50, unique=True)

    class Meta:
        db_table = 'catalog_tipo_monitor'


class TipoCpu(models.Model):
    nombre = models.CharField(max_length=50, unique=True)

    class Meta:
        db_table = 'catalog_tipo_cpu'


class TipoDiscoDuro(models.Model):
    nombre = models.CharField(max_length=50, unique=True)

    class Meta:
        db_table = 'catalog_tipo_disco_duro'


class ArquitecturaBits(models.Model):
    nombre = models.CharField(max_length=20, unique=True)

    class Meta:
        db_table = 'catalog_arquitectura_bits'


class TipoInterfazConexion(models.Model):
    nombre = models.CharField(max_length=50, unique=True)

    class Meta:
        db_table = 'catalog_tipo_interfaz_conexion'


class TamanoCarroImpresora(models.Model):
    nombre = models.CharField(max_length=50, unique=True)

    class Meta:
        db_table = 'catalog_tamano_carro_impresora'


class TipoTintaImpresion(models.Model):
    nombre = models.CharField(max_length=50, unique=True)

    class Meta:
        db_table = 'catalog_tipo_tinta_impresion'


class RegimenTenenciaBien(models.Model):
    nombre = models.CharField(max_length=100, unique=True)

    class Meta:
        db_table = 'catalog_regimen_tenencia_bien'


class MotivoTransferencia(models.Model):
    nombre = models.CharField(max_length=100, unique=True)
    estado = models.BooleanField(default=True)

    class Meta:
        db_table = 'catalog_motivo_transferencia'


class MotivoBaja(models.Model):
    nombre = models.CharField(max_length=100, unique=True)
    estado = models.BooleanField(default=True)

    class Meta:
        db_table = 'catalog_motivo_baja'
```

### apps/assets/models.py

```python
# ms-bienes/apps/assets/models.py
from django.db import models
from apps.catalogs.models import (TipoBien, Marca, RegimenTenenciaBien,
                                   TipoMonitor, TipoCpu, TipoDiscoDuro,
                                   ArquitecturaBits, TipoInterfazConexion,
                                   TamanoCarroImpresora)


class Bien(models.Model):
    """Activo informático base de la institución."""
    ESTADO_BIEN = [('ACTIVO', 'Activo'), ('INACTIVO', 'Inactivo')]
    ESTADO_FUNC = [('OPERATIVO','Operativo'),('AVERIADO','Averiado'),('INOPERATIVO','Inoperativo')]

    tipo_bien          = models.ForeignKey(TipoBien, on_delete=models.PROTECT)
    marca              = models.ForeignKey(Marca, on_delete=models.PROTECT)
    modelo             = models.CharField(max_length=200)
    numero_serie       = models.CharField(max_length=100, unique=True)
    codigo_patrimonial = models.CharField(max_length=50, unique=True)

    estado_bien          = models.CharField(max_length=20, choices=ESTADO_BIEN, default='ACTIVO')
    estado_funcionamiento = models.CharField(max_length=20, choices=ESTADO_FUNC, default='OPERATIVO')
    regimen_tenencia     = models.ForeignKey(RegimenTenenciaBien, on_delete=models.SET_NULL, null=True, blank=True)

    fecha_compra             = models.DateField(null=True, blank=True)
    numero_orden_compra      = models.CharField(max_length=50, blank=True)
    fecha_vencimiento_garantia = models.DateField(null=True, blank=True)
    fecha_instalacion        = models.DateField(null=True, blank=True)
    fecha_ultimo_inventario  = models.DateField(null=True, blank=True)

    # Usuario institucional asignado (ID del ms-usuarios)
    usuario_asignado_id   = models.IntegerField(null=True, blank=True)
    usuario_asignado_dni  = models.CharField(max_length=8, blank=True)
    usuario_asignado_nombre = models.CharField(max_length=200, blank=True)

    # Ubicación (IDs del ms-usuarios)
    sede_id    = models.IntegerField(null=True, blank=True)
    sede_nombre = models.CharField(max_length=200, blank=True)
    modulo_id  = models.IntegerField(null=True, blank=True)
    area_id    = models.IntegerField(null=True, blank=True)

    # Usuario de sistema que registra (ID del ms-usuarios)
    usuario_registra_id     = models.IntegerField()
    usuario_registra_nombre = models.CharField(max_length=200)

    observacion   = models.TextField(blank=True)
    fecha_registro = models.DateTimeField(auto_now_add=True)
    fecha_baja     = models.DateField(null=True, blank=True)
    motivo_baja    = models.TextField(blank=True)

    class Meta:
        db_table = 'assets_bien'
        ordering = ['-fecha_registro']
        verbose_name = 'Bien'

    def __str__(self):
        return f'{self.tipo_bien} - {self.codigo_patrimonial}'


class BienCPU(models.Model):
    """Datos técnicos específicos para CPU/Computadoras."""
    bien = models.OneToOneField(Bien, on_delete=models.CASCADE, related_name='cpu_detail')
    hostname         = models.CharField(max_length=100, blank=True)
    dominio_equipo   = models.CharField(max_length=100, blank=True)
    direccion_ip     = models.GenericIPAddressField(null=True, blank=True)
    direccion_mac    = models.CharField(max_length=17, blank=True)
    tipo_computadora = models.ForeignKey(TipoCpu, on_delete=models.SET_NULL, null=True, blank=True)
    funcion_cpu      = models.CharField(max_length=100, blank=True)

    procesador_tipo      = models.CharField(max_length=100, blank=True)
    procesador_cantidad  = models.IntegerField(null=True, blank=True)
    procesador_nucleos   = models.IntegerField(null=True, blank=True)
    procesador_velocidad = models.CharField(max_length=20, blank=True)

    sistema_operativo  = models.CharField(max_length=100, blank=True)
    arquitectura_bits  = models.ForeignKey(ArquitecturaBits, on_delete=models.SET_NULL, null=True, blank=True)
    licencia_so        = models.CharField(max_length=100, blank=True)
    version_office     = models.CharField(max_length=50, blank=True)
    licencia_office    = models.CharField(max_length=100, blank=True)

    capacidad_ram_gb      = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    cantidad_modulos_ram  = models.IntegerField(null=True, blank=True)
    tipo_disco            = models.ForeignKey(TipoDiscoDuro, on_delete=models.SET_NULL, null=True, blank=True)
    capacidad_disco_gb    = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    cantidad_discos       = models.IntegerField(null=True, blank=True)
    tipo_tarjeta_video    = models.CharField(max_length=100, blank=True)

    class Meta:
        db_table = 'assets_bien_cpu'


class BienMonitor(models.Model):
    """Datos técnicos específicos para Monitor."""
    bien          = models.OneToOneField(Bien, on_delete=models.CASCADE, related_name='monitor_detail')
    tipo_monitor  = models.ForeignKey(TipoMonitor, on_delete=models.SET_NULL, null=True, blank=True)
    tamano_pulgadas = models.DecimalField(max_digits=5, decimal_places=1, null=True, blank=True)

    class Meta:
        db_table = 'assets_bien_monitor'


class BienImpresora(models.Model):
    """Datos técnicos específicos para Impresora."""
    bien              = models.OneToOneField(Bien, on_delete=models.CASCADE, related_name='impresora_detail')
    tipo_impresion    = models.CharField(max_length=50, blank=True)
    impresion_color   = models.BooleanField(default=False)
    memoria_ram_mb    = models.IntegerField(null=True, blank=True)
    resolucion_maxima_ppp = models.CharField(max_length=30, blank=True)
    interfaz_conexion = models.ForeignKey(TipoInterfazConexion, on_delete=models.SET_NULL, null=True, blank=True)
    tamano_carro      = models.ForeignKey(TamanoCarroImpresora, on_delete=models.SET_NULL, null=True, blank=True)
    tamano_hojas_soportadas = models.CharField(max_length=50, blank=True)
    unidad_duplex         = models.BooleanField(default=False)
    velocidad_impresion_ppm = models.IntegerField(null=True, blank=True)
    conexion_red          = models.BooleanField(default=False)
    alimentacion_ac       = models.CharField(max_length=50, blank=True)

    class Meta:
        db_table = 'assets_bien_impresora'
```

### apps/maintenance/models.py

```python
# ms-bienes/apps/maintenance/models.py
from django.db import models
from apps.assets.models import Bien


class OrdenMantenimiento(models.Model):
    ESTADOS = [
        ('REGISTRADO',          'Registrado'),
        ('EN_PROCESO',          'En Proceso'),
        ('PENDIENTE_APROBACION','Pendiente Aprobación'),
        ('DEVUELTO',            'Devuelto'),
        ('ATENDIDO',            'Atendido'),
        ('CANCELADO',           'Cancelado'),
    ]
    numero_orden = models.CharField(max_length=20, unique=True)
    estado       = models.CharField(max_length=30, choices=ESTADOS, default='REGISTRADO')

    # IDs del ms-usuarios
    asistsistema_id     = models.IntegerField()
    asistsistema_nombre = models.CharField(max_length=200)
    sede_id             = models.IntegerField()
    sede_nombre         = models.CharField(max_length=200)

    # Aprobador
    adminsede_id        = models.IntegerField(null=True, blank=True)
    adminsede_nombre    = models.CharField(max_length=200, blank=True)
    motivo_devolucion   = models.TextField(blank=True)

    fecha_registro  = models.DateTimeField(auto_now_add=True)
    fecha_inicio    = models.DateTimeField(null=True, blank=True)
    fecha_termino   = models.DateTimeField(null=True, blank=True)
    fecha_cancelacion = models.DateTimeField(null=True, blank=True)
    motivo_cancelacion = models.TextField(blank=True)

    observaciones = models.TextField(blank=True)

    class Meta:
        db_table = 'maintenance_orden'
        ordering = ['-fecha_registro']


class DetalleMantenimiento(models.Model):
    """Un bien dentro de una orden de mantenimiento."""
    orden          = models.ForeignKey(OrdenMantenimiento, on_delete=models.CASCADE, related_name='detalles')
    bien           = models.ForeignKey(Bien, on_delete=models.PROTECT)
    usuario_bien_id     = models.IntegerField()
    usuario_bien_nombre = models.CharField(max_length=200)

    datos_iniciales    = models.TextField(blank=True)
    trabajos_realizados = models.TextField(blank=True)
    diagnostico_final  = models.TextField(blank=True)
    estado_funcionamiento_antes  = models.CharField(max_length=20, blank=True)
    estado_funcionamiento_despues = models.CharField(max_length=20, blank=True)

    class Meta:
        db_table = 'maintenance_detalle'


class ImagenMantenimiento(models.Model):
    detalle     = models.ForeignKey(DetalleMantenimiento, on_delete=models.CASCADE, related_name='imagenes')
    imagen      = models.ImageField(upload_to='mantenimiento/')
    descripcion = models.CharField(max_length=200, blank=True)
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'maintenance_imagen'
```

### apps/transfers/models.py

```python
# ms-bienes/apps/transfers/models.py
from django.db import models
from apps.assets.models import Bien
from apps.catalogs.models import MotivoTransferencia


class Traslado(models.Model):
    ESTADOS = [
        ('REGISTRADO',          'Registrado'),
        ('PENDIENTE_APROBACION','Pendiente Aprobación'),
        ('DEVUELTO',            'Devuelto'),
        ('ATENDIDO',            'Atendido'),
        ('CANCELADO',           'Cancelado'),
    ]
    numero_transaccion = models.CharField(max_length=20, unique=True)
    estado             = models.CharField(max_length=30, choices=ESTADOS, default='REGISTRADO')

    # Quien asigna (ASISTSISTEMA del ms-usuarios)
    asistsistema_id     = models.IntegerField()
    asistsistema_nombre = models.CharField(max_length=200)
    sede_origen_id      = models.IntegerField()
    sede_origen_nombre  = models.CharField(max_length=200)
    modulo_origen_id    = models.IntegerField(null=True, blank=True)
    area_origen_id      = models.IntegerField(null=True, blank=True)

    # A quien se asigna (usuario institucional)
    usuario_destino_id     = models.IntegerField()
    usuario_destino_nombre = models.CharField(max_length=200)
    usuario_destino_cargo  = models.CharField(max_length=150, blank=True)
    sede_destino_id        = models.IntegerField()
    sede_destino_nombre    = models.CharField(max_length=200)
    modulo_destino_id      = models.IntegerField(null=True, blank=True)
    area_destino_id        = models.IntegerField(null=True, blank=True)

    motivo           = models.ForeignKey(MotivoTransferencia, on_delete=models.SET_NULL, null=True)
    observaciones    = models.TextField(blank=True)

    # Aprobador
    adminsede_id      = models.IntegerField(null=True, blank=True)
    adminsede_nombre  = models.CharField(max_length=200, blank=True)
    motivo_devolucion = models.TextField(blank=True)

    # Seguridad de sede
    segursede_id      = models.IntegerField(null=True, blank=True)
    segursede_nombre  = models.CharField(max_length=200, blank=True)
    aprobado_seguridad = models.BooleanField(default=False)

    fecha_registro    = models.DateTimeField(auto_now_add=True)
    fecha_aprobacion  = models.DateTimeField(null=True, blank=True)
    fecha_cancelacion = models.DateTimeField(null=True, blank=True)
    motivo_cancelacion = models.TextField(blank=True)

    class Meta:
        db_table = 'transfers_traslado'
        ordering = ['-fecha_registro']


class DetalleTrasladoBien(models.Model):
    traslado = models.ForeignKey(Traslado, on_delete=models.CASCADE, related_name='bienes')
    bien     = models.ForeignKey(Bien, on_delete=models.PROTECT)
    usuario_origen_id     = models.IntegerField()
    usuario_origen_nombre = models.CharField(max_length=200)

    class Meta:
        db_table = 'transfers_detalle_bien'
```

### apps/decommission/models.py

```python
# ms-bienes/apps/decommission/models.py
from django.db import models
from apps.assets.models import Bien
from apps.catalogs.models import MotivoBaja


class SolicitudBaja(models.Model):
    ESTADOS = [
        ('REGISTRADO',          'Registrado'),
        ('PENDIENTE_APROBACION','Pendiente Aprobación'),
        ('DEVUELTO',            'Devuelto'),
        ('ATENDIDO',            'Atendido'),
        ('CANCELADO',           'Cancelado'),
    ]
    numero_informe = models.CharField(max_length=20, unique=True)
    estado         = models.CharField(max_length=30, choices=ESTADOS, default='REGISTRADO')

    # ASISTSISTEMA (de ms-usuarios)
    asistsistema_id     = models.IntegerField()
    asistsistema_nombre = models.CharField(max_length=200)
    asistsistema_cargo  = models.CharField(max_length=150, blank=True)
    sede_id             = models.IntegerField()
    sede_nombre         = models.CharField(max_length=200)

    # COORDSISTEMA aprueba la baja (de ms-usuarios)
    coordsistema_id     = models.IntegerField(null=True, blank=True)
    coordsistema_nombre = models.CharField(max_length=200, blank=True)
    coordsistema_cargo  = models.CharField(max_length=150, blank=True)
    motivo_devolucion   = models.TextField(blank=True)

    # Contenido del informe
    antecedentes    = models.TextField(blank=True)
    analisis        = models.TextField(blank=True)
    conclusiones    = models.TextField(blank=True)
    recomendaciones = models.TextField(blank=True)

    fecha_registro    = models.DateTimeField(auto_now_add=True)
    fecha_aprobacion  = models.DateTimeField(null=True, blank=True)
    fecha_cancelacion = models.DateTimeField(null=True, blank=True)
    motivo_cancelacion = models.TextField(blank=True)

    class Meta:
        db_table = 'decommission_solicitud'
        ordering = ['-fecha_registro']


class DetalleBaja(models.Model):
    solicitud    = models.ForeignKey(SolicitudBaja, on_delete=models.CASCADE, related_name='bienes')
    bien         = models.ForeignKey(Bien, on_delete=models.PROTECT)
    motivo_baja  = models.ForeignKey(MotivoBaja, on_delete=models.SET_NULL, null=True)
    estado_funcionamiento = models.CharField(max_length=20, blank=True)
    observacion  = models.TextField(blank=True)

    # Datos del mantenimiento de referencia
    datos_mantenimiento_id = models.IntegerField(null=True, blank=True)

    class Meta:
        db_table = 'decommission_detalle_baja'
```

## Paso 5: Ejecutar ms-bienes

```bash
cd ms-bienes
source venv/bin/activate
export DJANGO_SETTINGS_MODULE=config.settings.dev
python manage.py makemigrations catalogs assets maintenance transfers decommission
python manage.py migrate
python manage.py runserver 0.0.0.0:8002
```

---

# 05 — MICROSERVICIO 3: ms-reportes (Puerto 8003)

```bash
cd sigap
python -m venv ms-reportes/venv
source ms-reportes/venv/bin/activate

pip install django==6.0
pip install djangorestframework==3.16.0
pip install djangorestframework-simplejwt==5.4.0
pip install django-cors-headers==4.4.0
pip install psycopg2-binary==2.9.9
pip install python-decouple==3.8
pip install django-filter==24.3
pip install reportlab==4.2.0
pip install openpyxl==3.1.5
pip install requests==2.32.3

pip freeze > ms-reportes/requirements.txt
django-admin startproject config ms-reportes/
cd ms-reportes/
python manage.py startapp apps/reports
python manage.py startapp apps/audit
```

El ms-reportes consulta datos de ms-bienes y ms-usuarios vía REST y genera PDFs/Excel con reportlab y openpyxl. Su DB `sigap_reportes` almacena logs de auditoría y caché de reportes generados.

```bash
cd ms-reportes
export DJANGO_SETTINGS_MODULE=config.settings.dev
python manage.py migrate
python manage.py runserver 0.0.0.0:8003
```
# 06 — FRONTEND: React 19 + Vite + TailwindCSS

## PASO 1: Crear proyecto React 19

```bash
cd sigap

# React 19 con Vite
npm create vite@latest frontend -- --template react
cd frontend

# Instalar dependencias
npm install

# TailwindCSS v3
npm install -D tailwindcss@3 postcss autoprefixer
npx tailwindcss init -p

# Routing
npm install react-router-dom@7

# HTTP
npm install axios

# Formularios
npm install react-hook-form @hookform/resolvers zod

# Tablas
npm install @tanstack/react-table

# Estado servidor
npm install @tanstack/react-query

# UI
npm install @headlessui/react lucide-react

# Notificaciones
npm install react-hot-toast

# Fechas
npm install date-fns

# Exportar
npm install xlsx jspdf jspdf-autotable

# Animaciones
npm install framer-motion
```

## PASO 2: tailwind.config.js

```javascript
// frontend/tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eef2ff', 100: '#e0e7ff', 200: '#c7d2fe',
          300: '#a5b4fc', 400: '#818cf8', 500: '#6366f1',
          600: '#4f46e5', 700: '#4338ca', 800: '#3730a3', 900: '#312e81',
        },
        sidebar: { bg: '#1e1b4b', hover: '#312e81', active: '#4338ca', text: '#c7d2fe' },
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [],
}
```

## PASO 3: src/index.css

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

@layer components {
  .btn-primary   { @apply bg-primary-600 hover:bg-primary-700 text-white font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed; }
  .btn-secondary { @apply bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm; }
  .btn-danger    { @apply bg-red-600 hover:bg-red-700 text-white font-medium px-4 py-2 rounded-lg transition-colors text-sm; }
  .btn-success   { @apply bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded-lg transition-colors text-sm; }
  .btn-ghost     { @apply text-gray-600 hover:text-gray-900 hover:bg-gray-100 p-2 rounded-lg transition-colors; }

  .card          { @apply bg-white rounded-xl border border-gray-200 shadow-sm p-6; }
  .card-header   { @apply flex items-center justify-between mb-6 pb-4 border-b border-gray-100; }

  .input-field   { @apply w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent placeholder-gray-400 transition-all; }
  .input-error   { @apply border-red-400 focus:ring-red-400; }
  .form-label    { @apply block text-sm font-medium text-gray-700 mb-1; }
  .form-error    { @apply text-red-500 text-xs mt-1; }

  .badge         { @apply inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold; }
  .badge-green   { @apply badge bg-green-100 text-green-800; }
  .badge-red     { @apply badge bg-red-100 text-red-800; }
  .badge-yellow  { @apply badge bg-yellow-100 text-yellow-800; }
  .badge-blue    { @apply badge bg-blue-100 text-blue-800; }
  .badge-orange  { @apply badge bg-orange-100 text-orange-800; }
  .badge-gray    { @apply badge bg-gray-100 text-gray-700; }
  .badge-purple  { @apply badge bg-purple-100 text-purple-800; }

  .page-title    { @apply text-2xl font-bold text-gray-800; }
  .page-subtitle { @apply text-sm text-gray-500 mt-1; }

  .table-container { @apply overflow-x-auto rounded-xl border border-gray-200; }
  .table-base    { @apply min-w-full divide-y divide-gray-200; }
  .table-head    { @apply bg-gray-50; }
  .table-th      { @apply px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer select-none hover:bg-gray-100 transition-colors whitespace-nowrap; }
  .table-td      { @apply px-4 py-3 text-sm text-gray-700 whitespace-nowrap; }
  .table-row     { @apply hover:bg-gray-50 transition-colors; }
}

::-webkit-scrollbar { width: 5px; height: 5px; }
::-webkit-scrollbar-track { @apply bg-gray-100; }
::-webkit-scrollbar-thumb { @apply bg-gray-300 rounded-full; }
::-webkit-scrollbar-thumb:hover { @apply bg-gray-400; }
```

## PASO 4: .env del frontend

```bash
# frontend/.env
VITE_MS_USUARIOS_URL=http://localhost:8001/api/v1
VITE_MS_BIENES_URL=http://localhost:8002/api/v1
VITE_MS_REPORTES_URL=http://localhost:8003/api/v1
VITE_APP_NAME=SIGAP
VITE_CORTE=Corte Superior de Justicia de Lima Norte
```

---

# 07 — ESTRUCTURA COMPLETA src/

```
src/
├── main.jsx
├── App.jsx
├── index.css
│
├── api/
│   ├── clients.js          ← Instancias Axios (una por microservicio)
│   ├── authApi.js
│   ├── usersApi.js
│   ├── rolesApi.js
│   ├── locationsApi.js
│   ├── assetsApi.js
│   ├── maintenanceApi.js
│   ├── transfersApi.js
│   ├── decommissionApi.js
│   └── reportsApi.js
│
├── constants/
│   ├── roles.js
│   ├── states.js
│   ├── routes.js
│   └── menus.js
│
├── contexts/
│   ├── AuthContext.jsx
│   └── NotificationContext.jsx
│
├── hooks/
│   ├── useAuth.js
│   ├── usePermissions.js
│   ├── useModal.js
│   ├── useDebounce.js
│   └── useExport.js
│
├── services/              ← Wrappers de las APIs (lógica adicional)
│   ├── authService.js
│   ├── userService.js
│   └── assetService.js
│
├── components/
│   ├── common/
│   │   ├── AppTable.jsx
│   │   ├── AppModal.jsx
│   │   ├── AppBadge.jsx
│   │   ├── AppButton.jsx
│   │   ├── AppFormField.jsx
│   │   ├── AppSelect.jsx
│   │   ├── AppPagination.jsx
│   │   ├── AppSearchBar.jsx
│   │   ├── AppConfirm.jsx
│   │   ├── AppLoader.jsx
│   │   └── AppEmptyState.jsx
│   └── layout/
│       ├── MainLayout.jsx
│       ├── Sidebar.jsx
│       ├── Header.jsx
│       └── AuthLayout.jsx
│
├── pages/
│   ├── auth/
│   │   └── LoginPage.jsx
│   ├── dashboard/
│   │   └── DashboardPage.jsx
│   ├── admin/
│   │   ├── users/
│   │   │   ├── UsersPage.jsx
│   │   │   ├── UserModal.jsx
│   │   │   └── UserDetailModal.jsx
│   │   ├── roles/
│   │   │   ├── RolesPage.jsx
│   │   │   ├── RoleModal.jsx
│   │   │   └── PermissionsModal.jsx
│   │   └── locations/
│   │       ├── LocationsPage.jsx
│   │       ├── SedeModal.jsx
│   │       ├── ModuloModal.jsx
│   │       └── AreaModal.jsx
│   ├── assets/
│   │   ├── AssetsPage.jsx
│   │   ├── AssetModal.jsx
│   │   └── AssetDetailPage.jsx
│   ├── maintenance/
│   │   ├── MaintenancePage.jsx
│   │   ├── MaintenanceModal.jsx
│   │   └── MaintenanceApprovalModal.jsx
│   ├── transfers/
│   │   ├── TransfersPage.jsx
│   │   ├── TransferModal.jsx
│   │   └── TransferApprovalModal.jsx
│   ├── decommission/
│   │   ├── DecommissionPage.jsx
│   │   ├── DecommissionModal.jsx
│   │   └── DecommissionApprovalModal.jsx
│   └── reports/
│       └── ReportsPage.jsx
│
└── router/
    ├── AppRouter.jsx
    ├── PrivateRoute.jsx
    └── RoleRoute.jsx
```

---

# 08 — CÓDIGO COMPLETO DE ARCHIVOS

## src/api/clients.js

```javascript
import axios from 'axios';

const createClient = (baseURL) => {
  const client = axios.create({
    baseURL,
    withCredentials: true,  // CRÍTICO: envía cookies HttpOnly automáticamente
    headers: { 'Content-Type': 'application/json' },
    timeout: 15000,
  });

  // Interceptor de respuesta: redirige a login si el token expiró
  client.interceptors.response.use(
    (res) => res,
    async (error) => {
      if (error.response?.status === 401) {
        // Intentar refresh
        try {
          await axios.post(
            `${import.meta.env.VITE_MS_USUARIOS_URL}/auth/refresh/`,
            {},
            { withCredentials: true }
          );
          return client(error.config); // reintentar
        } catch {
          window.location.href = '/login';
        }
      }
      return Promise.reject(error);
    }
  );

  return client;
};

export const usuariosClient  = createClient(import.meta.env.VITE_MS_USUARIOS_URL);
export const bienesClient    = createClient(import.meta.env.VITE_MS_BIENES_URL);
export const reportesClient  = createClient(import.meta.env.VITE_MS_REPORTES_URL);
```

## src/api/authApi.js

```javascript
import { usuariosClient } from './clients';

export const authApi = {
  login:   (credentials) => usuariosClient.post('/auth/login/', credentials),
  logout:  ()            => usuariosClient.post('/auth/logout/'),
  refresh: ()            => usuariosClient.post('/auth/refresh/'),
  me:      ()            => usuariosClient.get('/auth/me/'),
};
```

## src/api/usersApi.js

```javascript
import { usuariosClient } from './clients';

export const usersApi = {
  // Usuarios del sistema
  getAll:       (params) => usuariosClient.get('/users/sistema/', { params }),
  getById:      (id)     => usuariosClient.get(`/users/sistema/${id}/`),
  create:       (data)   => usuariosClient.post('/users/sistema/', data),
  update:       (id, d)  => usuariosClient.put(`/users/sistema/${id}/`, d),
  toggleEstado: (id)     => usuariosClient.patch(`/users/sistema/${id}/toggle-estado/`),
  changeRole:   (id, d)  => usuariosClient.patch(`/users/sistema/${id}/change-role/`, d),
  changeSedes:  (id, d)  => usuariosClient.patch(`/users/sistema/${id}/change-sedes/`, d),

  // Usuarios institucionales
  getInstitucionales: (params) => usuariosClient.get('/users/institucionales/', { params }),
  searchByDni:  (dni) => usuariosClient.get('/users/institucionales/search-dni/', { params: { dni } }),
  createInstitucional: (d) => usuariosClient.post('/users/institucionales/', d),
  updateSede:   (id, d)    => usuariosClient.patch(`/users/institucionales/${id}/update-sede/`, d),
};
```

## src/api/rolesApi.js

```javascript
import { usuariosClient } from './clients';

export const rolesApi = {
  getRoles:         (params) => usuariosClient.get('/roles/roles/', { params }),
  getRoleById:      (id)     => usuariosClient.get(`/roles/roles/${id}/`),
  createRole:       (data)   => usuariosClient.post('/roles/roles/', data),
  updateRole:       (id, d)  => usuariosClient.put(`/roles/roles/${id}/`, d),
  toggleEstado:     (id)     => usuariosClient.patch(`/roles/roles/${id}/toggle-estado/`),
  assignPermissions:(id, d)  => usuariosClient.post(`/roles/roles/${id}/assign-permissions/`, d),
  removePermission: (id, pid)=> usuariosClient.delete(`/roles/roles/${id}/remove-permission/${pid}/`),

  getPermissions:   (params) => usuariosClient.get('/roles/permissions/', { params }),
  createPermission: (data)   => usuariosClient.post('/roles/permissions/', data),
};
```

## src/api/locationsApi.js

```javascript
import { usuariosClient } from './clients';

export const locationsApi = {
  getSedes:     (params) => usuariosClient.get('/locations/sedes/', { params }),
  getSedeById:  (id)     => usuariosClient.get(`/locations/sedes/${id}/`),
  createSede:   (data)   => usuariosClient.post('/locations/sedes/', data),
  updateSede:   (id, d)  => usuariosClient.put(`/locations/sedes/${id}/`, d),
  toggleSede:   (id)     => usuariosClient.patch(`/locations/sedes/${id}/toggle-estado/`),
  getModulosBySede: (id) => usuariosClient.get(`/locations/sedes/${id}/modulos/`),

  createModulo: (data) => usuariosClient.post('/locations/modulos/', data),
  toggleModulo: (id)   => usuariosClient.patch(`/locations/modulos/${id}/toggle-estado/`),
  getAreasByModulo: (id)=> usuariosClient.get(`/locations/modulos/${id}/areas/`),

  createArea:   (data) => usuariosClient.post('/locations/areas/', data),
  toggleArea:   (id)   => usuariosClient.patch(`/locations/areas/${id}/toggle-estado/`),
};
```

## src/api/assetsApi.js

```javascript
import { bienesClient } from './clients';

export const assetsApi = {
  getAll:       (params) => bienesClient.get('/assets/bienes/', { params }),
  getById:      (id)     => bienesClient.get(`/assets/bienes/${id}/`),
  create:       (data)   => bienesClient.post('/assets/bienes/', data),
  update:       (id, d)  => bienesClient.put(`/assets/bienes/${id}/`, d),
  toggleEstado: (id)     => bienesClient.patch(`/assets/bienes/${id}/toggle-estado/`),

  // Catálogos
  getMarcas:   () => bienesClient.get('/assets/catalogs/marcas/'),
  getTipos:    () => bienesClient.get('/assets/catalogs/tipos/'),
  getRegimenes:() => bienesClient.get('/assets/catalogs/regimenes/'),
};
```

## src/api/maintenanceApi.js

```javascript
import { bienesClient } from './clients';

export const maintenanceApi = {
  getAll:    (params) => bienesClient.get('/maintenance/ordenes/', { params }),
  getById:   (id)     => bienesClient.get(`/maintenance/ordenes/${id}/`),
  create:    (data)   => bienesClient.post('/maintenance/ordenes/', data),
  update:    (id, d)  => bienesClient.put(`/maintenance/ordenes/${id}/`, d),
  approve:   (id, d)  => bienesClient.patch(`/maintenance/ordenes/${id}/approve/`, d),
  disapprove:(id, d)  => bienesClient.patch(`/maintenance/ordenes/${id}/disapprove/`, d),
  cancel:    (id, d)  => bienesClient.patch(`/maintenance/ordenes/${id}/cancel/`, d),
  generatePdf:(id)    => bienesClient.get(`/maintenance/ordenes/${id}/pdf/`, { responseType: 'blob' }),
};
```

## src/api/transfersApi.js

```javascript
import { bienesClient } from './clients';

export const transfersApi = {
  getAll:     (params) => bienesClient.get('/transfers/traslados/', { params }),
  getById:    (id)     => bienesClient.get(`/transfers/traslados/${id}/`),
  create:     (data)   => bienesClient.post('/transfers/traslados/', data),
  update:     (id, d)  => bienesClient.put(`/transfers/traslados/${id}/`, d),
  approve:    (id, d)  => bienesClient.patch(`/transfers/traslados/${id}/approve/`, d),
  disapprove: (id, d)  => bienesClient.patch(`/transfers/traslados/${id}/disapprove/`, d),
  cancel:     (id, d)  => bienesClient.patch(`/transfers/traslados/${id}/cancel/`, d),
  approveSeguridad:(id,d)=>bienesClient.patch(`/transfers/traslados/${id}/approve-seguridad/`, d),
  generatePdf:(id)     => bienesClient.get(`/transfers/traslados/${id}/pdf/`, { responseType: 'blob' }),
};
```

## src/contexts/AuthContext.jsx

```jsx
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api/authApi';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  // Al montar, verificar si hay sesión activa (cookie válida)
  useEffect(() => {
    authApi.me()
      .then(res => setUser(res.data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (credentials) => {
    const res = await authApi.login(credentials);
    setUser(res.data.user);
    return res.data;
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout();
    setUser(null);
  }, []);

  const hasPermission = useCallback((perm) => {
    if (!user) return false;
    if (user.role === 'SYSADMIN') return true;
    return user.permissions?.includes(perm);
  }, [user]);

  const hasRole = useCallback((roles) => {
    if (!user) return false;
    const arr = Array.isArray(roles) ? roles : [roles];
    return arr.includes(user.role);
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, hasPermission, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
};
```

## src/constants/roles.js

```javascript
export const ROLES = {
  SYSADMIN:     'SYSADMIN',
  COORDSISTEMA: 'COORDSISTEMA',
  ASISTSISTEMA: 'ASISTSISTEMA',
  ADMINSEDE:    'ADMINSEDE',
  SEGURSEDE:    'SEGURSEDE',
  USUARIOCORTE: 'USUARIOCORTE',
};

export const ROLE_LABELS = {
  SYSADMIN:     'Administrador del Sistema',
  COORDSISTEMA: 'Coordinador de Sistemas',
  ASISTSISTEMA: 'Asistente de Sistemas',
  ADMINSEDE:    'Administrador de Sede',
  SEGURSEDE:    'Seguridad de Sede',
  USUARIOCORTE: 'Usuario de Corte',
};

export const ROLE_COLORS = {
  SYSADMIN:     'purple',
  COORDSISTEMA: 'blue',
  ASISTSISTEMA: 'green',
  ADMINSEDE:    'orange',
  SEGURSEDE:    'red',
  USUARIOCORTE: 'gray',
};
```

## src/constants/states.js

```javascript
export const ESTADO_PROCESO = {
  REGISTRADO:           { label: 'Registrado',           css: 'badge-blue'   },
  EN_PROCESO:           { label: 'En Proceso',           css: 'badge-yellow' },
  PENDIENTE_APROBACION: { label: 'Pend. Aprobación',     css: 'badge-orange' },
  DEVUELTO:             { label: 'Devuelto',             css: 'badge-red'    },
  ATENDIDO:             { label: 'Atendido',             css: 'badge-green'  },
  CANCELADO:            { label: 'Cancelado',            css: 'badge-gray'   },
};

export const ESTADO_BIEN = {
  ACTIVO:   { label: 'Activo',   css: 'badge-green' },
  INACTIVO: { label: 'Inactivo', css: 'badge-red'   },
};

export const ESTADO_FUNC = {
  OPERATIVO:   { label: 'Operativo',   css: 'badge-green'  },
  AVERIADO:    { label: 'Averiado',    css: 'badge-yellow' },
  INOPERATIVO: { label: 'Inoperativo', css: 'badge-red'    },
};
```

## src/constants/menus.js

```javascript
import {
  HomeIcon, UsersIcon, ShieldCheckIcon, BuildingOffice2Icon,
  ComputerDesktopIcon, WrenchScrewdriverIcon, ArrowsRightLeftIcon,
  TrashIcon, ChartBarIcon, TagIcon,
} from '@heroicons/react/24/outline';

export const MENU_CONFIG = [
  {
    section: 'Principal',
    items: [
      { label: 'Dashboard', path: '/dashboard', icon: HomeIcon, roles: [] },
    ],
  },
  {
    section: 'Gestión Administrativa',
    items: [
      { label: 'Usuarios',        path: '/admin/usuarios', icon: UsersIcon,          roles: ['SYSADMIN'] },
      { label: 'Roles y Permisos',path: '/admin/roles',    icon: ShieldCheckIcon,    roles: ['SYSADMIN'] },
      { label: 'Sedes / Módulos', path: '/admin/sedes',    icon: BuildingOffice2Icon,roles: ['SYSADMIN', 'COORDSISTEMA'] },
    ],
  },
  {
    section: 'Gestión de Bienes',
    items: [
      { label: 'Activos',       path: '/bienes',        icon: ComputerDesktopIcon,    roles: ['SYSADMIN','COORDSISTEMA','ASISTSISTEMA','ADMINSEDE'] },
      { label: 'Catálogos',     path: '/bienes/catalogos', icon: TagIcon,             roles: ['SYSADMIN','COORDSISTEMA','ASISTSISTEMA'] },
      { label: 'Mantenimiento', path: '/mantenimiento', icon: WrenchScrewdriverIcon,  roles: ['SYSADMIN','COORDSISTEMA','ASISTSISTEMA','ADMINSEDE'] },
      { label: 'Traslados',     path: '/traslados',     icon: ArrowsRightLeftIcon,    roles: ['SYSADMIN','COORDSISTEMA','ASISTSISTEMA','ADMINSEDE','SEGURSEDE'] },
      { label: 'Bajas / Salidas',path: '/bajas',        icon: TrashIcon,              roles: ['SYSADMIN','COORDSISTEMA','ASISTSISTEMA','ADMINSEDE'] },
    ],
  },
  {
    section: 'Reportes',
    items: [
      { label: 'Reportes', path: '/reportes', icon: ChartBarIcon, roles: ['SYSADMIN','COORDSISTEMA','ASISTSISTEMA','ADMINSEDE'] },
    ],
  },
];
```

---

## src/components/common/AppTable.jsx

```jsx
import { useState, useMemo } from 'react';
import {
  useReactTable, getCoreRowModel, getPaginationRowModel,
  getSortedRowModel, getFilteredRowModel, flexRender,
} from '@tanstack/react-table';
import { MagnifyingGlassIcon, ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline';
import AppLoader from './AppLoader';
import AppEmptyState from './AppEmptyState';
import AppPagination from './AppPagination';

const AppTable = ({
  columns, data = [], loading = false,
  title, subtitle, onAdd, addLabel = 'Nuevo',
  actions, extraButtons,
}) => {
  const [sorting,      setSorting]      = useState([]);
  const [globalFilter, setGlobalFilter] = useState('');

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  return (
    <div className="card">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between mb-5">
        <div>
          {title    && <h2 className="text-lg font-semibold text-gray-800">{title}</h2>}
          {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
          <p className="text-xs text-gray-400 mt-1">
            {table.getFilteredRowModel().rows.length} registro(s)
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Buscador */}
          <div className="relative">
            <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 w-52"
            />
          </div>
          {extraButtons}
          {onAdd && (
            <button onClick={onAdd} className="btn-primary">
              <span className="text-lg leading-none">+</span>
              {addLabel}
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="table-base">
          <thead className="table-head">
            {table.getHeaderGroups().map(hg => (
              <tr key={hg.id}>
                {hg.headers.map(header => (
                  <th
                    key={header.id}
                    className="table-th"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center gap-1">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getIsSorted() === 'asc'  && <ArrowUpIcon   className="w-3 h-3" />}
                      {header.column.getIsSorted() === 'desc' && <ArrowDownIcon className="w-3 h-3" />}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {loading
              ? <tr><td colSpan={columns.length} className="py-16 text-center"><AppLoader /></td></tr>
              : table.getRowModel().rows.length === 0
                ? <tr><td colSpan={columns.length}><AppEmptyState /></td></tr>
                : table.getRowModel().rows.map(row => (
                    <tr key={row.id} className="table-row">
                      {row.getVisibleCells().map(cell => (
                        <td key={cell.id} className="table-td">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))
            }
          </tbody>
        </table>
      </div>

      {!loading && <AppPagination table={table} />}
    </div>
  );
};

export default AppTable;
```

## src/components/common/AppModal.jsx

```jsx
import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';

const AppModal = ({ isOpen, onClose, title, children, size = 'md', footer }) => {
  const sizes = {
    sm: 'max-w-md', md: 'max-w-2xl', lg: 'max-w-4xl', xl: 'max-w-6xl',
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100"
          leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100"
              leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className={`w-full ${sizes[size]} bg-white rounded-2xl shadow-2xl overflow-hidden`}>
                {/* Modal Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
                  <Dialog.Title className="text-base font-semibold text-gray-800">
                    {title}
                  </Dialog.Title>
                  <button onClick={onClose} className="btn-ghost">
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>

                {/* Modal Body */}
                <div className="px-6 py-5 max-h-[75vh] overflow-y-auto">
                  {children}
                </div>

                {/* Modal Footer */}
                {footer && (
                  <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
                    {footer}
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default AppModal;
```

## src/components/common/AppBadge.jsx

```jsx
import { ESTADO_PROCESO, ESTADO_BIEN, ESTADO_FUNC } from '../../constants/states';
import { ROLE_LABELS } from '../../constants/roles';

export const EstadoProcesoBadge = ({ estado }) => {
  const cfg = ESTADO_PROCESO[estado] || { label: estado, css: 'badge-gray' };
  return <span className={cfg.css}>{cfg.label}</span>;
};

export const EstadoBienBadge = ({ estado }) => {
  const cfg = ESTADO_BIEN[estado] || { label: estado, css: 'badge-gray' };
  return <span className={cfg.css}>{cfg.label}</span>;
};

export const EstadoFuncBadge = ({ estado }) => {
  const cfg = ESTADO_FUNC[estado] || { label: estado, css: 'badge-gray' };
  return <span className={cfg.css}>{cfg.label}</span>;
};

export const RoleBadge = ({ role }) => {
  const colors = {
    SYSADMIN: 'badge-purple', COORDSISTEMA: 'badge-blue',
    ASISTSISTEMA: 'badge-green', ADMINSEDE: 'badge-orange',
    SEGURSEDE: 'badge-red', USUARIOCORTE: 'badge-gray',
  };
  return <span className={colors[role] || 'badge-gray'}>{ROLE_LABELS[role] || role}</span>;
};

export const ActiveBadge = ({ active }) => (
  <span className={active ? 'badge-green' : 'badge-red'}>
    {active ? 'Activo' : 'Inactivo'}
  </span>
);
```

## src/components/common/AppFormField.jsx

```jsx
const AppFormField = ({ label, error, required, children, hint }) => (
  <div className="mb-4">
    {label && (
      <label className="form-label">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
    )}
    {children}
    {hint  && !error && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    {error && <p className="form-error">{error}</p>}
  </div>
);

export default AppFormField;
```

## src/components/common/AppConfirm.jsx

```jsx
import AppModal from './AppModal';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const AppConfirm = ({ isOpen, onClose, onConfirm, title, message, confirmLabel = 'Confirmar', danger = false }) => (
  <AppModal
    isOpen={isOpen}
    onClose={onClose}
    title=""
    size="sm"
    footer={
      <>
        <button onClick={onClose} className="btn-secondary">Cancelar</button>
        <button onClick={onConfirm} className={danger ? 'btn-danger' : 'btn-primary'}>
          {confirmLabel}
        </button>
      </>
    }
  >
    <div className="flex flex-col items-center text-center py-4">
      <ExclamationTriangleIcon className={`w-14 h-14 mb-4 ${danger ? 'text-red-500' : 'text-yellow-500'}`} />
      <h3 className="text-lg font-semibold text-gray-800 mb-2">{title}</h3>
      <p className="text-sm text-gray-500">{message}</p>
    </div>
  </AppModal>
);

export default AppConfirm;
```

## src/components/common/AppPagination.jsx

```jsx
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

const AppPagination = ({ table }) => {
  const { pageIndex, pageSize } = table.getState().pagination;
  const total = table.getFilteredRowModel().rows.length;
  const from  = pageIndex * pageSize + 1;
  const to    = Math.min((pageIndex + 1) * pageSize, total);

  return (
    <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
      <span>Mostrando {from}–{to} de {total} registros</span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
          className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronLeftIcon className="w-4 h-4" />
        </button>
        {Array.from({ length: table.getPageCount() }, (_, i) => (
          <button
            key={i}
            onClick={() => table.setPageIndex(i)}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              pageIndex === i
                ? 'bg-primary-600 text-white'
                : 'hover:bg-gray-100 text-gray-600'
            }`}
          >
            {i + 1}
          </button>
        )).slice(Math.max(0, pageIndex - 2), pageIndex + 3)}
        <button
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
          className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronRightIcon className="w-4 h-4" />
        </button>
      </div>
      <select
        value={pageSize}
        onChange={e => table.setPageSize(Number(e.target.value))}
        className="border border-gray-300 rounded-lg px-2 py-1 text-sm"
      >
        {[10, 20, 50, 100].map(s => <option key={s} value={s}>{s} / pág</option>)}
      </select>
    </div>
  );
};

export default AppPagination;
```

## src/components/common/AppLoader.jsx

```jsx
const AppLoader = ({ text = 'Cargando...' }) => (
  <div className="flex flex-col items-center justify-center py-12 text-gray-400">
    <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mb-3" />
    <span className="text-sm">{text}</span>
  </div>
);

export default AppLoader;
```

## src/components/common/AppEmptyState.jsx

```jsx
import { FolderOpenIcon } from '@heroicons/react/24/outline';

const AppEmptyState = ({ title = 'Sin resultados', subtitle = 'No hay registros que mostrar.' }) => (
  <div className="flex flex-col items-center justify-center py-16 text-gray-400">
    <FolderOpenIcon className="w-14 h-14 mb-3 text-gray-300" />
    <p className="font-medium text-gray-500">{title}</p>
    <p className="text-sm mt-1">{subtitle}</p>
  </div>
);

export default AppEmptyState;
```

## src/components/layout/MainLayout.jsx

```jsx
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useState } from 'react';

const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
```

## src/components/layout/Sidebar.jsx

```jsx
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { MENU_CONFIG } from '../../constants/menus';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

const Sidebar = ({ isOpen, onToggle }) => {
  const { user, hasRole } = useAuth();

  return (
    <aside className={`${isOpen ? 'w-64' : 'w-16'} bg-sidebar-bg transition-all duration-300 flex flex-col overflow-hidden shadow-xl`}>
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-white/10">
        {isOpen && (
          <div>
            <div className="text-white font-bold text-lg leading-tight">SIGAP</div>
            <div className="text-sidebar-text text-xs">Gestión de Activos</div>
          </div>
        )}
        <button onClick={onToggle} className="text-sidebar-text hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors ml-auto">
          {isOpen ? <ChevronLeftIcon className="w-5 h-5" /> : <ChevronRightIcon className="w-5 h-5" />}
        </button>
      </div>

      {/* Menu */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {MENU_CONFIG.map((section) => {
          const visibleItems = section.items.filter(item =>
            item.roles.length === 0 || hasRole(item.roles)
          );
          if (visibleItems.length === 0) return null;

          return (
            <div key={section.section} className="mb-4">
              {isOpen && (
                <p className="text-sidebar-text/50 text-xs font-semibold uppercase tracking-wider px-3 mb-2">
                  {section.section}
                </p>
              )}
              {visibleItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 group
                    ${isActive
                      ? 'bg-sidebar-active text-white font-medium'
                      : 'text-sidebar-text hover:bg-sidebar-hover hover:text-white'
                    }`
                  }
                  title={!isOpen ? item.label : ''}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {isOpen && <span className="text-sm">{item.label}</span>}
                </NavLink>
              ))}
            </div>
          );
        })}
      </nav>

      {/* User info */}
      {isOpen && user && (
        <div className="p-4 border-t border-white/10">
          <div className="text-white text-sm font-medium truncate">{user.full_name}</div>
          <div className="text-sidebar-text text-xs mt-0.5 truncate">{user.role}</div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
```

## src/components/layout/Header.jsx

```jsx
import { Bars3Icon, BellIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';

const BREADCRUMB_LABELS = {
  '/dashboard': 'Dashboard',
  '/admin/usuarios': 'Usuarios del Sistema',
  '/admin/roles': 'Roles y Permisos',
  '/admin/sedes': 'Sedes / Módulos / Áreas',
  '/bienes': 'Activos Informáticos',
  '/mantenimiento': 'Mantenimiento Preventivo',
  '/traslados': 'Traslados y Asignaciones',
  '/bajas': 'Baja / Salida de Bienes',
  '/reportes': 'Reportes',
};

const Header = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const handleLogout = async () => {
    await logout();
    toast.success('Sesión cerrada correctamente.');
    navigate('/login');
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-4">
        <button onClick={onToggleSidebar} className="btn-ghost">
          <Bars3Icon className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-base font-semibold text-gray-800">
            {BREADCRUMB_LABELS[pathname] || 'SIGAP'}
          </h1>
          <p className="text-xs text-gray-400">Corte Superior de Justicia de Lima Norte</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button className="btn-ghost relative">
          <BellIcon className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>
        <div className="h-6 w-px bg-gray-200 mx-1" />
        <div className="text-right mr-2 hidden sm:block">
          <div className="text-sm font-medium text-gray-700">{user?.full_name}</div>
          <div className="text-xs text-gray-400">{user?.role_name}</div>
        </div>
        <button onClick={handleLogout} className="btn-ghost text-red-500 hover:text-red-700 hover:bg-red-50">
          <ArrowRightOnRectangleIcon className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};

export default Header;
```

---

# 09 — PÁGINAS COMPLETAS

## src/pages/auth/LoginPage.jsx

```jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

const schema = z.object({
  username: z.string().min(1, 'Usuario requerido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
});

const LoginPage = () => {
  const { login }   = useAuth();
  const navigate    = useNavigate();
  const [showPass, setShowPass] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data) => {
    try {
      await login(data);
      toast.success('Bienvenido al sistema SIGAP');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Credenciales incorrectas');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-700 to-primary-900 px-8 py-10 text-center">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-3xl font-bold">⚖</span>
          </div>
          <h1 className="text-white text-2xl font-bold">SIGAP</h1>
          <p className="text-primary-200 text-sm mt-1">Sistema de Gestión de Activos</p>
          <p className="text-primary-300 text-xs mt-1">Corte Superior de Justicia de Lima Norte</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="px-8 py-8">
          <div className="mb-5">
            <label className="form-label">Usuario</label>
            <input
              type="text"
              {...register('username')}
              className={`input-field ${errors.username ? 'input-error' : ''}`}
              placeholder="Ingrese su usuario"
              autoFocus
            />
            {errors.username && <p className="form-error">{errors.username.message}</p>}
          </div>

          <div className="mb-6">
            <label className="form-label">Contraseña</label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                {...register('password')}
                className={`input-field pr-10 ${errors.password ? 'input-error' : ''}`}
                placeholder="Ingrese su contraseña"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
              >
                {showPass ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && <p className="form-error">{errors.password.message}</p>}
          </div>

          <button type="submit" disabled={isSubmitting} className="btn-primary w-full justify-center py-3 text-base">
            {isSubmitting ? 'Ingresando...' : 'Ingresar al Sistema'}
          </button>
        </form>

        <div className="text-center pb-6 text-xs text-gray-400">
          Poder Judicial del Perú © {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
```

## src/pages/admin/users/UsersPage.jsx

```jsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '../../../api/usersApi';
import AppTable from '../../../components/common/AppTable';
import AppConfirm from '../../../components/common/AppConfirm';
import { ActiveBadge, RoleBadge } from '../../../components/common/AppBadge';
import UserModal from './UserModal';
import UserDetailModal from './UserDetailModal';
import {
  PencilSquareIcon, EyeIcon, PowerIcon,
  UserGroupIcon, MapPinIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const UsersPage = () => {
  const qc = useQueryClient();
  const [modalOpen,   setModalOpen]   = useState(false);
  const [detailOpen,  setDetailOpen]  = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selected,    setSelected]    = useState(null);
  const [filters,     setFilters]     = useState({ estado: '', role: '', search: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['users', filters],
    queryFn:  () => usersApi.getAll(filters).then(r => r.data.data),
  });

  const toggleMutation = useMutation({
    mutationFn: (id) => usersApi.toggleEstado(id),
    onSuccess: () => {
      qc.invalidateQueries(['users']);
      toast.success('Estado actualizado.');
      setConfirmOpen(false);
    },
    onError: () => toast.error('Error al cambiar estado.'),
  });

  const handleOpenCreate = () => { setSelected(null); setModalOpen(true); };
  const handleOpenEdit   = (user) => { setSelected(user); setModalOpen(true); };
  const handleOpenDetail = (user) => { setSelected(user); setDetailOpen(true); };
  const handleToggle     = (user) => { setSelected(user); setConfirmOpen(true); };

  const columns = [
    { accessorKey: 'dni', header: 'DNI' },
    {
      accessorKey: 'full_name', header: 'Nombre Completo',
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-gray-800">{row.original.full_name}</p>
          <p className="text-xs text-gray-400">{row.original.username}</p>
        </div>
      ),
    },
    { accessorKey: 'cargo', header: 'Cargo' },
    {
      accessorKey: 'role_name', header: 'Rol',
      cell: ({ row }) => <RoleBadge role={row.original.role_name} />,
    },
    {
      accessorKey: 'estado', header: 'Estado',
      cell: ({ getValue }) => <ActiveBadge active={getValue()} />,
    },
    {
      accessorKey: 'created_at', header: 'Fecha Registro',
      cell: ({ getValue }) => format(new Date(getValue()), 'dd/MM/yyyy', { locale: es }),
    },
    {
      id: 'acciones', header: 'Acciones',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <button onClick={() => handleOpenDetail(row.original)} className="btn-ghost" title="Ver detalle">
            <EyeIcon className="w-4 h-4 text-blue-500" />
          </button>
          <button onClick={() => handleOpenEdit(row.original)} className="btn-ghost" title="Editar">
            <PencilSquareIcon className="w-4 h-4 text-primary-500" />
          </button>
          <button onClick={() => handleToggle(row.original)} className="btn-ghost" title={row.original.estado ? 'Desactivar' : 'Activar'}>
            <PowerIcon className={`w-4 h-4 ${row.original.estado ? 'text-red-400' : 'text-green-400'}`} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="page-title">Usuarios del Sistema</h1>
        <p className="page-subtitle">Gestión de usuarios, roles y accesos al sistema SIGAP</p>
      </div>

      {/* Filtros */}
      <div className="card mb-4">
        <div className="flex flex-wrap gap-3">
          <select
            value={filters.estado}
            onChange={e => setFilters(f => ({ ...f, estado: e.target.value }))}
            className="input-field w-40"
          >
            <option value="">Todos los estados</option>
            <option value="true">Activos</option>
            <option value="false">Inactivos</option>
          </select>
          <select
            value={filters.role}
            onChange={e => setFilters(f => ({ ...f, role: e.target.value }))}
            className="input-field w-52"
          >
            <option value="">Todos los roles</option>
            <option value="SYSADMIN">Administrador del Sistema</option>
            <option value="COORDSISTEMA">Coordinador de Sistemas</option>
            <option value="ASISTSISTEMA">Asistente de Sistemas</option>
            <option value="ADMINSEDE">Administrador de Sede</option>
            <option value="SEGURSEDE">Seguridad de Sede</option>
          </select>
        </div>
      </div>

      {/* Tabla */}
      <AppTable
        columns={columns}
        data={data || []}
        loading={isLoading}
        title="Lista de Usuarios"
        onAdd={handleOpenCreate}
        addLabel="Nuevo Usuario"
      />

      {/* Modales */}
      <UserModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        user={selected}
        onSuccess={() => { qc.invalidateQueries(['users']); setModalOpen(false); }}
      />

      <UserDetailModal
        isOpen={detailOpen}
        onClose={() => setDetailOpen(false)}
        user={selected}
      />

      <AppConfirm
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => toggleMutation.mutate(selected?.id)}
        title={selected?.estado ? 'Desactivar Usuario' : 'Activar Usuario'}
        message={`¿Está seguro de ${selected?.estado ? 'desactivar' : 'activar'} a ${selected?.full_name}?`}
        confirmLabel={selected?.estado ? 'Desactivar' : 'Activar'}
        danger={selected?.estado}
      />
    </div>
  );
};

export default UsersPage;
```

## src/pages/admin/users/UserModal.jsx

```jsx
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { usersApi } from '../../../api/usersApi';
import { rolesApi } from '../../../api/rolesApi';
import { locationsApi } from '../../../api/locationsApi';
import AppModal from '../../../components/common/AppModal';
import AppFormField from '../../../components/common/AppFormField';
import toast from 'react-hot-toast';

const schema = z.object({
  dni:       z.string().length(8, 'DNI debe tener 8 dígitos'),
  nombres:   z.string().min(2, 'Nombres requeridos'),
  apellidos: z.string().min(2, 'Apellidos requeridos'),
  username:  z.string().min(3, 'Usuario mínimo 3 caracteres'),
  email:     z.string().email('Email inválido').optional().or(z.literal('')),
  cargo:     z.string().optional(),
  role:      z.string().min(1, 'Rol requerido'),
  password:  z.string().min(6, 'Mínimo 6 caracteres').optional().or(z.literal('')),
});

const UserModal = ({ isOpen, onClose, user, onSuccess }) => {
  const isEdit = !!user;

  const { data: roles }   = useQuery({ queryKey: ['roles-list'], queryFn: () => rolesApi.getRoles().then(r => r.data.data), enabled: isOpen });
  const { data: sedes }   = useQuery({ queryKey: ['sedes-list'], queryFn: () => locationsApi.getSedes().then(r => r.data.data), enabled: isOpen });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (isOpen) {
      reset(user ? {
        dni: user.dni, nombres: user.nombres, apellidos: user.apellidos,
        username: user.username, email: user.email || '', cargo: user.cargo || '',
        role: user.role || '', password: '',
      } : {});
    }
  }, [isOpen, user, reset]);

  const mutation = useMutation({
    mutationFn: (data) => isEdit ? usersApi.update(user.id, data) : usersApi.create(data),
    onSuccess: () => {
      toast.success(isEdit ? 'Usuario actualizado.' : 'Usuario registrado.');
      onSuccess();
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Error al guardar.'),
  });

  const onSubmit = (data) => {
    if (!data.password) delete data.password;
    mutation.mutate(data);
  };

  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Editar Usuario' : 'Registrar Nuevo Usuario'}
      size="lg"
      footer={
        <>
          <button onClick={onClose} className="btn-secondary">Cancelar</button>
          <button
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting || mutation.isPending}
            className="btn-primary"
          >
            {mutation.isPending ? 'Guardando...' : isEdit ? 'Actualizar' : 'Registrar'}
          </button>
        </>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
        <AppFormField label="DNI" required error={errors.dni?.message}>
          <input {...register('dni')} className="input-field" placeholder="12345678" maxLength={8} />
        </AppFormField>

        <AppFormField label="Nombre de Usuario" required error={errors.username?.message}>
          <input {...register('username')} className="input-field" placeholder="usuario.sistema" />
        </AppFormField>

        <AppFormField label="Nombres" required error={errors.nombres?.message}>
          <input {...register('nombres')} className="input-field" placeholder="Juan Carlos" />
        </AppFormField>

        <AppFormField label="Apellidos" required error={errors.apellidos?.message}>
          <input {...register('apellidos')} className="input-field" placeholder="García López" />
        </AppFormField>

        <AppFormField label="Correo Electrónico" error={errors.email?.message}>
          <input {...register('email')} type="email" className="input-field" placeholder="correo@pj.gob.pe" />
        </AppFormField>

        <AppFormField label="Cargo" error={errors.cargo?.message}>
          <input {...register('cargo')} className="input-field" placeholder="Analista de Informática" />
        </AppFormField>

        <AppFormField label="Rol" required error={errors.role?.message}>
          <select {...register('role')} className="input-field">
            <option value="">Seleccionar rol...</option>
            {roles?.map(r => <option key={r.id} value={r.code}>{r.name}</option>)}
          </select>
        </AppFormField>

        <AppFormField
          label={isEdit ? 'Nueva Contraseña (dejar vacío para no cambiar)' : 'Contraseña'}
          required={!isEdit}
          error={errors.password?.message}
        >
          <input {...register('password')} type="password" className="input-field" placeholder="••••••••" />
        </AppFormField>
      </div>
    </AppModal>
  );
};

export default UserModal;
```

## src/pages/admin/roles/RolesPage.jsx

```jsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rolesApi } from '../../../api/rolesApi';
import AppTable from '../../../components/common/AppTable';
import AppConfirm from '../../../components/common/AppConfirm';
import { ActiveBadge } from '../../../components/common/AppBadge';
import RoleModal from './RoleModal';
import PermissionsModal from './PermissionsModal';
import { PencilSquareIcon, PowerIcon, KeyIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const RolesPage = () => {
  const qc = useQueryClient();
  const [roleModal,   setRoleModal]   = useState(false);
  const [permModal,   setPermModal]   = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selected,    setSelected]    = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['roles'],
    queryFn:  () => rolesApi.getRoles().then(r => r.data.data),
  });

  const toggleMutation = useMutation({
    mutationFn: (id) => rolesApi.toggleEstado(id),
    onSuccess: () => { qc.invalidateQueries(['roles']); toast.success('Estado actualizado.'); setConfirmOpen(false); },
    onError: () => toast.error('Error.'),
  });

  const columns = [
    { accessorKey: 'code', header: 'Código' },
    { accessorKey: 'name', header: 'Nombre del Rol' },
    { accessorKey: 'description', header: 'Descripción' },
    {
      accessorKey: 'permission_count', header: 'Permisos',
      cell: ({ getValue }) => (
        <span className="badge-blue">{getValue()} permisos</span>
      ),
    },
    {
      accessorKey: 'estado', header: 'Estado',
      cell: ({ getValue }) => <ActiveBadge active={getValue()} />,
    },
    {
      id: 'acciones', header: 'Acciones',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <button onClick={() => { setSelected(row.original); setPermModal(true); }} className="btn-ghost" title="Gestionar permisos">
            <KeyIcon className="w-4 h-4 text-amber-500" />
          </button>
          <button onClick={() => { setSelected(row.original); setRoleModal(true); }} className="btn-ghost" title="Editar">
            <PencilSquareIcon className="w-4 h-4 text-primary-500" />
          </button>
          <button onClick={() => { setSelected(row.original); setConfirmOpen(true); }} className="btn-ghost" title="Activar/Desactivar">
            <PowerIcon className={`w-4 h-4 ${row.original.estado ? 'text-red-400' : 'text-green-400'}`} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="page-title">Roles y Permisos</h1>
        <p className="page-subtitle">Gestión de perfiles de acceso al sistema</p>
      </div>

      <AppTable
        columns={columns}
        data={data || []}
        loading={isLoading}
        title="Roles del Sistema"
        onAdd={() => { setSelected(null); setRoleModal(true); }}
        addLabel="Nuevo Rol"
      />

      <RoleModal
        isOpen={roleModal}
        onClose={() => setRoleModal(false)}
        role={selected}
        onSuccess={() => { qc.invalidateQueries(['roles']); setRoleModal(false); }}
      />

      <PermissionsModal
        isOpen={permModal}
        onClose={() => setPermModal(false)}
        role={selected}
        onSuccess={() => { qc.invalidateQueries(['roles']); }}
      />

      <AppConfirm
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => toggleMutation.mutate(selected?.id)}
        title={`${selected?.estado ? 'Desactivar' : 'Activar'} Rol`}
        message={`¿Confirma ${selected?.estado ? 'desactivar' : 'activar'} el rol "${selected?.name}"?`}
        danger={selected?.estado}
        confirmLabel={selected?.estado ? 'Desactivar' : 'Activar'}
      />
    </div>
  );
};

export default RolesPage;
```

## src/pages/admin/locations/LocationsPage.jsx

```jsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { locationsApi } from '../../../api/locationsApi';
import AppTable from '../../../components/common/AppTable';
import AppConfirm from '../../../components/common/AppConfirm';
import { ActiveBadge } from '../../../components/common/AppBadge';
import SedeModal from './SedeModal';
import ModuloModal from './ModuloModal';
import AreaModal from './AreaModal';
import { PencilSquareIcon, PowerIcon, ChevronDownIcon, ChevronRightIcon, PlusIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const LocationsPage = () => {
  const qc = useQueryClient();
  const [tab,        setTab]        = useState('sedes');
  const [sedeModal,  setSedeModal]  = useState(false);
  const [modModal,   setModModal]   = useState(false);
  const [areaModal,  setAreaModal]  = useState(false);
  const [confirmOpen,setConfirmOpen]= useState(false);
  const [selected,   setSelected]   = useState(null);
  const [expanded,   setExpanded]   = useState({});

  const { data: sedes, isLoading } = useQuery({
    queryKey: ['sedes'],
    queryFn:  () => locationsApi.getSedes().then(r => r.data.data),
  });

  const toggleExpanded = (id) => setExpanded(e => ({ ...e, [id]: !e[id] }));

  const toggleSedeMutation = useMutation({
    mutationFn: (id) => locationsApi.toggleSede(id),
    onSuccess: () => { qc.invalidateQueries(['sedes']); toast.success('Estado actualizado.'); setConfirmOpen(false); },
  });

  const sedeColumns = [
    {
      id: 'expand', header: '',
      cell: ({ row }) => (
        <button onClick={() => toggleExpanded(row.original.id)} className="btn-ghost">
          {expanded[row.original.id]
            ? <ChevronDownIcon  className="w-4 h-4 text-gray-400" />
            : <ChevronRightIcon className="w-4 h-4 text-gray-400" />
          }
        </button>
      ),
    },
    { accessorKey: 'codigo', header: 'Código' },
    { accessorKey: 'nombre', header: 'Nombre de Sede' },
    { accessorKey: 'ubicacion', header: 'Ubicación' },
    {
      accessorKey: 'modulos_count', header: 'Módulos',
      cell: ({ getValue }) => <span className="badge-blue">{getValue()} módulos</span>,
    },
    {
      accessorKey: 'estado', header: 'Estado',
      cell: ({ getValue }) => <ActiveBadge active={getValue()} />,
    },
    {
      id: 'acciones', header: 'Acciones',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <button onClick={() => { setSelected({ type: 'modulo', sede: row.original }); setModModal(true); }} className="btn-ghost" title="Agregar módulo">
            <PlusIcon className="w-4 h-4 text-green-500" />
          </button>
          <button onClick={() => { setSelected(row.original); setSedeModal(true); }} className="btn-ghost" title="Editar">
            <PencilSquareIcon className="w-4 h-4 text-primary-500" />
          </button>
          <button onClick={() => { setSelected(row.original); setConfirmOpen(true); }} className="btn-ghost">
            <PowerIcon className={`w-4 h-4 ${row.original.estado ? 'text-red-400' : 'text-green-400'}`} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="page-title">Sedes / Módulos / Áreas</h1>
        <p className="page-subtitle">Estructura organizacional de la Corte Superior de Justicia de Lima Norte</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        {['sedes', 'estructura'].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
              tab === t ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === 'sedes' ? 'Sedes' : 'Árbol Organizacional'}
          </button>
        ))}
      </div>

      {tab === 'sedes' && (
        <AppTable
          columns={sedeColumns}
          data={sedes || []}
          loading={isLoading}
          title="Sedes Registradas"
          onAdd={() => { setSelected(null); setSedeModal(true); }}
          addLabel="Nueva Sede"
        />
      )}

      {tab === 'estructura' && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Árbol Organizacional</h2>
          {sedes?.map(sede => (
            <div key={sede.id} className="mb-2 border border-gray-200 rounded-xl overflow-hidden">
              <div
                className="flex items-center justify-between p-4 bg-primary-50 cursor-pointer"
                onClick={() => toggleExpanded(sede.id)}
              >
                <div className="flex items-center gap-3">
                  {expanded[sede.id] ? <ChevronDownIcon className="w-4 h-4" /> : <ChevronRightIcon className="w-4 h-4" />}
                  <span className="font-semibold text-primary-800">{sede.nombre}</span>
                  <span className="badge-blue">{sede.modulos_count} módulos</span>
                  <ActiveBadge active={sede.estado} />
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); setSelected({ type: 'modulo', sede }); setModModal(true); }}
                  className="btn-ghost text-green-600 text-xs flex items-center gap-1"
                >
                  <PlusIcon className="w-3 h-3" /> Módulo
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <SedeModal
        isOpen={sedeModal}
        onClose={() => setSedeModal(false)}
        sede={selected?.type ? null : selected}
        onSuccess={() => { qc.invalidateQueries(['sedes']); setSedeModal(false); }}
      />
      <ModuloModal
        isOpen={modModal}
        onClose={() => setModModal(false)}
        sede={selected?.sede}
        onSuccess={() => { qc.invalidateQueries(['sedes']); setModModal(false); }}
      />
      <AreaModal
        isOpen={areaModal}
        onClose={() => setAreaModal(false)}
        onSuccess={() => { qc.invalidateQueries(['sedes']); setAreaModal(false); }}
      />
      <AppConfirm
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => toggleSedeMutation.mutate(selected?.id)}
        title="Cambiar estado de Sede"
        message={`¿Confirma ${selected?.estado ? 'desactivar' : 'activar'} la sede "${selected?.nombre}"?`}
        danger={selected?.estado}
      />
    </div>
  );
};

export default LocationsPage;
```

## src/pages/assets/AssetsPage.jsx

```jsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { assetsApi } from '../../api/assetsApi';
import AppTable from '../../components/common/AppTable';
import { EstadoBienBadge, EstadoFuncBadge } from '../../components/common/AppBadge';
import AssetModal from './AssetModal';
import { PencilSquareIcon, EyeIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

const AssetsPage = () => {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [selected,  setSelected]  = useState(null);
  const [filters,   setFilters]   = useState({ tipo: '', estado_bien: '', estado_func: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['bienes', filters],
    queryFn:  () => assetsApi.getAll(filters).then(r => r.data.data),
  });

  const { data: tipos }  = useQuery({ queryKey: ['tipos-bien'], queryFn: () => assetsApi.getTipos().then(r => r.data.data) });

  const columns = [
    { accessorKey: 'codigo_patrimonial', header: 'Cód. Patrimonial' },
    {
      accessorKey: 'tipo_bien',  header: 'Tipo de Bien',
      cell: ({ row }) => row.original.tipo_bien?.nombre,
    },
    {
      accessorKey: 'marca', header: 'Marca / Modelo',
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.marca?.nombre}</p>
          <p className="text-xs text-gray-400">{row.original.modelo}</p>
        </div>
      ),
    },
    { accessorKey: 'numero_serie', header: 'N° Serie' },
    {
      accessorKey: 'usuario_asignado_nombre', header: 'Asignado a',
      cell: ({ row }) => row.original.usuario_asignado_nombre || <span className="text-gray-300">Sin asignar</span>,
    },
    { accessorKey: 'sede_nombre', header: 'Sede' },
    {
      accessorKey: 'estado_bien', header: 'Estado',
      cell: ({ getValue }) => <EstadoBienBadge estado={getValue()} />,
    },
    {
      accessorKey: 'estado_funcionamiento', header: 'Funcionamiento',
      cell: ({ getValue }) => <EstadoFuncBadge estado={getValue()} />,
    },
    {
      id: 'acciones', header: 'Acciones',
      cell: ({ row }) => (
        <div className="flex gap-1">
          <button onClick={() => navigate(`/bienes/${row.original.id}`)} className="btn-ghost" title="Ver detalle">
            <EyeIcon className="w-4 h-4 text-blue-500" />
          </button>
          <button onClick={() => { setSelected(row.original); setModalOpen(true); }} className="btn-ghost" title="Editar">
            <PencilSquareIcon className="w-4 h-4 text-primary-500" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="page-title">Activos Informáticos</h1>
        <p className="page-subtitle">Registro, asignación y control de bienes informáticos de la institución</p>
      </div>

      {/* Filtros */}
      <div className="card mb-4">
        <div className="flex flex-wrap gap-3">
          <select
            value={filters.tipo}
            onChange={e => setFilters(f => ({ ...f, tipo: e.target.value }))}
            className="input-field w-48"
          >
            <option value="">Todos los tipos</option>
            {tipos?.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
          </select>
          <select
            value={filters.estado_bien}
            onChange={e => setFilters(f => ({ ...f, estado_bien: e.target.value }))}
            className="input-field w-40"
          >
            <option value="">Estado bien</option>
            <option value="ACTIVO">Activo</option>
            <option value="INACTIVO">Inactivo</option>
          </select>
          <select
            value={filters.estado_func}
            onChange={e => setFilters(f => ({ ...f, estado_func: e.target.value }))}
            className="input-field w-44"
          >
            <option value="">Funcionamiento</option>
            <option value="OPERATIVO">Operativo</option>
            <option value="AVERIADO">Averiado</option>
            <option value="INOPERATIVO">Inoperativo</option>
          </select>
        </div>
      </div>

      <AppTable
        columns={columns}
        data={data || []}
        loading={isLoading}
        title="Bienes Registrados"
        onAdd={() => { setSelected(null); setModalOpen(true); }}
        addLabel="Registrar Bien"
      />

      <AssetModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        asset={selected}
        onSuccess={() => { qc.invalidateQueries(['bienes']); setModalOpen(false); }}
      />
    </div>
  );
};

export default AssetsPage;
```

## src/pages/maintenance/MaintenancePage.jsx

```jsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { maintenanceApi } from '../../api/maintenanceApi';
import AppTable from '../../components/common/AppTable';
import { EstadoProcesoBadge } from '../../components/common/AppBadge';
import MaintenanceModal from './MaintenanceModal';
import MaintenanceApprovalModal from './MaintenanceApprovalModal';
import { EyeIcon, CheckCircleIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const MaintenancePage = () => {
  const { hasRole } = useAuth();
  const qc = useQueryClient();
  const [modalOpen,    setModalOpen]    = useState(false);
  const [approvalOpen, setApprovalOpen] = useState(false);
  const [selected,     setSelected]     = useState(null);
  const [filters,      setFilters]      = useState({ estado: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['mantenimientos', filters],
    queryFn:  () => maintenanceApi.getAll(filters).then(r => r.data.data),
  });

  const downloadPdf = async (id) => {
    const res = await maintenanceApi.generatePdf(id);
    const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
    const a = document.createElement('a'); a.href = url; a.download = `mantenimiento_${id}.pdf`;
    a.click(); URL.revokeObjectURL(url);
  };

  const columns = [
    { accessorKey: 'numero_orden', header: 'N° Orden' },
    { accessorKey: 'asistsistema_nombre', header: 'Técnico' },
    { accessorKey: 'sede_nombre', header: 'Sede' },
    {
      accessorKey: 'estado', header: 'Estado',
      cell: ({ getValue }) => <EstadoProcesoBadge estado={getValue()} />,
    },
    {
      accessorKey: 'fecha_registro', header: 'Fecha',
      cell: ({ getValue }) => format(new Date(getValue()), 'dd/MM/yyyy HH:mm', { locale: es }),
    },
    {
      id: 'acciones', header: 'Acciones',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <button className="btn-ghost" title="Ver detalle" onClick={() => { setSelected(row.original); setModalOpen(true); }}>
            <EyeIcon className="w-4 h-4 text-blue-500" />
          </button>
          {hasRole(['ADMINSEDE']) && row.original.estado === 'PENDIENTE_APROBACION' && (
            <button onClick={() => { setSelected(row.original); setApprovalOpen(true); }} className="btn-ghost" title="Aprobar/Rechazar">
              <CheckCircleIcon className="w-4 h-4 text-green-500" />
            </button>
          )}
          {row.original.estado === 'ATENDIDO' && (
            <button onClick={() => downloadPdf(row.original.id)} className="btn-ghost" title="Descargar PDF">
              <DocumentArrowDownIcon className="w-4 h-4 text-red-500" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="page-title">Mantenimiento Preventivo</h1>
        <p className="page-subtitle">Órdenes de mantenimiento de activos informáticos</p>
      </div>

      <div className="card mb-4">
        <div className="flex gap-3">
          <select
            value={filters.estado}
            onChange={e => setFilters(f => ({ ...f, estado: e.target.value }))}
            className="input-field w-56"
          >
            <option value="">Todos los estados</option>
            <option value="REGISTRADO">Registrado</option>
            <option value="EN_PROCESO">En Proceso</option>
            <option value="PENDIENTE_APROBACION">Pend. Aprobación</option>
            <option value="DEVUELTO">Devuelto</option>
            <option value="ATENDIDO">Atendido</option>
            <option value="CANCELADO">Cancelado</option>
          </select>
        </div>
      </div>

      <AppTable
        columns={columns}
        data={data || []}
        loading={isLoading}
        title="Órdenes de Mantenimiento"
        onAdd={hasRole(['ASISTSISTEMA', 'SYSADMIN']) ? () => { setSelected(null); setModalOpen(true); } : undefined}
        addLabel="Nueva Orden"
      />

      <MaintenanceModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        order={selected}
        onSuccess={() => { qc.invalidateQueries(['mantenimientos']); setModalOpen(false); }}
      />
      <MaintenanceApprovalModal
        isOpen={approvalOpen}
        onClose={() => setApprovalOpen(false)}
        order={selected}
        onSuccess={() => { qc.invalidateQueries(['mantenimientos']); setApprovalOpen(false); }}
      />
    </div>
  );
};

export default MaintenancePage;
```

---

## src/router/AppRouter.jsx

```jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '../contexts/AuthContext';

import MainLayout from '../components/layout/MainLayout';
import PrivateRoute from './PrivateRoute';
import RoleRoute from './RoleRoute';

import LoginPage from '../pages/auth/LoginPage';
import DashboardPage from '../pages/dashboard/DashboardPage';
import UsersPage from '../pages/admin/users/UsersPage';
import RolesPage from '../pages/admin/roles/RolesPage';
import LocationsPage from '../pages/admin/locations/LocationsPage';
import AssetsPage from '../pages/assets/AssetsPage';
import AssetDetailPage from '../pages/assets/AssetDetailPage';
import MaintenancePage from '../pages/maintenance/MaintenancePage';
import TransfersPage from '../pages/transfers/TransfersPage';
import DecommissionPage from '../pages/decommission/DecommissionPage';
import ReportsPage from '../pages/reports/ReportsPage';

const qc = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

const AppRouter = () => (
  <QueryClientProvider client={qc}>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route element={<PrivateRoute><MainLayout /></PrivateRoute>}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />

            {/* Admin */}
            <Route path="/admin/usuarios" element={
              <RoleRoute roles={['SYSADMIN']}><UsersPage /></RoleRoute>
            } />
            <Route path="/admin/roles" element={
              <RoleRoute roles={['SYSADMIN']}><RolesPage /></RoleRoute>
            } />
            <Route path="/admin/sedes" element={
              <RoleRoute roles={['SYSADMIN', 'COORDSISTEMA']}><LocationsPage /></RoleRoute>
            } />

            {/* Bienes */}
            <Route path="/bienes" element={<AssetsPage />} />
            <Route path="/bienes/:id" element={<AssetDetailPage />} />

            {/* Operaciones */}
            <Route path="/mantenimiento" element={<MaintenancePage />} />
            <Route path="/traslados"     element={<TransfersPage />} />
            <Route path="/bajas"         element={<DecommissionPage />} />

            {/* Reportes */}
            <Route path="/reportes" element={
              <RoleRoute roles={['SYSADMIN','COORDSISTEMA','ASISTSISTEMA','ADMINSEDE']}>
                <ReportsPage />
              </RoleRoute>
            } />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
    </AuthProvider>
  </QueryClientProvider>
);

export default AppRouter;
```

## src/router/PrivateRoute.jsx

```jsx
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import AppLoader from '../components/common/AppLoader';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <AppLoader text="Verificando sesión..." />
    </div>
  );

  return user ? children : <Navigate to="/login" replace />;
};

export default PrivateRoute;
```

## src/router/RoleRoute.jsx

```jsx
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';

const RoleRoute = ({ children, roles }) => {
  const { hasRole } = useAuth();
  return hasRole(roles) ? children : <Navigate to="/dashboard" replace />;
};

export default RoleRoute;
```

## src/main.jsx

```jsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import AppRouter from './router/AppRouter';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppRouter />
  </StrictMode>
);
```

---

## PASO FINAL: Levantar todo el sistema

```bash
# Terminal 1 — ms-usuarios (puerto 8001)
cd sigap/ms-usuarios
source venv/bin/activate
export DJANGO_SETTINGS_MODULE=config.settings.dev
python manage.py runserver 0.0.0.0:8001

# Terminal 2 — ms-bienes (puerto 8002)
cd sigap/ms-bienes
source venv/bin/activate
export DJANGO_SETTINGS_MODULE=config.settings.dev
python manage.py runserver 0.0.0.0:8002

# Terminal 3 — ms-reportes (puerto 8003)
cd sigap/ms-reportes
source venv/bin/activate
export DJANGO_SETTINGS_MODULE=config.settings.dev
python manage.py runserver 0.0.0.0:8003

# Terminal 4 — Frontend React 19
cd sigap/frontend
npm run dev

# Acceder en: http://localhost:5173
```

---

## RESUMEN DE ENDPOINTS CLAVE

### ms-usuarios (puerto 8001)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/v1/auth/login/` | Login → JWT en HttpOnly Cookie |
| POST | `/api/v1/auth/logout/` | Logout → borra cookies |
| POST | `/api/v1/auth/refresh/` | Refresca access token |
| GET  | `/api/v1/auth/me/` | Datos del usuario autenticado |
| GET/POST | `/api/v1/users/sistema/` | CRUD usuarios sistema |
| PATCH | `/api/v1/users/sistema/{id}/toggle-estado/` | Activar/inactivar |
| PATCH | `/api/v1/users/sistema/{id}/change-role/` | Cambiar rol |
| GET  | `/api/v1/users/institucionales/search-dni/` | Buscar por DNI |
| GET/POST | `/api/v1/roles/roles/` | CRUD roles |
| POST | `/api/v1/roles/roles/{id}/assign-permissions/` | Asignar permisos |
| GET/POST | `/api/v1/locations/sedes/` | CRUD sedes |
| GET  | `/api/v1/locations/sedes/{id}/modulos/` | Módulos de una sede |

### ms-bienes (puerto 8002)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET/POST | `/api/v1/assets/bienes/` | CRUD bienes |
| GET/POST | `/api/v1/maintenance/ordenes/` | Órdenes de mantenimiento |
| PATCH | `/api/v1/maintenance/ordenes/{id}/approve/` | Aprobar mantenimiento |
| GET  | `/api/v1/maintenance/ordenes/{id}/pdf/` | Generar PDF |
| GET/POST | `/api/v1/transfers/traslados/` | Traslados |
| PATCH | `/api/v1/transfers/traslados/{id}/approve-seguridad/` | Aprobación seguridad |
| GET/POST | `/api/v1/decommission/bajas/` | Solicitudes de baja |
