import axios from 'axios';
import { useState } from 'react';
import { Pencil } from 'lucide-react';
import { api } from '../api/config';
import { useAuth } from '../context/AuthContext';
import { NutritionMeal, NutritionPlanWithMeals } from '../hooks/useNutritionToday';
import NutritionLiveTotals from './NutritionLiveTotals';
import { macroCalories, sumMealCalories } from '../utils/nutritionMath';

function authHeaders(token: string | null) {
    return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function EditNutritionPlan({ plan, onUpdated }: { plan: NutritionPlanWithMeals; onUpdated: () => void }) {
    const { token } = useAuth();
    const [open, setOpen] = useState(false);
    const [label, setLabel] = useState(plan.label);
    const [goalCalories, setGoalCalories] = useState(String(plan.goalCalories));
    const [proteinG, setProteinG] = useState(String(plan.proteinGTarget ?? ''));
    const [carbsG, setCarbsG] = useState(String(plan.carbsGTarget ?? ''));
    const [fatG, setFatG] = useState(String(plan.fatGTarget ?? ''));
    const [waterGoalMl, setWaterGoalMl] = useState(String(plan.waterGoalMl));
    const [meals, setMeals] = useState<NutritionMeal[]>(plan.meals);
    const [newMeal, setNewMeal] = useState({ name: '', mealTime: '', calories: '' });
    const [saving, setSaving] = useState(false);
    const [feedback, setFeedback] = useState('');

    if (!open) {
        return (
            <button
                className="mt-3 flex items-center gap-1.5 text-xs font-medium text-amber-300 hover:text-amber-200"
                onClick={() => setOpen(true)}
                type="button"
            >
                <Pencil size={13} /> Editar plan
            </button>
        );
    }

    const updateMealField = (id: number, field: 'name' | 'mealTime' | 'calories', value: string) => {
        setMeals((current) => current.map((meal) => (meal.id === id ? { ...meal, [field]: field === 'calories' ? Number(value) : value } : meal)));
    };

    const savePlanDetails = async () => {
        setSaving(true);
        setFeedback('');
        try {
            await axios.patch(
                `${api.baseURL}${api.endpoints.nutritionPlanUpdate(plan.id)}`,
                {
                    label,
                    goalCalories: Number(goalCalories),
                    proteinGTarget: proteinG ? Number(proteinG) : null,
                    carbsGTarget: carbsG ? Number(carbsG) : null,
                    fatGTarget: fatG ? Number(fatG) : null,
                    waterGoalMl: waterGoalMl ? Number(waterGoalMl) : undefined,
                },
                { headers: authHeaders(token) },
            );
            setFeedback('Plan actualizado.');
            onUpdated();
        } catch {
            setFeedback('No se pudo actualizar el plan.');
        } finally {
            setSaving(false);
        }
    };

    const saveMeal = async (meal: NutritionMeal) => {
        setSaving(true);
        setFeedback('');
        try {
            await axios.patch(
                `${api.baseURL}${api.endpoints.nutritionMealUpdate(meal.id)}`,
                { name: meal.name, mealTime: meal.mealTime, calories: meal.calories },
                { headers: authHeaders(token) },
            );
            setFeedback('Comida actualizada.');
            onUpdated();
        } catch {
            setFeedback('No se pudo actualizar la comida.');
        } finally {
            setSaving(false);
        }
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
            await axios.post(
                `${api.baseURL}${api.endpoints.nutritionPlanAddMeal(plan.id)}`,
                { name: newMeal.name, mealTime: newMeal.mealTime, calories: Number(newMeal.calories) },
                { headers: authHeaders(token) },
            );
            setNewMeal({ name: '', mealTime: '', calories: '' });
            onUpdated();
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="mt-4 space-y-3 rounded-2xl border border-white/8 bg-white/[0.02] p-4">
            <div className="flex items-center justify-between">
                <p className="eyebrow">Editar plan</p>
                <button className="text-xs text-slate-400 hover:text-white" onClick={() => setOpen(false)} type="button">
                    Cerrar
                </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
                <div>
                    <label className="mb-1 block text-[10px] text-slate-500">Nombre del plan</label>
                    <input
                        className="w-full rounded-lg border border-white/8 bg-white/[0.03] px-2 py-1.5 text-xs text-slate-100"
                        onChange={(event) => setLabel(event.target.value)}
                        value={label}
                    />
                </div>
                <div>
                    <label className="mb-1 block text-[10px] text-slate-500">Calorías meta al día</label>
                    <input
                        className="w-full rounded-lg border border-white/8 bg-white/[0.03] px-2 py-1.5 text-xs text-slate-100"
                        onChange={(event) => setGoalCalories(event.target.value)}
                        type="number"
                        value={goalCalories}
                    />
                </div>
            </div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Macros y agua meta (por día)</p>
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
            <NutritionLiveTotals
                goalCalories={Number(goalCalories) || 0}
                macroTotalCalories={macroCalories(proteinG, carbsG, fatG)}
                mealsTotalCalories={sumMealCalories(meals)}
            />
            <button
                className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-400 disabled:opacity-50"
                disabled={saving}
                onClick={savePlanDetails}
                type="button"
            >
                Guardar nombre/meta
            </button>

            <div className="space-y-2 border-t border-white/7 pt-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Comidas existentes</p>
                <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-1.5 px-0.5 text-[10px] text-slate-500">
                    <span>Nombre</span>
                    <span>Hora</span>
                    <span>Calorías</span>
                    <span />
                </div>
                {meals.map((meal) => (
                    <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-1.5" key={meal.id}>
                        <input
                            className="rounded-lg border border-white/8 bg-white/[0.03] px-2 py-1 text-xs text-slate-100"
                            onChange={(event) => updateMealField(meal.id, 'name', event.target.value)}
                            value={meal.name}
                        />
                        <input
                            className="rounded-lg border border-white/8 bg-white/[0.03] px-2 py-1 text-xs text-slate-100"
                            onChange={(event) => updateMealField(meal.id, 'mealTime', event.target.value)}
                            value={meal.mealTime ?? ''}
                        />
                        <input
                            className="rounded-lg border border-white/8 bg-white/[0.03] px-2 py-1 text-xs text-slate-100"
                            onChange={(event) => updateMealField(meal.id, 'calories', event.target.value)}
                            type="number"
                            value={meal.calories}
                        />
                        <div className="flex gap-1">
                            <button className="rounded-lg bg-white/8 px-2 text-xs text-slate-200 hover:bg-white/15" onClick={() => saveMeal(meal)} type="button">
                                ✓
                            </button>
                            <button className="rounded-lg bg-rose-500/15 px-2 text-xs text-rose-300 hover:bg-rose-500/25" onClick={() => deleteMeal(meal.id)} type="button">
                                ✕
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-1.5 border-t border-white/7 pt-3">
                <p className="col-span-4 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Agregar comida nueva</p>
                <input
                    className="rounded-lg border border-white/8 bg-white/[0.03] px-2 py-1 text-xs text-slate-100"
                    onChange={(event) => setNewMeal((current) => ({ ...current, name: event.target.value }))}
                    placeholder="Comida nueva"
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
                    +
                </button>
            </div>
            {feedback && <p className="text-xs text-slate-400">{feedback}</p>}
        </div>
    );
}
