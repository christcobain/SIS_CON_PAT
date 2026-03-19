PERMISOS TRANSFERENCIAS POR ROL
================================

CODENAMES DISPONIBLES (ms-bienes:transferencias):
  view_transferencia
  add_transferencia
  change_transferencia
  delete_transferencia
  change_transferenciadetalle

ASIGNACIÓN POR ROL:
┌──────────────────┬────────────────────┬───────────────────────┬────────────────────────┬──────────────────────┬──────────────────────────────┐
│ Rol              │ view_transferencia  │ add_transferencia     │ change_transferencia   │ delete_transferencia │ change_transferenciadetalle  │
├──────────────────┼────────────────────┼───────────────────────┼────────────────────────┼──────────────────────┼──────────────────────────────┤
│ SYSADMIN         │ ✅ (bypassea todo)  │ ✅                    │ ✅                     │ ✅                   │ ✅                           │
│ analistaSistema  │ ✅                  │ ✅ (solo traslados)   │ ✅ (reenviar, firmar)  │ ✅ (cancelar)        │ ✗                            │
│ coordSistema     │ ✅                  │ ✅ (solo traslados)   │ ✅ (aprobar lógico)    │ ✅ (cancelar)        │ ✗                            │
│ adminSede        │ ✅                  │ ✗                     │ ✅ (aprobar, devolver) │ ✗                    │ ✗                            │
│ asistSistema     │ ✅                  │ ✗                     │ ✅ (confirmar, firmar) │ ✗                    │ ✗                            │
│ segurSede        │ ✅                  │ ✗                     │ ✗                     │ ✗                    │ ✅ (aprobar/rechazar físico)  │
│ userCorte        │ ✅ (solo los suyos) │ ✗                     │ ✗                     │ ✗                    │ ✗                            │
└──────────────────┴────────────────────┴───────────────────────┴────────────────────────┴──────────────────────┴──────────────────────────────┘

SEPARACIÓN TRASLADO vs ASIGNACIÓN EN FRONTEND:
  El permiso add_transferencia habilita el botón "Nueva Transferencia".
  El frontend verifica ADEMÁS el rol para mostrar TRASLADO_SEDE o ASIGNACION_INTERNA:
    - TRASLADO_SEDE:      analistaSistema, coordSistema, SYSADMIN
    - ASIGNACION_INTERNA: asistSistema, SYSADMIN

  Para ver la tabla TRASLADOS pero no poder crear → asignar solo view_transferencia.
  Para ver Y crear traslados → view_transferencia + add_transferencia.

ENDPOINT PARA SEGURSEDE (sin llamada a ms-usuarios):
  GET /api/v1/transferencias/pendientes-segur/
  → usa TransferenciaSegurSerializer (sin nombres enriquecidos, solo IDs + bienes snapshot)
  → segurSede no necesita view_user en ms-usuarios para este endpoint

NOTA IMPORTANTE:
  El backend ya valida en services.py:
    - aprobar_segur_salida → _validar_sede_segursede(sede_segur_id, t.sede_ORIGEN_id)
    - aprobar_segur_entrada → _validar_sede_segursede(sede_segur_id, t.sede_DESTINO_id)
  El frontend DEBE verificar esto también para no mostrar botones incorrectos.
