import { Utensils } from 'lucide-react';
import { useCoachClients } from '../hooks/useCoachClients';
import { ClientNutritionItem } from '../components/CoachingPanel';

export default function ClientNutritionPage() {
    const { clients, loading, error } = useCoachClients();

    return (
        <section className="rounded-3xl border border-white/8 bg-panel/70 p-6 shadow-panel sm:p-8">
            <div className="flex items-center justify-between">
                <div>
                    <p className="eyebrow">Coaching</p>
                    <h1 className="mt-2 font-display text-2xl font-semibold tracking-[-0.03em] text-slate-50">Nutrición de clientes</h1>
                    <p className="mt-2 max-w-xl text-sm text-slate-400">Crea y edita el plan de alimentación de cada uno de tus clientes.</p>
                </div>
                <Utensils className="text-amber-300" size={22} />
            </div>

            {loading && <p className="mt-6 text-sm text-slate-500">Cargando lista…</p>}
            {error && <p className="mt-6 text-sm text-rose-300">{error}</p>}
            {!loading && !error && clients.length === 0 && (
                <p className="mt-6 text-sm text-slate-400">Aún no tienes clientes asignados.</p>
            )}
            {!loading && clients.length > 0 && (
                <ul className="mt-6 space-y-3">
                    {clients.map((client) => (
                        <ClientNutritionItem client={client} key={client.id} />
                    ))}
                </ul>
            )}
        </section>
    );
}
