import axios from 'axios';
import { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { api } from '../api/config';
import { useAuth } from '../context/AuthContext';
import { NutritionDayConfig, NutritionMeal, NutritionPlanWithMeals } from '../hooks/useNutritionToday';
import FoodSearchAdd, { FoodOption } from './FoodSearchAdd';
import MealItemsEditor, { MealItemDraft, mealItemsTotals } from './MealItemsEditor';

function authHeaders(token: string | null) {
    return token ? { Authorization: `Bearer ${token}` } : {};
}

const WEEKDAY_LABELS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
type DayType = 'entrenamiento' | 'descanso';
const DAY_TYPE_LABELS: Record<DayType, string> = { entrenamiento: 'Día de entrenamiento', descanso: 'Día de descanso' };

function dayTypeOf(label: string): DayType {
    return label.toLowerCase().includes('entrenamiento') ? 'entrenamiento' : 'descanso';
}

interface MealDraft {
    name: string;
    mealTime: string;
    calories: string;
    items: MealItemDraft[];
}

const emptyMeal = (index: number): MealDraft => ({ name: `Comida ${index + 1}`, mealTime: '', calories: '200', items: [] });

function effectiveCalories(meal: MealDraft): number {
    return meal.items.length > 0 ? mealItemsTotals(meal.items).calories : Number(meal.calories) || 0;
}

// Full edit form for an existing day-config: change its type/weekdays, and edit/add/remove its meals.
function DayConfigEditForm({
    config,
    otherUsedWeekdays,
    onUpdated,
    onCancel,
}: {
    config: NutritionDayConfig;
    otherUsedWeekdays: Set<number>;
    onUpdated: () => void;
    onCancel: () => void;
}) {
    const { token } = useAuth();
    const [dayType, setDayType] = useState<DayType>(dayTypeOf(config.label));
    const [weekdays, setWeekdays] = useState<number[]>(config.weekdays);
    const [meals, setMeals] = useState<NutritionMeal[]>(config.meals.map((meal) => ({ ...meal, status: 'planned' })));
    const [newMeal, setNewMeal] = useState({ name: '', mealTime: '', calories: '' });
    const [saving, setSaving] = useState(false);
    const [feedback, setFeedback] = useState('');

    const toggleWeekday = (weekday: number) => {
        setWeekdays((current) => (current.includes(weekday) ? current.filter((w) => w !== weekday) : [...current, weekday]));
    };

    const mergeMeal = (mealId: number, patch: Partial<NutritionMeal>) => {
        setMeals((current) => current.map((meal) => (meal.id === mealId ? { ...meal, ...patch } : meal)));
    };

    const saveTypeAndWeekdays = async () => {
        if (weekdays.length === 0) {
            setFeedback('Selecciona al menos un día de la semana.');
            return;
        }
        setSaving(true);
        setFeedback('');
        try {
            await axios.patch(
                `${api.baseURL}${api.endpoints.nutritionDayConfigUpdate(config.id)}`,
                { label: DAY_TYPE_LABELS[dayType], weekdays },
                { headers: authHeaders(token) },
            );
            onUpdated();
        } catch (error) {
            const message = axios.isAxiosError(error) ? error.response?.data?.error?.message : undefined;
            setFeedback(message ?? 'No se pudo actualizar la configuración.');
        } finally {
            setSaving(false);
        }
    };

    const saveMealField = async (meal: NutritionMeal, field: 'name' | 'mealTime' | 'calories', value: string) => {
        const patch = { [field]: field === 'calories' ? Number(value) || 0 : value };
        mergeMeal(meal.id, patch);
        await axios.patch(
            `${api.baseURL}${api.endpoints.nutritionMealUpdate(meal.id)}`,
            { name: patch.name ?? meal.name, mealTime: patch.mealTime ?? meal.mealTime, calories: patch.calories ?? meal.calories },
            { headers: authHeaders(token) },
        );
        onUpdated();
    };

    const deleteMeal = async (mealId: number) => {
        setSaving(true);
        try {
            await axios.delete(`${api.baseURL}${api.endpoints.nutritionMealUpdate(mealId)}`, { headers: authHeaders(token) });
            setMeals((current) => current.filter((meal) => meal.id !== mealId));
            onUpdated();
        } finally {
            setSaving(false);
        }
    };

    const addMeal = async () => {
        if (!newMeal.name || !newMeal.calories) return;
        setSaving(true);
        try {
            const res = await axios.post(
                `${api.baseURL}${api.endpoints.nutritionPlanAddMeal(config.planId)}`,
                { name: newMeal.name, mealTime: newMeal.mealTime, calories: Number(newMeal.calories), dayConfigId: config.id },
                { headers: authHeaders(token) },
            );
            if (res.data?.meal) setMeals((current) => [...current, { ...res.data.meal, status: 'planned' }]);
            setNewMeal({ name: '', mealTime: '', calories: '' });
            onUpdated();
        } finally {
            setSaving(false);
        }
    };

    const addItemToMeal = async (meal: NutritionMeal, food: FoodOption) => {
        setSaving(true);
        try {
            const res = await axios.post(
                `${api.baseURL}${api.endpoints.nutritionMealItemAdd(meal.id)}`,
                { foodId: food.id, foodName: food.name, grams: 100 },
                { headers: authHeaders(token) },
            );
            if (res.data?.meal) mergeMeal(meal.id, res.data.meal);
            onUpdated();
        } finally {
            setSaving(false);
        }
    };

    const updateItemGrams = async (meal: NutritionMeal, itemId: number, grams: string) => {
        if (!grams || Number(grams) <= 0) return;
        setSaving(true);
        try {
            const res = await axios.patch(
                `${api.baseURL}${api.endpoints.nutritionMealItemUpdate(itemId)}`,
                { grams: Number(grams) },
                { headers: authHeaders(token) },
            );
            if (res.data?.meal) mergeMeal(meal.id, res.data.meal);
            onUpdated();
        } finally {
            setSaving(false);
        }
    };

    const removeMealItem = async (meal: NutritionMeal, itemId: number) => {
        setSaving(true);
        try {
            const res = await axios.delete(`${api.baseURL}${api.endpoints.nutritionMealItemDelete(itemId)}`, { headers: authHeaders(token) });
            if (res.data?.meal) mergeMeal(meal.id, res.data.meal);
            onUpdated();
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-3 rounded-xl border border-white/7 bg-white/[0.02] p-3">
            <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Editando configuración</p>
                <button className="text-xs font-medium text-slate-300 hover:text-slate-100" onClick={onCancel} type="button">
                    Listo
                </button>
            </div>
            <div>
                <label className="mb-1 block text-[10px] text-slate-500">Tipo de día (obligatorio)</label>
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
                <label className="mb-1 block text-[10px] text-slate-500">Días de la semana en que aplica</label>
                <div className="flex flex-wrap gap-1.5">
                    {WEEKDAY_LABELS.map((weekdayLabel, index) => {
                        const weekdayValue = index + 1;
                        if (otherUsedWeekdays.has(weekdayValue)) return null;
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
            <button
                className="rounded-lg bg-white/8 px-3 py-1.5 text-xs text-slate-100 hover:bg-white/15 disabled:opacity-50"
                disabled={saving}
                onClick={saveTypeAndWeekdays}
                type="button"
            >
                Guardar tipo y días
            </button>

            <div className="space-y-2 border-t border-white/7 pt-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Comidas de esta configuración</p>
                {meals.map((meal) => (
                    <div className="space-y-1.5 rounded-lg border border-white/7 p-2" key={meal.id}>
                        <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-1.5">
                            <input
                                className="rounded-lg border border-white/8 bg-white/[0.03] px-2 py-1 text-xs text-slate-100"
                                defaultValue={meal.name}
                                onBlur={(event) => saveMealField(meal, 'name', event.target.value)}
                            />
                            <input
                                className="rounded-lg border border-white/8 bg-white/[0.03] px-2 py-1 text-xs text-slate-100"
                                defaultValue={meal.mealTime ?? ''}
                                onBlur={(event) => saveMealField(meal, 'mealTime', event.target.value)}
                                placeholder="Hora"
                            />
                            {meal.items.length === 0 ? (
                                <input
                                    className="rounded-lg border border-white/8 bg-white/[0.03] px-2 py-1 text-xs text-slate-100"
                                    defaultValue={meal.calories}
                                    onBlur={(event) => saveMealField(meal, 'calories', event.target.value)}
                                    type="number"
                                />
                            ) : (
                                <div className="flex items-center rounded-lg border border-white/8 bg-white/[0.03] px-2 py-1 text-xs text-slate-400">
                                    {Math.round(meal.calories)} kcal
                                </div>
                            )}
                            <button className="rounded-lg bg-rose-500/15 px-2 text-xs text-rose-300 hover:bg-rose-500/25" onClick={() => deleteMeal(meal.id)} type="button">
                                <Trash2 size={13} />
                            </button>
                        </div>
                        <div className="space-y-1">
                            {meal.items.map((item) => (
                                <div className="flex items-center justify-between gap-2 text-xs text-slate-300" key={item.id}>
                                    <span className="truncate">{item.foodName}</span>
                                    <div className="flex items-center gap-1.5">
                                        <input
                                            className="w-14 rounded-lg border border-white/8 bg-white/[0.03] px-1.5 py-1 text-slate-100"
                                            defaultValue={item.grams}
                                            onBlur={(event) => updateItemGrams(meal, item.id, event.target.value)}
                                            type="number"
                                        />
                                        <button className="text-rose-300 hover:text-rose-200" onClick={() => removeMealItem(meal, item.id)} type="button">
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <FoodSearchAdd onSelect={(food) => addItemToMeal(meal, food)} />
                    </div>
                ))}
                {feedback && <p className="text-xs text-rose-300">{feedback}</p>}
                <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-1.5">
                    <input
                        className="rounded-lg border border-white/8 bg-white/[0.03] px-2 py-1 text-xs text-slate-100"
                        onChange={(event) => setNewMeal((current) => ({ ...current, name: event.target.value }))}
                        placeholder="Nueva comida"
                        value={newMeal.name}
                    />
                    <input
                        className="rounded-lg border border-white/8 bg-white/[0.03] px-2 py-1 text-xs text-slate-100"
                        onChange={(event) => setNewMeal((current) => ({ ...current, mealTime: event.target.value }))}
                        placeholder="Hora"
                        value={newMeal.mealTime}
                    />
                    <input
                        className="rounded-lg border border-white/8 bg-white/[0.03] px-2 py-1 text-xs text-slate-100"
                        onChange={(event) => setNewMeal((current) => ({ ...current, calories: event.target.value }))}
                        placeholder="kcal"
                        type="number"
                        value={newMeal.calories}
                    />
                    <button className="rounded-lg bg-amber-500 px-2 text-xs font-semibold text-white hover:bg-amber-400" onClick={addMeal} type="button">
                        <Plus size={13} />
                    </button>
                </div>
            </div>
        </div>
    );
}

// Lets a coach/client define 1+ diet variants (e.g. "Día de entrenamiento" vs "Día de descanso"),
// each covering a checked set of weekdays and carrying its own set of meals.
export default function NutritionDayConfigsEditor({ plan, onUpdated }: { plan: NutritionPlanWithMeals; onUpdated: () => void }) {    const { token } = useAuth();
    const [creating, setCreating] = useState(false);
    const [dayType, setDayType] = useState<DayType | null>(null);
    const [weekdays, setWeekdays] = useState<number[]>([]);
    const [meals, setMeals] = useState<MealDraft[]>([emptyMeal(0)]);
    const [submitting, setSubmitting] = useState(false);
    const [feedback, setFeedback] = useState('');
    const [confirmingDeleteId, setConfirmingDeleteId] = useState<number | null>(null);
    const [editingConfigId, setEditingConfigId] = useState<number | null>(null);

    const usedWeekdays = new Set(plan.dayConfigs.flatMap((config) => config.weekdays));

    const toggleWeekday = (weekday: number) => {
        setWeekdays((current) => (current.includes(weekday) ? current.filter((w) => w !== weekday) : [...current, weekday]));
    };

    const updateMealField = (index: number, field: 'name' | 'mealTime' | 'calories', value: string) => {
        setMeals((current) => current.map((meal, i) => (i === index ? { ...meal, [field]: value } : meal)));
    };
    const updateMealItems = (index: number, items: MealItemDraft[]) => {
        setMeals((current) => current.map((meal, i) => (i === index ? { ...meal, items } : meal)));
    };
    const addMealRow = () => setMeals((current) => [...current, emptyMeal(current.length)]);
    const removeMealRow = (index: number) => setMeals((current) => current.filter((_, i) => i !== index));

    const resetForm = () => {
        setDayType(null);
        setWeekdays([]);
        setMeals([emptyMeal(0)]);
        setCreating(false);
    };

    const handleCreate = async () => {
        if (!dayType || weekdays.length === 0) return;
        setSubmitting(true);
        setFeedback('');
        try {
            await axios.post(
                `${api.baseURL}${api.endpoints.nutritionDayConfigAdd(plan.id)}`,
                {
                    label: DAY_TYPE_LABELS[dayType],
                    weekdays,
                    meals: meals.map((meal) => ({
                        name: meal.name,
                        mealTime: meal.mealTime,
                        calories: effectiveCalories(meal),
                        items: meal.items.map((item) => ({ foodId: item.foodId, foodName: item.foodName, grams: Number(item.grams) })),
                    })),
                },
                { headers: authHeaders(token) },
            );
            resetForm();
            onUpdated();
        } catch (error) {
            const message = axios.isAxiosError(error) ? error.response?.data?.error?.message : undefined;
            setFeedback(message ?? 'No se pudo crear la configuración de días.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (dayConfigId: number) => {
        await axios.delete(`${api.baseURL}${api.endpoints.nutritionDayConfigDelete(dayConfigId)}`, { headers: authHeaders(token) });
        setConfirmingDeleteId(null);
        onUpdated();
    };

    return (
        <div className="space-y-3 rounded-2xl border border-white/8 bg-white/[0.02] p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Dietas por día (entrenamiento vs. descanso)
            </p>

            {plan.dayConfigs.length === 0 && !creating && (
                <p className="text-xs text-slate-500">Aún no hay configuraciones de días distintas para este plan.</p>
            )}

            {plan.dayConfigs.map((config: NutritionDayConfig) => {
                const type = dayTypeOf(config.label);
                if (editingConfigId === config.id) {
                    const otherUsedWeekdays = new Set(
                        plan.dayConfigs.filter((other) => other.id !== config.id).flatMap((other) => other.weekdays),
                    );
                    return (
                        <DayConfigEditForm
                            config={config}
                            key={config.id}
                            onCancel={() => setEditingConfigId(null)}
                            onUpdated={onUpdated}
                            otherUsedWeekdays={otherUsedWeekdays}
                        />
                    );
                }
                return (
                    <div className="space-y-2 rounded-xl border border-white/7 bg-white/[0.02] p-3" key={config.id}>
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="flex items-center gap-2">
                                    <span
                                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${type === 'entrenamiento' ? 'bg-amber-500/15 text-amber-300' : 'bg-teal-500/15 text-teal-300'
                                            }`}
                                    >
                                        {type === 'entrenamiento' ? 'Entrenamiento' : 'Descanso'}
                                    </span>
                                    <p className="text-sm font-medium text-slate-100">{config.label}</p>
                                </div>
                                <p className="mt-0.5 text-[11px] text-slate-500">
                                    {config.weekdays.map((w) => WEEKDAY_LABELS[w - 1]).join(', ')}
                                </p>
                            </div>
                            {confirmingDeleteId === config.id ? (
                                <div className="flex items-center gap-1.5 text-[11px]">
                                    <span className="text-slate-400">¿Eliminar esta dieta?</span>
                                    <button className="font-semibold text-rose-300 hover:text-rose-200" onClick={() => handleDelete(config.id)} type="button">
                                        Sí
                                    </button>
                                    <button className="text-slate-400 hover:text-slate-200" onClick={() => setConfirmingDeleteId(null)} type="button">
                                        No
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <button className="text-slate-300 hover:text-slate-100" onClick={() => setEditingConfigId(config.id)} type="button">
                                        <Pencil size={14} />
                                    </button>
                                    <button className="text-rose-300 hover:text-rose-200" onClick={() => setConfirmingDeleteId(config.id)} type="button">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            )}
                        </div>
                        <div className="space-y-1">
                            {config.meals.map((meal) => (
                                <p className="text-xs text-slate-400" key={meal.id}>
                                    {meal.name}
                                    {meal.mealTime ? ` · ${meal.mealTime}` : ''} — {Math.round(meal.calories)} kcal
                                </p>
                            ))}
                        </div>
                    </div>
                );
            })}

            {!creating && (
                <button
                    className="flex items-center gap-1.5 text-xs font-medium text-amber-300 hover:text-amber-200"
                    onClick={() => setCreating(true)}
                    type="button"
                >
                    <Plus size={13} /> Agregar configuración de días
                </button>
            )}

            {creating && (
                <div className="space-y-3 rounded-xl border border-white/7 bg-white/[0.02] p-3">
                    <div>
                        <label className="mb-1 block text-[10px] text-slate-500">Tipo de día (obligatorio)</label>
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
                        <label className="mb-1 block text-[10px] text-slate-500">Días de la semana en que aplica</label>
                        <div className="flex flex-wrap gap-1.5">
                            {WEEKDAY_LABELS.map((weekdayLabel, index) => {
                                const weekdayValue = index + 1;
                                const disabled = usedWeekdays.has(weekdayValue);
                                const checked = weekdays.includes(weekdayValue);
                                if (disabled) return null;
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

                    <div className="space-y-2">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Comidas de esta configuración</p>
                        {meals.map((meal, index) => (
                            <div className="space-y-1.5 rounded-lg border border-white/7 p-2" key={index}>
                                <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-1.5">
                                    <input
                                        className="rounded-lg border border-white/8 bg-white/[0.03] px-2 py-1 text-xs text-slate-100"
                                        onChange={(event) => updateMealField(index, 'name', event.target.value)}
                                        placeholder="Comida"
                                        value={meal.name}
                                    />
                                    <input
                                        className="rounded-lg border border-white/8 bg-white/[0.03] px-2 py-1 text-xs text-slate-100"
                                        onChange={(event) => updateMealField(index, 'mealTime', event.target.value)}
                                        placeholder="Hora"
                                        value={meal.mealTime}
                                    />
                                    {meal.items.length === 0 ? (
                                        <input
                                            className="rounded-lg border border-white/8 bg-white/[0.03] px-2 py-1 text-xs text-slate-100"
                                            onChange={(event) => updateMealField(index, 'calories', event.target.value)}
                                            placeholder="kcal"
                                            type="number"
                                            value={meal.calories}
                                        />
                                    ) : (
                                        <div className="flex items-center rounded-lg border border-white/8 bg-white/[0.03] px-2 py-1 text-xs text-slate-400">
                                            {Math.round(effectiveCalories(meal))} kcal
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

                    {feedback && <p className="text-xs text-rose-300">{feedback}</p>}
                    <div className="flex gap-2">
                        <button
                            className="flex-1 rounded-lg bg-amber-500 py-2 text-xs font-semibold text-white hover:bg-amber-400 disabled:opacity-50"
                            disabled={submitting || !dayType || weekdays.length === 0}
                            onClick={handleCreate}
                            type="button"
                        >
                            {submitting ? 'Guardando…' : 'Guardar configuración'}
                        </button>
                        <button className="rounded-lg bg-white/8 px-3 py-2 text-xs text-slate-100 hover:bg-white/15" onClick={resetForm} type="button">
                            Cancelar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
