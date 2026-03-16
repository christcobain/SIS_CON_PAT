# 📦 SISCONPAT — ms-bienes: Documento Maestro
> Corte Superior de Justicia de Lima Norte — Poder Judicial del Perú
> Microservicio: `ms-bienes` | Base de datos: `db_bienes` (PostgreSQL independiente)

---

## 1. PERFILES INVOLUCRADOS EN EL PROCESO DE BIENES

| Perfil | Rol en el proceso de bienes |
|---|---|
| **SYSADMIN** | Acceso total. Registra usuarios y asigna roles/permisos. Puede registrar bienes (tiene permiso `add_bienes`). |
| **COORDSISTEMA** | Tiene permiso `add_bienes`: registra bienes por primera vez, el bien queda asignado a su propia sede/módulo/ubicación. Envía bienes a otra sede asignándolos al ASISTSISTEMA de la sede destino. Aprueba **bajas**. Ve todos los bienes de todas las sedes. Accede a reportes. |
| **ASISTSISTEMA** | Recibe bienes en su sede (asignados por COORDSISTEMA/SYSADMIN). Transfiere bienes **dentro de su propia sede** a usuarios finales (especificando módulo, ubicación, piso y usuario destino). Realiza mantenimientos preventivos. Registra bajas. Ve bienes de todas las sedes (solo lectura). |
| **ADMINSEDE** | Aprueba **transferencias internas** y **mantenimientos** de su propia sede. Ve bienes, mantenimientos y bajas de su propia sede. |
| **SEGURSEDE** | Aprueba entrada/salida **física** de bienes de la sede que custodia. Sin su aprobación, ningún bien puede moverse físicamente entre sedes aunque haya aprobación lógica. |

---

## 2. ARQUITECTURA DE DATOS — DECISIONES DE DISEÑO

| Decisión | Justificación |
|---|---|
| **Una tabla `bien` central** para todos los tipos | Unifica la lógica de asignación, mantenimiento, transferencia y baja. Elimina la redundancia del Excel donde CPU+Monitor+Teclado eran columnas de una misma fila. |
| **Tablas de detalle 1:1 por tipo técnico** | Solo CPU, Monitor, Impresora, Scanner y Switch tienen campos técnicos propios que justifican tabla separada. |
| **Sin tabla separada para "otros"** | Webcam, mouse, auriculares, proyector, estabilizador, UPS se registran en `bien` con `tipo_bien` del catálogo + campo `detalle_tecnico` libre. |
| **Catálogos como tablas maestras** | Escalabilidad: nuevas marcas, tipos o estados sin alterar el modelo principal. |
| **FK externas a ms-usuarios como `IntegerField`** | `bien` almacena IDs enteros de `User`, `Sede`, `Modulo` y `Ubicacion` del ms-usuarios. No hay JOIN cross-microservicio; la validación de existencia se hace en el `Service` vía HTTP interno antes de persistir. |
| **Dos tipos de transferencia diferenciados** | `TRASLADO_SEDE` (COORDSISTEMA/SYSADMIN envía bien a otra sede → destino es ASISTSISTEMA) y `ASIGNACION_INTERNA` (ASISTSISTEMA asigna bien a usuario final dentro de su sede). |
| **`sede_id`, `modulo_id`, `ubicacion_id`, `piso`, `usuario_asignado_id`,`empresa_id ` en `bien`** | Representan la localización y custodia **actual** del bien. El historial completo de cambios queda en las tablas de procesos. |

---

## 3. MODELO DE UBICACIÓN DEL BIEN (integración con ms-usuarios)

El bien debe conocer **dónde está físicamente** y **a quién pertenece**. La jerarquía de localización existe en `ms-usuarios` y se referencia por ID entero:

```
ms-usuarios
│
├── locations_sede          → Sede (CENTRAL, CANTA, ESTAÑOS, etc.)
│     └── locations_modulo  → Módulo (NCPP, CIVIL, FLAGRANCIA, etc.)
│           └── locations_ubicacion → Área/Juzgado (1er JUZGADO CIVIL, POOL ESPECIALISTAS, etc.)
│
└── users_user              → Usuario del sistema o jurisdiccional
      ├── id, dni, first_name, last_name, cargo
      ├── empresa_id         → FK → locations_empresa
      ├── dependencia_id    → Dependencia (Administrativa / Jurisdiccional)
      └── sedes (M2M)       → Sedes asignadas al usuario de sistema
```

**Campos de localización en `bienes_bien` (FK externas):**

```
bien.empresa_id           → INTEGER NOT NULL  → locations_empresa.id
bien.sede_id              → INTEGER NOT NULL  → locations_sede.id
bien.modulo_id            → INTEGER nullable  → locations_modulo.id
bien.ubicacion_id         → INTEGER nullable  → locations_ubicacion.id
bien.piso                 → SMALLINT nullable
bien.usuario_asignado_id  → INTEGER nullable  → users_user.id
bien.usuario_registra_id  → INTEGER NOT NULL  → users_user.id
```

> **Nota de integración:** Como ms-bienes tiene su propia base de datos, estos campos son `IntegerField` en Django (no ForeignKey cross-DB). El `BienService` valida existencia consultando ms-usuarios vía HTTP interno antes de persistir.

---

## 4. DIAGRAMA DE TABLAS — ms-bienes

```
╔══════════════════════════════════════════════════════════════════╗
║              CATÁLOGOS MAESTROS (bienes_cat_*)                  ║
║  cat_tipo_bien   cat_marca   cat_regimen_tenencia               ║
║  cat_estado_bien  cat_estado_funcionamiento  cat_motivo_baja     ║
║  cat_tipo_computadora  cat_tipo_disco  cat_arq_bits             ║
║  cat_tipo_monitor  cat_tipo_escaner  cat_interfaz_conexion       ║
║  cat_tipo_impresion  cat_tamano_carro                            ║
║  cat_motivo_transferencia  cat_motivo_cancelacion               ║
╚══════════════════╦═══════════════════════════════════════════════╝
                   ║ FK
         ╔═════════╩══════════╗
         ║    bienes_bien      ║  ← Tabla central de bienes
         ╚══╦══════════════════╝
            ║ 1:1 según tipo_bien_id
   ╔════════╬═══════════════════════════════════╗
   ▼        ▼         ▼           ▼             ▼
det_cpu  det_switch  det_scanner  det_impresora  det_monitor

         ╔══════════════════════════════════╗
         ║          PROCESOS                ║
         ║  bienes_transferencia            ║ → bienes_transferencia_detalle
         ║  bienes_mantenimiento            ║ → bienes_mantenimiento_detalle
         ║                                  ║ → bienes_mantenimiento_imagen
         ║  bienes_baja                     ║ → bienes_baja_detalle
         ╚══════════════════════════════════╝
```

---

## 5. FLUJO COMPLETO DE REGISTRO Y ASIGNACIÓN DE BIENES

### Fase 1 — Registro inicial (SYSADMIN / perfil con `add_bienes`)

```
SYSADMIN o perfil con add_bienes registra el bien
  ├── bien.empresa_id           = empresa del usuario que registra
  ├── bien.usuario_registra_id  = usuario que registra
  ├── bien.usuario_asignado_id  = mismo usuario (auto-asignado)
  ├── bien.sede_id              = sede del usuario que registra
  ├── bien.modulo_id            = módulo de ese usuario
  ├── bien.ubicacion_id         = ubicación/área de ese usuario
  └── bien.piso                 = piso referencial

  → Si tipo = CPU       → crea bienes_bien_detalle_cpu
  → Si tipo = MONITOR   → crea bienes_bien_detalle_monitor
  → Si tipo = IMPRESORA → crea bienes_bien_detalle_impresora
  → Si tipo = SCANNER   → crea bienes_bien_detalle_scanner
  → Si tipo = SWITCH    → crea bienes_bien_detalle_switch
  → Otros tipos         → bien + detalle_tecnico libre
```

### Fase 2 — Traslado entre sedes (analistaSistema/COORDSISTEMA/SYSADMIN → ASISTSISTEMA destino)

```
analistaSistema/COORDSISTEMA crea transferencia tipo TRASLADO_SEDE
  ├── usuario_destino_id = ASISTSISTEMA de la sede destino
  ├── sede_destino_id    = sede destino
  ├── modulo_destino_id  = módulo destino
  ├── ubicacion_destino_id = ubicación destino
  └── piso_destino       = piso destino

Notificación → ASISTSISTEMA + ADMINSEDE de sede origen
ADMINSEDE sede origen aprueba salida lógica
SEGURSEDE sede origen aprueba salida física
SEGURSEDE sede destino aprueba entrada física
→ estado = ATENDIDO :
  ├── bien.usuario_asignado_id  = ASISTSISTEMA destino
  ├── bien.sede_id              = sede destino
  ├── bien.modulo_id            = módulo destino
  ├── bien.ubicacion_id         = ubicación destino
  └── bien.piso                 = piso destino
  └──usuario_asignado_id        = usuario asignado
```

### Fase 3 — Asignación interna a usuario final (ASISTSISTEMA → usuario de su sede)

```
ASISTSISTEMA crea transferencia tipo ASIGNACION_INTERNA (dentro de su propia sede)
  ├── usuario_destino_id    = usuario final (jurisdiccional/administrativo) de la MISMA sede
  ├── sede_destino_id       = misma sede (se valida que coincida con sede del ASISTSISTEMA)
  ├── modulo_destino_id     = módulo donde trabaja el usuario final
  ├── ubicacion_destino_id  = área/juzgado específico del usuario final
  └── piso_destino          = piso donde se instala el equipo

Notificación → ADMINSEDE de la sede
ADMINSEDE aprueba

Al ser ATENDIDO:
  ├── bien.usuario_asignado_id  = usuario final
  ├── bien.modulo_id            = módulo del usuario final
  ├── bien.ubicacion_id         = ubicación del usuario final
  └── bien.piso                 = piso de instalación
  (bien.sede_id no cambia: sigue en la misma sede)
```

---

## 6. TABLAS DETALLADAS

---

### 6.1 `bienes_bien` — Tabla central

```
bienes_bien
├── id                          PK (autoincrement)
├── tipo_bien_id                FK → bienes_cat_tipo_bien
├── marca_id                    FK → bienes_cat_marca
├── modelo                      VARCHAR(150)
├── numero_serie                VARCHAR(100) UNIQUE nullable   -- NULL si es S/N
├── codigo_patrimonial          VARCHAR(50)  UNIQUE nullable   -- NULL si es S/N
├── regimen_tenencia_id         FK → bienes_cat_regimen_tenencia
├── estado_bien_id              FK → bienes_cat_estado_bien
├── estado_funcionamiento_id    FK → bienes_cat_estado_funcionamiento
├── detalle_tecnico             TEXT nullable  -- especificaciones libres para tipo "otros"
│
│   ── LOCALIZACIÓN ACTUAL (referencias a ms-usuarios) ──────────────
├── empresa_id                  INTEGER NOT NULL   -- locations_empresa.id
├── sede_id                     INTEGER NOT NULL   -- locations_sede.id
├── modulo_id                   INTEGER nullable   -- locations_modulo.id
├── ubicacion_id                INTEGER nullable   -- locations_ubicacion.id (área/juzgado)
├── piso                        SMALLINT nullable  -- piso físico dentro de la sede
│
│   ── CUSTODIA ACTUAL ────────────────────────────────────────────────
├── usuario_asignado_id         INTEGER nullable   -- users_user.id del custodio actual
│                                                  -- NULL = sin asignar a usuario final
├── usuario_registra_id         INTEGER NOT NULL   -- users_user.id de quien registró
│
│   ── DATOS DE ADQUISICIÓN ──────────────────────────────────────────
├── anio_adquisicion            SMALLINT nullable
├── fecha_compra                DATE nullable
├── numero_orden_compra         VARCHAR(50) nullable
├── fecha_vencimiento_garantia  DATE nullable
├── fecha_instalacion           DATE nullable
├── fecha_ultimo_inventario     DATE nullable
├── observacion                 TEXT nullable
│
│   ── MANTENIMIENTO (desnormalizado) ───────────────────────────────
├── fecha_ultimo_mantenimiento  DATE nullable
│   -- Se actualiza automáticamente cuando un Mantenimiento pasa a ATENDIDO.
│   -- Evita JOINs costosos en listados de inventario.
│   -- No reemplaza la tabla bienes_mantenimiento; es solo un indicador rápido.
│
│   ── AUDITORÍA ─────────────────────────────────────────────────────
├── fecha_registro              TIMESTAMP auto_now_add
├── fecha_actualizacion         TIMESTAMP auto_now
│
│   ── BAJA ───────────────────────────────────────────────────────────
├── fecha_baja                  DATE nullable
├── motivo_baja_id              FK → bienes_cat_motivo_baja nullable
│
├── is_active                   BOOLEAN default True
└── corte                       VARCHAR(20) default 'CSJLN'
```

**Índices recomendados:**
`empresa_id`,`sede_id`, `modulo_id`, `ubicacion_id`, `usuario_asignado_id`, `tipo_bien_id`, `estado_funcionamiento_id`, `is_active`, `codigo_patrimonial`, `numero_serie`

---

### 6.2 `bienes_bien_detalle_cpu` — Extensión CPU (1:1)

```
bienes_bien_detalle_cpu
├── id                      PK
├── bien_id                 FK → bienes_bien (UNIQUE)
├── hostname                VARCHAR(100) nullable
├── dominio_equipo          VARCHAR(100) nullable
├── direccion_ip            VARCHAR(45)  nullable   -- IPv4/IPv6
├── direccion_mac           VARCHAR(17)  nullable   -- AA:BB:CC:DD:EE:FF
├── conectado_red           BOOLEAN default False
├── tipo_computadora_id     FK → bienes_cat_tipo_computadora
├── funcion_cpu             VARCHAR(100) nullable   -- PRODUCCION / SERVIDOR / OTROS
├── procesador_tipo         VARCHAR(100) nullable
├── procesador_cantidad     SMALLINT nullable
├── procesador_nucleos      SMALLINT nullable
├── procesador_velocidad    VARCHAR(30)  nullable   -- 3.0 GHZ
├── sistema_operativo       VARCHAR(100) nullable
├── arquitectura_bits_id    FK → bienes_cat_arq_bits nullable
├── licencia_so             VARCHAR(100) nullable
├── version_office          VARCHAR(50)  nullable
├── licencia_office         VARCHAR(100) nullable
├── capacidad_ram_gb        VARCHAR(20)  nullable   -- 8 GB, 16 GB
├── cantidad_modulos_ram    SMALLINT nullable
├── tipo_disco_id           FK → bienes_cat_tipo_disco nullable
├── capacidad_disco         VARCHAR(30)  nullable   -- 1 TB, 512 GB
├── cantidad_discos         SMALLINT nullable
├── multimedia              VARCHAR(100) nullable   -- DVD RW, etc.
└── tipo_tarjeta_video      VARCHAR(100) nullable   -- INTEGRADO / DEDICADO
```

---

### 6.3 `bienes_bien_detalle_monitor` — Extensión Monitor (1:1)

```
bienes_bien_detalle_monitor
├── id                  PK
├── bien_id             FK → bienes_bien (UNIQUE)
├── tipo_monitor_id     FK → bienes_cat_tipo_monitor
└── tamano_pulgadas     DECIMAL(4,1) nullable
```

---

### 6.4 `bienes_bien_detalle_impresora` — Extensión Impresora (1:1)

```
bienes_bien_detalle_impresora
├── id                        PK
├── bien_id                   FK → bienes_bien (UNIQUE)
├── tipo_impresion_id         FK → bienes_cat_tipo_impresion
├── impresion_color           BOOLEAN nullable
├── memoria_ram_mb            SMALLINT nullable
├── resolucion_maxima_ppp     VARCHAR(30) nullable
├── interfaz_conexion_id      FK → bienes_cat_interfaz_conexion
├── tamano_carro_id           FK → bienes_cat_tamano_carro
├── tamano_hojas_soportadas   VARCHAR(50) nullable
├── unidad_duplex             BOOLEAN nullable
├── velocidad_impresion_ppm   SMALLINT nullable
├── conexion_red              BOOLEAN nullable
└── alimentacion_ac           VARCHAR(20) nullable
```

---

### 6.5 `bienes_bien_detalle_scanner` — Extensión Scanner (1:1)

```
bienes_bien_detalle_scanner
├── id                        PK
├── bien_id                   FK → bienes_bien (UNIQUE)
├── tipo_escaner_id           FK → bienes_cat_tipo_escaner
├── tamano_documentos         VARCHAR(20) nullable
├── alimentador_automatico    BOOLEAN nullable
├── metadata                  BOOLEAN nullable
├── resolucion_exploracion    VARCHAR(50) nullable
├── resolucion_salida         VARCHAR(50) nullable
├── interfaz_conexion_id      FK → bienes_cat_interfaz_conexion
└── alimentacion_ac           VARCHAR(20) nullable
```

---

### 6.6 `bienes_bien_detalle_switch` — Extensión Switch de Red (1:1)

```
bienes_bien_detalle_switch
├── id                      PK
├── bien_id                 FK → bienes_bien (UNIQUE)
├── direccion_mac           VARCHAR(17) nullable
├── direccion_ip            VARCHAR(45) nullable
├── cantidad_puertos_utp    SMALLINT nullable
├── cantidad_puertos_ftp    SMALLINT nullable
├── cantidad_puertos_fo     SMALLINT nullable
├── cantidad_puertos_wan    SMALLINT nullable
├── admin_software          BOOLEAN nullable
├── velocidad_mbps          INTEGER nullable
├── chasis_slots            SMALLINT nullable
├── migracion_atm           BOOLEAN nullable
├── soporta_vlan            BOOLEAN nullable
├── alimentacion_ac         VARCHAR(20) nullable
├── manual_incluido         BOOLEAN nullable
└── fuente_poder            VARCHAR(100) nullable
```

---

### 6.7 TABLAS CATÁLOGO / MAESTROS

Patrón uniforme:

```
bienes_cat_*
├── id          PK
├── nombre      VARCHAR(100) UNIQUE NOT NULL
├── descripcion TEXT nullable
└── is_active   BOOLEAN default True
```

| Tabla | Valores de referencia |
|---|---|
| `bienes_cat_tipo_bien` | CPU, MONITOR, TECLADO, MOUSE, IMPRESORA, SCANNER, SWITCH, ESTABILIZADOR, UPS, WEBCAM, PROYECTOR, AURICULARES, OTROS |
| `bienes_cat_marca` | HP, DELL, SAMSUNG, LEXMARK, FUJITSU, TP-LINK, HUAWEI, FORZA, ADVANCE, LOGITECH, LENOVO, ACER... |
| `bienes_cat_regimen_tenencia` | PROPIO, ALQUILADO, COMODATO, DONADO |
| `bienes_cat_estado_bien` | ACTIVO, INACTIVO |
| `bienes_cat_estado_funcionamiento` | OPERATIVO, AVERIADO, INOPERATIVO |
|  `bienes_cat_motivo_baja` | RAEE, FALLA SIN SOLUCIÓN, OBSOLESCENCIA, DONACIÓN, ROBO/PÉRDIDA, SINIESTRO |
| `bienes_cat_tipo_computadora` | COMPUTADOR DE ESCRITORIO, ALL-IN-ONE, SERVIDOR |
| `bienes_cat_tipo_disco` | HDD, SSD, NVMe, HÍBRIDO |
| `bienes_cat_arq_bits` | 32 BITS, 64 BITS |
| `bienes_cat_tipo_monitor` | LCD, LED, OLED, CRT |
| `bienes_cat_tipo_escaner` | DE SOBREMESA, PORTÁTIL, CAMA PLANA, ALIMENTADOR AUTOMÁTICO |
| `bienes_cat_interfaz_conexion` | USB, RED (RJ45), WIFI, BLUETOOTH, PARALELO |
| `bienes_cat_tipo_impresion` | LASER, TINTA, MULTIFUNCIONAL LASER, MULTIFUNCIONAL TINTA |
| `bienes_cat_tamano_carro` | A4, A3, CARTA, LEGAL || 
| `bienes_cat_motivo_transferencia` | EQUIPO NUEVO, TRASLADO A OTRA SEDE, FIN DE CONTRATO, AVERÍA DE EQUIPO, DEVOLUCIÓN, REASIGNACIÓN |
| `bienes_cat_motivo_cancelacion` | ERROR DE REGISTRO, BIEN NO DISPONIBLE, PROCESO DUPLICADO, OTROS |

---

## 7. TABLAS DE PROCESOS

---

### 7.1 `bienes_transferencia` — Traslado entre sedes y asignación interna

```
bienes_transferencia
├── id                          PK
├── numero_transaccion          VARCHAR(20) UNIQUE
│                               -- TRF-YYYYMMDD-NNNN (traslado sede)
│                               -- ASG-YYYYMMDD-NNNN (asignación interna)
│
├── tipo                        VARCHAR(25) NOT NULL
│                               -- TRASLADO_SEDE       : COORDSISTEMA/SYSADMIN → ASISTSISTEMA destino
│                               -- ASIGNACION_INTERNA  : ASISTSISTEMA → usuario final de su sede
│
│   ── QUIEN REALIZA ────────────────────────────────────────────────
├── usuario_asigna_id           INTEGER NOT NULL   -- users_user.id
├── sede_origen_id              INTEGER NOT NULL   -- locations_sede.id
├── modulo_origen_id            INTEGER nullable   -- locations_modulo.id
├── ubicacion_origen_id         INTEGER nullable   -- locations_ubicacion.id
│
│   ── DESTINO ──────────────────────────────────────────────────────
├── usuario_destino_id          INTEGER NOT NULL   -- users_user.id
│                               -- TRASLADO_SEDE: ASISTSISTEMA de sede destino
│                               -- ASIGNACION_INTERNA: usuario final (jurisdiccional/admin)
├── sede_destino_id             INTEGER NOT NULL   -- locations_sede.id
│                               -- ASIGNACION_INTERNA: misma sede (validado en service)
├── modulo_destino_id           INTEGER nullable   -- locations_modulo.id del destino
├── ubicacion_destino_id        INTEGER nullable   -- locations_ubicacion.id del destino
├── piso_destino                SMALLINT nullable  -- piso físico de instalación
│
├── motivo_id                   FK → bienes_cat_motivo_transferencia
├── observaciones               TEXT nullable
│
│   ── ESTADO Y FECHAS ────────────────────────────────────────────────
├── estado                      VARCHAR(30)
│                               -- PENDIENTE_APROBACION / ATENDIDO / DEVUELTO / CANCELADO
├── fecha_registro              TIMESTAMP auto_now_add
├── fecha_aprobacion            TIMESTAMP nullable
├── fecha_cancelacion           TIMESTAMP nullable
├── motivo_cancelacion_id       FK → bienes_cat_motivo_cancelacion nullable
├── detalle_cancelacion         TEXT nullable
├── motivo_devolucion           TEXT nullable  -- motivo si ADMINSEDE desaprueba
│
│   ── APROBACIÓN ADMINSEDE ──────────────────────────────────────────
├── aprobado_por_adminsede_id   INTEGER nullable   -- users_user.id
├── fecha_aprobacion_adminsede  TIMESTAMP nullable
│
│   ── APROBACIÓN SEGURSEDE (solo TRASLADO_SEDE) ─────────────────────
├── aprobado_segur_salida_id    INTEGER nullable   -- SEGURSEDE sede origen
├── fecha_aprobacion_segur_salida TIMESTAMP nullable
├── aprobado_segur_entrada_id   INTEGER nullable   -- SEGURSEDE sede destino
├── fecha_aprobacion_segur_entrada TIMESTAMP nullable
└── observacion_segursede       TEXT nullable
```

### 7.2 `bienes_transferencia_detalle` — Bienes incluidos en la transferencia

```
bienes_transferencia_detalle
├── id                      PK
├── transferencia_id        FK → bienes_transferencia
├── bien_id                 FK → bienes_bien
│
│   ── Snapshot al momento de la transferencia ───────────────────────
├── codigo_patrimonial      VARCHAR(50)
├── numero_serie            VARCHAR(100)
├── tipo_bien_nombre        VARCHAR(100)
├── marca_nombre            VARCHAR(100)
├── modelo                  VARCHAR(150)
├── estado_bien             VARCHAR(50)
└── estado_funcionamiento   VARCHAR(50)
```

> **Regla de negocio:** En `ASIGNACION_INTERNA` los bienes pueden venir de distintos custodios anteriores, pero todos deben pertenecer a la misma `sede_id`. El destino es siempre un único usuario dentro de esa misma sede.

---

### 7.3 `bienes_mantenimiento` — Mantenimiento preventivo

```
bienes_mantenimiento
├── id                              PK
├── numero_orden                    VARCHAR(20) UNIQUE   -- MNT-YYYYMMDD-NNNN
│
│   ── QUIEN REALIZA ────────────────────────────────────────────────
├── usuario_realiza_id              INTEGER NOT NULL   -- users_user.id (ASISTSISTEMA)
├── sede_id                         INTEGER NOT NULL   -- sede donde se realiza
├── modulo_id                       INTEGER nullable
│
│   ── PROPIETARIO DE LOS BIENES ─────────────────────────────────────
├── usuario_propietario_id          INTEGER NOT NULL
│                               -- Todos los bienes del mantenimiento deben
│                               -- pertenecer a este único usuario (validado en service)
│
│   ── CONTENIDO DEL MANTENIMIENTO ──────────────────────────────────
├── datos_iniciales                 TEXT nullable
├── tiene_imagenes                  BOOLEAN default False
├── trabajos_realizados             TEXT nullable
├── diagnostico_final               TEXT nullable
│
│   ── ESTADO Y FECHAS ────────────────────────────────────────────────
├── estado                          VARCHAR(30)
│                               -- EN_PROCESO / PENDIENTE_APROBACION / ATENDIDO / DEVUELTO / CANCELADO
├── fecha_registro                  TIMESTAMP auto_now_add
├── fecha_inicio                    DATE nullable
├── fecha_termino                   DATE nullable      -- al pasar a PENDIENTE_APROBACION
├── fecha_cancelacion               TIMESTAMP nullable
├── motivo_cancelacion_id           FK → bienes_cat_motivo_cancelacion nullable
├── detalle_cancelacion             TEXT nullable
├── motivo_devolucion               TEXT nullable
│
│   ── APROBACIÓN ADMINSEDE ──────────────────────────────────────────
├── aprobado_por_adminsede_id       INTEGER nullable
└── fecha_aprobacion                TIMESTAMP nullable
```
>Al pasar a `ATENDIDO`: el service actualiza `bien.fecha_ultimo_mantenimiento = fecha_aprobacion.date() `para cada bien del detalle.

### 7.4 `bienes_mantenimiento_detalle` — Bienes del mantenimiento

```
bienes_mantenimiento_detalle
├── id                                PK
├── mantenimiento_id                  FK → bienes_mantenimiento
├── bien_id                           FK → bienes_bien
├── estado_funcionamiento_antes       VARCHAR(50)   -- snapshot pre-mantenimiento
├── estado_funcionamiento_despues     VARCHAR(50)   -- actualizado por ASISTSISTEMA
├── codigo_patrimonial                VARCHAR(50)
├── tipo_bien_nombre                  VARCHAR(100)
└── observacion_detalle               TEXT nullable
```

### 7.5 `bienes_mantenimiento_imagen` — Evidencia fotográfica

```
bienes_mantenimiento_imagen
├── id                  PK
├── mantenimiento_id    FK → bienes_mantenimiento
├── imagen              FileField (ruta o URL)
├── descripcion         VARCHAR(200) nullable
└── fecha_subida        TIMESTAMP auto_now_add
```

---

### 7.6 `bienes_baja` — Baja / Salida definitiva del bien

```
bienes_baja
├── id                          PK
├── numero_informe              VARCHAR(20) UNIQUE   -- BAJ-YYYYMMDD-NNNN
│
│   ── ENCABEZADO DEL INFORME (DE: / A:) ────────────────────────────
├── usuario_elabora_id          INTEGER NOT NULL   -- ASISTSISTEMA (DE:)
├── sede_elabora_id             INTEGER NOT NULL   -- sede del ASISTSISTEMA
├── usuario_destino_id          INTEGER NOT NULL   -- COORDSISTEMA (A:)
│
│   ── CUERPO DEL INFORME ─────────────────────────────────────────────
├── antecedentes                TEXT nullable
├── analisis                    TEXT nullable   -- contiene datos del mantenimiento previo
├── conclusiones                TEXT nullable
├── recomendaciones             TEXT nullable
│
│   ── ESTADO Y FECHAS ────────────────────────────────────────────────
├── estado                      VARCHAR(30)
│                               -- PENDIENTE_APROBACION / ATENDIDO / DEVUELTO / CANCELADO
├── fecha_registro              TIMESTAMP auto_now_add
├── fecha_cancelacion           TIMESTAMP nullable
├── motivo_cancelacion_id       FK → bienes_cat_motivo_cancelacion nullable
├── detalle_cancelacion         TEXT nullable
├── motivo_devolucion           TEXT nullable   -- motivo si COORDSISTEMA desaprueba
│
│   ── APROBACIÓN COORDSISTEMA ───────────────────────────────────────
├── aprobado_por_id             INTEGER nullable
└── fecha_aprobacion            TIMESTAMP nullable
```

### 7.7 `bienes_baja_detalle` — Bienes incluidos en la baja

```
bienes_baja_detalle
├── id                      PK
├── baja_id                 FK → bienes_baja
├── bien_id                 FK → bienes_bien
├── motivo_baja_id          FK → bienes_cat_motivo_baja   -- por bien individual
├── mantenimiento_id        FK → bienes_mantenimiento nullable  -- mantenimiento que lo sustenta
│
│   ── Snapshot del bien ─────────────────────────────────────────────
├── tipo_bien_nombre        VARCHAR(100)
├── marca_nombre            VARCHAR(100)
├── modelo                  VARCHAR(150)
├── numero_serie            VARCHAR(100)
├── codigo_patrimonial      VARCHAR(50)
└── estado_funcionamiento   VARCHAR(50)
```

---

## 8. FLUJOS DETALLADOS DE APROBACIÓN

### 8.1 Traslado entre sedes (TRASLADO_SEDE)

```
analistaSistema/COORDSISTEMA/SYSADMIN registra traslado
  └── estado = PENDIENTE_APROBACION
      ├── Notificación → ASISTSISTEMA de sede origen  (alerta de seguridad)
      └── Notificación → ADMINSEDE de sede origen     (alerta de seguridad)

ADMINSEDE/coorSistema sede origen aprueba salida lógica
  └── aprobado_por_adminsede_id = ADMINSEDE.id

SEGURSEDE sede origen aprueba salida física
  └── aprobado_segur_salida_id = SEGURSEDE.id

SEGURSEDE sede destino aprueba entrada física
  └── aprobado_segur_entrada_id = SEGURSEDE.id
  └── estado = ATENDIDO
      └── bien actualiza: sede_id, modulo_id, ubicacion_id, piso, usuario_asignado_id

Si ADMINSEDE desaprueba:
  └── estado = DEVUELTO → proceso editable
      └── al guardar de nuevo → PENDIENTE_APROBACION

Si COORDSISTEMA/SYSADMIN cancela:
  └── estado = CANCELADO (sin aprobación)
```

### 8.2 Asignación interna (ASIGNACION_INTERNA)

```
ASISTSISTEMA registra asignación interna
  ├── Selecciona bienes disponibles en su sede
  ├── Selecciona usuario destino (de su misma sede)
  ├── Especifica: modulo_destino, ubicacion_destino, piso_destino
  └── estado = PENDIENTE_APROBACION
      └── Notificación → ADMINSEDE de la sede

ADMINSEDE aprueba
  └── estado = ATENDIDO
      └── bien actualiza: usuario_asignado_id, modulo_id, ubicacion_id, piso

ADMINSEDE desaprueba + motivo
  └── estado = DEVUELTO → proceso editable
      └── al guardar de nuevo → PENDIENTE_APROBACION

ASISTSISTEMA cancela
  └── estado = CANCELADO (sin aprobación de nadie)
```

### 8.3 Mantenimiento

```
ASISTSISTEMA registra mantenimiento
  ├── Todos los bienes deben ser del mismo usuario_propietario_id (validado en service)
  └── estado = PENDIENTE_APROBACION
      └── Notificación → ADMINSEDE

ADMINSEDE aprueba
  └── estado = ATENDIDO
      └── Aplica estado_funcionamiento_despues a cada bien en detalle
      └── Actualiza bien.fecha_ultimo_mantenimiento = fecha_aprobacion.date()

ADMINSEDE desaprueba + motivo
  └── estado = DEVUELTO → editable
      └── al guardar → PENDIENTE_APROBACION

ASISTSISTEMA cancela
  └── estado = CANCELADO (sin aprobación)

COORDSISTEMA: lectura de mantenimientos de TODAS las sedes (solo lectura)
```

### 8.4 Baja

```
ASISTSISTEMA selecciona bienes con estado_funcionamiento = AVERIADO | INOPERATIVO
  └── Provienen del módulo de mantenimiento (mantenimiento_id referenciado en detalle)

ASISTSISTEMA completa informe (antecedentes, análisis, conclusiones, recomendaciones)
  └── estado = PENDIENTE_APROBACION
      └── Notificación → COORDSISTEMA

COORDSISTEMA aprueba
  └── estado = ATENDIDO
      └── bien: is_active = False, fecha_baja = hoy, motivo_baja_id actualizado

COORDSISTEMA desaprueba + motivo
  └── estado = DEVUELTO → editable
      └── al guardar → PENDIENTE_APROBACION

ASISTSISTEMA cancela
  └── estado = CANCELADO (sin aprobación)
```

---

## 9. RESUMEN DE ESTADOS POR PROCESO

| Estado                | Traslado sede | Asignación interna | Mantenimiento | Baja |
|---|---|---|---|---|
| `PENDIENTE_APROBACION`  | ✅ | ✅ | ✅ | ✅ |
| `ATENDIDO`              | ✅ | ✅ | ✅ | ✅ |
| `DEVUELTO`              | ✅ | ✅ | ✅ | ✅ |
| `CANCELADO`             | ✅ | ✅ | ✅ | ✅ |
| `EN_PROCESO`            | —   | —  | ✅ | —  |

---

## 10. RESUMEN DE APROBACIONES

| Proceso              | Quién registra          | Aprobación lógica | Aprobación física |
|---|---|---|---|
| Alta de bien         | SYSADMIN / perfil `add_bienes` | — (sin aprobación) | — |
| Traslado entre sedes | COORDSISTEMA / SYSADMIN | ADMINSEDE sede origen | SEGURSEDE origen + SEGURSEDE destino |
| Asignación interna   | ASISTSISTEMA            | ADMINSEDE de la sede | — |
| Mantenimiento        | ASISTSISTEMA            | ADMINSEDE de la sede | — |
| Baja                 | ASISTSISTEMA            | COORDSISTEMA | — |

---

## 11. DOCUMENTOS PDF GENERADOS

| Proceso                         | Documento | Firmante |
|---|---|---|
| Asignación interna (ATENDIDO)   | Acta de Asignación con datos del bien, usuario destino, módulo, ubicación y piso | Usuario destino (dueño del bien) |

| Traslado sede (ATENDIDO)        | Acta de Traslado con datos del bien, sede origen, sede destino y custodio nuevo | ASISTSISTEMA destino |

| Mantenimiento (ATENDIDO)        | Acta de Mantenimiento con bienes, trabajos realizados y diagnóstico final 
| Usuario propietario de los bienes |

| Baja (ATENDIDO)                 | Informe Técnico: DE (ASISTSISTEMA) / A (COORDSISTEMA) / ASUNTO: Informe de Baja. Contiene antecedentes, análisis, conclusiones y recomendaciones 
| ASISTSISTEMA |

---

## 12. NOMENCLATURA COMPLETA DE TABLAS

| Modelo Django | Tabla PostgreSQL | App Django |
|---|---|---|
| `Bien` | `bienes_bien` | `bienes` |
| `BienDetalleCpu` | `bienes_bien_detalle_cpu` | `bienes` |
| `BienDetalleMonitor` | `bienes_bien_detalle_monitor` | `bienes` |
| `BienDetalleImpresora` | `bienes_bien_detalle_impresora` | `bienes` |
| `BienDetalleScanner` | `bienes_bien_detalle_scanner` | `bienes` |
| `BienDetalleSwitch` | `bienes_bien_detalle_switch` | `bienes` |
| `Transferencia` | `bienes_transferencia` | `transferencias` |
| `TransferenciaDetalle` | `bienes_transferencia_detalle` | `transferencias` |
| `Mantenimiento` | `bienes_mantenimiento` | `mantenimientos` |
| `MantenimientoDetalle` | `bienes_mantenimiento_detalle` | `mantenimientos` |
| `MantenimientoImagen` | `bienes_mantenimiento_imagen` | `mantenimientos` |
| `Baja` | `bienes_baja` | `bajas` |
| `BajaDetalle` | `bienes_baja_detalle` | `bajas` |
| `CatTipoBien` | `bienes_cat_tipo_bien` | `catalogos` |
| `CatMarca` | `bienes_cat_marca` | `catalogos` |
| `CatRegimenTenencia` | `bienes_cat_regimen_tenencia` | `catalogos` |
| `CatEstadoBien` | `bienes_cat_estado_bien` | `catalogos` |
| `CatEstadoFuncionamiento` | `bienes_cat_estado_funcionamiento` | `catalogos` |
| `CatTipoComputadora` | `bienes_cat_tipo_computadora` | `catalogos` |
| `CatTipoDisco` | `bienes_cat_tipo_disco` | `catalogos` |
| `CatArquitecturaBits` | `bienes_cat_arq_bits` | `catalogos` |
| `CatTipoMonitor` | `bienes_cat_tipo_monitor` | `catalogos` |
| `CatTipoEscaner` | `bienes_cat_tipo_escaner` | `catalogos` |
| `CatInterfazConexion` | `bienes_cat_interfaz_conexion` | `catalogos` |
| `CatTipoImpresion` | `bienes_cat_tipo_impresion` | `catalogos` |
| `CatTamanoCarro` | `bienes_cat_tamano_carro` | `catalogos` |
| `CatMotivoBaja` | `bienes_cat_motivo_baja` | `catalogos` |
| `CatMotivoTransferencia` | `bienes_cat_motivo_transferencia` | `catalogos` |
| `CatMotivoCancelacion` | `bienes_cat_motivo_cancelacion` | `catalogos` |

---

## 13. APPS DJANGO DENTRO DE ms-bienes

```
ms-bienes/
├── catalogos/       -- Todos los modelos cat_*
├── bienes/          -- Bien + detalles por tipo (cpu, monitor, impresora, scanner, switch)
├── transferencias/  -- Transferencia + TransferenciaDetalle
├── mantenimientos/  -- Mantenimiento + MantenimientoDetalle + MantenimientoImagen
└── bajas/           -- Baja + BajaDetalle
```

---

## 14. NOTAS TÉCNICAS FINALES
- **Se obtiene de `locations_empresa.id`** del ms-usuarios vía HTTP interno. Cuando el sistema se extienda a otra corte, solo se registra la nueva Empresa y se asigna en el bien.
- **`numero_serie` y `codigo_patrimonial`** admiten `NULL` (registros históricos con valor `S/N`). La unicidad se valida en el `Service` solo cuando el valor no es nulo.
- **fecha_ultimo_mantenimiento** es un campo desnormalizado en bienes_bien. Se actualiza automáticamente en el MantenimientoService.aprobar() para cada bien_id del detalle del mantenimiento aprobado. No reemplaza el historial completo de bienes_mantenimiento.
- **FK externas a ms-usuarios** son `IntegerField` en Django. El `Service` valida existencia consultando ms-usuarios antes de persistir. Los nombres (usuario, sede, módulo) se resuelven en tiempo de consulta o se cachean.
- **Snapshots en tablas de detalle** de procesos: se guardan valores de texto al momento del proceso para que el historial no se rompa si el bien cambia de estado posteriormente.
- **Kit de usuario** (CPU + Monitor + Teclado + Mouse): son bienes individuales en `bienes_bien`, agrupados visualmente en el frontend por `usuario_asignado_id`.
- **Validación crítica en `ASIGNACION_INTERNA`**: el `service` debe verificar que `sede_destino_id == sede del ASISTSISTEMA` antes de persistir, rechazando cualquier intento de asignar fuera de su sede.
- **Validación crítica en mantenimiento**: el `service` debe verificar que todos los `bien_id` del detalle tengan el mismo `usuario_asignado_id` antes de persistir.
- **Escalabilidad futura**: bienes muebles o inmuebles → nuevo valor en `bienes_cat_tipo_bien` + nueva tabla `bienes_bien_detalle_mueble`, sin alterar `bienes_bien`.