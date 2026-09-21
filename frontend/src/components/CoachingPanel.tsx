import axios from 'axios';
import { useEffect, useState } from 'react';
import { HeartHandshake, Users } from 'lucide-react';
import { api } from '../api/config';
import { useAuth } from '../context/AuthContext';

interface PersonSummary {
  id: number;
  email: string;
  fullName: string | null;
  role: string;
}

function authHeaders(token: string | null) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function CoachRoster() {
  const { user, token } = useAuth();
  const [clients, setClients] = useState<PersonSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    axios
      .get(`${api.baseURL}${api.endpoints.coachClients(user.id)}`, { headers: authHeaders(token) })
      .then((res) => setClients(res.data?.data ?? []))
      .catch(() => setError('Unable to load your client roster.'))
      .finally(() => setLoading(false));
  }, [user, token]);

  return (
    <section className="rounded-3xl border border-white/8 bg-panel/70 p-6 shadow-panel">
      <div className="flex items-center justify-between">
        <div>
          <p className="eyebrow">Coaching</p>
          <h2 className="mt-2 font-display text-xl font-semibold tracking-[-0.03em] text-slate-50">Your clients</h2>
        </div>
        <Users className="text-violet-300" size={20} />
      </div>
      {loading && <p className="mt-5 text-sm text-slate-500">Loading roster…</p>}
      {error && <p className="mt-5 text-sm text-rose-300">{error}</p>}
      {!loading && !error && clients.length === 0 && (
        <p className="mt-5 text-sm text-slate-400">No clients assigned yet.</p>
      )}
      {!loading && clients.length > 0 && (
        <ul className="mt-5 space-y-3">
          {clients.map((client) => (
            <li className="flex items-center justify-between rounded-xl border border-white/7 bg-white/[0.03] px-4 py-3" key={client.id}>
              <span className="text-sm font-medium text-slate-100">{client.fullName ?? client.email}</span>
              <span className="text-xs text-slate-500">{client.email}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function ClientCoach() {
  const { user, token } = useAuth();
  const [coach, setCoach] = useState<PersonSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    axios
      .get(`${api.baseURL}${api.endpoints.clientCoach(user.id)}`, { headers: authHeaders(token) })
      .then((res) => setCoach(res.data?.coach ?? null))
      .catch(() => setError('Unable to load your coach.'))
      .finally(() => setLoading(false));
  }, [user, token]);

  return (
    <section className="rounded-3xl border border-white/8 bg-panel/70 p-6 shadow-panel">
      <div className="flex items-center justify-between">
        <div>
          <p className="eyebrow">Coaching</p>
          <h2 className="mt-2 font-display text-xl font-semibold tracking-[-0.03em] text-slate-50">Your coach</h2>
        </div>
        <HeartHandshake className="text-violet-300" size={20} />
      </div>
      {loading && <p className="mt-5 text-sm text-slate-500">Loading…</p>}
      {error && <p className="mt-5 text-sm text-rose-300">{error}</p>}
      {!loading && !error && !coach && (
        <p className="mt-5 text-sm text-slate-400">No coach assigned yet. Reach out to the team to get paired with one.</p>
      )}
      {!loading && coach && (
        <div className="mt-5 rounded-xl border border-white/7 bg-white/[0.03] px-4 py-3">
          <p className="text-sm font-medium text-slate-100">{coach.fullName ?? coach.email}</p>
          <p className="mt-1 text-xs text-slate-500">{coach.email}</p>
        </div>
      )}
    </section>
  );
}

export default function CoachingPanel() {
  const { user } = useAuth();
  if (!user) return null;

  if (user.role === 'coach') return <CoachRoster />;
  if (user.role === 'client') return <ClientCoach />;
  return null;
}
