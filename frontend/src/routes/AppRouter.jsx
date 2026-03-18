import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import AppLayout       from '../components/layout/AppLayout';
import PageLoader      from '../components/feedback/PageLoader';
import ProtectedRoute  from './ProtectedRoute';
import PermissionRoute from './PermissionRoute';

const Login            = lazy(() => import('../pages/auth/Login'));
const Dashboard        = lazy(() => import('../pages/dashboard/Dashboard'));
const Alertas          = lazy(() => import('../pages/dashboard/Alertas'));
const UsuariosPage     = lazy(() => import('../pages/admin/usuarios/UsuariosPage'));
const RolesPage        = lazy(() => import('../pages/admin/roles/RolesPage'));
const LocacionesPage   = lazy(() => import('../pages/admin/locaciones/LocacionesPage'));
const SeguridadPage    = lazy(() => import('../pages/admin/seguridad/SeguridadPage'));
const CatalogosPage    = lazy(() => import('../pages/assets/catalogos/CatalogosPage'));
const BienesPage       = lazy(() => import('../pages/assets/bienes/BienesPage'));
const TransferenciasPage  = lazy(() => import('../pages/assets/transferencias/TransferenciasPage'));
const MantenimientosPage  = lazy(() => import('../pages/assets/mantenimientos/MantenimientosPage'));

export default function AppRouter() {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);

  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader fullScreen />}>
        <Routes>
          <Route path="/login"
            element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} />

          <Route path="/403" element={
            <div className="flex items-center justify-center h-screen"
              style={{ background: 'var(--color-bg)' }}>
              <div className="text-center">
                <p className="text-7xl font-black" style={{ color: 'var(--color-border)' }}>403</p>
                <p className="mt-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                  No tienes permisos para acceder a esta página.
                </p>
              </div>
            </div>
          } />

          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="alertas"   element={<Alertas />} />

              <Route element={<PermissionRoute perm="ms-usuarios:users:add_user" />}>
                <Route path="admin/usuarios" element={<UsuariosPage />} />
              </Route>
              <Route element={<PermissionRoute perm="ms-usuarios:roles:view_role" />}>
                <Route path="admin/roles" element={<RolesPage />} />
              </Route>
              <Route element={<PermissionRoute perm="ms-usuarios:locations:view_sede" />}>
                <Route path="admin/locaciones" element={<LocacionesPage />} />
              </Route>
              <Route element={<PermissionRoute perm="ms-usuarios:authentication:view_loginattempt" />}>
                <Route path="/admin/seguridad" element={<SeguridadPage />} />
              </Route>

              <Route element={<PermissionRoute perm="ms-bienes:catalogos:add_catcategoriabien" />}>
                <Route path="catalogos" element={<CatalogosPage />} />
              </Route>
              <Route element={<PermissionRoute perm="ms-bienes:bienes:view_bien" />}>
                <Route path="bienes" element={<BienesPage />} />
              </Route>
              <Route element={<PermissionRoute perm="ms-bienes:transferencias:view_transferencia" />}>
                <Route path="transferencias" element={<TransferenciasPage />} />
              </Route>
              <Route element={<PermissionRoute perm="ms-bienes:mantenimientos:view_mantenimiento" />}>
                <Route path="mantenimientos" element={<MantenimientosPage />} />
              </Route>
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}