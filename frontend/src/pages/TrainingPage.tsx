import { Dumbbell } from 'lucide-react';
import WorkoutCard from '../components/WorkoutCard';

export default function TrainingPage() {
  return (
    <section className="mx-auto max-w-xl">
      <div className="mb-8">
        <p className="mb-3 flex items-center gap-2 text-sm font-medium text-amber-300"><Dumbbell size={16} /> ENTRENAMIENTO</p>
        <h1 className="font-display text-4xl font-semibold tracking-[-0.04em] text-slate-50">Tu entrenamiento</h1>
        <p className="mt-3 max-w-xl text-base leading-7 text-slate-300">
          Crea o actualiza el entrenamiento de hoy y registra tus series, repeticiones y pesos.
        </p>
      </div>
      <WorkoutCard />
    </section>
  );
}
