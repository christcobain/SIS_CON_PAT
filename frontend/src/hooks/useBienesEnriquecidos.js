import { useMemo } from 'react';

export function useBienesEnriquecidos(bienes = [], { sedes = [], modulos = [], usuarios = [] } = {}) {
  const sedeMap   = useMemo(() => Object.fromEntries((sedes   ?? []).map(s => [s.id,  s.nombre])), [sedes]);
  const moduloMap = useMemo(() => Object.fromEntries((modulos ?? []).map(m => [m.id,  m.nombre])), [modulos]);
  const usuarioMap = useMemo(() => Object.fromEntries(
    (usuarios ?? []).map(u => [u.id, `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim() || u.dni])
  ), [usuarios]);

  return useMemo(() => bienes.map(b => ({
    ...b,
    sede_nombre:             b.sede_nombre             ?? sedeMap[b.sede_id]               ?? (b.sede_id    ? `Sede #${b.sede_id}`    : '—'),
    modulo_nombre:           b.modulo_nombre           ?? moduloMap[b.modulo_id]            ?? (b.modulo_id  ? `Mód. #${b.modulo_id}` : null),
    usuario_asignado_nombre: b.usuario_asignado_nombre ?? usuarioMap[b.usuario_asignado_id] ?? (b.usuario_asignado_id ? `ID #${b.usuario_asignado_id}` : '—'),
  })), [bienes, sedeMap, moduloMap, usuarioMap]);
}