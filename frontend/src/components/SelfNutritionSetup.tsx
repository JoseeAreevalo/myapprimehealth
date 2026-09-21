import axios from 'axios';
import { useState } from 'react';
import { ChefHat } from 'lucide-react';
import { api } from '../api/config';
import { useAuth } from '../context/AuthContext';

interface MealDraft {
  name: string;
  mealTime: string;
  calories: string;
}

const defaultMeals: MealDraft[] = [
  { name: 'Desayuno', mealTime: '08:00', calories: '450' },
  { name: 'Almuerzo', mealTime: '13:00', calories: '600' },
  { name: 'Cena', mealTime: '19:00', calories: '550' },
];

// Lets any user without an existing plan (e.g. no coach yet) set up their own nutrition plan.
export default function SelfNutritionSetup({ hasPlan, onCreated }: { hasPlan: boolean; onCreated?: () => void }) {
  const { user, token } = useAuth();
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState('Mi plan');
  const [goalCalories, setGoalCalories] = useState('2200');
  const [meals, setMeals] = useState<MealDraft[]>(defaultMeals);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  if (!user || hasPlan) return null;

  const updateMeal = (index: number, field: keyof MealDraft, value: string) => {
    setMeals((current) => current.map((meal, i) => (i === index ? { ...meal, [field]: value } : meal)));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
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
          meals: meals.map((meal) => ({ name: meal.name, mealTime: meal.mealTime, calories: Number(meal.calories) })),
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
          <p className="eyebrow">Nutrici\u00f3n</p>
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
          Crear mi plan de nutrici\u00f3n
        </button>
      ) : (
        <form className="mt-5 space-y-3" onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-3">
            <input
              className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
              onChange={(event) => setLabel(event.target.value)}
              placeholder="Nombre del plan"
              value={label}
            />
            <input
              className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
              onChange={(event) => setGoalCalories(event.target.value)}
              placeholder="Calor\u00edas meta"
              type="number"
              value={goalCalories}
            />
          </div>
          <div className="space-y-2">
            {meals.map((meal, index) => (
              <div className="grid grid-cols-3 gap-2" key={meal.name}>
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
                <input
                  className="rounded-lg border border-white/8 bg-white/[0.03] px-2 py-1.5 text-xs text-slate-100"
                  onChange={(event) => updateMeal(index, 'calories', event.target.value)}
                  type="number"
                  value={meal.calories}
                />
              </div>
            ))}
          </div>
          {feedback && (
            <p className={`text-xs ${feedback.type === 'success' ? 'text-emerald-300' : 'text-rose-300'}`}>{feedback.message}</p>
          )}
          <button
            className="w-full rounded-xl bg-amber-500 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-400 disabled:opacity-50"
            disabled={submitting}
            type="submit"
          >
            {submitting ? 'Creando\u2026' : 'Guardar plan'}
          </button>
        </form>
      )}
    </section>
  );
}
