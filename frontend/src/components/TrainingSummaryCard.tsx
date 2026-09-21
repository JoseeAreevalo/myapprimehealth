import { Link } from 'react-router-dom';
import { Dumbbell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTrainingPlan } from '../hooks/useTrainingPlan';

// Compact, tracking-only summary for the Overview page; full day/exercise editing lives on /training.
export default function TrainingSummaryCard() {
  const { user } = useAuth();
  const { plan, loading } = useTrainingPlan(user?.id ?? null);

  return (
    <section className="overflow-hidden rounded-3xl border border-amber-400/15 bg-gradient-to-br from-amber-500/20 via-panel to-panel p-6 shadow-panel">
      <div className="flex items-center justify-between">
        <span className="grid size-11 place-items-center rounded-xl bg-amber-400/15 text-amber-200"><Dumbbell size={20} /></span>
      </div>
      <p className="eyebrow mt-8">Enfoque de entrenamiento</p>

      {loading && <p className="mt-3 text-sm text-slate-400">Cargando…</p>}

      {!loading && plan && (
        <>
          <h2 className="mt-3 font-display text-2xl font-semibold tracking-[-0.03em] text-slate-50">{plan.label}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">{plan.days.length} días por semana</p>
        </>
      )}

      {!loading && !plan && <p className="mt-3 text-sm text-slate-400">Aún no tienes un plan de entrenamiento.</p>}

      <Link
        className="mt-7 block w-full rounded-xl bg-amber-400 py-3 text-center text-sm font-semibold text-amber-950 transition hover:bg-amber-300"
        to="/training"
      >
        {plan ? 'Ir a registrar hoy' : 'Configurar entrenamiento'}
      </Link>
    </section>
  );
}
