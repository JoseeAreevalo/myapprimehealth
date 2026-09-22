import { Flame } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useMyCoach } from '../hooks/useMyCoach';
import ActivityPlanView from '../components/ActivityPlanView';

export default function ActivityPage() {
    const { user } = useAuth();
    const { hasCoach, loading: coachLoading } = useMyCoach();
    const canManage = user?.role !== 'client' || (!coachLoading && !hasCoach);

    return (
        <section className="mx-auto max-w-2xl">
            <div className="mb-8">
                <p className="mb-3 flex items-center gap-2 text-sm font-medium text-amber-300"><Flame size={16} /> ACTIVIDAD</p>
                <h1 className="font-display text-4xl font-semibold tracking-[-0.04em] text-slate-50">HEAT y NEAT</h1>
                <p className="mt-3 max-w-xl text-base leading-7 text-slate-300">
                    {canManage
                        ? 'Configura tus minutos de cardio (HEAT) y tu meta de pasos diarios (NEAT) por día de la semana.'
                        : 'Revisa la actividad que te configuró tu coach y registra tus minutos de cardio y pasos de hoy.'}
                </p>
            </div>
            {user && !coachLoading && <ActivityPlanView canManage={canManage} clientId={user.id} />}
        </section>
    );
}
