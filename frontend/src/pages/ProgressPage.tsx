import { Activity } from 'lucide-react';
import ProgressPanel from '../components/ProgressPanel';
import WeeklyCheckInCard from '../components/WeeklyCheckInCard';

export default function ProgressPage() {
  return (
    <section className="mx-auto grid max-w-3xl gap-5 sm:grid-cols-2">
      <div className="sm:col-span-2 mb-3">
        <p className="mb-3 flex items-center gap-2 text-sm font-medium text-amber-300"><Activity size={16} /> PROGRESO</p>
        <h1 className="font-display text-4xl font-semibold tracking-[-0.04em] text-slate-50">Tu progreso</h1>
        <p className="mt-3 max-w-xl text-base leading-7 text-slate-300">Peso, adherencia y check-ins semanales a lo largo del tiempo.</p>
      </div>
      <WeeklyCheckInCard />
      <ProgressPanel />
    </section>
  );
}
