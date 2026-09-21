import { TrendingUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useClientProgress } from '../hooks/useClientProgress';

function Sparkbars({ values }: { values: number[] }) {
  if (values.length === 0) return null;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;

  return (
    <div className="mt-4 flex h-16 items-end gap-1.5">
      {values.map((value, index) => (
        <div
          className="flex-1 rounded-t-sm bg-gradient-to-t from-violet-500 to-fuchsia-400"
          key={index}
          style={{ height: `${((value - min) / range) * 100 || 8}%`, minHeight: '8%' }}
        />
      ))}
    </div>
  );
}

export default function ProgressPanel() {
  const { user } = useAuth();
  const clientId = user?.role === 'client' ? user.id : null;
  const { progress, loading, error } = useClientProgress(clientId);

  if (user?.role !== 'client') return null;

  return (
    <section className="rounded-3xl border border-white/8 bg-panel/70 p-6 shadow-panel">
      <div className="flex items-center justify-between">
        <div>
          <p className="eyebrow">Progress</p>
          <h2 className="mt-2 font-display text-xl font-semibold tracking-[-0.03em] text-slate-50">Your trend</h2>
        </div>
        <TrendingUp className="text-violet-300" size={20} />
      </div>

      {loading && <p className="mt-5 text-sm text-slate-500">Loading…</p>}
      {error && <p className="mt-5 text-sm text-rose-300">{error}</p>}

      {!loading && !error && progress && progress.summary.totalCheckIns === 0 && (
        <p className="mt-5 text-sm text-slate-400">Submit your first weekly check-in to start tracking progress.</p>
      )}

      {!loading && !error && progress && progress.summary.totalCheckIns > 0 && (
        <>
          <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl border border-white/7 bg-white/[0.03] px-3 py-2">
              <p className="text-xs text-slate-500">Weight change</p>
              <p className="mt-1 font-medium text-slate-100">
                {progress.summary.weightChangeKg != null ? `${progress.summary.weightChangeKg > 0 ? '+' : ''}${progress.summary.weightChangeKg} kg` : '—'}
              </p>
            </div>
            <div className="rounded-xl border border-white/7 bg-white/[0.03] px-3 py-2">
              <p className="text-xs text-slate-500">Avg. adherence</p>
              <p className="mt-1 font-medium text-slate-100">
                {progress.summary.averageAdherencePercent != null ? `${progress.summary.averageAdherencePercent}%` : '—'}
              </p>
            </div>
          </div>
          {progress.weightSeries.length > 1 && (
            <>
              <p className="mt-5 text-xs text-slate-500">Weight (kg) over time</p>
              <Sparkbars values={progress.weightSeries.map((point) => point.weightKg)} />
            </>
          )}
        </>
      )}
    </section>
  );
}
