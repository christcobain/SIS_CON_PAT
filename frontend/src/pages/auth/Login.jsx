import { useState, useEffect } from 'react';
import { useAuth }        from '../../hooks/useAuth';
import ChangePassword     from './ChangePassword';
import icono_pj           from '../../assets/images/icono_pj.jpg';

const bgStyle = {
  background:
    'linear-gradient(rgba(0,0,0,0.62),rgba(0,0,0,0.62)),' +
    'url("https://images.unsplash.com/photo-1589829545856-d10d557cf95f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80")',
  backgroundSize: 'cover', backgroundPosition: 'center',
};

const Icon = ({ name, className = '' }) => (
  <span className={`material-symbols-outlined leading-none select-none ${className}`}>{name}</span>
);

export default function Login() {
  const { login, loading, error } = useAuth();
  const [username, setUsername]   = useState('');
  const [password, setPassword]   = useState('');
  const [showPass, setShowPass]   = useState(false);

  const [cpOpen,     setCpOpen]     = useState(false);
  const [cpMode,     setCpMode]     = useState('voluntary');
  const [cpUsername, setCpUsername] = useState('');

  const openChangePassword = (mode, user = '') => {
    setCpMode(mode);
    setCpUsername(user || username);
    setCpOpen(true);
  };

  // const handleSubmit = async (e) => {
  //   e.preventDefault();
  //   try {
  //     await login(username, password);
  //   } catch (err) {
  //     const msg = err?.response?.data?.error;
  //     const mustChange = Array.isArray(msg) 
  //       ? msg.some(m => m.includes("Debe cambiar su contraseña")) 
  //       : msg?.includes("Debe cambiar su contraseña");

  //     if (mustChange) {
  //       openChangePassword('expired', username);
  //     }
  //   }
  // };
  const handleSubmit = async (e) => {
    e.preventDefault();
    localStorage.removeItem('sisconpat-auth-storage');
    try {
        await login(username, password);
    } catch (err) {
        const msg = err?.response?.data?.error;
        const mustChange = Array.isArray(msg)
            ? msg.some(m => m.includes('Debe cambiar su contraseña'))
            : msg?.includes('Debe cambiar su contraseña');
        if (mustChange) {
            openChangePassword('expired', username);
        }
    }
};




  useEffect(() => {
    const handler = (e) => openChangePassword(e.detail.mode, e.detail.username);
    window.addEventListener('sisconpat:openChangePassword', handler);
    return () => window.removeEventListener('sisconpat:openChangePassword', handler);
  }, [username]);

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12" style={bgStyle}>
      <div className="w-full max-w-md space-y-6">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
          <div className="h-1.5 w-full bg-primary" />
          <div className="px-10 pt-8 pb-6">
            <div className="flex justify-center mb-7">
              <div className="relative">
                <div className="absolute -inset-2 bg-primary rounded-full blur opacity-20" />
                <img src={icono_pj} alt="Logo Poder Judicial" className="relative h-20 w-auto drop-shadow-md" />
              </div>
            </div>
            <div className="text-center mb-8">
              <h1 className="text-xl font-black text-gray-800 tracking-tight uppercase leading-tight">
                Sistema de Control Patrimonial
              </h1>
              <div className="h-0.5 w-10 bg-primary mx-auto mt-2.5 rounded-full" />
              <p className="text-gray-400 text-[10px] font-bold mt-2.5 uppercase tracking-widest">
                Corte Superior de Justicia de Lima Norte
              </p>
            </div>

            {error && (
              <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                <Icon name="error" className="text-red-500 text-[18px] mt-0.5 shrink-0" />
                <p className="text-sm text-red-700 font-medium">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
                  Usuario (DNI)
                </label>
                <div className="relative">
                  <Icon name="badge" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 text-[20px] pointer-events-none" />
                  <input type="text" required autoFocus disabled={loading}
                    value={username} onChange={(e) => setUsername(e.target.value)}
                    placeholder="Ingrese su número de DNI"
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl
                               text-gray-700 font-medium text-sm focus:outline-none focus:ring-2
                               focus:border-primary transition-all disabled:opacity-60" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
                  Contraseña
                </label>
                <div className="relative">
                  <Icon name="lock" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 text-[20px] pointer-events-none" />
                  <input type={showPass ? 'text' : 'password'} required disabled={loading}
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••"
                    className="w-full pl-10 pr-11 py-3 bg-gray-50 border border-gray-200 rounded-xl
                               text-gray-700 text-sm focus:outline-none focus:ring-2
                               focus:border-primary transition-all disabled:opacity-60" />
                  <button type="button" tabIndex={-1} onClick={() => setShowPass((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors">
                    <Icon name={showPass ? 'visibility_off' : 'visibility'} className="text-[20px]" />
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="w-full py-3.5 rounded-xl text-white font-black text-sm uppercase tracking-widest
                           transition-all shadow-lg flex items-center justify-center gap-2.5
                           disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ background: 'var(--color-primary)' }}
                onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = 'var(--color-primary-hover)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--color-primary)'; }}
              >
                {loading
                  ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Verificando...</>
                  : <><Icon name="login" className="text-[18px]" /> Ingresar al Sistema</>
                }
              </button>
            </form>
          </div>

          <div className="px-10 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
            <p className="text-[10px] text-gray-400 uppercase tracking-tighter font-medium">
              Acceso restringido · Personal autorizado
            </p>
            <button type="button"
              onClick={() => openChangePassword('voluntary')}
              className="flex items-center gap-1.5 text-[11px] font-semibold transition-colors"
              style={{ color: 'var(--color-primary)' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-primary-hover)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-primary)'; }}
            >
              <Icon name="key" className="text-[15px]" />
              Cambiar contraseña
            </button>
          </div>
        </div>

        <div className="text-center space-y-1.5">
          <p className="text-white text-xs font-bold tracking-widest uppercase opacity-80">Poder Judicial del Perú</p>
          <div className="flex justify-center items-center gap-2">
            <span className="h-px w-4 bg-red-400 opacity-50" />
            <p className="text-gray-300 text-[10px] font-medium tracking-wider">Versión 1.1.0 — Coordinación de Informática</p>
            <span className="h-px w-4 bg-red-400 opacity-50" />
          </div>
          <p className="text-gray-400 text-[9px] uppercase tracking-tighter opacity-60">
            © {new Date().getFullYear()} Corte Superior de Justicia de Lima Norte
          </p>
        </div>
      </div>
      <ChangePassword
        open={cpOpen}
        onClose={() => setCpOpen(false)}
        onSuccess={() => setCpOpen(false)}
        mode={cpMode}
        username={cpUsername}
      />
    </main>
  );
}