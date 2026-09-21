import { useState, useEffect } from 'react';
import { ArrowRight, HeartPulse, ShieldCheck, Sparkles } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import lionLogo from '../assets/lion-logo.png';

export default function Login() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const errorMsg = searchParams.get('error');
    if (errorMsg) setError(errorMsg);
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(email, password, name || undefined);
      }
      navigate('/');
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error?.message || 'La solicitud falló.');
      } else {
        setError('Algo salió mal. Inténtalo de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-ink text-slate-100">
      <div className="ambient-orb ambient-orb-top" />
      <div className="ambient-orb ambient-orb-bottom" />

      <div className="relative mx-auto flex min-h-screen max-w-7xl items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid w-full max-w-6xl overflow-hidden rounded-[2rem] border border-white/8 bg-panel/80 shadow-[0_25px_80px_rgba(15,23,42,0.45)] backdrop-blur-xl lg:grid-cols-[1.1fr_0.9fr]">
          <div className="relative hidden overflow-hidden border-r border-white/8 bg-gradient-to-br from-amber-500/20 via-panel to-panel p-8 lg:block">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(217,158,45,0.28),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.20),transparent_30%)]" />
            <div className="relative flex h-full flex-col justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <div className="grid size-11 place-items-center overflow-hidden rounded-2xl bg-black shadow-[0_0_30px_rgba(217,158,45,0.5)]">
                    <img alt="Prime Health" className="size-full object-cover" src={lionLogo} />
                  </div>
                  <span className="font-display text-2xl font-semibold tracking-tight text-white">prime health</span>
                </div>

                <div className="mt-12 space-y-6">
                  <p className="eyebrow text-amber-200">Tu ritmo diario</p>
                  <h1 className="font-display text-4xl font-semibold tracking-[-0.05em] text-slate-50 xl:text-5xl">
                    Hábitos más inteligentes para una mejor versión de ti.
                  </h1>
                  <p className="max-w-md text-base leading-7 text-slate-200">
                    Nutrición personalizada, información de bienestar y seguimiento de progreso pensados para ayudarte a sentirte mejor cada día.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {[
                  { icon: Sparkles, text: 'Plan de bienestar guiado por IA' },
                  { icon: HeartPulse, text: 'Información de progreso en tiempo real' },
                  { icon: ShieldCheck, text: 'Seguro y privado por diseño' },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-3 rounded-2xl border border-white/7 bg-white/[0.03] px-4 py-3 text-sm text-slate-200">
                    <span className="grid size-9 place-items-center rounded-xl bg-amber-500/15 text-amber-200">
                      <Icon size={18} />
                    </span>
                    {text}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center p-6 sm:p-8 lg:p-10">
            <div className="w-full max-w-md">
              <div className="mb-8 flex items-center justify-between">
                <div>
                  <p className="eyebrow text-slate-400">Bienvenido</p>
                  <h2 className="mt-2 font-display text-3xl font-semibold tracking-[-0.04em] text-slate-50">
                    {mode === 'login' ? 'Qué bueno verte de nuevo' : 'Crea tu cuenta'}
                  </h2>
                </div>
                <span className="rounded-full border border-amber-300/30 bg-amber-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-200">
                  Prime
                </span>
              </div>

              <div className="mb-7 flex rounded-2xl border border-white/8 bg-white/[0.03] p-1">
                {['login', 'register'].map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => {
                      setMode(tab as 'login' | 'register');
                      setError('');
                    }}
                    className={`flex-1 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                      mode === tab
                        ? 'bg-amber-500 text-white shadow-[0_10px_30px_rgba(217,158,45,0.35)]'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {tab === 'login' ? 'Iniciar sesión' : 'Registrarme'}
                  </button>
                ))}
              </div>

              {error && (
                <div className="mb-5 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {mode === 'register' && (
                  <div>
                    <label htmlFor="name" className="mb-2 block text-sm font-medium text-slate-300">
                      Nombre completo
                    </label>
                    <input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-xl border border-white/12 bg-slate-950/60 px-3.5 py-3 text-sm text-slate-50 placeholder:text-slate-400 focus:border-amber-300/70 focus:outline-none focus:ring-2 focus:ring-amber-500/25"
                      placeholder="Tu nombre"
                    />
                  </div>
                )}

                <div>
                  <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-300">
                    Correo electrónico
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-white/12 bg-slate-950/60 px-3.5 py-3 text-sm text-slate-50 placeholder:text-slate-400 focus:border-amber-300/70 focus:outline-none focus:ring-2 focus:ring-amber-500/25"
                    placeholder="nombre@ejemplo.com"
                    required
                    autoFocus
                  />
                </div>

                <div>
                  <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-300">
                    Contraseña {mode === 'register' && <span className="text-slate-500">(mínimo 8 caracteres)</span>}
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-white/12 bg-slate-950/60 px-3.5 py-3 text-sm text-slate-50 placeholder:text-slate-400 focus:border-amber-300/70 focus:outline-none focus:ring-2 focus:ring-amber-500/25"
                    placeholder="••••••••"
                    required
                    minLength={mode === 'register' ? 8 : undefined}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="group flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? 'Un momento…' : mode === 'login' ? 'Entrar a tu cuenta' : 'Crear mi cuenta'}
                  <ArrowRight size={16} className="transition group-hover:translate-x-0.5" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}