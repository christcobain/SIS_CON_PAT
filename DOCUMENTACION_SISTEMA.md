# 🏢 SISCONPAT — Documentación Oficial del Proyecto
> Sistema Integrado de Control Patrimonial - Corte Superior de Justicia
 Explica detalladamente el funcionamiento del sistema, la arquitectura de microservicios, el modelo de datos y los procedimientos principales.

---

## 1. 📖 Propósito y Visión General del Sistema
**SISCONPAT** es un sistema diseñado para la gestión y control del patrimonio informático (CPUs, Monitores, Impresoras, Switches, etc.) dentro de una organización. 

**¿Qué hace el sistema?**
Permite rastrear el ciclo de vida completo de un bien informático:
1. **Registro:** Ingreso de nuevos bienes al sistema.
2. **Traslados:** Envío de bienes entre diferentes sedes (requiere aprobación de seguridad).
3. **Asignación:** Entrega del equipo a un usuario final dentro de una sede.
4. **Mantenimiento:** Registro de reparaciones y mantenimientos preventivos.
5. **Baja:** Proceso de retiro definitivo del equipo (por avería, obsolescencia, etc.).

---

## 2. 🏗️ Arquitectura de Microservicios

El sistema Backend está dividido en 3 microservicios independientes, desplegados en **Railway** (con frontend en **Vercel**). Cada uno cuenta con su propia base de datos **PostgreSQL** alojada en **Supabase**.

```mermaid
graph TD
    UI[Frontend - React/Next.js en Vercel]
    
    subgraph Backend [Backend - Railway / Django REST]
        MS_USERS(ms-usuarios<br/>Puerto 8001)
        MS_BIENES(ms-bienes<br/>Puerto 8002)
        MS_REPORTS(ms-reportes<br/>Puerto 8003)
    end
    
    subgraph Bases de Datos [Supabase PostgreSQL]
        DB_USERS[(db_usuarios)]
        DB_BIENES[(db_bienes)]
        DB_REPORTS[(db_reportes)]
    end

    UI -->|JWT / HTTPS| MS_USERS
    UI -->|JWT / HTTPS| MS_BIENES
    UI -->|JWT / HTTPS| MS_REPORTS

    MS_USERS --> DB_USERS
    MS_BIENES --> DB_BIENES
    MS_REPORTS --> DB_REPORTS

    MS_BIENES -.->|Peticiones HTTP internas<br/>Validación IDs| MS_USERS
```

### 🔹 2.1 Conexión a Base de Datos (Supabase vs Local)
En producción, los microservicios se conectan a **Supabase (PostgreSQL)** mediante las variables de entorno configuradas en Railway.
Para pruebas locales, se recomienda utilizar una instalación local de PostgreSQL. En tu archivo `.env` o `settings.py` (sección `DATABASES`), comenta las credenciales de Supabase y habilita las locales:

```python
# Ejemplo configuración DB en settings/base.py o .env
# PROD (Supabase)
# DATABASE_URL=postgres://postgres.[PROYECTO]:[PASSWORD]@aws-0-us-west-1.pooler.supabase.com:6543/postgres

# LOCAL (Descomentar para desarrollo local)
# DB_NAME=db_usuarios
# DB_USER=postgres
# DB_PASSWORD=tu_password
# DB_HOST=localhost
# DB_PORT=5432
```

---

## 3. 🧩 Detalle de Microservicios y sus Apps

### 🟢 Microservicio: `ms-usuarios`
Se encarga de la seguridad, autenticación, ubicaciones y manejo del personal.
* **`authentication`**: Maneja el Login, generación de tokens JWT (almacenados en *Cookies HTTP-only* para mayor seguridad), historial de contraseñas y múltiples sesiones.
* **`users`**: Gestiona los usuarios del sistema. Conecta con una tabla externa o vista `bdempleados` (Recursos Humanos) para validar y autocompletar la información de un DNI.
* **`roles`**: Maneja Roles y Permisos a nivel granular (Ej: `ms-bienes:transferencias:add_transferencia`).
* **`locations`**: Administra la jerarquía de lugares físicos: Empresa → Departamento → Provincia → Distrito → Sede → Módulo → Ubicación.

### 🔵 Microservicio: `ms-bienes`
Es el núcleo de negocio. Almacena las características técnicas del hardware y sus movimientos. Utiliza llaves foráneas lógicas (`IntegerField`) que apuntan a IDs de `ms-usuarios`.
* **`catalogos`**: Tablas maestras estáticas (Marcas, Tipos de bien, Estados, etc).
* **`bienes`**: La tabla central del equipo informático, con tablas de detalle 1:1 para especificaciones técnicas precisas (CPU, Monitor, Impresora, Scanner, Switch).
* **`transferencias`**: Registra traslados entre sedes y asignaciones internas de equipos a usuarios.
* **`mantenimientos`**: Permite a los técnicos registrar diagnósticos, reparaciones y fotos del estado del equipo.
* **`bajas`**: Genera los informes técnicos para dar de baja definitiva a un equipo malogrado.

### 🟡 Microservicio: `ms-reportes`
* **`reports`**: Genera exportables (PDF, Excel) leyendo la información procesada por los demás microservicios.

---

## 4. 🔐 Seguridad y Comunicación (JWT)

1. **Login:** El usuario envía credenciales a `ms-usuarios/api/v1/auth/login`.
2. **Generación:** `ms-usuarios` verifica y devuelve un Access Token y un Refresh Token empaquetados en *Cookies Seguras*.
3. **Peticiones:** En cada petición al frontend, este envía las cookies. Si se llama a `ms-bienes`, este último valida la firma del JWT usando la misma `SECRET_KEY` compartida en todos los microservicios o validándolo contra `ms-usuarios`.
4. **Permisos:** El token incluye de forma aplanada (`permissions_flat`) los accesos del usuario, permitiendo que cada microservicio autorice la acción antes de ejecutarla.

```mermaid
sequenceDiagram
    participant User as Frontend
    participant Auth as ms-usuarios (Auth)
    participant Bienes as ms-bienes

    User->>Auth: POST /login (DNI + Password)
    Auth-->>User: Retorna HTTP-Only Cookies (Access + Refresh JWT)
    User->>Bienes: POST /bienes/crear (envía Cookie JWT)
    Bienes->>Bienes: Valida firma JWT y verifica permiso 'add_bienes'
    Bienes-->>User: 201 Created (Bien registrado)
```

---

## 5. 🛠️ Procesos Principales Paso a Paso

### 5.1 Flujo: Crear un Nuevo Usuario del Sistema
El sistema no permite crear usuarios inventados; la persona debe existir en la base de datos de RRHH (`BDEmpleados`).

```mermaid
sequenceDiagram
    actor SysAdmin
    participant API as ms-usuarios/users
    participant RRHH as bdempleados

    SysAdmin->>API: 1. Busca empleado por DNI
    API->>RRHH: 2. SELECT * FROM bdempleados WHERE dni=?
    RRHH-->>API: 3. Retorna Nombres, Apellidos, Cargo
    API-->>SysAdmin: 4. Muestra datos validados
    
    SysAdmin->>API: 5. Envía POST /users/ (Datos + Rol + Dependencia + Sedes)
    API->>API: 6. Crea User (Password por defecto = DNI)
    API-->>SysAdmin: 7. Usuario creado exitosamente
```

**Paso a paso en interfaz:**
1. Ingresar el DNI del nuevo usuario y hacer clic en buscar.
2. El sistema autocompleta nombres y apellidos desde RRHH.
3. Se selecciona la **Empresa**, **Dependencia** y **Cargo**.
4. Se elige un **Rol** (Ej: `ASISTSISTEMA`, `ADMINSEDE`, `SYSADMIN`).
5. Se asignan las **Sedes** a las que el usuario tendrá acceso (multisede).
6. Al guardar, el usuario puede iniciar sesión con su DNI como contraseña (se le exigirá cambiarla).

### 5.2 Flujo: CRUD de Catálogos / Roles / Locations
Todos los elementos estáticos utilizan un patrón de capas limpios (`ViewSet` -> `Service` -> `Repository`/`Model`).
* **Crear:** Petición `POST /api/.../`. Se valida en el Serializer y se inserta en BD.
* **Modificar:** Petición `PATCH /api/.../{id}`. Solo modifica los campos enviados.
* **Inactivar / Activar (Soft Delete):** Petición `PATCH /api/.../{id}/deactivate` o `activate`. No se borran registros para mantener integridad histórica (FK), solo se cambia `is_active = False`.

### 5.3 Flujo: Traslado de un Bien entre Sedes
Este proceso evidencia la robustez del sistema en el manejo patrimonial, requiriendo validaciones cruzadas lógicas y físicas.

```mermaid
graph TD
    A[Coordinador: Inicia Traslado] -->|Estado: PENDIENTE| B(Notifica Admin Sede Origen)
    B --> C{Admin Sede: ¿Aprueba?}
    C -->|No| D[Estado: DEVUELTO]
    C -->|Sí| E(Agente Seguridad Origen)
    E --> F{¿Aprueba Salida Física?}
    F -->|Sí| G(Agente Seguridad Destino)
    G --> H{¿Aprueba Ingreso Físico?}
    H -->|Sí| I[Estado: ATENDIDO]
    I --> J[Actualiza Sede y Custodio del Bien en ms-bienes]
```

---

## 6. 📊 Tablas Principales por Microservicio

### 🟢 `ms-usuarios`
| Tabla / Modelo | Propósito |
|---|---|
| `users_user` | Tabla extendida de Django. Almacena login, DNI, estado, FK a Rol y Dependencia. |
| `bdempleados` | Tabla (o vista externa) con el padrón real de RRHH. |
| `roles_role` / `roles_permission` | Sistema de autorización basado en roles y permisos por microservicio/app. |
| `locations_sede` / `locations_modulo` | Define la estructura física (Ej: Sede Central -> Módulo NCPP -> Pool Especialistas). |

### 🔵 `ms-bienes`
| Tabla / Modelo | Propósito |
|---|---|
| `bienes_bien` | Tabla central (Código Patrimonial, Marca, Serie, Ubicación ID apuntando a ms-usuarios). |
| `bienes_bien_detalle_cpu` | Datos específicos (MAC, IP, Procesador, RAM, DD) si el bien es un CPU. |
| `bienes_transferencia` | Registra quién traslada qué, de qué sede a qué sede, y aprobaciones. |
| `bienes_mantenimiento` | Diagnóstico técnico y aprobaciones por la sede. |
| `bienes_baja` | Informes de retiro definitivo de activos. |

---

## 7. 📝 Conclusiones de Diseño (Code Review para Desarrolladores)
1. **Separación de Responsabilidades:** La separación en microservicios es adecuada conceptualmente, aislando el dominio de RRHH/Seguridad (`ms-usuarios`) del dominio patrimonial (`ms-bienes`).
2. **Capas del Software:** El código revisado demuestra una buena práctica al utilizar el patrón `ViewSet` (Enrutamiento/HTTP) → `Serializer` (Validación) → `Service` (Reglas de Negocio) → `Repository`/`Model` (Acceso a BD). **Recomendación:** Mantener esta estructura estricta para no repetir código lógico en los controladores (Views).
3. **Referencias Cruzadas:** Al separar BBDD, `ms-bienes` guarda `usuario_asignado_id` (Entero) en lugar de un FK directo. Para garantizar la consistencia, el `Service` de `ms-bienes` debe siempre consultar vía HTTP interno (Ej: usando `requests` o HTTPX a `http://ms-usuarios:8001/api/users/{id}`) antes de guardar un registro para asegurar que el ID enviado realmente existe y pertenece a la sede correcta.
4. **Soft Delete (`is_active`):** Bien implementado en todas las tablas mediante endpoints de `activate`/`deactivate`. Evita problemas de constraints por borrado en cascada.
