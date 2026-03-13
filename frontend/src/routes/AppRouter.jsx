import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore }  from '../store/authStore';
import AppLayout         from '../components/layout/AppLayout';
import Login             from '../pages/auth/Login';
import Dashboard         from '../pages/dashboard/Dashboard';
import Alertas           from '../pages/dashboard/Alertas';
import UsuariosPage      from '../pages/admin/usuarios/UsuariosPage';
import RolesPage         from '../pages/admin/roles/RolesPage';
import LocacionesPage    from '../pages/admin/locaciones/LocacionesPage';
import ProtectedRoute    from './ProtectedRoute';
import PermissionRoute   from './PermissionRoute';

export default function AppRouter() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return (
    <BrowserRouter>
      <Routes>
        {/* ── Públicas — sin sesión requerida ────────────────────────────── */}
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/" replace /> : <Login />}
        />
        {/* ── 403 ─────────────────────────────────────────────────────────── */}
        <Route
          path="/403"
          element={
            <div className="flex items-center justify-center h-screen"
              style={{ background: 'var(--color-bg)' }}>
              <div className="text-center">
                <p className="text-7xl font-black" style={{ color: 'var(--color-border)' }}>403</p>
                <p className="mt-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                  No tienes permisos para acceder a esta página.
                </p>
              </div>
            </div>
          }
        />

        {/* ── Protegidas — requieren sesión activa ────────────────────────── */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="alertas"   element={<Alertas />} />
            <Route element={<PermissionRoute perm="ms-usuarios:users:add_user" />}>
              <Route path="admin/usuarios" element={<UsuariosPage />} />
            </Route>
            <Route element={<PermissionRoute perm="ms-usuarios:users:view_user" />}>
              <Route path="admin/usuarios" element={<UsuariosPage />} />
            </Route>


            <Route element={<PermissionRoute perm="ms-usuarios:roles:view_role" />}>
              <Route path="admin/roles" element={<RolesPage />} />
            </Route>
            <Route element={<PermissionRoute perm="ms-usuarios:locations:view_sede" />}>
              <Route path="admin/locaciones" element={<LocacionesPage />} />
            </Route>

            {/* ── Próximas rutas (descomentar cuando existan) ─────────────
            <Route path="bienes"         element={<BienesPage />} />
            <Route path="transferencias" element={<TransferenciasPage />} />
            <Route path="mantenimientos" element={<MantenimientosPage />} />

            <Route element={<PermissionRoute perm="ms-usuarios:users:view_user" />}>
              <Route path="admin/usuarios" element={<UsuariosPage />} />
            </Route>

            <Route element={<PermissionRoute perm="ms-bienes:catalogos:view_cattipobien" />}>
              <Route path="catalogos" element={<CatalogosPage />} />
            </Route>
            ─────────────────────────────────────────────────────────────── */}
          </Route>
        </Route>
        {/* ── Catch-all ────────────────────────────────────────────────────── */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}