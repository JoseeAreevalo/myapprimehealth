import { useState } from 'react';
import { Settings, Utensils } from 'lucide-react';
import { Link, useOutletContext } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import CoachingPanel from '../components/CoachingPanel';
import WeeklyCheckInCard from '../components/WeeklyCheckInCard';
import ProgressPanel from '../components/ProgressPanel';
import FoodCalculator from '../components/FoodCalculator';
import TrainingSummaryCard from '../components/TrainingSummaryCard';
import MealLogger from '../components/MealLogger';
import { useNutritionToday } from '../hooks/useNutritionToday';
import { useHydrationToday } from '../hooks/useHydrationToday';
import { findActiveDayConfig } from '../utils/weekday';
import type { LayoutContext } from '../components/AppLayout';

export default function OverviewPage() {
    const { user } = useAuth();
    const { openProfile } = useOutletContext<LayoutContext>();
    const { todayPlan, loading: nutritionLoading, error: nutritionError, logMeal, isClient } = useNutritionToday();
    const { consumedMl, logWater } = useHydrationToday();
    const [customMl, setCustomMl] = useState('');
    const displayName = user?.fullName || user?.name || 'ahí';
    const firstName = displayName.split(' ')[0] || 'Hola';

    const completedCalories = (todayPlan?.meals ?? [])
        .filter((meal) => meal.status === 'completed')
        .reduce((total, meal) => total + (meal.loggedCalories ?? meal.calories), 0);
    const goalCalories = todayPlan?.goalCalories ?? 0;
    const leftCalories = Math.max(goalCalories - completedCalories, 0);
    const progressPercent = goalCalories > 0 ? Math.min((completedCalories / goalCalories) * 100, 100) : 0;
    const waterGoalMl = todayPlan?.waterGoalMl ?? 2000;
    const waterProgress = Math.min((consumedMl / waterGoalMl) * 100, 100);

    return (
        <section className="grid gap-8 xl:grid-cols-[1fr_360px]">
            <div>
                <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <p className="mb-3 flex items-center gap-2 text-sm font-medium text-amber-300"><span className="size-2 rounded-full bg-amber-400" /> TU RITMO DIARIO</p>
                        <h1 className="font-display text-4xl font-semibold tracking-[-0.04em] text-slate-50 sm:text-5xl">Buenos días, {firstName}.</h1>
                        <p className="mt-3 max-w-xl text-base leading-7 text-slate-300">Pequeñas acciones con propósito. Una mejor versión de ti, un día a la vez.</p>
                    </div>
                    <button
                        className="hidden h-11 items-center gap-2 rounded-xl border border-white/9 px-4 text-sm font-medium text-slate-300 transition hover:border-amber-400/40 hover:text-white sm:flex"
                        onClick={openProfile}
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
                        {todayPlan && (todayPlan.proteinGTarget || todayPlan.carbsGTarget || todayPlan.fatGTarget) && (
                            <div className="mt-4 grid grid-cols-3 gap-2 border-t border-white/7 pt-4 text-center text-xs">
                                <div>
                                    <p className="text-slate-500">PRO</p>
                                    <p className="mt-0.5 font-semibold text-slate-100">{todayPlan.proteinGTarget ?? '—'}g</p>
                                </div>
                                <div>
                                    <p className="text-slate-500">CHO</p>
                                    <p className="mt-0.5 font-semibold text-slate-100">{todayPlan.carbsGTarget ?? '—'}g</p>
                                </div>
                                <div>
                                    <p className="text-slate-500">GRA</p>
                                    <p className="mt-0.5 font-semibold text-slate-100">{todayPlan.fatGTarget ?? '—'}g</p>
                                </div>
                            </div>
                        )}
                    </article>
                    <article className="metric-card">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="eyebrow">Agua</p>
                                <p className="mt-4 font-display text-4xl font-semibold tracking-[-0.04em] text-slate-50">
                                    {(consumedMl / 1000).toFixed(1)} <span className="text-base font-medium text-slate-400">/ {(waterGoalMl / 1000).toFixed(1)} L</span>
                                </p>
                            </div>
                            <span className="grid size-11 place-items-center rounded-xl bg-cyan-400/10 text-cyan-300">💧</span>
                        </div>
                        <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/8">
                            <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-sky-500" style={{ width: `${waterProgress}%` }} />
                        </div>
                        <button
                            type="button"
                            onClick={() => logWater(100)}
                            className="mt-8 w-full rounded-xl bg-white/7 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/12"
                        >
                            {consumedMl >= waterGoalMl ? 'Meta alcanzada' : '+ 100 ml'}
                        </button>
                        <div className="mt-2 flex gap-2">
                            <input
                                className="w-full rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
                                min={1}
                                onChange={(event) => setCustomMl(event.target.value)}
                                placeholder="Otra cantidad (ml)"
                                type="number"
                                value={customMl}
                            />
                            <button
                                className="shrink-0 rounded-xl bg-white/7 px-4 text-sm font-medium text-slate-300 transition hover:bg-white/12 disabled:opacity-40"
                                disabled={!customMl || Number(customMl) <= 0}
                                onClick={() => {
                                    logWater(Number(customMl));
                                    setCustomMl('');
                                }}
                                type="button"
                            >
                                Añadir
                            </button>
                        </div>
                    </article>
                </section>

                <section className="mt-8 rounded-3xl border border-white/8 bg-panel/70 p-5 shadow-panel sm:p-7">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <p className="eyebrow">Comidas de hoy</p>
                            <h2 className="mt-2 font-display text-2xl font-semibold tracking-[-0.03em] text-slate-50">Nutre con intención</h2>
                            {todayPlan && findActiveDayConfig(todayPlan.dayConfigs) && (
                                <span className="mt-2 inline-block rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-medium text-amber-200">
                                    Hoy: {findActiveDayConfig(todayPlan.dayConfigs)?.label}
                                </span>
                            )}
                        </div>
                    </div>
                    {isClient && nutritionLoading && <p className="mt-7 text-sm text-slate-500">Cargando tu plan…</p>}
                    {isClient && !nutritionLoading && nutritionError && <p className="mt-7 text-sm text-rose-300">{nutritionError}</p>}
                    {isClient && !nutritionLoading && !nutritionError && !todayPlan && (
                        <div className="mt-7">
                            <p className="text-sm text-slate-400">Aún no tienes un plan de nutrición.</p>
                            <Link className="mt-3 inline-block text-sm font-medium text-amber-300 hover:text-amber-200" to="/nutrition">
                                Configura tu plan en Nutrición →
                            </Link>
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
                                        {meal.items.length > 0 && (
                                            <p className="mt-1 truncate text-xs text-slate-500">
                                                {meal.items.map((item) => `${item.foodName} (${item.grams}g)`).join(', ')}
                                            </p>
                                        )}
                                        {meal.items.length > 0 && (
                                            <p className="mt-1 text-xs text-slate-400">
                                                P {meal.items.reduce((sum, item) => sum + item.proteinG, 0).toFixed(1)}g · C{' '}
                                                {meal.items.reduce((sum, item) => sum + item.carbsG, 0).toFixed(1)}g · G{' '}
                                                {meal.items.reduce((sum, item) => sum + item.fatG, 0).toFixed(1)}g
                                            </p>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-medium text-slate-300">
                                            {meal.status === 'completed' && meal.loggedCalories != null ? Math.round(meal.loggedCalories) : meal.calories} kcal
                                        </p>
                                        <MealLogger meal={meal} onLog={logMeal} />
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                    {todayPlan && (
                        <Link className="mt-5 inline-block text-xs font-medium text-amber-300 hover:text-amber-200" to="/nutrition">
                            Editar plan en Nutrición →
                        </Link>
                    )}
                </section>
            </div>

            <aside className="space-y-5">
                <CoachingPanel />
                <TrainingSummaryCard />
                <WeeklyCheckInCard />
                <ProgressPanel />
                <FoodCalculator />
            </aside>
        </section>
    );
}
