import axios from 'axios';
import { useEffect, useState } from 'react';
import { ClipboardCheck, HeartHandshake, TrendingUp, Users } from 'lucide-react';
import { api } from '../api/config';
import { useAuth } from '../context/AuthContext';
import { useClientProgress } from '../hooks/useClientProgress';
import CheckInPhotos from './CheckInPhotos';

interface PersonSummary {
  id: number;
  email: string;
  fullName: string | null;
  role: string;
}

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
}

const emptyMeals: MealDraft[] = [
  { name: 'Desayuno', mealTime: '08:00', calories: '450' },
  { name: 'Almuerzo', mealTime: '13:00', calories: '600' },
  { name: 'Cena', mealTime: '19:00', calories: '550' },
];

function authHeaders(token: string | null) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function PendingCheckIns({ clients }: { clients: PersonSummary[] }) {
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

function CreateMealPlanForm({ clients }: { clients: PersonSummary[] }) {
  const { token } = useAuth();
  const [clientId, setClientId] = useState<number | ''>('');
  const [label, setLabel] = useState('Balanced');
  const [goalCalories, setGoalCalories] = useState('2200');
  const [meals, setMeals] = useState<MealDraft[]>(emptyMeals);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const updateMeal = (index: number, field: keyof MealDraft, value: string) => {
    setMeals((current) => current.map((meal, i) => (i === index ? { ...meal, [field]: value } : meal)));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!clientId) {
      setFeedback({ type: 'error', message: 'Selecciona un cliente primero.' });
      return;
    }

    setSubmitting(true);
    setFeedback(null);
    try {
      await axios.post(
        `${api.baseURL}${api.endpoints.nutritionPlanCreate}`,
        {
          clientId,
          planKey: label.toLowerCase().replace(/\s+/g, '-'),
          label,
          goalCalories: Number(goalCalories),
          meals: meals.map((meal) => ({ name: meal.name, mealTime: meal.mealTime, calories: Number(meal.calories) })),
        },
        { headers: authHeaders(token) },
      );
      setFeedback({ type: 'success', message: 'Plan creado para el cliente.' });
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
      <select
        className="w-full rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
        value={clientId}
        onChange={(event) => setClientId(event.target.value ? Number(event.target.value) : '')}
      >
        <option value="">Selecciona un cliente…</option>
        {clients.map((client) => (
          <option key={client.id} value={client.id}>
            {client.fullName ?? client.email}
          </option>
        ))}
      </select>
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
          placeholder="Calorías meta"
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
        {submitting ? 'Creando…' : 'Crear plan'}
      </button>
    </form>
  );
}

function ClientRosterItem({ client }: { client: PersonSummary }) {
  const [expanded, setExpanded] = useState(false);
  const { progress, loading } = useClientProgress(expanded ? client.id : null);

  return (
    <li className="rounded-xl border border-white/7 bg-white/[0.03] px-4 py-3">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-sm font-medium text-slate-100">{client.fullName ?? client.email}</span>
          <span className="block text-xs text-slate-500">{client.email}</span>
        </div>
        <button
          className="flex items-center gap-1 rounded-lg border border-white/8 px-2 py-1 text-xs text-slate-300 hover:bg-white/8"
          onClick={() => setExpanded((current) => !current)}
          type="button"
        >
          <TrendingUp size={14} /> Progreso
        </button>
      </div>
      {expanded && (
        <div className="mt-3 border-t border-white/7 pt-3 text-xs text-slate-400">
          {loading && <p>Cargando…</p>}
          {!loading && progress && progress.summary.totalCheckIns === 0 && <p>Aún no hay check-ins.</p>}
          {!loading && progress && progress.summary.totalCheckIns > 0 && (
            <div className="grid grid-cols-2 gap-2">
              <p>Cambio de peso: <span className="text-slate-200">{progress.summary.weightChangeKg != null ? `${progress.summary.weightChangeKg} kg` : '—'}</span></p>
              <p>Adherencia prom.: <span className="text-slate-200">{progress.summary.averageAdherencePercent != null ? `${progress.summary.averageAdherencePercent}%` : '—'}</span></p>
            </div>
          )}
        </div>
      )}
    </li>
  );
}

function CoachDashboard() {
  const { user, token } = useAuth();
  const [clients, setClients] = useState<PersonSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    axios
      .get(`${api.baseURL}${api.endpoints.coachClients(user.id)}`, { headers: authHeaders(token) })
      .then((res) => setClients(res.data?.data ?? []))
      .catch(() => setError('No se pudo cargar tu lista de clientes.'))
      .finally(() => setLoading(false));
  }, [user, token]);

  return (
    <>
      <section className="rounded-3xl border border-white/8 bg-panel/70 p-6 shadow-panel">
        <div className="flex items-center justify-between">
          <div>
            <p className="eyebrow">Coaching</p>
            <h2 className="mt-2 font-display text-xl font-semibold tracking-[-0.03em] text-slate-50">Tus clientes</h2>
          </div>
          <Users className="text-amber-300" size={20} />
        </div>
        {loading && <p className="mt-5 text-sm text-slate-500">Cargando lista…</p>}
        {error && <p className="mt-5 text-sm text-rose-300">{error}</p>}
        {!loading && !error && clients.length === 0 && (
          <p className="mt-5 text-sm text-slate-400">Aún no tienes clientes asignados.</p>
        )}
        {!loading && clients.length > 0 && (
          <ul className="mt-5 space-y-3">
            {clients.map((client) => (
              <ClientRosterItem client={client} key={client.id} />
            ))}
          </ul>
        )}
        {!loading && clients.length > 0 && <CreateMealPlanForm clients={clients} />}
      </section>
      {!loading && clients.length > 0 && <PendingCheckIns clients={clients} />}
    </>
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

  if (user.role === 'coach') return <CoachDashboard />;
  if (user.role === 'client') return <ClientCoach />;
  return null;
}
