import { useCoachClients } from '../hooks/useCoachClients';
import { ClientPlansSearch } from '../components/CoachingPanel';

export default function ClientPlansPage() {
    const { clients, loading, error } = useCoachClients();

    return (
        <div className="space-y-6">
            {loading && <p className="text-sm text-slate-500">Cargando lista…</p>}
            {error && <p className="text-sm text-rose-300">{error}</p>}
            {!loading && !error && clients.length === 0 && (
                <p className="text-sm text-slate-400">Aún no tienes clientes asignados.</p>
            )}
            {!loading && clients.length > 0 && <ClientPlansSearch clients={clients} />}
        </div>
    );
}
