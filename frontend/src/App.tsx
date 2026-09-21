import { Activity, Bell, ChevronDown, Droplets, Dumbbell, HeartPulse, Home, LogOut, Menu, Moon, Settings, Sparkles, Utensils, X } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from './context/AuthContext';
import CoachingPanel from './components/CoachingPanel';

type MealStatus = 'Completed' | 'Next' | 'Planned';

type Meal = {
  name: string;
  detail: string;
  time: string;
  status: MealStatus;
  calories: number;
};

type MenuPlanKey = 'balanced' | 'protein' | 'vegetarian';

type MenuPlan = {
  label: string;
  goalCalories: number;
  meals: Meal[];
};

const navigation = [
  { label: 'Overview', icon: Home, active: true },
  { label: 'Nutrition', icon: Utensils },
  { label: 'Progress', icon: Activity },
  { label: 'Wellness', icon: HeartPulse },
];

const menuPlans: Record<MenuPlanKey, MenuPlan> = {
  balanced: {
    label: 'Balanced',
    goalCalories: 2400,
    meals: [
      { name: 'Breakfast', detail: 'Overnight oats with berries', time: '08:00', status: 'Completed', calories: 482 },
      { name: 'Lunch', detail: 'Chicken harvest bowl', time: '13:00', status: 'Next', calories: 625 },
      { name: 'Dinner', detail: 'Miso salmon with greens', time: '19:30', status: 'Planned', calories: 540 },
    ],
  },
  protein: {
    label: 'High Protein',
    goalCalories: 2550,
    meals: [
      { name: 'Breakfast', detail: 'Greek yogurt bowl with chia and seeds', time: '08:15', status: 'Completed', calories: 520 },
      { name: 'Lunch', detail: 'Turkey quinoa power salad', time: '12:45', status: 'Completed', calories: 710 },
      { name: 'Dinner', detail: 'Grilled chicken and sweet potato', time: '19:00', status: 'Next', calories: 680 },
    ],
  },
  vegetarian: {
    label: 'Vegetarian',
    goalCalories: 2300,
    meals: [
      { name: 'Breakfast', detail: 'Avocado toast with hemp seeds', time: '08:30', status: 'Next', calories: 440 },
      { name: 'Lunch', detail: 'Lentil tabbouleh bowl', time: '13:00', status: 'Planned', calories: 610 },
      { name: 'Dinner', detail: 'Tofu stir-fry with brown rice', time: '19:15', status: 'Planned', calories: 645 },
    ],
  },
};

function BrandMark() {
  return (
    <div className="flex items-center gap-3">
      <div className="grid size-10 place-items-center rounded-2xl bg-violet-500 text-sm font-black text-white shadow-[0_0_30px_oklch(0.58_0.24_295_/_0.42)]">
        P
      </div>
      <span className="font-display text-lg font-semibold tracking-tight text-slate-50">prime health</span>
    </div>
  );
}

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<MenuPlanKey>('balanced');
  const [mealPlan, setMealPlan] = useState<Meal[]>(() => menuPlans.balanced.meals.map((meal) => ({ ...meal })));
  const [waterMl, setWaterMl] = useState(1600);
  const { user, logout } = useAuth();
  const displayName = user?.fullName || user?.name || 'there';
  const firstName = displayName.split(' ')[0] || 'There';
  const todayLabel = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  const selectedPlanConfig = menuPlans[selectedPlan];
  const completedCalories = mealPlan
    .filter((meal) => meal.status === 'Completed')
    .reduce((total, meal) => total + meal.calories, 0);
  const goalCalories = selectedPlanConfig.goalCalories;
  const leftCalories = Math.max(goalCalories - completedCalories, 0);
  const progressPercent = Math.min((completedCalories / goalCalories) * 100, 100);
  const waterGoalMl = 2500;
  const waterProgress = Math.min((waterMl / waterGoalMl) * 100, 100);

  const handlePlanChange = (planKey: MenuPlanKey) => {
    const nextPlan = menuPlans[planKey];
    setSelectedPlan(planKey);
    setMealPlan(nextPlan.meals.map((meal) => ({ ...meal })));
  };

  const handleMealStatusChange = (mealName: string) => {
    setMealPlan((currentMeals) =>
      currentMeals.map((meal) =>
        meal.name === mealName
          ? {
              ...meal,
              status: meal.status === 'Completed' ? 'Next' : 'Completed',
            }
          : meal,
      ),
    );
  };

  const handleWaterLog = () => {
    setWaterMl((current) => Math.min(current + 250, waterGoalMl));
  };

  return (
    <div className="min-h-screen bg-ink text-slate-100">
      <div className="ambient-orb ambient-orb-top" />
      <div className="ambient-orb ambient-orb-bottom" />

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-white/7 bg-panel/75 px-6 py-8 backdrop-blur-xl lg:block">
        <BrandMark />
        <div className="mt-14">
          <p className="px-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">My space</p>
          <nav className="mt-4 space-y-2">
            {navigation.map(({ label, icon: Icon, active }) => (
              <a
                className={`flex h-12 items-center gap-3 rounded-xl px-3 text-sm font-medium transition ${
                  active ? 'bg-violet-500/15 text-violet-200 ring-1 ring-violet-400/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'
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
            <div className="grid size-10 place-items-center rounded-xl bg-violet-500/15 text-violet-300">
              <Sparkles size={19} />
            </div>
            <div>
              <p className="text-sm font-medium text-white">Prime Plus</p>
              <p className="mt-0.5 text-xs text-slate-500">Your personalized path</p>
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
            <p className="mt-0.5 text-sm font-medium text-slate-300">Make today intentional.</p>
          </div>
          <div className="flex items-center gap-3">
            <button aria-label="Notifications" className="relative grid size-11 place-items-center rounded-xl border border-white/8 bg-white/[0.035] text-slate-300 transition hover:bg-white/8">
              <Bell size={19} />
              <span className="absolute right-2.5 top-2.5 size-1.5 rounded-full bg-violet-400" />
            </button>
            <div className="hidden items-center gap-3 sm:flex">
              <button className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.035] py-1.5 pl-1.5 pr-3 text-sm">
                <span className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-violet-400 to-fuchsia-600 text-xs font-bold text-white">
                  {firstName.substring(0, 2).toUpperCase()}
                </span>
                <span className="font-medium text-slate-200">{firstName}</span>
                <ChevronDown size={16} className="text-slate-500" />
              </button>
              <button
                type="button"
                onClick={logout}
                aria-label="Log out"
                className="grid size-11 place-items-center rounded-xl border border-white/8 bg-white/[0.035] text-slate-300 transition hover:bg-white/8"
              >
                <LogOut size={18} />
              </button>
            </div>
            <button aria-label="Open menu" className="grid size-11 place-items-center rounded-xl border border-white/8 bg-white/[0.035] lg:hidden" onClick={() => setMenuOpen((open) => !open)}>
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
                <p className="mb-3 flex items-center gap-2 text-sm font-medium text-violet-300"><span className="size-2 rounded-full bg-violet-400" /> YOUR DAILY RHYTHM</p>
                <h1 className="font-display text-4xl font-semibold tracking-[-0.04em] text-slate-50 sm:text-5xl">Good morning, {firstName}.</h1>
                <p className="mt-3 max-w-xl text-base leading-7 text-slate-300">Small, deliberate actions. A stronger you, one day at a time.</p>
              </div>
              <button className="hidden h-11 items-center gap-2 rounded-xl border border-white/9 px-4 text-sm font-medium text-slate-300 transition hover:border-violet-400/40 hover:text-white sm:flex">
                <Settings size={17} /> Personalize
              </button>
            </div>

            <section className="grid gap-4 md:grid-cols-3">
              <article className="metric-card md:col-span-2">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="eyebrow">Nutrition budget</p>
                   <p className="mt-4 font-display text-5xl font-semibold tracking-[-0.05em] text-slate-50">
                     {leftCalories}
                     <span className="text-lg font-medium text-slate-400"> kcal left</span>
                   </p>
                 </div>
                 <span className="grid size-11 place-items-center rounded-xl bg-violet-500/15 text-violet-300"><Utensils size={20} /></span>
                </div>
               <div className="mt-8 h-2 overflow-hidden rounded-full bg-white/8">
                 <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-400" style={{ width: `${progressPercent}%` }} />
               </div>
               <div className="mt-3 flex justify-between text-xs text-slate-500">
                 <span>{completedCalories} consumed</span>
                 <span>{goalCalories} goal</span>
               </div>
             </article>
             <article className="metric-card">
               <div className="flex items-start justify-between">
                 <div>
                   <p className="eyebrow">Water</p>
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
                 {waterMl >= waterGoalMl ? 'Goal reached' : 'Log 250 ml'}
               </button>
             </article>
            </section>

            <section className="mt-8 rounded-3xl border border-white/8 bg-panel/70 p-5 shadow-panel sm:p-7">
             <div className="flex items-start justify-between gap-4">
               <div>
                 <p className="eyebrow">Today's meals</p>
                 <h2 className="mt-2 font-display text-2xl font-semibold tracking-[-0.03em] text-slate-50">Nourish with intention</h2>
               </div>
               <div className="flex flex-wrap gap-2">
                 {Object.entries(menuPlans).map(([key, plan]) => (
                   <button
                     key={key}
                     type="button"
                     onClick={() => handlePlanChange(key as MenuPlanKey)}
                     className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                       selectedPlan === key
                         ? 'bg-violet-500 text-white shadow-[0_10px_24px_rgba(139,92,246,0.28)]'
                         : 'bg-white/5 text-slate-300 hover:bg-white/10'
                     }`}
                   >
                     {plan.label}
                   </button>
                 ))}
               </div>
             </div>
             <div className="mt-7 divide-y divide-white/7">
               {mealPlan.map((meal) => (
                 <article className="flex items-center gap-4 py-5 first:pt-0 last:pb-0" key={meal.name}>
                   <span className={`grid size-11 shrink-0 place-items-center rounded-xl ${meal.status === 'Completed' ? 'bg-emerald-400/12 text-emerald-300' : 'bg-white/6 text-slate-400'}`}>
                     {meal.status === 'Completed' ? <span className="text-lg">✓</span> : <Utensils size={18} />}
                   </span>
                   <div className="min-w-0 flex-1">
                     <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                       <h3 className="font-medium text-slate-50">{meal.name}</h3>
                       <span className="text-xs text-slate-400">{meal.time}</span>
                     </div>
                     <p className="mt-1 truncate text-sm text-slate-500">{meal.detail}</p>
                   </div>
                   <div className="text-right">
                     <p className="text-sm font-medium text-slate-300">{meal.calories} kcal</p>
                     <button
                       type="button"
                       onClick={() => handleMealStatusChange(meal.name)}
                       className={`mt-1 text-xs font-medium ${meal.status === 'Completed' ? 'text-emerald-300' : 'text-slate-500'} hover:text-violet-300`}
                     >
                       {meal.status === 'Completed' ? 'Completed' : meal.status === 'Next' ? 'Mark done' : 'Start'}
                     </button>
                   </div>
                 </article>
               ))}
             </div>
            </section>
          </div>

          <aside className="space-y-5">
            <CoachingPanel />
            <section className="overflow-hidden rounded-3xl border border-violet-400/15 bg-gradient-to-br from-violet-500/20 via-panel to-panel p-6 shadow-panel">
              <div className="flex items-center justify-between">
                <span className="grid size-11 place-items-center rounded-xl bg-violet-400/15 text-violet-200"><Dumbbell size={20} /></span>
                <span className="rounded-full border border-violet-300/20 bg-violet-300/10 px-3 py-1 text-xs font-semibold text-violet-200">Day 12</span>
              </div>
              <p className="eyebrow mt-8">Training focus</p>
              <h2 className="mt-3 font-display text-3xl font-semibold tracking-[-0.04em] text-slate-50">Build your<br />foundation.</h2>
              <p className="mt-4 text-sm leading-6 text-slate-300">Upper body strength · 45 minutes</p>
              <button className="mt-7 w-full rounded-xl bg-violet-400 py-3 text-sm font-semibold text-violet-950 transition hover:bg-violet-300">Start workout</button>
            </section>

            <section className="rounded-3xl border border-white/8 bg-panel/70 p-6 shadow-panel">
              <div className="flex items-center justify-between">
                <div>
                  <p className="eyebrow">Weekly check-in</p>
                  <h2 className="mt-2 font-display text-xl font-semibold tracking-[-0.03em] text-slate-50">Your progress story</h2>
                </div>
                <Moon className="text-violet-300" size={20} />
              </div>
              <div className="mt-6 grid grid-cols-7 gap-1.5">
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => (
                  <div className="text-center" key={`${day}-${index}`}>
                    <span className="text-[10px] font-medium text-slate-600">{day}</span>
                    <span className={`mt-2 block aspect-square rounded-lg ${index < 4 ? 'bg-violet-400 shadow-[0_0_14px_oklch(0.7_0.2_295_/_0.25)]' : index === 4 ? 'border border-violet-300/60 bg-violet-400/15' : 'bg-white/6'}`} />
                  </div>
                ))}
              </div>
              <p className="mt-5 text-sm leading-6 text-slate-300"><span className="font-semibold text-violet-300">4 days consistent.</span> Your weekly check-in unlocks tomorrow.</p>
              <button className="mt-5 text-sm font-semibold text-slate-50 hover:text-violet-200">Open check-in →</button>
            </section>
          </aside>
        </section>
      </main>
    </div>
  );
}

export default App;
