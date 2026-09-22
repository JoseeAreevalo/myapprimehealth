import { Activity, ChevronDown, Dumbbell, Flame, LogOut, Menu, Search, ShieldCheck, Sparkles, User, Users, Utensils, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationsBell from './NotificationsBell';
import ProfileModal from './ProfileModal';
import lionLogo from '../assets/lion-logo.png';

const navigation = [
    { label: 'Resumen', icon: Sparkles, to: '/' },
    { label: 'Nutrición', icon: Utensils, to: '/nutrition' },
    { label: 'Entrenamiento', icon: Dumbbell, to: '/training' },
    { label: 'Actividad', icon: Flame, to: '/activity' },
    { label: 'Progreso', icon: Activity, to: '/progress' },
];

const coachNavigation = [
    { label: 'Nutrición de clientes', icon: Utensils, to: '/clients/nutrition' },
    { label: 'Entrenamiento de clientes', icon: Users, to: '/clients/training' },
    { label: 'Actividad de clientes', icon: Flame, to: '/clients/activity' },
    { label: 'Seguimiento', icon: Search, to: '/clients/review' },
];

const superAdminNavigation = [
    { label: 'Configuración de perfiles', icon: ShieldCheck, to: '/admin/profiles' },
];

export interface LayoutContext {
    openProfile: () => void;
}

function BrandMark() {
    return (
        <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center overflow-hidden rounded-2xl bg-black shadow-[0_0_30px_oklch(0.58_0.24_295_/_0.42)]">
                <img alt="Prime Health" className="size-full object-cover" src={lionLogo} />
            </div>
            <span className="font-display text-lg font-semibold tracking-tight text-slate-50">prime health</span>
        </div>
    );
}

export default function AppLayout() {
    const [menuOpen, setMenuOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const userMenuRef = useRef<HTMLDivElement>(null);
    const { user, logout } = useAuth();
    const displayName = user?.fullName || user?.name || 'ahí';
    const firstName = displayName.split(' ')[0] || 'Hola';
    const todayLabel = new Date().toLocaleDateString('es-MX', { weekday: 'long', month: 'long', day: 'numeric' });
    const isCoach = user?.role === 'coach';
    const isSuperAdmin = user?.role === 'super_admin';
    const allNavigation = [...navigation, ...(isCoach ? coachNavigation : []), ...(isSuperAdmin ? superAdminNavigation : [])];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setUserMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="min-h-screen bg-ink text-slate-100">
            <div className="ambient-orb ambient-orb-top" />
            <div className="ambient-orb ambient-orb-bottom" />

            <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-white/7 bg-panel/75 px-6 py-8 backdrop-blur-xl lg:block">
                <BrandMark />
                <div className="mt-14">
                    <p className="px-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Mi espacio</p>
                    <nav className="mt-4 space-y-2">
                        {allNavigation.map(({ label, icon: Icon, to }) => (
                            <NavLink
                                className={({ isActive }) =>
                                    `flex h-12 items-center gap-3 rounded-xl px-3 text-sm font-medium transition ${isActive ? 'bg-amber-500/15 text-amber-200 ring-1 ring-amber-400/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'
                                    }`
                                }
                                end={to === '/'}
                                key={label}
                                to={to}
                            >
                                <Icon size={19} strokeWidth={1.9} />
                                {label}
                            </NavLink>
                        ))}
                    </nav>
                </div>
                <div className="absolute inset-x-6 bottom-8 rounded-2xl border border-white/8 bg-white/[0.035] p-4">
                    <div className="flex items-center gap-3">
                        <div className="grid size-10 place-items-center rounded-xl bg-amber-500/15 text-amber-300">
                            <Sparkles size={19} />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-white">Prime Plus</p>
                            <p className="mt-0.5 text-xs text-slate-500">Tu camino personalizado</p>
                        </div>
                    </div>
                </div>
            </aside>

            <header className="fixed inset-x-0 top-0 z-20 border-b border-white/7 bg-ink/75 px-5 py-4 backdrop-blur-xl lg:left-72 lg:px-10">
                <div className="mx-auto flex max-w-[1480px] items-center justify-between">
                    <div className="lg:hidden">
                        <BrandMark />
                    </div>
                    <div className="hidden lg:block">
                        <p className="text-sm text-slate-500">{todayLabel}</p>
                        <p className="mt-0.5 text-sm font-medium text-slate-300">Haz que hoy cuente.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <NotificationsBell />
                        <div className="hidden items-center gap-3 sm:flex">
                            <div className="relative" ref={userMenuRef}>
                                <button
                                    className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.035] py-1.5 pl-1.5 pr-3 text-sm"
                                    onClick={() => setUserMenuOpen((current) => !current)}
                                    type="button"
                                >
                                    <span className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-amber-400 to-yellow-600 text-xs font-bold text-white">
                                        {firstName.substring(0, 2).toUpperCase()}
                                    </span>
                                    <span className="font-medium text-slate-200">{firstName}</span>
                                    <ChevronDown size={16} className="text-slate-500" />
                                </button>
                                {userMenuOpen && (
                                    <div className="absolute right-0 top-14 z-50 w-48 rounded-2xl border border-white/10 bg-panel p-2 shadow-2xl">
                                        <button
                                            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-200 hover:bg-white/8"
                                            onClick={() => {
                                                setProfileOpen(true);
                                                setUserMenuOpen(false);
                                            }}
                                            type="button"
                                        >
                                            <User size={16} /> Mi perfil
                                        </button>
                                        <button
                                            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-200 hover:bg-white/8"
                                            onClick={logout}
                                            type="button"
                                        >
                                            <LogOut size={16} /> Cerrar sesión
                                        </button>
                                    </div>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={logout}
                                aria-label="Cerrar sesión"
                                className="grid size-11 place-items-center rounded-xl border border-white/8 bg-white/[0.035] text-slate-300 transition hover:bg-white/8"
                            >
                                <LogOut size={18} />
                            </button>
                        </div>
                        <button aria-label="Abrir menú" className="grid size-11 place-items-center rounded-xl border border-white/8 bg-white/[0.035] lg:hidden" onClick={() => setMenuOpen((open) => !open)}>
                            {menuOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>
                    </div>
                </div>
            </header>

            {menuOpen && (
                <nav className="fixed inset-x-4 top-20 z-40 rounded-2xl border border-white/10 bg-panel p-3 shadow-2xl lg:hidden">
                    {allNavigation.map(({ label, icon: Icon, to }) => (
                        <NavLink
                            className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-300 hover:bg-white/5"
                            key={label}
                            onClick={() => setMenuOpen(false)}
                            to={to}
                        >
                            <Icon size={18} /> {label}
                        </NavLink>
                    ))}
                </nav>
            )}

            <main className="relative mx-auto max-w-[1480px] px-5 pb-12 pt-28 lg:ml-72 lg:px-10">
                <Outlet context={{ openProfile: () => setProfileOpen(true) } satisfies LayoutContext} />
            </main>
            <ProfileModal onClose={() => setProfileOpen(false)} open={profileOpen} />
        </div>
    );
}
