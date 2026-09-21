import { useState } from 'react';
import { Dumbbell } from 'lucide-react';
import { useWorkoutToday } from '../hooks/useWorkoutToday';

export default function WorkoutCard() {
  const { workout, loading, error, save, complete } = useWorkoutToday();
  const [name, setName] = useState('Fuerza de tren superior');
  const [duration, setDuration] = useState('45');
  const [editing, setEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await save(name, Number(duration));
      setEditing(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleComplete = async () => {
    setSubmitting(true);
    try {
      await complete();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="overflow-hidden rounded-3xl border border-amber-400/15 bg-gradient-to-br from-amber-500/20 via-panel to-panel p-6 shadow-panel">
      <div className="flex items-center justify-between">
        <span className="grid size-11 place-items-center rounded-xl bg-amber-400/15 text-amber-200"><Dumbbell size={20} /></span>
        {workout && (
          <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-xs font-semibold text-amber-200">
            {workout.status === 'completed' ? 'Completado' : 'Hoy'}
          </span>
        )}
      </div>
      <p className="eyebrow mt-8">Enfoque de entrenamiento</p>

      {loading && <p className="mt-3 text-sm text-slate-400">Cargando…</p>}
      {error && <p className="mt-3 text-sm text-rose-300">{error}</p>}

      {!loading && !error && workout && !editing && (
        <>
          <h2 className="mt-3 font-display text-2xl font-semibold tracking-[-0.03em] text-slate-50">{workout.name}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">{workout.durationMinutes} minutos</p>
          {workout.status === 'completed' ? (
            <button
              className="mt-7 w-full rounded-xl bg-white/10 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/15"
              onClick={() => setEditing(true)}
              type="button"
            >
              Registrar otro entrenamiento
            </button>
          ) : (
            <button
              className="mt-7 w-full rounded-xl bg-amber-400 py-3 text-sm font-semibold text-amber-950 transition hover:bg-amber-300 disabled:opacity-50"
              disabled={submitting}
              onClick={handleComplete}
              type="button"
            >
              {submitting ? 'Guardando…' : 'Marcar como completado'}
            </button>
          )}
        </>
      )}

      {!loading && !error && (!workout || editing) && (
        <form className="mt-4 space-y-3" onSubmit={handleSave}>
          <input
            className="w-full rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
            onChange={(event) => setName(event.target.value)}
            placeholder="Nombre del entrenamiento"
            value={name}
          />
          <input
            className="w-full rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
            onChange={(event) => setDuration(event.target.value)}
            placeholder="Minutos"
            type="number"
            value={duration}
          />
          <button
            className="w-full rounded-xl bg-amber-400 py-3 text-sm font-semibold text-amber-950 transition hover:bg-amber-300 disabled:opacity-50"
            disabled={submitting}
            type="submit"
          >
            {submitting ? 'Guardando…' : 'Guardar entrenamiento de hoy'}
          </button>
        </form>
      )}
    </section>
  );
}
