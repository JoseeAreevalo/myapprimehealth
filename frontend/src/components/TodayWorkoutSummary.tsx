import { Link } from 'react-router-dom';
import { Dumbbell } from 'lucide-react';
import { useWorkoutToday } from '../hooks/useWorkoutToday';

// Compact, tracking-only summary for the Overview page; full create/edit lives on /training.
export default function TodayWorkoutSummary() {
  const { workout, loading, complete } = useWorkoutToday();

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

      {!loading && workout && (
        <>
          <h2 className="mt-3 font-display text-2xl font-semibold tracking-[-0.03em] text-slate-50">{workout.name}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">{workout.durationMinutes} minutos</p>
          {workout.status === 'completed' ? (
            <p className="mt-7 text-center text-sm font-medium text-emerald-300">¡Entrenamiento completado hoy! 🎉</p>
          ) : (
            <button
              className="mt-7 w-full rounded-xl bg-amber-400 py-3 text-sm font-semibold text-amber-950 transition hover:bg-amber-300"
              onClick={() => complete()}
              type="button"
            >
              Marcar como completado
            </button>
          )}
        </>
      )}

      {!loading && !workout && (
        <>
          <p className="mt-3 text-sm text-slate-400">Aún no has registrado un entrenamiento para hoy.</p>
          <Link
            className="mt-7 block w-full rounded-xl bg-amber-400 py-3 text-center text-sm font-semibold text-amber-950 transition hover:bg-amber-300"
            to="/training"
          >
            Ir a Entrenamiento
          </Link>
        </>
      )}
    </section>
  );
}
