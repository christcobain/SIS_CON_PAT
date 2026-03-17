/**
 * catalogosMeta.js
 * Fuente única de verdad para todos los catálogos del sistema.
 * Mapea exactamente las keys de catalogosService con sus metadatos de UI.
 *
 * key       → nombre de la key en catalogosService / useCatalogos
 * label     → etiqueta visible en la UI
 * icon      → ícono Material Symbols
 * grupo     → grupo de agrupación en el sidebar/tabs
 * perm      → permiso DRF para visibilidad (puede ser null = todos)
 * descripcion → texto informativo breve
 */
export const GRUPOS = [
  {
    id: 'general',
    label: 'Generales',
    icon: 'category',
  },
  {
    id: 'estados',
    label: 'Estados',
    icon: 'toggle_on',
  },
  {
    id: 'motivos',
    label: 'Motivos',
    icon: 'help_outline',
  },
  {
    id: 'hardware',
    label: 'Hardware / TI',
    icon: 'computer',
  },
];

export const CATALOGOS_META = [
  // ── Generales ──────────────────────────────────────────────────────────────
  {
    key:         'categoriasBien',
    label:       'Categorías de Bien',
    icon:        'folder_open',
    grupo:       'general',
    descripcion: 'Clasificación principal de bienes patrimoniales.',
    perm:        'ms-bienes:catalogos:view_cattipobien',
  },
  {
    key:         'tiposBien',
    label:       'Tipos de Bien',
    icon:        'label',
    grupo:       'general',
    descripcion: 'Subtipo dentro de cada categoría de bien.',
    perm:        'ms-bienes:catalogos:view_cattipobien',
  },
  {
    key:         'marcas',
    label:       'Marcas',
    icon:        'verified',
    grupo:       'general',
    descripcion: 'Marcas o fabricantes de bienes.',
    perm:        'ms-bienes:catalogos:view_cattipobien',
  },
  {
    key:         'regimenTenencia',
    label:       'Régimen de Tenencia',
    icon:        'gavel',
    grupo:       'general',
    descripcion: 'Régimen legal bajo el que se poseen los bienes.',
    perm:        'ms-bienes:catalogos:view_cattipobien',
  },
  // ── Estados ────────────────────────────────────────────────────────────────
  {
    key:         'estadosBien',
    label:       'Estados de Bien',
    icon:        'inventory',
    grupo:       'estados',
    descripcion: 'Estado físico o contable del bien (Bueno, Regular, Malo…).',
    perm:        'ms-bienes:catalogos:view_cattipobien',
  },
  {
    key:         'estadosFuncionamiento',
    label:       'Estados de Funcionamiento',
    icon:        'power_settings_new',
    grupo:       'estados',
    descripcion: 'Estado operativo del bien (Operativo, En reparación…).',
    perm:        'ms-bienes:catalogos:view_cattipobien',
  },
  // ── Motivos ────────────────────────────────────────────────────────────────
  {
    key:         'motivosBaja',
    label:       'Motivos de Baja',
    icon:        'delete_sweep',
    grupo:       'motivos',
    descripcion: 'Razones por las que un bien es dado de baja.',
    perm:        'ms-bienes:catalogos:view_cattipobien',
  },
   {
    key:         'motivosMantenimiento',
    label:       'Motivos de Mantenimiento',
    icon:        'swap_horiz',
    grupo:       'motivos',
    descripcion: 'Razones que justifican el mantenimiento de un bien informático.',
    perm:        'ms-bienes:catalogos:view_cattipobien',
  },
  {
    key:         'motivosTransferencia',
    label:       'Motivos de Transferencia',
    icon:        'swap_horiz',
    grupo:       'motivos',
    descripcion: 'Razones que justifican el traslado de un bien.',
    perm:        'ms-bienes:catalogos:view_cattipobien',
  },
  {
    key:         'motivosCancelacion',
    label:       'Motivos de Cancelación',
    icon:        'cancel',
    grupo:       'motivos',
    descripcion: 'Causas de cancelación de una solicitud o proceso.',
    perm:        'ms-bienes:catalogos:view_cattipobien',
  },
  // ── Hardware / TI ──────────────────────────────────────────────────────────
  {
    key:         'tiposComputadora',
    label:       'Tipos de Computadora',
    icon:        'computer',
    grupo:       'hardware',
    descripcion: 'Clasificación de equipos informáticos (Desktop, Laptop…).',
    perm:        'ms-bienes:catalogos:view_cattipobien',
  },
  {
    key:         'tiposDisco',
    label:       'Tipos de Disco',
    icon:        'storage',
    grupo:       'hardware',
    descripcion: 'Tipos de almacenamiento (HDD, SSD, NVMe…).',
    perm:        'ms-bienes:catalogos:view_cattipobien',
  },
  {
    key:         'arquitecturasBits',
    label:       'Arquitecturas de Bits',
    icon:        'memory',
    grupo:       'hardware',
    descripcion: 'Arquitectura del procesador (32 bits, 64 bits…).',
    perm:        'ms-bienes:catalogos:view_cattipobien',
  },
  {
    key:         'tiposMonitor',
    label:       'Tipos de Monitor',
    icon:        'monitor',
    grupo:       'hardware',
    descripcion: 'Clasificación de monitores (LCD, LED, OLED…).',
    perm:        'ms-bienes:catalogos:view_cattipobien',
  },
  {
    key:         'tiposEscaner',
    label:       'Tipos de Escáner',
    icon:        'document_scanner',
    grupo:       'hardware',
    descripcion: 'Tipos de escáneres disponibles en el inventario.',
    perm:        'ms-bienes:catalogos:view_cattipobien',
  },
  {
    key:         'interfacesConexion',
    label:       'Interfaces de Conexión',
    icon:        'usb',
    grupo:       'hardware',
    descripcion: 'Tipos de puertos o interfaces (USB, HDMI, VGA…).',
    perm:        'ms-bienes:catalogos:view_cattipobien',
  },
  {
    key:         'tiposImpresion',
    label:       'Tipos de Impresión',
    icon:        'print',
    grupo:       'hardware',
    descripcion: 'Tecnología de impresión (Láser, Inyección de tinta…).',
    perm:        'ms-bienes:catalogos:view_cattipobien',
  },
  {
    key:         'tamanosCarro',
    label:       'Tamaños de Carro',
    icon:        'directions_car',
    grupo:       'hardware',
    descripcion: 'Clasificación de tamaños para vehículos en inventario.',
    perm:        'ms-bienes:catalogos:view_cattipobien',
  },
  {
    key:         'tiposTarjetaVideo',
    label:       'Tipos de Tarjeta de Video',
    icon:        'tv',
    grupo:       'hardware',
    descripcion: 'Clasificación de tarjetas gráficas (Integrada, Dedicada…).',
    perm:        'ms-bienes:catalogos:view_cattipobien',
  },
];

/** Devuelve el meta de un catálogo por su key */
export function getCatalogoMeta(key) {
  return CATALOGOS_META.find((c) => c.key === key) ?? null;
}

/** Devuelve todos los catálogos de un grupo */
export function getCatalogosPorGrupo(grupoId) {
  return CATALOGOS_META.filter((c) => c.grupo === grupoId);
}

/** Todas las keys disponibles en el servicio */
export const TODAS_LAS_KEYS = CATALOGOS_META.map((c) => c.key);