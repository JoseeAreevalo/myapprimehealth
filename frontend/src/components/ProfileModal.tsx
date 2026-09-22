import axios from 'axios';
import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { api } from '../api/config';
import { useAuth } from '../context/AuthContext';
import { COUNTRY_CODES, joinPhone, splitPhone } from '../utils/countryCodes';

interface Profile {
    phone: string | null;
    bio: string | null;
}

function authHeaders(token: string | null) {
    return token ? { Authorization: `Bearer ${token}` } : {};
}

function splitFullName(fullName: string | null | undefined): { firstName: string; lastName: string } {
    const trimmed = (fullName ?? '').trim();
    if (!trimmed) return { firstName: '', lastName: '' };
    const [firstName, ...rest] = trimmed.split(/\s+/);
    return { firstName, lastName: rest.join(' ') };
}

export default function ProfileModal({ open, onClose }: { open: boolean; onClose: () => void }) {
    const { user, token, refreshUser } = useAuth();
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [dialCode, setDialCode] = useState('+56');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [bio, setBio] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    useEffect(() => {
        if (!open) return;
        const { firstName: fn, lastName: ln } = splitFullName(user?.fullName);
        setFirstName(fn);
        setLastName(ln);
        setEmail(user?.email ?? '');
        setLoading(true);
        setFeedback(null);
        axios
            .get(`${api.baseURL}${api.endpoints.myProfile}`, { headers: authHeaders(token) })
            .then((res) => {
                const profile: Profile | null = res.data?.profile ?? null;
                const { dialCode: parsedDialCode, number } = splitPhone(profile?.phone);
                setDialCode(parsedDialCode);
                setPhoneNumber(number);
                setBio(profile?.bio ?? '');
            })
            .catch(() => setFeedback({ type: 'error', message: 'No se pudo cargar tu perfil.' }))
            .finally(() => setLoading(false));
    }, [open, token, user]);

    if (!open) return null;

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setSubmitting(true);
        setFeedback(null);
        try {
            const fullName = [firstName.trim(), lastName.trim()].filter(Boolean).join(' ') || null;
            await axios.patch(
                `${api.baseURL}${api.endpoints.accountUpdate}`,
                { fullName, email },
                { headers: authHeaders(token) },
            );
            await axios.put(
                `${api.baseURL}${api.endpoints.myProfile}`,
                { phone: joinPhone(dialCode, phoneNumber), bio: bio || null },
                { headers: authHeaders(token) },
            );
            await refreshUser();
            setFeedback({ type: 'success', message: 'Perfil actualizado.' });
        } catch (error) {
            const message = axios.isAxiosError(error) ? error.response?.data?.error?.message : undefined;
            setFeedback({ type: 'error', message: message ?? 'No se pudo guardar tu perfil.' });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 px-4" onClick={onClose}>
            <div
                className="w-full max-w-md rounded-3xl border border-white/10 bg-panel p-6 shadow-2xl"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="flex items-center justify-between">
                    <div>
                        <p className="eyebrow">Editar perfil</p>
                        <h2 className="mt-2 font-display text-xl font-semibold tracking-[-0.03em] text-slate-50">{user?.fullName ?? user?.email}</h2>
                    </div>
                    <button aria-label="Cerrar" className="grid size-9 place-items-center rounded-lg text-slate-400 hover:bg-white/8" onClick={onClose} type="button">
                        <X size={18} />
                    </button>
                </div>

                {loading ? (
                    <p className="mt-6 text-sm text-slate-500">Cargando…</p>
                ) : (
                    <form className="mt-6 space-y-3" onSubmit={handleSubmit}>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="mb-1.5 block text-xs font-medium text-slate-400">Nombre</label>
                                <input
                                    className="w-full rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
                                    onChange={(event) => setFirstName(event.target.value)}
                                    placeholder="Nombre"
                                    value={firstName}
                                />
                            </div>
                            <div>
                                <label className="mb-1.5 block text-xs font-medium text-slate-400">Apellido</label>
                                <input
                                    className="w-full rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
                                    onChange={(event) => setLastName(event.target.value)}
                                    placeholder="Apellido"
                                    value={lastName}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="mb-1.5 block text-xs font-medium text-slate-400">Correo electrónico</label>
                            <input
                                className="w-full rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
                                onChange={(event) => setEmail(event.target.value)}
                                placeholder="correo@ejemplo.com"
                                type="email"
                                value={email}
                            />
                        </div>
                        <div>
                            <label className="mb-1.5 block text-xs font-medium text-slate-400">Teléfono</label>
                            <div className="flex gap-2">
                                <select
                                    className="w-32 rounded-xl border border-white/8 bg-slate-900 px-2 py-2 text-sm text-slate-100"
                                    onChange={(event) => setDialCode(event.target.value)}
                                    value={dialCode}
                                >
                                    {COUNTRY_CODES.map((country) => (
                                        <option className="bg-slate-900 text-slate-100" key={country.code} value={country.dialCode}>
                                            {country.name} ({country.dialCode})
                                        </option>
                                    ))}
                                </select>
                                <input
                                    className="flex-1 rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
                                    onChange={(event) => setPhoneNumber(event.target.value)}
                                    placeholder="9 1234 5678"
                                    value={phoneNumber}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="mb-1.5 block text-xs font-medium text-slate-400">Sobre mí</label>
                            <textarea
                                className="w-full rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
                                onChange={(event) => setBio(event.target.value)}
                                placeholder="Cuéntanos un poco de ti…"
                                rows={3}
                                value={bio}
                            />
                        </div>
                        {feedback && (
                            <p className={`text-xs ${feedback.type === 'success' ? 'text-emerald-300' : 'text-rose-300'}`}>{feedback.message}</p>
                        )}
                        <button
                            className="w-full rounded-xl bg-amber-500 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-400 disabled:opacity-50"
                            disabled={submitting}
                            type="submit"
                        >
                            {submitting ? 'Guardando…' : 'Guardar cambios'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}

