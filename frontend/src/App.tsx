import { Activity, ChevronDown, Droplets, HeartPulse, Home, LogOut, Menu, Settings, Sparkles, User, Utensils, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from './context/AuthContext';
import CoachingPanel from './components/CoachingPanel';
import WeeklyCheckInCard from './components/WeeklyCheckInCard';
import ProgressPanel from './components/ProgressPanel';
import AdministrationPanel from './components/AdministrationPanel';
import NotificationsBell from './components/NotificationsBell';
import SelfNutritionSetup from './components/SelfNutritionSetup';
import EditNutritionPlan from './components/EditNutritionPlan';
import WorkoutCard from './components/WorkoutCard';
import ProfileModal from './components/ProfileModal';
import FoodCalculator from './components/FoodCalculator';
import { useNutritionToday } from './hooks/useNutritionToday';
import lionLogo from './assets/lion-logo.png';

const navigation = [
  { label: 'Resumen', icon: Home, active: true },
  { label: 'Nutrición', icon: Utensils },
  { label: 'Progreso', icon: Activity },
  { label: 'Bienestar', icon: HeartPulse },
];

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

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const [waterMl, setWaterMl] = useState(1600);
  const { user, logout } = useAuth();
  const { plans, todayPlan, loading: nutritionLoading, error: nutritionError, activatePlan, logMeal, refresh: refreshNutrition, isClient } = useNutritionToday();
  const displayName = user?.fullName || user?.name || 'ahí';
  const firstName = displayName.split(' ')[0] || 'Hola';
  const todayLabel = new Date().toLocaleDateString('es-MX', { weekday: 'long', month: 'long', day: 'numeric' });

  const completedCalories = (todayPlan?.meals ?? [])
    .filter((meal) => meal.status === 'completed')
    .reduce((total, meal) => total + meal.calories, 0);
  const goalCalories = todayPlan?.goalCalories ?? 0;
  const leftCalories = Math.max(goalCalories - completedCalories, 0);
  const progressPercent = goalCalories > 0 ? Math.min((completedCalories / goalCalories) * 100, 100) : 0;
  const waterGoalMl = 2500;
  const waterProgress = Math.min((waterMl / waterGoalMl) * 100, 100);

  const handleMealStatusChange = (mealId: number, currentStatus: string) => {
    void logMeal(mealId, currentStatus === 'completed' ? 'next' : 'completed');
  };

  const handleWaterLog = () => {
    setWaterMl((current) => Math.min(current + 250, waterGoalMl));
  };

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
            {navigation.map(({ label, icon: Icon, active }) => (
              <a
                className={`flex h-12 items-center gap-3 rounded-xl px-3 text-sm font-medium transition ${
                  active ? 'bg-amber-500/15 text-amber-200 ring-1 ring-amber-400/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
                href="#overview"
                key={label}
              >
                <Icon size={19} strokeWidth={active ? 2.3 : 1.8} />
                {label}
              </a>
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
          {navigation.map(({ label, icon: Icon }) => (
            <a className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-300 hover:bg-white/5" href="#overview" key={label}>
              <Icon size={18} /> {label}
            </a>
          ))}
        </nav>
      )}

      <main className="relative mx-auto max-w-[1480px] px-5 pb-12 pt-28 lg:ml-72 lg:px-10">
        <section id="overview" className="grid gap-8 xl:grid-cols-[1fr_360px]">
          <div>
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="mb-3 flex items-center gap-2 text-sm font-medium text-amber-300"><span className="size-2 rounded-full bg-amber-400" /> TU RITMO DIARIO</p>
                <h1 className="font-display text-4xl font-semibold tracking-[-0.04em] text-slate-50 sm:text-5xl">Buenos días, {firstName}.</h1>
                <p className="mt-3 max-w-xl text-base leading-7 text-slate-300">Pequeñas acciones con propósito. Una mejor versión de ti, un día a la vez.</p>
              </div>
              <button
                className="hidden h-11 items-center gap-2 rounded-xl border border-white/9 px-4 text-sm font-medium text-slate-300 transition hover:border-amber-400/40 hover:text-white sm:flex"
                onClick={() => setProfileOpen(true)}
                type="button"
              >
                <Settings size={17} /> Personalizar
              </button>
            </div>

            <section className="grid gap-4 md:grid-cols-3">
              <article className="metric-card md:col-span-2">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="eyebrow">Presupuesto de nutrición</p>
                   <p className="mt-4 font-display text-5xl font-semibold tracking-[-0.05em] text-slate-50">
                     {leftCalories}
                     <span className="text-lg font-medium text-slate-400"> kcal restantes</span>
                   </p>
                 </div>
                 <span className="grid size-11 place-items-center rounded-xl bg-amber-500/15 text-amber-300"><Utensils size={20} /></span>
                </div>
               <div className="mt-8 h-2 overflow-hidden rounded-full bg-white/8">
                 <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-400" style={{ width: `${progressPercent}%` }} />
               </div>
               <div className="mt-3 flex justify-between text-xs text-slate-500">
                 <span>{completedCalories} consumidas</span>
                 <span>{goalCalories} meta</span>
               </div>
             </article>
             <article className="metric-card">
               <div className="flex items-start justify-between">
                 <div>
                   <p className="eyebrow">Agua</p>
                   <p className="mt-4 font-display text-4xl font-semibold tracking-[-0.04em] text-slate-50">
                     {(waterMl / 1000).toFixed(1)} <span className="text-base font-medium text-slate-400">/ 2.5 L</span>
                   </p>
                 </div>
                 <span className="grid size-11 place-items-center rounded-xl bg-cyan-400/10 text-cyan-300"><Droplets size={20} /></span>
               </div>
               <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/8">
                 <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-sky-500" style={{ width: `${waterProgress}%` }} />
               </div>
               <button
                 type="button"
                 onClick={handleWaterLog}
                 className="mt-8 w-full rounded-xl bg-white/7 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/12"
               >
                 {waterMl >= waterGoalMl ? 'Meta alcanzada' : 'Registrar 250 ml'}
               </button>
             </article>
            </section>

            <section className="mt-8 rounded-3xl border border-white/8 bg-panel/70 p-5 shadow-panel sm:p-7">
             <div className="flex items-start justify-between gap-4">
               <div>
                 <p className="eyebrow">Comidas de hoy</p>
                 <h2 className="mt-2 font-display text-2xl font-semibold tracking-[-0.03em] text-slate-50">Nutre con intención</h2>
               </div>
               {plans.length > 1 && (
                 <div className="flex flex-wrap gap-2">
                   {plans.map((plan) => (
                     <button
                       key={plan.id}
                       type="button"
                       onClick={() => activatePlan(plan.id)}
                       className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                         plan.isActive
                           ? 'bg-amber-500 text-white shadow-[0_10px_24px_rgba(217,158,45,0.28)]'
                           : 'bg-white/5 text-slate-300 hover:bg-white/10'
                       }`}
                     >
                       {plan.label}
                     </button>
                   ))}
                 </div>
               )}
             </div>
             {isClient && nutritionLoading && <p className="mt-7 text-sm text-slate-500">Cargando tu plan…</p>}
             {isClient && !nutritionLoading && nutritionError && <p className="mt-7 text-sm text-rose-300">{nutritionError}</p>}
             {isClient && !nutritionLoading && !nutritionError && !todayPlan && (
               <div className="mt-7">
                 <SelfNutritionSetup hasPlan={false} onCreated={refreshNutrition} />
               </div>
             )}
             {isClient && !nutritionLoading && !nutritionError && todayPlan && (
               <div className="mt-7 divide-y divide-white/7">
                 {todayPlan.meals.map((meal) => (
                   <article className="flex items-center gap-4 py-5 first:pt-0 last:pb-0" key={meal.id}>
                     <span className={`grid size-11 shrink-0 place-items-center rounded-xl ${meal.status === 'completed' ? 'bg-emerald-400/12 text-emerald-300' : 'bg-white/6 text-slate-400'}`}>
                       {meal.status === 'completed' ? <span className="text-lg">✓</span> : <Utensils size={18} />}
                     </span>
                     <div className="min-w-0 flex-1">
                       <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                         <h3 className="font-medium text-slate-50">{meal.name}</h3>
                         {meal.mealTime && <span className="text-xs text-slate-400">{meal.mealTime}</span>}
                       </div>
                       {meal.detail && <p className="mt-1 truncate text-sm text-slate-500">{meal.detail}</p>}
                     </div>
                     <div className="text-right">
                       <p className="text-sm font-medium text-slate-300">{meal.calories} kcal</p>
                       <button
                         type="button"
                         onClick={() => handleMealStatusChange(meal.id, meal.status)}
                         className={`mt-1 text-xs font-medium ${meal.status === 'completed' ? 'text-emerald-300' : 'text-slate-500'} hover:text-amber-300`}
                       >
                         {meal.status === 'completed' ? 'Completado' : meal.status === 'next' ? 'Marcar hecho' : 'Comenzar'}
                       </button>
                     </div>
                   </article>
                 ))}
               </div>
             )}
             {isClient && !nutritionLoading && !nutritionError && todayPlan && (
               <EditNutritionPlan onUpdated={refreshNutrition} plan={todayPlan} />
             )}
            </section>
          </div>

          <aside className="space-y-5">
            <CoachingPanel />
            <AdministrationPanel />
            <WorkoutCard />

            <WeeklyCheckInCard />
            <ProgressPanel />
            <FoodCalculator />
          </aside>
        </section>
      </main>
      <ProfileModal onClose={() => setProfileOpen(false)} open={profileOpen} />
    </div>
  );
}

export default App;
