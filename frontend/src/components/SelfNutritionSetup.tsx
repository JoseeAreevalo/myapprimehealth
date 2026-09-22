import axios from 'axios';
import { useState } from 'react';
import { ChefHat, Plus, Trash2 } from 'lucide-react';
import { api } from '../api/config';
import { useAuth } from '../context/AuthContext';
import MealItemsEditor, { MealItemDraft, mealItemsTotals } from './MealItemsEditor';
import NutritionLiveTotals from './NutritionLiveTotals';
import { macroCalories } from '../utils/nutritionMath';

interface MealDraft {
    name: string;
    mealTime: string;
    calories: string;
    items: MealItemDraft[];
}

function effectiveCalories(meal: MealDraft): number {
    return meal.items.length > 0 ? mealItemsTotals(meal.items).calories : Number(meal.calories) || 0;
}

const defaultMeals: MealDraft[] = [
    { name: 'Desayuno', mealTime: '08:00', calories: '450', items: [] },
    { name: 'Almuerzo', mealTime: '13:00', calories: '600', items: [] },
    { name: 'Cena', mealTime: '19:00', calories: '550', items: [] },
];

const WEEKDAY_LABELS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
type DayType = 'entrenamiento' | 'descanso';
const DAY_TYPE_LABELS: Record<DayType, string> = { entrenamiento: 'Día de entrenamiento', descanso: 'Día de descanso' };

// Lets any user without an existing plan (e.g. no coach yet) set up their own nutrition plan.
export default function SelfNutritionSetup({ hasPlan, onCreated }: { hasPlan: boolean; onCreated?: () => void }) {
    const { user, token } = useAuth();
    const [open, setOpen] = useState(false);
    const [label, setLabel] = useState('Mi plan');
    const [goalCalories, setGoalCalories] = useState('2200');
    const [proteinG, setProteinG] = useState('150');
    const [carbsG, setCarbsG] = useState('220');
    const [fatG, setFatG] = useState('70');
    const [waterGoalMl, setWaterGoalMl] = useState('2500');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [dietMode, setDietMode] = useState<'same' | 'split' | null>(null);
    const [dayType, setDayType] = useState<DayType | null>(null);
    const [weekdays, setWeekdays] = useState<number[]>([1, 2, 3, 4, 5, 6, 7]);
    const [meals, setMeals] = useState<MealDraft[]>(defaultMeals);
    const [submitting, setSubmitting] = useState(false);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    if (!user || hasPlan) return null;

    const toggleWeekday = (weekday: number) => {
        setWeekdays((current) => (current.includes(weekday) ? current.filter((w) => w !== weekday) : [...current, weekday]));
    };

    const updateMeal = (index: number, field: 'name' | 'mealTime' | 'calories', value: string) => {
        setMeals((current) => current.map((meal, i) => (i === index ? { ...meal, [field]: value } : meal)));
    };

    const addMealRow = () => {
        setMeals((current) => [...current, { name: `Comida ${current.length + 1}`, mealTime: '', calories: '200', items: [] }]);
    };

    const removeMealRow = (index: number) => {
        setMeals((current) => current.filter((_, i) => i !== index));
    };

    const updateMealItems = (index: number, items: MealItemDraft[]) => {
        setMeals((current) => current.map((meal, i) => (i === index ? { ...meal, items } : meal)));
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!dietMode) {
            setFeedback({ type: 'error', message: 'Indica si esta dieta será la misma todos los días o si se separa entre entrenamiento y descanso.' });
            return;
        }
        if (dietMode === 'split' && (!dayType || weekdays.length === 0)) {
            setFeedback({ type: 'error', message: 'Indica si esta dieta es de entrenamiento o descanso, y para qué días de la semana aplica.' });
            return;
        }
        setSubmitting(true);
        setFeedback(null);
        try {
            await axios.post(
                `${api.baseURL}${api.endpoints.nutritionPlanCreate}`,
                {
                    clientId: user.id,
                    planKey: label.toLowerCase().replace(/\s+/g, '-'),
                    label,
                    goalCalories: Number(goalCalories),
                    proteinGTarget: proteinG ? Number(proteinG) : undefined,
                    carbsGTarget: carbsG ? Number(carbsG) : undefined,
                    fatGTarget: fatG ? Number(fatG) : undefined,
                    waterGoalMl: waterGoalMl ? Number(waterGoalMl) : undefined,
                    startDate: startDate || undefined,
                    endDate: endDate || undefined,
                    dayConfig: dietMode === 'split' && dayType ? { label: DAY_TYPE_LABELS[dayType], weekdays } : undefined,
                    meals: meals.map((meal) => ({
                        name: meal.name,
                        mealTime: meal.mealTime,
                        calories: effectiveCalories(meal),
                        items: meal.items.map((item) => ({ foodId: item.foodId, foodName: item.foodName, grams: Number(item.grams) })),
                    })),
                },
                { headers: { Authorization: `Bearer ${token}` } },
            );
            setFeedback({ type: 'success', message: 'Plan creado.' });
            onCreated?.();
        } catch (error) {
            const message = axios.isAxiosError(error) ? error.response?.data?.error?.message : undefined;
            setFeedback({ type: 'error', message: message ?? 'No se pudo crear el plan.' });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <section className="rounded-3xl border border-white/8 bg-panel/70 p-6 shadow-panel">
            <div className="flex items-center justify-between">
                <div>
                    <p className="eyebrow">Nutrición</p>
                    <h2 className="mt-2 font-display text-xl font-semibold tracking-[-0.03em] text-slate-50">Configura tu plan</h2>
                </div>
                <ChefHat className="text-amber-300" size={20} />
            </div>
            {!open ? (
                <button
                    className="mt-5 w-full rounded-xl bg-amber-500 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-400"
                    onClick={() => setOpen(true)}
                    type="button"
                >
                    Crear mi plan de nutrición
                </button>
            ) : (
                <form className="mt-5 space-y-3" onSubmit={handleSubmit}>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Datos generales del plan</p>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="mb-1 block text-[11px] text-slate-500">Nombre del plan</label>
                            <input
                                className="w-full rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
                                onChange={(event) => setLabel(event.target.value)}
                                placeholder="Nombre del plan"
                                value={label}
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-[11px] text-slate-500">Calorías meta al día</label>
                            <input
                                className="w-full rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
                                onChange={(event) => setGoalCalories(event.target.value)}
                                placeholder="Calorías meta"
                                type="number"
                                value={goalCalories}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="mb-1 block text-[11px] text-slate-500">¿La dieta es la misma todos los días? (obligatorio)</label>
                        <div className="flex gap-2">
                            <button
                                className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition ${dietMode === 'same' ? 'border-amber-400 bg-amber-500 text-white' : 'border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/8'
                                    }`}
                                onClick={() => setDietMode('same')}
                                type="button"
                            >
                                Sí, la misma todos los días
                            </button>
                            <button
                                className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition ${dietMode === 'split' ? 'border-amber-400 bg-amber-500 text-white' : 'border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/8'
                                    }`}
                                onClick={() => setDietMode('split')}
                                type="button"
                            >
                                No, separar entrenamiento/descanso
                            </button>
                        </div>
                    </div>
                    {dietMode === 'split' && (
                        <>
                            <div>
                                <label className="mb-1 block text-[11px] text-slate-500">Tipo de día (obligatorio)</label>
                                <div className="flex gap-2">
                                    {(['entrenamiento', 'descanso'] as DayType[]).map((type) => (
                                        <button
                                            className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition ${dayType === type
                                                ? type === 'entrenamiento'
                                                    ? 'border-amber-400 bg-amber-500 text-white'
                                                    : 'border-teal-400 bg-teal-500 text-white'
                                                : 'border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/8'
                                                }`}
                                            key={type}
                                            onClick={() => setDayType(type)}
                                            type="button"
                                        >
                                            {DAY_TYPE_LABELS[type]}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="mb-1 block text-[11px] text-slate-500">Días de la semana en que aplica</label>
                                <div className="flex flex-wrap gap-1.5">
                                    {WEEKDAY_LABELS.map((weekdayLabel, index) => {
                                        const weekdayValue = index + 1;
                                        const checked = weekdays.includes(weekdayValue);
                                        return (
                                            <button
                                                className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition ${checked ? 'border-amber-400 bg-amber-500 text-white' : 'border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/8'
                                                    }`}
                                                key={weekdayValue}
                                                onClick={() => toggleWeekday(weekdayValue)}
                                                type="button"
                                            >
                                                {weekdayLabel}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </>
                    )}
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Macronutrientes y agua meta (por día)</p>
                    <div className="grid grid-cols-4 gap-2 px-0.5 text-[10px] text-slate-500">
                        <span>Proteína (g)</span>
                        <span>Carbohidratos (g)</span>
                        <span>Grasa (g)</span>
                        <span>Agua (ml)</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                        <input
                            className="rounded-lg border border-white/8 bg-white/[0.03] px-2 py-1.5 text-xs text-slate-100"
                            onChange={(event) => setProteinG(event.target.value)}
                            placeholder="Prot. (g)"
                            type="number"
                            value={proteinG}
                        />
                        <input
                            className="rounded-lg border border-white/8 bg-white/[0.03] px-2 py-1.5 text-xs text-slate-100"
                            onChange={(event) => setCarbsG(event.target.value)}
                            placeholder="Carb. (g)"
                            type="number"
                            value={carbsG}
                        />
                        <input
                            className="rounded-lg border border-white/8 bg-white/[0.03] px-2 py-1.5 text-xs text-slate-100"
                            onChange={(event) => setFatG(event.target.value)}
                            placeholder="Grasa (g)"
                            type="number"
                            value={fatG}
                        />
                        <input
                            className="rounded-lg border border-white/8 bg-white/[0.03] px-2 py-1.5 text-xs text-slate-100"
                            onChange={(event) => setWaterGoalMl(event.target.value)}
                            placeholder="Agua (ml)"
                            type="number"
                            value={waterGoalMl}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="mb-1 block text-[11px] text-slate-500">Fecha de inicio</label>
                            <input
                                className="w-full rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
                                onChange={(event) => setStartDate(event.target.value)}
                                type="date"
                                value={startDate}
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-[11px] text-slate-500">Fecha de término</label>
                            <input
                                className="w-full rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
                                onChange={(event) => setEndDate(event.target.value)}
                                type="date"
                                value={endDate}
                            />
                        </div>
                    </div>
                    <NutritionLiveTotals
                        goalCalories={Number(goalCalories) || 0}
                        macroTotalCalories={macroCalories(proteinG, carbsG, fatG)}
                        mealsTotalCalories={meals.reduce((sum, meal) => sum + effectiveCalories(meal), 0)}
                    />
                    <div className="space-y-2">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Comidas del plan</p>
                        <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 px-0.5 text-[10px] text-slate-500">
                            <span>Nombre de la comida</span>
                            <span>Hora (HH:MM)</span>
                            <span>Calorías (o agrega alimentos abajo)</span>
                            <span />
                        </div>
                        {meals.map((meal, index) => (
                            <div className="space-y-1.5 rounded-xl border border-white/7 p-2" key={index}>
                                <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2">
                                    <input
                                        className="rounded-lg border border-white/8 bg-white/[0.03] px-2 py-1.5 text-xs text-slate-100"
                                        onChange={(event) => updateMeal(index, 'name', event.target.value)}
                                        value={meal.name}
                                    />
                                    <input
                                        className="rounded-lg border border-white/8 bg-white/[0.03] px-2 py-1.5 text-xs text-slate-100"
                                        onChange={(event) => updateMeal(index, 'mealTime', event.target.value)}
                                        value={meal.mealTime}
                                    />
                                    {meal.items.length === 0 ? (
                                        <input
                                            className="rounded-lg border border-white/8 bg-white/[0.03] px-2 py-1.5 text-xs text-slate-100"
                                            onChange={(event) => updateMeal(index, 'calories', event.target.value)}
                                            type="number"
                                            value={meal.calories}
                                        />
                                    ) : (
                                        <div className="flex items-center rounded-lg border border-white/8 bg-white/[0.03] px-2 py-1.5 text-xs text-slate-400">
                                            {Math.round(effectiveCalories(meal))} kcal (de alimentos)
                                        </div>
                                    )}
                                    <button
                                        className="rounded-lg bg-rose-500/15 px-2 text-xs text-rose-300 hover:bg-rose-500/25 disabled:opacity-30"
                                        disabled={meals.length <= 1}
                                        onClick={() => removeMealRow(index)}
                                        type="button"
                                    >
                                        <Trash2 size={13} />
                                    </button>
                                </div>
                                <MealItemsEditor items={meal.items} onChange={(items) => updateMealItems(index, items)} />
                            </div>
                        ))}
                        <button
                            className="flex items-center gap-1.5 text-xs font-medium text-amber-300 hover:text-amber-200"
                            onClick={addMealRow}
                            type="button"
                        >
                            <Plus size={13} /> Agregar comida
                        </button>
                    </div>
                    {feedback && (
                        <p className={`text-xs ${feedback.type === 'success' ? 'text-emerald-300' : 'text-rose-300'}`}>{feedback.message}</p>
                    )}
                    <button
                        className="w-full rounded-xl bg-amber-500 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-400 disabled:opacity-50"
                        disabled={submitting}
                        type="submit"
                    >
                        {submitting ? 'Creando…' : 'Guardar plan'}
                    </button>
                </form>
            )}
        </section>
    );
}
