import { useState } from 'react';
import { Outlet }   from 'react-router-dom';
import Navbar  from './Navbar';
import Sidebar from './Sidebar';

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--color-bg)' }}>
      {/* Sidebar — recibe estado de colapso */}
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((v) => !v)}
      />

      {/* Área principal */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Navbar — recibe callback para colapsar desde la franja superior */}
        <Navbar onToggleSidebar={() => setCollapsed((v) => !v)} />

        {/* Contenido de la página */}
        <main className="flex-1 overflow-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}