import { useState } from 'react';
import type { NutritionMeal } from '../hooks/useNutritionToday';

interface Props {
    meal: NutritionMeal;
    onLog: (mealId: number, status: 'completed' | 'next' | 'planned', items?: { itemId: number; grams: number }[]) => Promise<void>;
}

// Lets a client record the grams actually served per food item for a meal; macros are
// recomputed live from the ratio against the plan's target grams.
export default function MealLogger({ meal, onLog }: Props) {
    const [open, setOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [grams, setGrams] = useState<Record<number, string>>(() =>
        Object.fromEntries(meal.items.map((item) => [item.id, String(item.grams)])),
    );

    const totals = meal.items.reduce(
        (sum, item) => {
            const servedGrams = Number(grams[item.id]) || 0;
            const ratio = item.grams > 0 ? servedGrams / item.grams : 0;
            return {
                calories: sum.calories + item.calories * ratio,
                proteinG: sum.proteinG + item.proteinG * ratio,
                carbsG: sum.carbsG + item.carbsG * ratio,
                fatG: sum.fatG + item.fatG * ratio,
            };
        },
        { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 },
    );

    const handleSave = async () => {
        setSaving(true);
        try {
            await onLog(
                meal.id,
                'completed',
                meal.items.map((item) => ({ itemId: item.id, grams: Number(grams[item.id]) || 0 })),
            );
            setOpen(false);
        } finally {
            setSaving(false);
        }
    };

    if (meal.items.length === 0) {
        // Legacy calorie-only meals (no food items) keep the simple complete/undo toggle.
        return (
            <button
                className={`mt-1 text-xs font-medium ${meal.status === 'completed' ? 'text-emerald-300' : 'text-slate-500'} hover:text-amber-300`}
                onClick={() => onLog(meal.id, meal.status === 'completed' ? 'next' : 'completed')}
                type="button"
            >
                {meal.status === 'completed' ? 'Completado' : meal.status === 'next' ? 'Marcar hecho' : 'Comenzar'}
            </button>
        );
    }

    return (
        <div>
            <button
                className={`mt-1 text-xs font-medium ${meal.status === 'completed' ? 'text-emerald-300' : 'text-slate-500'} hover:text-amber-300`}
                onClick={() => setOpen((current) => !current)}
                type="button"
            >
                {meal.status === 'completed' ? 'Editar registro' : 'Registrar'}
            </button>
            {open && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 px-4" onClick={() => !saving && setOpen(false)}>
                    <div
                        className="w-full max-w-sm rounded-2xl border border-white/10 bg-slate-950 p-5 shadow-panel"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <p className="text-sm font-semibold text-slate-100">{meal.name}</p>
                        <p className="mt-1 text-xs text-slate-500">Indica cuántos gramos serviste de cada alimento.</p>
                        <div className="mt-3 space-y-2">
                            {meal.items.map((item) => (
                                <div className="flex items-center justify-between gap-2" key={item.id}>
                                    <span className="text-xs text-slate-300">{item.foodName}</span>
                                    <input
                                        className="w-20 rounded-lg border border-white/8 bg-white/[0.03] px-2 py-1 text-xs text-slate-100"
                                        onChange={(event) =>
                                            setGrams((current) => ({ ...current, [item.id]: event.target.value }))
                                        }
                                        type="number"
                                        value={grams[item.id] ?? ''}
                                    />
                                </div>
                            ))}
                        </div>
                        <div className="mt-3 rounded-xl border border-white/7 bg-white/[0.03] p-3 text-xs text-slate-300">
                            <p className="font-semibold text-slate-100">{Math.round(totals.calories)} kcal</p>
                            <p className="mt-1 text-slate-400">
                                P {totals.proteinG.toFixed(1)}g · C {totals.carbsG.toFixed(1)}g · G {totals.fatG.toFixed(1)}g
                            </p>
                        </div>
                        <div className="mt-4 flex justify-end gap-2">
                            <button
                                className="rounded-lg bg-white/8 px-3 py-1.5 text-xs text-slate-200 hover:bg-white/15"
                                disabled={saving}
                                onClick={() => setOpen(false)}
                                type="button"
                            >
                                Cancelar
                            </button>
                            <button
                                className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-400 disabled:opacity-50"
                                disabled={saving}
                                onClick={handleSave}
                                type="button"
                            >
                                {saving ? 'Guardando…' : 'Guardar registro'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
