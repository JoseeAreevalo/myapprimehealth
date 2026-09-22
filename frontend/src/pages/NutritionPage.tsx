import { Utensils } from 'lucide-react';
import { useNutritionToday } from '../hooks/useNutritionToday';
import { useMyCoach } from '../hooks/useMyCoach';
import SelfNutritionSetup from '../components/SelfNutritionSetup';
import EditNutritionPlan from '../components/EditNutritionPlan';
import MealLogger from '../components/MealLogger';
import { findActiveDayConfig } from '../utils/weekday';

export default function NutritionPage() {
    const { plans, todayPlan, loading, error, activatePlan, refresh, isClient, logMeal } = useNutritionToday();
    const { hasCoach, loading: coachLoading } = useMyCoach();
    const canManageOwnPlan = isClient && !coachLoading && !hasCoach;

    return (
        <section className="mx-auto max-w-3xl">
            <div className="mb-8">
                <p className="mb-3 flex items-center gap-2 text-sm font-medium text-amber-300"><Utensils size={16} /> NUTRICIÓN</p>
                <h1 className="font-display text-4xl font-semibold tracking-[-0.04em] text-slate-50">Tu plan de nutrición</h1>
                <p className="mt-3 max-w-xl text-base leading-7 text-slate-300">
                    Crea, revisa y ajusta tu plan: calorías, macronutrientes, meta de agua y cada una de tus comidas.
                </p>
            </div>

            {loading && <p className="text-sm text-slate-500">Cargando…</p>}
            {!loading && error && <p className="text-sm text-rose-300">{error}</p>}

            {!loading && !error && plans.length > 1 && (
                <div className="mb-5 flex flex-wrap gap-2">
                    {plans.map((plan) => (
                        <button
                            key={plan.id}
                            type="button"
                            onClick={() => activatePlan(plan.id)}
                            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${plan.isActive ? 'bg-amber-500 text-white shadow-[0_10px_24px_rgba(217,158,45,0.28)]' : 'bg-white/5 text-slate-300 hover:bg-white/10'
                                }`}
                        >
                            {plan.label}
                        </button>
                    ))}
                </div>
            )}

            {!loading && !error && todayPlan && (
                <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
                    <div className="metric-card !p-4 text-center">
                        <p className="eyebrow">kcal</p>
                        <p className="mt-2 font-display text-2xl font-semibold text-slate-50">{todayPlan.goalCalories}</p>
                    </div>
                    <div className="metric-card !p-4 text-center">
                        <p className="eyebrow">PRO</p>
                        <p className="mt-2 font-display text-2xl font-semibold text-slate-50">{todayPlan.proteinGTarget ?? '—'}g</p>
                    </div>
                    <div className="metric-card !p-4 text-center">
                        <p className="eyebrow">CHO</p>
                        <p className="mt-2 font-display text-2xl font-semibold text-slate-50">{todayPlan.carbsGTarget ?? '—'}g</p>
                    </div>
                    <div className="metric-card !p-4 text-center">
                        <p className="eyebrow">GRA</p>
                        <p className="mt-2 font-display text-2xl font-semibold text-slate-50">{todayPlan.fatGTarget ?? '—'}g</p>
                    </div>
                    <div className="metric-card !p-4 text-center">
                        <p className="eyebrow">Agua</p>
                        <p className="mt-2 font-display text-2xl font-semibold text-slate-50">{(todayPlan.waterGoalMl / 1000).toFixed(1)}L</p>
                    </div>
                </div>
            )}

            {!loading && !error && isClient && !coachLoading && !todayPlan && canManageOwnPlan && (
                <SelfNutritionSetup hasPlan={false} onCreated={refresh} />
            )}
            {!loading && !error && isClient && !coachLoading && !todayPlan && !canManageOwnPlan && (
                <p className="text-sm text-slate-400">Tu coach aún no te ha asignado un plan de nutrición.</p>
            )}
            {!loading && !error && isClient && todayPlan && (
                <div className="rounded-3xl border border-white/8 bg-panel/70 p-6 shadow-panel">
                    <p className="eyebrow">Comidas del plan activo</p>
                    {findActiveDayConfig(todayPlan.dayConfigs) && (
                        <span className="mt-2 inline-block rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-medium text-amber-200">
                            Hoy: {findActiveDayConfig(todayPlan.dayConfigs)?.label}
                        </span>
                    )}
                    <ul className="mt-3 space-y-2 text-sm text-slate-300">
                        {todayPlan.meals.map((meal) => (
                            <li className="flex items-center justify-between gap-3" key={meal.id}>
                                <span>{meal.name} {meal.mealTime && <span className="text-slate-500">· {meal.mealTime}</span>}</span>
                                <span className="flex items-center gap-3">
                                    <span>{meal.status === 'completed' && meal.loggedCalories != null ? Math.round(meal.loggedCalories) : meal.calories} kcal</span>
                                    <MealLogger meal={meal} onLog={logMeal} />
                                </span>
                            </li>
                        ))}
                    </ul>
                    {canManageOwnPlan && <EditNutritionPlan onUpdated={refresh} plan={todayPlan} />}
                </div>
            )}
        </section>
    );
}
