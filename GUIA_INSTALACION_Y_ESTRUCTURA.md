# 🏛️ SIGAP - Sistema de Gestión de Activos del Poder Judicial
## Corte Superior de Justicia de Lima Norte
### Guía Completa de Instalación y Estructura del Proyecto

---

## 📋 PRERREQUISITOS - Instalaciones Globales

### 1. Herramientas Base (instalar en este orden)

```bash
# ========================================================
# A) NODE.JS (v20 LTS) - Descargar desde https://nodejs.org
# ========================================================
# Verificar instalación:
node --version   # debe mostrar v20.x.x
npm --version    # debe mostrar 10.x.x

# ========================================================
# B) PYTHON (v3.11+) - Descargar desde https://python.org
# ========================================================
# Verificar instalación:
python --version  # debe mostrar Python 3.11.x

# ========================================================
# C) GIT - Descargar desde https://git-scm.com
# ========================================================
git --version    # debe mostrar git version 2.x.x

# ========================================================
# D) POSTGRESQL (v16) - Descargar desde https://postgresql.org
# ========================================================
# Durante instalación: recordar usuario=postgres, contraseña que pongas
psql --version   # debe mostrar psql (PostgreSQL) 16.x
```

---

## 🗂️ ESTRUCTURA GENERAL DEL REPOSITORIO

```
sigap/
├── frontend/          ← React + Vite + TailwindCSS
├── backend/           ← Django + DRF + PostgreSQL
├── .gitignore
└── README.md
```

---

## ⚙️ PASO 1 — Configurar Git y GitHub

```bash
# Abrir terminal en VSCode (Ctrl + `)

# Configurar identidad Git (solo una vez)
git config --global user.name "Tu Nombre"
git config --global user.email "tu@email.com"

# Crear carpeta raíz del proyecto
mkdir sigap
cd sigap

# Inicializar repositorio
git init

# Crear .gitignore raíz
cat > .gitignore << 'EOF'
# Python
__pycache__/
*.py[cod]
*.pyo
*.pyd
.Python
*.egg-info/
dist/
build/
venv/
env/
.env

# Node
node_modules/
dist/
.cache/

# VSCode
.vscode/settings.json

# OS
.DS_Store
Thumbs.db

# Django
*.sqlite3
media/
staticfiles/

# Environment files
.env
.env.local
.env.production
EOF

# Crear README
echo "# SIGAP - Sistema de Control Patrimonial -Corte Superior de Justicia de Lima Norte - Poder Judicial" > README.md

# Primer commit
git add .
git commit -m "feat: inicializar repositorio SIGAP"

# Conectar con GitHub (crear repo vacío en github.com primero)
git remote add origin https://github.com/TU_USUARIO/sigap.git
git branch -M main
git push -u origin main
```

---

## 🖥️ PASO 2 — BACKEND: Django + PostgreSQL

### 2.1 Crear Base de Datos en PostgreSQL

```sql
-- Abrir pgAdmin o terminal psql:
psql -U postgres

-- Crear base de datos y usuario
CREATE DATABASE sigap_db;
CREATE USER sigap_user WITH PASSWORD 'sigap2024*';
GRANT ALL PRIVILEGES ON DATABASE sigap_db TO sigap_user;
ALTER DATABASE sigap_db OWNER TO sigap_user;
\q
```

### 2.2 Crear proyecto Django

```bash
# Desde la carpeta sigap/
cd sigap

# Crear entorno virtual Python
python -m venv venv

# Activar entorno virtual
# En Windows:
venv\Scripts\activate
# En Mac/Linux:
source venv/bin/activate

# Instalar dependencias
pip install django==5.0.4
pip install djangorestframework==3.15.1
pip install django-cors-headers==4.3.1
pip install psycopg2-binary==2.9.9
pip install python-decouple==3.8
pip install djangorestframework-simplejwt==5.3.1
pip install django-filter==24.2
pip install Pillow==10.3.0
pip install reportlab==4.1.0
pip install openpyxl==3.1.2
pip install celery==5.3.6
pip install redis==5.0.4
pip install django-channels==4.1.0

# Guardar dependencias
pip freeze > backend/requirements.txt

# Crear proyecto Django
django-admin startproject config backend/
cd backend/

# Crear microservicios como apps Django
python manage.py startapp apps/users
python manage.py startapp apps/assets
python manage.py startapp apps/maintenance
python manage.py startapp apps/transfers
python manage.py startapp apps/decommission
python manage.py startapp apps/reports
python manage.py startapp apps/locations
python manage.py startapp apps/notifications
```

### 2.3 Estructura del Backend

```
backend/
├── config/
│   ├── __init__.py
│   ├── settings/
│   │   ├── __init__.py
│   │   ├── base.py          ← Configuración base
│   │   ├── development.py   ← Config desarrollo
│   │   └── production.py    ← Config producción
│   ├── urls.py
│   ├── wsgi.py
│   └── asgi.py
├── apps/
│   ├── users/               ← Gestión de usuarios, roles, permisos
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── urls.py
│   │   └── permissions.py
│   ├── locations/           ← Sedes, Módulos, Áreas
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   └── urls.py
│   ├── assets/              ← Bienes/Activos informáticos
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   └── urls.py
│   ├── maintenance/         ← Mantenimiento preventivo
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   └── urls.py
│   ├── transfers/           ← Traslados/Asignaciones
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   └── urls.py
│   ├── decommission/        ← Baja/Salida de bienes
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   └── urls.py
│   ├── reports/             ← Reportes y estadísticas
│   │   ├── views.py
│   │   └── urls.py
│   └── notifications/       ← Alertas del sistema
│       ├── models.py
│       ├── consumers.py     ← WebSocket
│       └── utils.py
├── requirements.txt
├── .env
└── manage.py
```

### 2.4 Archivo .env del Backend

```bash
# backend/.env
DEBUG=True
SECRET_KEY=django-insecure-tu-clave-secreta-aqui-cambiar-en-produccion
DATABASE_URL=postgresql://sigap_user:sigap2024*@localhost:5432/sigap_db

DB_NAME=sigap_db
DB_USER=sigap_user
DB_PASSWORD=sigap2024*
DB_HOST=localhost
DB_PORT=5432

ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:5173
```

### 2.5 Configuración settings/base.py

```python
# backend/config/settings/base.py
from pathlib import Path
from decouple import config

BASE_DIR = Path(__file__).resolve().parent.parent.parent

SECRET_KEY = config('SECRET_KEY')
DEBUG = config('DEBUG', default=False, cast=bool)

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
    'corsheaders',
    'django_filters',
    'channels',
]

LOCAL_APPS = [
    'apps.users',
    'apps.locations',
    'apps.assets',
    'apps.maintenance',
    'apps.transfers',
    'apps.decommission',
    'apps.reports',
    'apps.notifications',
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
        'rest_framework_simplejwt.authentication.JWTAuthentication',
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
    'PAGE_SIZE': 10,
}

from datetime import timedelta
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=8),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
}

CORS_ALLOWED_ORIGINS = config('CORS_ALLOWED_ORIGINS', default='').split(',')

LANGUAGE_CODE = 'es-pe'
TIME_ZONE = 'America/Lima'
USE_I18N = True
USE_TZ = True

STATIC_URL = '/static/'
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
```

### 2.6 Ejecutar migraciones y servidor

```bash
# Desde backend/
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver 0.0.0.0:8000
```

---

## ⚛️ PASO 3 — FRONTEND: React + Vite + TailwindCSS

### 3.1 Crear proyecto React con Vite

```bash
# Desde la carpeta sigap/
cd sigap

# Crear proyecto React + Vite
npm create vite@latest frontend -- --template react
cd frontend

# Instalar dependencias base
npm install

# Instalar TailwindCSS v3
npm install -D tailwindcss@3 postcss autoprefixer
npx tailwindcss init -p

# Instalar librerías esenciales del proyecto
npm install axios
npm install react-router-dom
npm install @tanstack/react-table
npm install react-hook-form
npm install @hookform/resolvers
npm install zod
npm install react-query
npm install @tanstack/react-query

# UI Components
npm install @headlessui/react
npm install @heroicons/react
npm install lucide-react

# Notificaciones y utilidades
npm install react-hot-toast
npm install date-fns
npm install react-datepicker
npm install recharts

# Excel y PDF (para reportes)
npm install xlsx
npm install jspdf
npm install jspdf-autotable

# Drag and drop (para tablas)
npm install @dnd-kit/core @dnd-kit/sortable

# Animaciones
npm install framer-motion
```

### 3.2 Configurar tailwind.config.js

```javascript
// frontend/tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#f0f4ff',
          100: '#e0e9ff',
          200: '#c7d6ff',
          300: '#a4b8fd',
          400: '#818efb',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        judiciary: {
          dark:   '#1a237e',
          medium: '#283593',
          light:  '#3949ab',
          accent: '#c62828',
          gold:   '#f9a825',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0,0,0,0.1), 0 1px 2px -1px rgba(0,0,0,0.1)',
        'card-hover': '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)',
      }
    },
  },
  plugins: [],
}
```

### 3.3 Configurar src/index.css

```css
/* frontend/src/index.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

@layer base {
  * { @apply border-border; }
  body { @apply bg-gray-50 text-gray-900 font-sans antialiased; }
}

@layer components {
  .btn-primary {
    @apply bg-primary-600 hover:bg-primary-700 text-white font-medium px-4 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2 disabled:opacity-50;
  }
  .btn-secondary {
    @apply bg-white hover:bg-gray-50 text-gray-700 font-medium px-4 py-2 rounded-lg border border-gray-300 transition-colors duration-200 flex items-center gap-2;
  }
  .btn-danger {
    @apply bg-red-600 hover:bg-red-700 text-white font-medium px-4 py-2 rounded-lg transition-colors duration-200;
  }
  .card {
    @apply bg-white rounded-xl shadow-card border border-gray-100 p-6;
  }
  .input-field {
    @apply w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all;
  }
  .label {
    @apply block text-sm font-medium text-gray-700 mb-1;
  }
  .badge-active   { @apply inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800; }
  .badge-inactive { @apply inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800; }
  .badge-pending  { @apply inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800; }
  .badge-process  { @apply inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800; }
  .badge-done     { @apply inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800; }
}

/* Scrollbar personalizada */
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { @apply bg-gray-100; }
::-webkit-scrollbar-thumb { @apply bg-gray-400 rounded-full; }
::-webkit-scrollbar-thumb:hover { @apply bg-gray-500; }
```

---

## 📁 ESTRUCTURA COMPLETA DEL FRONTEND (src/)

```
frontend/src/
├── main.jsx                      ← Punto de entrada
├── App.jsx                       ← Router principal
├── index.css                     ← Estilos globales
│
├── api/                          ← Instancias Axios configuradas
│   ├── axios.js                  ← Configuración base de Axios + interceptores
│   ├── authApi.js
│   ├── usersApi.js
│   ├── locationsApi.js
│   ├── assetsApi.js
│   ├── maintenanceApi.js
│   ├── transfersApi.js
│   ├── decommissionApi.js
│   └── reportsApi.js
│
├── constants/                    ← Constantes globales del sistema
│   ├── roles.js                  ← SYSADMIN, COORDSISTEMA, ASISTSISTEMA, etc.
│   ├── states.js                 ← Estados: activo, pendiente_aprobacion, etc.
│   ├── assetTypes.js             ← Tipos de bienes: CPU, MONITOR, TECLADO, etc.
│   ├── routes.js                 ← Rutas nombradas
│   └── permissions.js            ← Mapa rol → permisos
│
├── contexts/                     ← Contextos React globales
│   ├── AuthContext.jsx           ← Usuario autenticado, token, rol
│   ├── NotificationContext.jsx   ← Alertas y notificaciones del sistema
│   └── ThemeContext.jsx          ← Tema UI
│
├── hooks/                        ← Custom hooks reutilizables
│   ├── useAuth.js                ← Acceso al AuthContext
│   ├── usePermissions.js         ← Verificar permisos por rol
│   ├── useTable.js               ← Config TanStack Table
│   ├── useModal.js               ← Manejo de modales
│   ├── usePagination.js
│   ├── useDebounce.js
│   ├── useNotifications.js
│   └── useExportData.js          ← Exportar Excel/PDF
│
├── services/                     ← Lógica de negocio + llamadas API
│   ├── authService.js
│   ├── userService.js
│   ├── locationService.js
│   ├── assetService.js
│   ├── maintenanceService.js
│   ├── transferService.js
│   ├── decommissionService.js
│   └── reportService.js
│
├── components/                   ← Componentes reutilizables UI
│   ├── common/
│   │   ├── AppTable.jsx          ← Tabla genérica TanStack con búsqueda/paginación
│   │   ├── AppModal.jsx          ← Modal genérico con backdrop
│   │   ├── AppBadge.jsx          ← Badge de estado
│   │   ├── AppButton.jsx         ← Botón reutilizable
│   │   ├── AppSelect.jsx         ← Select con búsqueda
│   │   ├── AppPagination.jsx     ← Paginación
│   │   ├── AppSearchBar.jsx      ← Barra de búsqueda global
│   │   ├── AppConfirm.jsx        ← Modal de confirmación
│   │   ├── AppLoader.jsx         ← Spinner de carga
│   │   ├── AppEmptyState.jsx     ← Estado vacío de tablas
│   │   ├── AppExportButtons.jsx  ← Botones exportar Excel/PDF
│   │   ├── AppFormField.jsx      ← Input con label + error
│   │   ├── AppTooltip.jsx
│   │   └── AppNotificationBell.jsx ← Campana con badge contador
│   │
│   ├── layout/
│   │   ├── MainLayout.jsx        ← Layout principal con sidebar
│   │   ├── Sidebar.jsx           ← Menú lateral colapsable
│   │   ├── Header.jsx            ← Barra superior con usuario y notifs
│   │   ├── BreadCrumb.jsx
│   │   └── AuthLayout.jsx        ← Layout para login
│   │
│   └── charts/
│       ├── AssetsByTypeChart.jsx
│       ├── AssetsByStatusChart.jsx
│       └── MaintenanceTimelineChart.jsx
│
├── pages/                        ← Vistas principales por módulo
│   ├── auth/
│   │   └── LoginPage.jsx
│   │
│   ├── dashboard/
│   │   └── DashboardPage.jsx     ← Estadísticas y alertas
│   │
│   ├── admin/                    ← GESTIÓN ADMINISTRATIVA
│   │   ├── users/
│   │   │   ├── UsersPage.jsx     ← Lista de usuarios con tabla
│   │   │   ├── UserModal.jsx     ← Modal crear/editar usuario
│   │   │   └── UserDetailPage.jsx
│   │   ├── roles/
│   │   │   ├── RolesPage.jsx
│   │   │   └── RoleModal.jsx
│   │   └── locations/
│   │       ├── LocationsPage.jsx ← Gestión Sedes/Módulos/Áreas (tabs)
│   │       ├── SedeModal.jsx
│   │       ├── ModuloModal.jsx
│   │       └── AreaModal.jsx
│   │
│   ├── assets/                   ← GESTIÓN DE BIENES
│   │   ├── AssetsPage.jsx        ← Lista de activos con filtros
│   │   ├── AssetModal.jsx        ← Modal crear/editar bien (dinámico por tipo)
│   │   ├── AssetDetailPage.jsx   ← Detalle completo del activo + historial
│   │   └── catalogs/
│   │       └── CatalogsPage.jsx  ← Catálogos: Marca, TipoBien, etc.
│   │
│   ├── maintenance/              ← MANTENIMIENTO PREVENTIVO
│   │   ├── MaintenancePage.jsx   ← Lista de órdenes de mantenimiento
│   │   ├── MaintenanceModal.jsx  ← Modal crear/editar mantenimiento
│   │   ├── MaintenanceDetailPage.jsx ← Detalle + formulario técnico
│   │   └── MaintenanceApprovalModal.jsx ← Modal aprobar/desaprobar ADMINSEDE
│   │
│   ├── transfers/                ← TRASLADOS / ASIGNACIONES
│   │   ├── TransfersPage.jsx
│   │   ├── TransferModal.jsx
│   │   ├── TransferDetailPage.jsx
│   │   └── TransferApprovalModal.jsx
│   │
│   ├── decommission/             ← BAJA / SALIDA
│   │   ├── DecommissionPage.jsx
│   │   ├── DecommissionModal.jsx ← Informe técnico de baja
│   │   ├── DecommissionDetailPage.jsx
│   │   └── DecommissionApprovalModal.jsx
│   │
│   └── reports/                  ← GESTIÓN DE REPORTES
│       ├── ReportsPage.jsx       ← Dashboard de reportes con tabs
│       ├── ActiveAssetsReport.jsx
│       ├── InactiveAssetsReport.jsx
│       ├── MaintenanceReport.jsx
│       └── DecommissionReport.jsx
│
└── router/
    ├── AppRouter.jsx             ← Definición de todas las rutas
    ├── PrivateRoute.jsx          ← Protección de rutas por auth
    └── RoleRoute.jsx             ← Protección de rutas por rol
```

---

## 🔌 PASO 4 — Archivos clave del Frontend

### api/axios.js — Configuración central Axios

```javascript
// src/api/axios.js
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Interceptor REQUEST — agrega token JWT automáticamente
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor RESPONSE — refresca token si expira
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        const { data } = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, { refresh: refreshToken });
        localStorage.setItem('access_token', data.access);
        original.headers.Authorization = `Bearer ${data.access}`;
        return apiClient(original);
      } catch {
        localStorage.clear();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

### constants/roles.js

```javascript
// src/constants/roles.js
export const ROLES = {
  SYSADMIN:     'SYSADMIN',
  COORDSISTEMA: 'COORDSISTEMA',
  ASISTSISTEMA: 'ASISTSISTEMA',
  ADMINSEDE:    'ADMINSEDE',
  SEGURSEDE:    'SEGURSEDE',
};

export const ROLE_LABELS = {
  SYSADMIN:     'Administrador del Sistema',
  COORDSISTEMA: 'Coordinador de Sistemas',
  ASISTSISTEMA: 'Asistente de Sistemas',
  ADMINSEDE:    'Administrador de Sede',
  SEGURSEDE:    'Seguridad de Sede',
};

// Permisos por módulo según rol
export const ROLE_PERMISSIONS = {
  SYSADMIN: {
    users: ['view','create','edit','delete'],
    roles: ['view','create','edit','delete'],
    locations: ['view','create','edit','delete'],
    assets: ['view','create','edit','delete'],
    maintenance: ['view','create','edit','approve'],
    transfers: ['view','create','edit','approve'],
    decommission: ['view','create','edit','approve'],
    reports: ['view','export'],
  },
  COORDSISTEMA: {
    users: ['view'],
    assets: ['view','create','edit'],
    maintenance: ['view','approve_final'],
    transfers: ['view','create','edit'],
    decommission: ['view','approve'],
    reports: ['view','export'],
    locations: ['view'],
  },
  ASISTSISTEMA: {
    assets: ['view','create','edit'],
    maintenance: ['view','create','edit','cancel'],
    transfers: ['view','create','edit','cancel'],
    decommission: ['view','create','edit','cancel'],
    reports: ['view'],
  },
  ADMINSEDE: {
    assets: ['view'],
    maintenance: ['view','approve'],
    transfers: ['view','approve'],
    decommission: ['view'],
    reports: ['view'],
  },
  SEGURSEDE: {
    transfers: ['view','approve_entry_exit'],
  },
};
```

### constants/states.js

```javascript
// src/constants/states.js
export const MAINTENANCE_STATES = {
  REGISTRADO:          { label: 'Registrado',           color: 'blue' },
  EN_PROCESO:          { label: 'En Proceso',           color: 'yellow' },
  PENDIENTE_APROBACION:{ label: 'Pendiente Aprobación', color: 'orange' },
  DEVUELTO:            { label: 'Devuelto',             color: 'red' },
  ATENDIDO:            { label: 'Atendido',             color: 'green' },
  CANCELADO:           { label: 'Cancelado',            color: 'gray' },
};

export const TRANSFER_STATES = { ...MAINTENANCE_STATES };
export const DECOMMISSION_STATES = { ...MAINTENANCE_STATES };

export const ASSET_STATUS = {
  ACTIVO:   { label: 'Activo',   color: 'green' },
  INACTIVO: { label: 'Inactivo', color: 'red' },
};

export const ASSET_FUNCTION_STATUS = {
  OPERATIVO:   { label: 'Operativo',   color: 'green' },
  AVERIADO:    { label: 'Averiado',    color: 'yellow' },
  INOPERATIVO: { label: 'Inoperativo', color: 'red' },
};
```

### router/AppRouter.jsx — Rutas principales

```javascript
// src/router/AppRouter.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import AuthLayout from '../components/layout/AuthLayout';
import PrivateRoute from './PrivateRoute';
import RoleRoute from './RoleRoute';
import { ROLES } from '../constants/roles';

// Auth
import LoginPage from '../pages/auth/LoginPage';

// Dashboard
import DashboardPage from '../pages/dashboard/DashboardPage';

// Admin
import UsersPage from '../pages/admin/users/UsersPage';
import RolesPage from '../pages/admin/roles/RolesPage';
import LocationsPage from '../pages/admin/locations/LocationsPage';

// Bienes
import AssetsPage from '../pages/assets/AssetsPage';
import AssetDetailPage from '../pages/assets/AssetDetailPage';
import CatalogsPage from '../pages/assets/catalogs/CatalogsPage';

// Operaciones
import MaintenancePage from '../pages/maintenance/MaintenancePage';
import MaintenanceDetailPage from '../pages/maintenance/MaintenanceDetailPage';
import TransfersPage from '../pages/transfers/TransfersPage';
import TransferDetailPage from '../pages/transfers/TransferDetailPage';
import DecommissionPage from '../pages/decommission/DecommissionPage';
import DecommissionDetailPage from '../pages/decommission/DecommissionDetailPage';

// Reportes
import ReportsPage from '../pages/reports/ReportsPage';

const AppRouter = () => (
  <BrowserRouter>
    <Routes>
      {/* Rutas públicas */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>

      {/* Rutas protegidas */}
      <Route element={<PrivateRoute><MainLayout /></PrivateRoute>}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />

        {/* Gestión Administrativa */}
        <Route path="/admin/usuarios" element={
          <RoleRoute roles={[ROLES.SYSADMIN]}><UsersPage /></RoleRoute>
        } />
        <Route path="/admin/roles" element={
          <RoleRoute roles={[ROLES.SYSADMIN]}><RolesPage /></RoleRoute>
        } />
        <Route path="/admin/sedes" element={
          <RoleRoute roles={[ROLES.SYSADMIN, ROLES.COORDSISTEMA]}><LocationsPage /></RoleRoute>
        } />

        {/* Gestión de Bienes */}
        <Route path="/bienes" element={<AssetsPage />} />
        <Route path="/bienes/:id" element={<AssetDetailPage />} />
        <Route path="/bienes/catalogos" element={
          <RoleRoute roles={[ROLES.SYSADMIN, ROLES.COORDSISTEMA, ROLES.ASISTSISTEMA]}>
            <CatalogsPage />
          </RoleRoute>
        } />

        {/* Mantenimiento */}
        <Route path="/mantenimiento" element={<MaintenancePage />} />
        <Route path="/mantenimiento/:id" element={<MaintenanceDetailPage />} />

        {/* Traslados */}
        <Route path="/traslados" element={<TransfersPage />} />
        <Route path="/traslados/:id" element={<TransferDetailPage />} />

        {/* Bajas */}
        <Route path="/bajas" element={<DecommissionPage />} />
        <Route path="/bajas/:id" element={<DecommissionDetailPage />} />

        {/* Reportes */}
        <Route path="/reportes" element={
          <RoleRoute roles={[ROLES.SYSADMIN, ROLES.COORDSISTEMA, ROLES.ASISTSISTEMA, ROLES.ADMINSEDE]}>
            <ReportsPage />
          </RoleRoute>
        } />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </BrowserRouter>
);

export default AppRouter;
```

---

## 🎨 PASO 5 — Menú del Sidebar con íconos

```javascript
// src/components/layout/Sidebar.jsx (estructura de navegación)

// El Sidebar tiene 3 secciones principales:
const MENU_ITEMS = [
  {
    section: 'Principal',
    items: [
      { label: 'Dashboard', path: '/dashboard', icon: 'HomeIcon' },
    ]
  },
  {
    section: 'Gestión Administrativa',
    items: [
      { label: 'Usuarios',          path: '/admin/usuarios', icon: 'UsersIcon',    roles: ['SYSADMIN'] },
      { label: 'Roles y Permisos',  path: '/admin/roles',    icon: 'ShieldIcon',   roles: ['SYSADMIN'] },
      { label: 'Sedes / Módulos',   path: '/admin/sedes',    icon: 'BuildingIcon', roles: ['SYSADMIN','COORDSISTEMA'] },
    ]
  },
  {
    section: 'Gestión de Bienes',
    items: [
      { label: 'Activos',          path: '/bienes',         icon: 'ComputerIcon',  roles: ['SYSADMIN','COORDSISTEMA','ASISTSISTEMA','ADMINSEDE'] },
      { label: 'Catálogos',        path: '/bienes/catalogos',icon: 'TagIcon',      roles: ['SYSADMIN','COORDSISTEMA','ASISTSISTEMA'] },
      { label: 'Mantenimiento',    path: '/mantenimiento',  icon: 'WrenchIcon',    roles: ['SYSADMIN','COORDSISTEMA','ASISTSISTEMA','ADMINSEDE'] },
      { label: 'Traslados',        path: '/traslados',      icon: 'ArrowsIcon',    roles: ['SYSADMIN','COORDSISTEMA','ASISTSISTEMA','ADMINSEDE','SEGURSEDE'] },
      { label: 'Bajas / Salidas',  path: '/bajas',          icon: 'TrashIcon',     roles: ['SYSADMIN','COORDSISTEMA','ASISTSISTEMA','ADMINSEDE'] },
    ]
  },
  {
    section: 'Reportes',
    items: [
      { label: 'Reportes',         path: '/reportes',       icon: 'ChartIcon',     roles: ['SYSADMIN','COORDSISTEMA','ASISTSISTEMA','ADMINSEDE'] },
    ]
  },
];
```

---

## 🧩 PASO 6 — Componente AppTable (TanStack Table)

```javascript
// src/components/common/AppTable.jsx
// Tabla profesional con: búsqueda, paginación, sorting, export, acciones
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
} from '@tanstack/react-table';
import { useState } from 'react';
import AppPagination from './AppPagination';
import AppSearchBar from './AppSearchBar';
import AppExportButtons from './AppExportButtons';
import AppLoader from './AppLoader';
import AppEmptyState from './AppEmptyState';

const AppTable = ({
  columns,
  data = [],
  loading = false,
  title,
  onAdd,
  addLabel = 'Nuevo',
  searchable = true,
  exportable = true,
  pagination = true,
}) => {
  const [sorting, setSorting] = useState([]);
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          {title && <h2 className="text-lg font-semibold text-gray-800">{title}</h2>}
          <p className="text-sm text-gray-500 mt-0.5">
            {table.getFilteredRowModel().rows.length} registro(s)
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {searchable && (
            <AppSearchBar value={globalFilter} onChange={setGlobalFilter} />
          )}
          {exportable && <AppExportButtons data={data} columns={columns} title={title} />}
          {onAdd && (
            <button onClick={onAdd} className="btn-primary">
              <span>＋</span> {addLabel}
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            {table.getHeaderGroups().map(hg => (
              <tr key={hg.id}>
                {hg.headers.map(header => (
                  <th
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer select-none hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getIsSorted() === 'asc' && ' ↑'}
                      {header.column.getIsSorted() === 'desc' && ' ↓'}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={columns.length} className="py-16"><AppLoader /></td></tr>
            ) : table.getRowModel().rows.length === 0 ? (
              <tr><td colSpan={columns.length} className="py-16"><AppEmptyState /></td></tr>
            ) : (
              table.getRowModel().rows.map(row => (
                <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id} className="px-4 py-3 text-sm text-gray-700">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && !loading && <AppPagination table={table} />}
    </div>
  );
};

export default AppTable;
```

---

## 🔐 PASO 7 — Configuración .env del Frontend

```bash
# frontend/.env
VITE_API_URL=http://localhost:8000/api/v1
VITE_APP_NAME=SIGAP
VITE_INSTITUTION=Corte Superior de Justicia de Lima Norte
VITE_PARENT_INSTITUTION=Poder Judicial del Perú
```

---

## 🚀 PASO 8 — Levantar el sistema completo

```bash
# Terminal 1 — Backend Django
cd sigap/backend
source venv/bin/activate   # Windows: venv\Scripts\activate
python manage.py runserver

# Terminal 2 — Frontend React
cd sigap/frontend
npm run dev

# URLs:
# Frontend: http://localhost:5173
# Backend API: http://localhost:8000/api/v1
# Django Admin: http://localhost:8000/admin
```

---

## 📊 MODELOS PRINCIPALES DE BASE DE DATOS

### Resumen de tablas clave:

| App | Modelos principales |
|-----|---------------------|
| users | User, Role, Permission, RolePermission |
| locations | Institution, Court, Sede, Modulo, Area |
| assets | TipoBien, Marca, Bien, BienCPU, BienImpresora, BienMonitor |
| maintenance | OrdenMantenimiento, DetalleMantenimiento, ImagenMantenimiento |
| transfers | Traslado, DetalleTrasladoBien |
| decommission | SolicitudBaja, DetalleBaja, InformeBaja |
| notifications | Notificacion, NotificacionUsuario |

---

## 📦 Scripts útiles package.json

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext js,jsx --report-unused-disable-directives --max-warnings 0"
  }
}
```

---

## 🔄 Flujo de trabajo Git recomendado

```bash
# Ramas por módulo
git checkout -b feature/modulo-usuarios
git checkout -b feature/modulo-bienes
git checkout -b feature/modulo-mantenimiento
git checkout -b feature/modulo-traslados
git checkout -b feature/modulo-bajas
git checkout -b feature/modulo-reportes

# Por cada feature completada
git add .
git commit -m "feat(usuarios): implementar CRUD de usuarios con modal"
git push origin feature/modulo-usuarios

# Merge a main
git checkout main
git merge feature/modulo-usuarios
git push origin main
```

---

> **SIGAP v1.0** — Sistema de Gestión de Activos del Poder Judicial  
> Corte Superior de Justicia de Lima Norte  
> Stack: React 18 + Vite + TailwindCSS v3 | Django 5 + DRF + PostgreSQL 16
