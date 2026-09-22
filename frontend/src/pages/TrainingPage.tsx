import { Dumbbell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useMyCoach } from '../hooks/useMyCoach';
import TrainingPlanView from '../components/TrainingPlanView';

export default function TrainingPage() {
    const { user } = useAuth();
    const { hasCoach, loading: coachLoading } = useMyCoach();
    const canManage = user?.role !== 'client' || (!coachLoading && !hasCoach);

    return (
        <section className="mx-auto max-w-2xl">
            <div className="mb-8">
                <p className="mb-3 flex items-center gap-2 text-sm font-medium text-amber-300"><Dumbbell size={16} /> ENTRENAMIENTO</p>
                <h1 className="font-display text-4xl font-semibold tracking-[-0.04em] text-slate-50">Tu semana de entrenamiento</h1>
                <p className="mt-3 max-w-xl text-base leading-7 text-slate-300">
                    {canManage
                        ? 'Configura cuántos días entrenas, qué ejercicios corresponden a cada día, y registra cuántas repeticiones y peso hiciste en cada serie.'
                        : 'Revisa la rutina que te asignó tu coach y registra cuántas repeticiones, peso y RIR hiciste en cada serie.'}
                </p>
            </div>
            {user && !coachLoading && <TrainingPlanView canManage={canManage} clientId={user.id} />}
        </section>
    );
}
