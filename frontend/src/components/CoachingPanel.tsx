import axios from 'axios';
import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ClipboardCheck, HeartHandshake, Plus, Search, Trash2, UserPlus } from 'lucide-react';
import { api } from '../api/config';
import { useAuth } from '../context/AuthContext';
import { useClientProgress } from '../hooks/useClientProgress';
import { PersonSummary } from '../hooks/useCoachClients';
import { NutritionPlanWithMeals } from '../hooks/useNutritionToday';
import CheckInPhotos from './CheckInPhotos';
import EditNutritionPlan from './EditNutritionPlan';
import MealItemsEditor, { MealItemDraft, mealItemsTotals } from './MealItemsEditor';
import NutritionLiveTotals from './NutritionLiveTotals';
import TrainingPlanView from './TrainingPlanView';
import { macroCalories } from '../utils/nutritionMath';

export type { PersonSummary };

interface PendingCheckIn {
    id: number;
    clientId: number;
    weekStartDate: string;
    weightKg: number | null;
    adherencePercent: number | null;
    notes: string | null;
}

interface MealDraft {
    name: string;
    mealTime: string;
    calories: string;
    items: MealItemDraft[];
}

function effectiveCalories(meal: MealDraft): number {
    return meal.items.length > 0 ? mealItemsTotals(meal.items).calories : Number(meal.calories) || 0;
}

const emptyMeals: MealDraft[] = [
    { name: 'Desayuno', mealTime: '08:00', calories: '450', items: [] },
    { name: 'Almuerzo', mealTime: '13:00', calories: '600', items: [] },
    { name: 'Cena', mealTime: '19:00', calories: '550', items: [] },
];

const WEEKDAY_LABELS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
type DayType = 'entrenamiento' | 'descanso';
const DAY_TYPE_LABELS: Record<DayType, string> = { entrenamiento: 'Día de entrenamiento', descanso: 'Día de descanso' };

function authHeaders(token: string | null) {
    return token ? { Authorization: `Bearer ${token}` } : {};
}

export function PendingCheckIns({ clients }: { clients: PersonSummary[] }) {
    const { user, token } = useAuth();
    const [pending, setPending] = useState<PendingCheckIn[]>([]);
    const [loading, setLoading] = useState(true);
    const [drafts, setDrafts] = useState<Record<number, string>>({});
    const [submittingId, setSubmittingId] = useState<number | null>(null);

    const load = () => {
        if (!user) return;
        setLoading(true);
        axios
            .get(`${api.baseURL}${api.endpoints.checkInPending(user.id)}`, { headers: authHeaders(token) })
            .then((res) => setPending(res.data?.data ?? []))
            .catch(() => setPending([]))
            .finally(() => setLoading(false));
    };

    useEffect(load, [user, token]);

    const clientName = (clientId: number) => clients.find((client) => client.id === clientId)?.fullName ?? `Cliente #${clientId}`;

    const handleReview = async (id: number) => {
        setSubmittingId(id);
        try {
            await axios.patch(
                `${api.baseURL}${api.endpoints.checkInReview(id)}`,
                { feedback: drafts[id] ?? '' },
                { headers: authHeaders(token) },
            );
            load();
        } finally {
            setSubmittingId(null);
        }
    };

    return (
        <section className="rounded-3xl border border-white/8 bg-panel/70 p-6 shadow-panel">
            <div className="flex items-center justify-between">
                <div>
                    <p className="eyebrow">Coaching</p>
                    <h2 className="mt-2 font-display text-xl font-semibold tracking-[-0.03em] text-slate-50">Check-ins por revisar</h2>
                </div>
                <ClipboardCheck className="text-amber-300" size={20} />
            </div>
            {loading && <p className="mt-5 text-sm text-slate-500">Cargando…</p>}
            {!loading && pending.length === 0 && <p className="mt-5 text-sm text-slate-400">No hay nada pendiente por revisar.</p>}
            {!loading && pending.length > 0 && (
                <ul className="mt-5 space-y-4">
                    {pending.map((checkIn) => (
                        <li className="rounded-xl border border-white/7 bg-white/[0.03] p-4" key={checkIn.id}>
                            <p className="text-sm font-medium text-slate-100">{clientName(checkIn.clientId)} · semana del {checkIn.weekStartDate}</p>
                            <p className="mt-1 text-xs text-slate-500">
                                {checkIn.weightKg != null ? `${checkIn.weightKg} kg` : 'Sin peso registrado'} · {checkIn.adherencePercent != null ? `${checkIn.adherencePercent}% de adherencia` : 'Sin adherencia registrada'}
                            </p>
                            {checkIn.notes && <p className="mt-2 text-sm text-slate-300">"{checkIn.notes}"</p>}
                            <CheckInPhotos canUpload={false} checkInId={checkIn.id} />
                            <textarea
                                className="mt-3 w-full rounded-lg border border-white/8 bg-white/[0.03] px-3 py-2 text-xs text-slate-100"
                                onChange={(event) => setDrafts((current) => ({ ...current, [checkIn.id]: event.target.value }))}
                                placeholder="Escribe una respuesta para este cliente…"
                                rows={2}
                                value={drafts[checkIn.id] ?? ''}
                            />
                            <button
                                className="mt-2 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-amber-400 disabled:opacity-50"
                                disabled={submittingId === checkIn.id}
                                onClick={() => handleReview(checkIn.id)}
                                type="button"
                            >
                                {submittingId === checkIn.id ? 'Guardando…' : 'Enviar respuesta'}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}

export function CreateMealPlanForm({ clients, fixedClientId, onCreated }: { clients?: PersonSummary[]; fixedClientId?: number; onCreated?: () => void }) {
    const { token } = useAuth();
    const [clientId, setClientId] = useState<number | ''>(fixedClientId ?? '');
    const [label, setLabel] = useState('Balanced');
    const [goalCalories, setGoalCalories] = useState('2200');
    const [proteinG, setProteinG] = useState('150');
    const [carbsG, setCarbsG] = useState('220');
    const [fatG, setFatG] = useState('70');
    const [waterGoalMl, setWaterGoalMl] = useState('2500');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [dayType, setDayType] = useState<DayType | null>(null);
    const [weekdays, setWeekdays] = useState<number[]>([1, 2, 3, 4, 5, 6, 7]);
    const [meals, setMeals] = useState<MealDraft[]>(emptyMeals);
    const [submitting, setSubmitting] = useState(false);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

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
        const targetClientId = fixedClientId ?? clientId;
        if (!targetClientId) {
            setFeedback({ type: 'error', message: 'Selecciona un cliente primero.' });
            return;
        }
        if (!dayType || weekdays.length === 0) {
            setFeedback({ type: 'error', message: 'Indica si esta dieta es de entrenamiento o descanso, y para qué días de la semana aplica.' });
            return;
        }

        setSubmitting(true);
        setFeedback(null);
        try {
            await axios.post(
                `${api.baseURL}${api.endpoints.nutritionPlanCreate}`,
                {
                    clientId: targetClientId,
                    planKey: label.toLowerCase().replace(/\s+/g, '-'),
                    label,
                    goalCalories: Number(goalCalories),
                    proteinGTarget: proteinG ? Number(proteinG) : undefined,
                    carbsGTarget: carbsG ? Number(carbsG) : undefined,
                    fatGTarget: fatG ? Number(fatG) : undefined,
                    waterGoalMl: waterGoalMl ? Number(waterGoalMl) : undefined,
                    startDate: startDate || undefined,
                    endDate: endDate || undefined,
                    dayConfig: { label: DAY_TYPE_LABELS[dayType], weekdays },
                    meals: meals.map((meal) => ({
                        name: meal.name,
                        mealTime: meal.mealTime,
                        calories: effectiveCalories(meal),
                        items: meal.items.map((item) => ({ foodId: item.foodId, foodName: item.foodName, grams: Number(item.grams) })),
                    })),
                },
                { headers: authHeaders(token) },
            );
            setFeedback({ type: 'success', message: 'Plan creado para el cliente.' });
            onCreated?.();
        } catch (error) {
            const message = axios.isAxiosError(error) ? error.response?.data?.error?.message : undefined;
            setFeedback({ type: 'error', message: message ?? 'No se pudo crear el plan.' });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form className="mt-6 space-y-4 border-t border-white/7 pt-6" onSubmit={handleSubmit}>
            <p className="eyebrow">Nuevo plan de comidas</p>
            {!fixedClientId && (
                <select
                    className="w-full rounded-xl border border-white/8 bg-slate-900 px-3 py-2 text-sm text-slate-100"
                    value={clientId}
                    onChange={(event) => setClientId(event.target.value ? Number(event.target.value) : '')}
                >
                    <option className="bg-slate-900 text-slate-100" value="">Selecciona un cliente…</option>
                    {(clients ?? []).map((client) => (
                        <option className="bg-slate-900 text-slate-100" key={client.id} value={client.id}>
                            {client.fullName ?? client.email}
                        </option>
                    ))}
                </select>
            )}
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
                {submitting ? 'Creando…' : 'Crear plan'}
            </button>
        </form>
    );
}

export function CreateClientForm({ onCreated }: { onCreated: () => void }) {
    const { user, token } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!user) return;
        setSubmitting(true);
        setFeedback(null);
        try {
            await axios.post(
                `${api.baseURL}${api.endpoints.coachClients(user.id)}`,
                { email, password, fullName: fullName || undefined },
                { headers: authHeaders(token) },
            );
            setFeedback({ type: 'success', message: 'Cliente creado y asignado a ti.' });
            setEmail('');
            setPassword('');
            setFullName('');
            onCreated();
        } catch (error) {
            const message = axios.isAxiosError(error) ? error.response?.data?.error?.message : undefined;
            setFeedback({ type: 'error', message: message ?? 'No se pudo crear el cliente.' });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form className="mt-6 space-y-3 border-t border-white/7 pt-6" onSubmit={handleSubmit}>
            <p className="eyebrow flex items-center gap-1.5"><UserPlus size={13} /> Nuevo cliente</p>
            <input
                className="w-full rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Correo electrónico"
                type="email"
                value={email}
            />
            <input
                className="w-full rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Nombre completo"
                value={fullName}
            />
            <input
                className="w-full rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Contraseña temporal"
                type="password"
                value={password}
            />
            {feedback && (
                <p className={`text-xs ${feedback.type === 'success' ? 'text-emerald-300' : 'text-rose-300'}`}>{feedback.message}</p>
            )}
            <button
                className="w-full rounded-xl bg-amber-500 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-400 disabled:opacity-50"
                disabled={submitting}
                type="submit"
            >
                {submitting ? 'Creando…' : 'Crear cliente'}
            </button>
        </form>
    );
}

function ClientReviewDetail({ client }: { client: PersonSummary }) {
    const { token } = useAuth();
    const [clientPlan, setClientPlan] = useState<NutritionPlanWithMeals | null>(null);
    const [planLoading, setPlanLoading] = useState(true);
    const { progress, loading } = useClientProgress(client.id);

    useEffect(() => {
        setPlanLoading(true);
        axios
            .get(`${api.baseURL}${api.endpoints.nutritionToday(client.id)}`, { headers: authHeaders(token) })
            .then((res) => setClientPlan(res.data?.plan ?? null))
            .catch(() => setClientPlan(null))
            .finally(() => setPlanLoading(false));
    }, [client.id, token]);

    return (
        <div className="mt-4 space-y-4 rounded-2xl border border-white/8 bg-white/[0.02] p-4">
            <div>
                <p className="text-sm font-semibold text-slate-100">{client.fullName ?? client.email}</p>
                <p className="text-xs text-slate-500">{client.email}</p>
            </div>
            <div className="rounded-xl border border-white/7 bg-white/[0.03] p-3 text-xs text-slate-400">
                {loading && <p>Cargando progreso…</p>}
                {!loading && progress && progress.summary.totalCheckIns === 0 && <p>Aún no hay check-ins.</p>}
                {!loading && progress && progress.summary.totalCheckIns > 0 && (
                    <div className="grid grid-cols-2 gap-2">
                        <p>Cambio de peso: <span className="text-slate-200">{progress.summary.weightChangeKg != null ? `${progress.summary.weightChangeKg} kg` : '—'}</span></p>
                        <p>Adherencia prom.: <span className="text-slate-200">{progress.summary.averageAdherencePercent != null ? `${progress.summary.averageAdherencePercent}%` : '—'}</span></p>
                    </div>
                )}
            </div>
            <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Nutrición (solo lectura)</p>
                {planLoading && <p className="text-xs text-slate-400">Cargando…</p>}
                {!planLoading && !clientPlan && <p className="text-xs text-slate-400">Este cliente no tiene un plan activo todavía.</p>}
                {!planLoading && clientPlan && (
                    <div className="rounded-xl border border-white/7 bg-white/[0.03] p-3">
                        <p className="text-xs text-slate-300">
                            {clientPlan.goalCalories} kcal meta · P {clientPlan.proteinGTarget ?? '—'}g · C {clientPlan.carbsGTarget ?? '—'}g · G {clientPlan.fatGTarget ?? '—'}g · Agua {(clientPlan.waterGoalMl / 1000).toFixed(1)}L
                        </p>
                        <ul className="mt-2 space-y-1 text-xs text-slate-400">
                            {clientPlan.meals.map((meal) => (
                                <li className="flex justify-between" key={meal.id}>
                                    <span>{meal.name}{meal.mealTime ? ` · ${meal.mealTime}` : ''}</span>
                                    <span>{meal.status === 'completed' && meal.loggedCalories != null ? Math.round(meal.loggedCalories) : meal.calories} kcal{meal.status === 'completed' ? ' ✓' : ''}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
            <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Entrenamiento (solo lectura)</p>
                <TrainingPlanView clientId={client.id} canManage={false} readOnly />
            </div>
        </div>
    );
}

export function ClientReviewSearch({ clients }: { clients: PersonSummary[] }) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [selectedClient, setSelectedClient] = useState<PersonSummary | null>(null);
    const [highlightedIndex, setHighlightedIndex] = useState(0);

    const filtered = useMemo(() => {
        const normalized = query.trim().toLowerCase();
        if (!normalized) return clients;
        return clients.filter((client) =>
            (client.fullName ?? '').toLowerCase().includes(normalized) || client.email.toLowerCase().includes(normalized),
        );
    }, [clients, query]);

    const selectClient = (client: PersonSummary) => {
        setSelectedClient(client);
        setOpen(false);
        setQuery('');
        setHighlightedIndex(0);
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'ArrowDown') {
            event.preventDefault();
            setHighlightedIndex((current) => Math.min(current + 1, filtered.length - 1));
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            setHighlightedIndex((current) => Math.max(current - 1, 0));
        } else if (event.key === 'Enter') {
            event.preventDefault();
            const client = filtered[highlightedIndex];
            if (client) selectClient(client);
        } else if (event.key === 'Escape') {
            setOpen(false);
        }
    };

    return (
        <section className="rounded-3xl border border-white/8 bg-panel/70 p-6 shadow-panel">
            <div className="flex items-center justify-between">
                <div>
                    <p className="eyebrow">Coaching</p>
                    <h2 className="mt-2 font-display text-xl font-semibold tracking-[-0.03em] text-slate-50">Revisión de Clientes</h2>
                </div>
                <Search className="text-amber-300" size={20} />
            </div>
            <button
                className="mt-4 flex w-full items-center justify-between rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2 text-sm text-slate-300 hover:bg-white/8"
                onClick={() => {
                    setOpen((current) => !current);
                    setHighlightedIndex(0);
                }}
                type="button"
            >
                <span>{selectedClient ? (selectedClient.fullName ?? selectedClient.email) : 'Buscar y seleccionar un cliente…'}</span>
                <Search size={15} />
            </button>
            {open && (
                <div className="mt-2 rounded-xl border border-white/8 bg-slate-950 p-2">
                    <input
                        autoFocus
                        className="w-full rounded-lg border border-white/8 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
                        onChange={(event) => {
                            setQuery(event.target.value);
                            setHighlightedIndex(0);
                        }}
                        onKeyDown={handleKeyDown}
                        placeholder="Escribe un nombre o correo… (↑/↓ para navegar, Enter para elegir)"
                        value={query}
                    />
                    <ul className="mt-2 max-h-56 space-y-1 overflow-y-auto">
                        {filtered.length === 0 && <li className="px-2 py-2 text-xs text-slate-500">Sin resultados.</li>}
                        {filtered.map((client, index) => (
                            <li key={client.id}>
                                <button
                                    className={`w-full rounded-lg px-2 py-1.5 text-left text-xs transition ${index === highlightedIndex
                                        ? 'bg-amber-500/20 text-amber-100 ring-1 ring-amber-400/40'
                                        : 'text-slate-200 hover:bg-white/8'
                                        }`}
                                    onClick={() => selectClient(client)}
                                    onMouseEnter={() => setHighlightedIndex(index)}
                                    type="button"
                                >
                                    <span className="font-medium">{client.fullName ?? client.email}</span>
                                    <span className="block text-slate-500">{client.email}</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
            {selectedClient && <ClientReviewDetail client={selectedClient} />}
        </section>
    );
}

export function ClientNutritionItem({ client }: { client: PersonSummary }) {
    const { token } = useAuth();
    const [open, setOpen] = useState(false);
    const [clientPlan, setClientPlan] = useState<NutritionPlanWithMeals | null>(null);
    const [planLoading, setPlanLoading] = useState(false);

    const loadPlan = () => {
        setPlanLoading(true);
        axios
            .get(`${api.baseURL}${api.endpoints.nutritionToday(client.id)}`, { headers: authHeaders(token) })
            .then((res) => setClientPlan(res.data?.plan ?? null))
            .catch(() => setClientPlan(null))
            .finally(() => setPlanLoading(false));
    };

    return (
        <li className="rounded-xl border border-white/7 bg-white/[0.03] px-4 py-3">
            <button
                className="flex w-full items-center justify-between"
                onClick={() => {
                    const next = !open;
                    setOpen(next);
                    if (next) loadPlan();
                }}
                type="button"
            >
                <div className="text-left">
                    <span className="text-sm font-medium text-slate-100">{client.fullName ?? client.email}</span>
                    <span className="block text-xs text-slate-500">{client.email}</span>
                </div>
                <ChevronDown className={`text-slate-400 transition ${open ? 'rotate-180' : ''}`} size={16} />
            </button>
            {open && (
                <div className="mt-3 border-t border-white/7 pt-3">
                    {planLoading && <p className="text-xs text-slate-400">Cargando…</p>}
                    {!planLoading && !clientPlan && <CreateMealPlanForm fixedClientId={client.id} onCreated={loadPlan} />}
                    {!planLoading && clientPlan && <EditNutritionPlan onUpdated={loadPlan} plan={clientPlan} />}
                </div>
            )}
        </li>
    );
}

export function ClientTrainingItem({ client }: { client: PersonSummary }) {
    const [open, setOpen] = useState(false);

    return (
        <li className="rounded-xl border border-white/7 bg-white/[0.03] px-4 py-3">
            <button
                className="flex w-full items-center justify-between"
                onClick={() => setOpen((current) => !current)}
                type="button"
            >
                <div className="text-left">
                    <span className="text-sm font-medium text-slate-100">{client.fullName ?? client.email}</span>
                    <span className="block text-xs text-slate-500">{client.email}</span>
                </div>
                <ChevronDown className={`text-slate-400 transition ${open ? 'rotate-180' : ''}`} size={16} />
            </button>
            {open && (
                <div className="mt-3 border-t border-white/7 pt-3">
                    <TrainingPlanView clientId={client.id} />
                </div>
            )}
        </li>
    );
}

function ClientCoach() {
    const { user, token } = useAuth();
    const [coach, setCoach] = useState<PersonSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!user) return;
        setLoading(true);
        axios
            .get(`${api.baseURL}${api.endpoints.clientCoach(user.id)}`, { headers: authHeaders(token) })
            .then((res) => setCoach(res.data?.coach ?? null))
            .catch(() => setError('No se pudo cargar tu coach.'))
            .finally(() => setLoading(false));
    }, [user, token]);

    return (
        <section className="rounded-3xl border border-white/8 bg-panel/70 p-6 shadow-panel">
            <div className="flex items-center justify-between">
                <div>
                    <p className="eyebrow">Coaching</p>
                    <h2 className="mt-2 font-display text-xl font-semibold tracking-[-0.03em] text-slate-50">Tu coach</h2>
                </div>
                <HeartHandshake className="text-amber-300" size={20} />
            </div>
            {loading && <p className="mt-5 text-sm text-slate-500">Cargando…</p>}
            {error && <p className="mt-5 text-sm text-rose-300">{error}</p>}
            {!loading && !error && !coach && (
                <p className="mt-5 text-sm text-slate-400">Aún no tienes un coach asignado. Contacta al equipo para que te asignen uno.</p>
            )}
            {!loading && coach && (
                <div className="mt-5 rounded-xl border border-white/7 bg-white/[0.03] px-4 py-3">
                    <p className="text-sm font-medium text-slate-100">{coach.fullName ?? coach.email}</p>
                    <p className="mt-1 text-xs text-slate-500">{coach.email}</p>
                </div>
            )}
        </section>
    );
}

export default function CoachingPanel() {
    const { user } = useAuth();
    if (!user) return null;

    if (user.role === 'client') return <ClientCoach />;
    return null;
}
