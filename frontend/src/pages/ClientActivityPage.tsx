import { useState } from 'react';
import { ChevronDown, Flame } from 'lucide-react';
import { useCoachClients, PersonSummary } from '../hooks/useCoachClients';
import ActivityPlanView from '../components/ActivityPlanView';

function ClientActivityItem({ client }: { client: PersonSummary }) {
    const [open, setOpen] = useState(false);
    return (
        <li className="rounded-xl border border-white/7 bg-white/[0.03] px-4 py-3">
            <button className="flex w-full items-center justify-between" onClick={() => setOpen((current) => !current)} type="button">
                <div className="text-left">
                    <span className="text-sm font-medium text-slate-100">{client.fullName ?? client.email}</span>
                    <span className="block text-xs text-slate-500">{client.email}</span>
                </div>
                <ChevronDown className={`text-slate-400 transition ${open ? 'rotate-180' : ''}`} size={16} />
            </button>
            {open && (
                <div className="mt-3 border-t border-white/7 pt-3">
                    <ActivityPlanView clientId={client.id} />
                </div>
            )}
        </li>
    );
}

export default function ClientActivityPage() {
    const { clients, loading, error } = useCoachClients();

    return (
        <section className="rounded-3xl border border-white/8 bg-panel/70 p-6 shadow-panel sm:p-8">
            <div className="flex items-center justify-between">
                <div>
                    <p className="eyebrow">Coaching</p>
                    <h1 className="mt-2 font-display text-2xl font-semibold tracking-[-0.03em] text-slate-50">Actividad de clientes</h1>
                    <p className="mt-2 max-w-xl text-sm text-slate-400">Configura el cardio (HEAT) y la meta de pasos (NEAT) de cada uno de tus clientes.</p>
                </div>
                <Flame className="text-amber-300" size={22} />
            </div>

            {loading && <p className="mt-6 text-sm text-slate-500">Cargando lista…</p>}
            {error && <p className="mt-6 text-sm text-rose-300">{error}</p>}
            {!loading && !error && clients.length === 0 && (
                <p className="mt-6 text-sm text-slate-400">Aún no tienes clientes asignados.</p>
            )}
            {!loading && clients.length > 0 && (
                <ul className="mt-6 space-y-3">
                    {clients.map((client) => (
                        <ClientActivityItem client={client} key={client.id} />
                    ))}
                </ul>
            )}
        </section>
    );
}
