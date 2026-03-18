import { Suspense, useState } from 'react';
import { Outlet }  from 'react-router-dom';
import Navbar      from './Navbar';
import Sidebar     from './Sidebar';
import PageLoader  from '../feedback/PageLoader';

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--color-bg)' }}>
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(v => !v)} />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Navbar onToggleSidebar={() => setCollapsed(v => !v)} />

        <main className="flex-1 overflow-auto">
          <Suspense fallback={<PageLoader message="Cargando módulo..." />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}