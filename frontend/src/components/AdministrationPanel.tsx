import axios from 'axios';
import { useEffect, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { api } from '../api/config';
import { useAuth } from '../context/AuthContext';

interface AdminUser {
  id: number;
  email: string;
  fullName: string | null;
  role: 'super_admin' | 'coach' | 'client';
  isActive: boolean;
}

function authHeaders(token: string | null) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const roleLabels: Record<AdminUser['role'], string> = {
  super_admin: 'super admin',
  coach: 'coach',
  client: 'cliente',
};

function CreateUserForm({ onCreated }: { onCreated: () => void }) {
  const { token } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'coach' | 'client'>('coach');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setFeedback(null);
    try {
      await axios.post(
        `${api.baseURL}${api.endpoints.adminUsers}`,
        { email, password, fullName: fullName || undefined, role },
        { headers: authHeaders(token) },
      );
      setFeedback({ type: 'success', message: 'Usuario creado.' });
      setEmail('');
      setPassword('');
      setFullName('');
      onCreated();
    } catch (error) {
      const message = axios.isAxiosError(error) ? error.response?.data?.error?.message : undefined;
      setFeedback({ type: 'error', message: message ?? 'No se pudo crear el usuario.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="mt-6 space-y-3 border-t border-white/7 pt-6" onSubmit={handleSubmit}>
      <p className="eyebrow">Nuevo coach o cliente</p>
      <input
        className="w-full rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
        onChange={(event) => setEmail(event.target.value)}
        placeholder="Correo electrónico"
        type="email"
        value={email}
      />
      <input
        className="w-full rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
        onChange={(event) => setFullName(event.target.value)}
        placeholder="Nombre completo"
        value={fullName}
      />
      <div className="grid grid-cols-2 gap-3">
        <input
          className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Contraseña temporal"
          type="password"
          value={password}
        />
        <select
          className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
          onChange={(event) => setRole(event.target.value as 'coach' | 'client')}
          value={role}
        >
          <option value="coach">Coach</option>
          <option value="client">Cliente</option>
        </select>
      </div>
      {feedback && (
        <p className={`text-xs ${feedback.type === 'success' ? 'text-emerald-300' : 'text-rose-300'}`}>{feedback.message}</p>
      )}
      <button
        className="w-full rounded-xl bg-amber-500 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-400 disabled:opacity-50"
        disabled={submitting}
        type="submit"
      >
        {submitting ? 'Creando…' : 'Crear cuenta'}
      </button>
    </form>
  );
}

export default function AdministrationPanel() {
  const { user, token } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    axios
      .get(`${api.baseURL}${api.endpoints.adminUsers}`, { headers: authHeaders(token) })
      .then((res) => setUsers(res.data?.data ?? []))
      .catch(() => setError('No se pudieron cargar los usuarios.'))
      .finally(() => setLoading(false));
  };

  useEffect(load, [token]);

  const toggleActive = async (target: AdminUser) => {
    await axios.patch(
      `${api.baseURL}${api.endpoints.adminUserUpdate(target.id)}`,
      { isActive: !target.isActive },
      { headers: authHeaders(token) },
    );
    load();
  };

  if (user?.role !== 'super_admin') return null;

  return (
    <section className="rounded-3xl border border-white/8 bg-panel/70 p-6 shadow-panel">
      <div className="flex items-center justify-between">
        <div>
          <p className="eyebrow">Administración</p>
          <h2 className="mt-2 font-display text-xl font-semibold tracking-[-0.03em] text-slate-50">Usuarios de la plataforma</h2>
        </div>
        <ShieldCheck className="text-amber-300" size={20} />
      </div>

      {loading && <p className="mt-5 text-sm text-slate-500">Cargando…</p>}
      {error && <p className="mt-5 text-sm text-rose-300">{error}</p>}

      {!loading && !error && (
        <ul className="mt-5 max-h-72 space-y-2 overflow-y-auto pr-1">
          {users.map((item) => (
            <li className="flex items-center justify-between rounded-xl border border-white/7 bg-white/[0.03] px-3 py-2 text-xs" key={item.id}>
              <div>
                <p className="font-medium text-slate-100">{item.fullName ?? item.email}</p>
                <p className="text-slate-500">{item.email} · {roleLabels[item.role]}</p>
              </div>
              <button
                className={`rounded-lg px-2 py-1 font-semibold ${item.isActive ? 'bg-white/8 text-slate-300' : 'bg-rose-500/20 text-rose-300'}`}
                onClick={() => toggleActive(item)}
                type="button"
              >
                {item.isActive ? 'Activo' : 'Deshabilitado'}
              </button>
            </li>
          ))}
        </ul>
      )}

      <CreateUserForm onCreated={load} />
    </section>
  );
}
