import { Search } from 'lucide-react';
import { useCoachClients } from '../hooks/useCoachClients';
import { ClientReviewSearch, CreateClientForm, PendingCheckIns } from '../components/CoachingPanel';

export default function ClientReviewPage() {
    const { clients, loading, error, reload } = useCoachClients();

    return (
        <div className="space-y-6">
            <section className="rounded-3xl border border-white/8 bg-panel/70 p-6 shadow-panel sm:p-8">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="eyebrow">Coaching</p>
                        <h1 className="mt-2 font-display text-2xl font-semibold tracking-[-0.03em] text-slate-50">Seguimiento</h1>
                        <p className="mt-2 max-w-xl text-sm text-slate-400">Agrega nuevos clientes y da seguimiento a su progreso, nutrición y entrenamiento.</p>
                    </div>
                    <Search className="text-amber-300" size={22} />
                </div>
                {loading && <p className="mt-6 text-sm text-slate-500">Cargando lista…</p>}
                {error && <p className="mt-6 text-sm text-rose-300">{error}</p>}
                <CreateClientForm onCreated={reload} />
            </section>
            {!loading && clients.length > 0 && <ClientReviewSearch clients={clients} />}
            {!loading && clients.length > 0 && <PendingCheckIns clients={clients} />}
        </div>
    );
}
