import { useMemo } from 'react';

export function useBienesEnriquecidos(bienes = [], { sedes = [], modulos = [], ubicaciones = [], usuarios = [] } = {}) {
  // Mapeos simples para locaciones
  const sedeMap = useMemo(() => Object.fromEntries((sedes ?? []).map(s => [s.id, s.nombre])), [sedes]);
  const moduloMap = useMemo(() => Object.fromEntries((modulos ?? []).map(m => [m.id, m.nombre])), [modulos]);
  const ubicacionMap = useMemo(() => Object.fromEntries((ubicaciones ?? []).map(u => [u.id, u.nombre])), [ubicaciones]);
  const usuarioMap = useMemo(() => {
    return (usuarios ?? []).reduce((acc, u) => {
      acc[u.id] = {
        nombre: `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim() || u.dni || '—',
        cargo: u.cargo || 'Sin cargo'
      };
      return acc;
    }, {});
  }, [usuarios]);

  return useMemo(() =>
    bienes.map(b => {
      const datosAsignado = usuarioMap[b.usuario_asignado_id];
      const datosRegistra = usuarioMap[b.usuario_registra_id];
      return {
        ...b,
        sede_nombre: b.sede_nombre ?? sedeMap[b.sede_id] ?? (b.sede_id ? `Sede #${b.sede_id}` : '—'),
        modulo_nombre: b.modulo_nombre ?? moduloMap[b.modulo_id] ?? (b.modulo_id ? `Mód. #${b.modulo_id}` : null),
        ubicacion_nombre: b.ubicacion_nombre ?? ubicacionMap[b.ubicacion_id] ?? (b.ubicacion_id ? `Ubic. #${b.ubicacion_id}` : null),

        usuario_asignado_nombre: b.usuario_asignado_nombre ?? datosAsignado?.nombre ?? (b.usuario_asignado_id ? `ID #${b.usuario_asignado_id}` : '—'),
        usuario_asignado_cargo: b.usuario_asignado_cargo ?? datosAsignado?.cargo ?? (b.usuario_asignado_id ? '—' : null),

        usuario_registra_nombre: b.usuario_registra_nombre ?? datosRegistra?.nombre ?? (b.usuario_registra_id ? `ID #${b.usuario_registra_id}` : '—'),
      };
    }), [bienes, sedeMap, moduloMap, ubicacionMap, usuarioMap]);
}