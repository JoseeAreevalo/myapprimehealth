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


function CreateUserForm({ coaches, hasSuperAdmin, onCreated }: { coaches: AdminUser[]; hasSuperAdmin: boolean; onCreated: () => void }) {
    const { token } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [role, setRole] = useState<'super_admin' | 'coach' | 'client'>('coach');
    const [coachId, setCoachId] = useState<number | ''>('');
    const [submitting, setSubmitting] = useState(false);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (role === 'client' && !coachId) {
            setFeedback({ type: 'error', message: 'Selecciona a qué coach quedará asignado este cliente.' });
            return;
        }
        setSubmitting(true);
        setFeedback(null);
        try {
            await axios.post(
                `${api.baseURL}${api.endpoints.adminUsers}`,
                { email, password, fullName: fullName || undefined, role, coachId: role === 'client' ? coachId : undefined },
                { headers: authHeaders(token) },
            );
            setFeedback({ type: 'success', message: 'Usuario creado.' });
            setEmail('');
            setPassword('');
            setFullName('');
            setCoachId('');
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
            <p className="eyebrow">Nuevo perfil (super admin, coach o cliente)</p>
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
                    className="rounded-xl border border-white/8 bg-slate-900 px-3 py-2 text-sm text-slate-100"
                    onChange={(event) => {
                        setRole(event.target.value as 'super_admin' | 'coach' | 'client');
                        setCoachId('');
                    }}
                    value={role}
                >
                    <option className="bg-slate-900 text-slate-100" disabled={hasSuperAdmin} value="super_admin">
                        Super admin{hasSuperAdmin ? ' (ya existe uno)' : ''}
                    </option>
                    <option className="bg-slate-900 text-slate-100" value="coach">Coach</option>
                    <option className="bg-slate-900 text-slate-100" value="client">Cliente</option>
                </select>
            </div>
            {role === 'client' && (
                <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-400">Coach asignado</label>
                    <select
                        className="w-full rounded-xl border border-white/8 bg-slate-900 px-3 py-2 text-sm text-slate-100"
                        onChange={(event) => setCoachId(event.target.value ? Number(event.target.value) : '')}
                        value={coachId}
                    >
                        <option className="bg-slate-900 text-slate-100" value="">Selecciona un coach…</option>
                        {coaches.map((coach) => (
                            <option className="bg-slate-900 text-slate-100" key={coach.id} value={coach.id}>
                                {coach.fullName ?? coach.email}
                            </option>
                        ))}
                    </select>
                </div>
            )}
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
    const [confirmingDeleteId, setConfirmingDeleteId] = useState<number | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [pendingRoleChange, setPendingRoleChange] = useState<{ user: AdminUser; role: AdminUser['role'] } | null>(null);
    const [changingRole, setChangingRole] = useState(false);

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

    const confirmRoleChange = async () => {
        if (!pendingRoleChange) return;
        setChangingRole(true);
        try {
            await axios.patch(
                `${api.baseURL}${api.endpoints.adminUserUpdate(pendingRoleChange.user.id)}`,
                { role: pendingRoleChange.role },
                { headers: authHeaders(token) },
            );
            setPendingRoleChange(null);
            load();
        } catch (err) {
            const message = axios.isAxiosError(err) ? err.response?.data?.error?.message : undefined;
            setError(message ?? 'No se pudo cambiar el rol.');
        } finally {
            setChangingRole(false);
        }
    };

    const handleDelete = async (target: AdminUser) => {
        setDeleting(true);
        try {
            await axios.delete(`${api.baseURL}${api.endpoints.adminUserDelete(target.id)}`, { headers: authHeaders(token) });
            setConfirmingDeleteId(null);
            load();
        } catch {
            setError('No se pudo eliminar el usuario.');
        } finally {
            setDeleting(false);
        }
    };

    if (user?.role !== 'super_admin') return null;

    return (
        <section className="rounded-3xl border border-white/8 bg-panel/70 p-6 shadow-panel">
            <div className="flex items-center justify-between">
                <div>
                    <p className="eyebrow">Administración</p>
                    <h2 className="mt-2 font-display text-xl font-semibold tracking-[-0.03em] text-slate-50">Configuración de perfiles</h2>
                </div>
                <ShieldCheck className="text-amber-300" size={20} />
            </div>

            {loading && <p className="mt-5 text-sm text-slate-500">Cargando…</p>}
            {error && <p className="mt-5 text-sm text-rose-300">{error}</p>}

            {!loading && !error && (
                <ul className="mt-5 max-h-96 space-y-2 overflow-y-auto pr-1">
                    {users.map((item) => (
                        <li className="rounded-xl border border-white/7 bg-white/[0.03] px-3 py-2 text-xs" key={item.id}>
                            <div className="flex items-center justify-between gap-2">
                                <div>
                                    <p className="font-medium text-slate-100">{item.fullName ?? item.email}</p>
                                    <p className="text-slate-500">{item.email} · {roleLabels[item.role]}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <select
                                        className="rounded-lg border border-white/8 bg-slate-900 px-2 py-1 text-[11px] text-slate-100"
                                        onChange={(event) => {
                                            const role = event.target.value as AdminUser['role'];
                                            if (role !== item.role) setPendingRoleChange({ user: item, role });
                                        }}
                                        value={item.role}
                                    >
                                        <option className="bg-slate-900 text-slate-100" disabled={item.role !== 'super_admin' && users.some((u) => u.role === 'super_admin')} value="super_admin">
                                            Super admin
                                        </option>
                                        <option className="bg-slate-900 text-slate-100" value="coach">Coach</option>
                                        <option className="bg-slate-900 text-slate-100" value="client">Cliente</option>
                                    </select>
                                    <button
                                        className={`rounded-lg px-2 py-1 font-semibold ${item.isActive ? 'bg-white/8 text-slate-300' : 'bg-rose-500/20 text-rose-300'}`}
                                        onClick={() => toggleActive(item)}
                                        type="button"
                                    >
                                        {item.isActive ? 'Activo' : 'Deshabilitado'}
                                    </button>
                                    <button
                                        className="rounded-lg bg-rose-500/15 px-2 py-1 text-rose-300 hover:bg-rose-500/25"
                                        onClick={() => setConfirmingDeleteId(item.id)}
                                        type="button"
                                    >
                                        Eliminar
                                    </button>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            <CreateUserForm coaches={users.filter((item) => item.role === 'coach')} hasSuperAdmin={users.some((item) => item.role === 'super_admin')} onCreated={load} />

            {pendingRoleChange && (
                <div
                    className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 px-4"
                    onClick={() => !changingRole && setPendingRoleChange(null)}
                >
                    <div
                        className="w-full max-w-sm rounded-2xl border border-white/10 bg-slate-950 p-5 shadow-panel"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <p className="text-sm text-slate-200">
                            ¿Cambiar el rol de <span className="font-semibold text-slate-100">{pendingRoleChange.user.fullName ?? pendingRoleChange.user.email}</span> a <span className="font-semibold text-amber-300">{roleLabels[pendingRoleChange.role]}</span>?
                        </p>
                        <div className="mt-4 flex justify-end gap-2">
                            <button
                                className="rounded-lg bg-white/8 px-3 py-1.5 text-xs text-slate-200 hover:bg-white/15"
                                disabled={changingRole}
                                onClick={() => setPendingRoleChange(null)}
                                type="button"
                            >
                                Cancelar
                            </button>
                            <button
                                className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-400 disabled:opacity-50"
                                disabled={changingRole}
                                onClick={confirmRoleChange}
                                type="button"
                            >
                                {changingRole ? 'Guardando…' : 'Confirmar cambio'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {confirmingDeleteId !== null && (
                <div
                    className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 px-4"
                    onClick={() => !deleting && setConfirmingDeleteId(null)}
                >
                    <div
                        className="w-full max-w-sm rounded-2xl border border-white/10 bg-slate-950 p-5 shadow-panel"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <p className="text-sm text-slate-200">¿Eliminar este perfil de forma permanente? Esta acción no se puede deshacer.</p>
                        <div className="mt-4 flex justify-end gap-2">
                            <button
                                className="rounded-lg bg-white/8 px-3 py-1.5 text-xs text-slate-200 hover:bg-white/15"
                                disabled={deleting}
                                onClick={() => setConfirmingDeleteId(null)}
                                type="button"
                            >
                                Cancelar
                            </button>
                            <button
                                className="rounded-lg bg-rose-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-400 disabled:opacity-50"
                                disabled={deleting}
                                onClick={() => {
                                    const target = users.find((candidate) => candidate.id === confirmingDeleteId);
                                    if (target) handleDelete(target);
                                }}
                                type="button"
                            >
                                {deleting ? 'Eliminando…' : 'Sí, eliminar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
