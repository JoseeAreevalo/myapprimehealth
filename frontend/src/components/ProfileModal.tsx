import axios from 'axios';
import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { api } from '../api/config';
import { useAuth } from '../context/AuthContext';

interface Profile {
    phone: string | null;
    bio: string | null;
}

function authHeaders(token: string | null) {
    return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function ProfileModal({ open, onClose }: { open: boolean; onClose: () => void }) {
    const { user, token } = useAuth();
    const [phone, setPhone] = useState('');
    const [bio, setBio] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    useEffect(() => {
        if (!open) return;
        setLoading(true);
        setFeedback(null);
        axios
            .get(`${api.baseURL}${api.endpoints.myProfile}`, { headers: authHeaders(token) })
            .then((res) => {
                const profile: Profile | null = res.data?.profile ?? null;
                setPhone(profile?.phone ?? '');
                setBio(profile?.bio ?? '');
            })
            .catch(() => setFeedback({ type: 'error', message: 'No se pudo cargar tu perfil.' }))
            .finally(() => setLoading(false));
    }, [open, token]);

    if (!open) return null;

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setSubmitting(true);
        setFeedback(null);
        try {
            await axios.put(
                `${api.baseURL}${api.endpoints.myProfile}`,
                { phone: phone || null, bio: bio || null },
                { headers: authHeaders(token) },
            );
            setFeedback({ type: 'success', message: 'Perfil actualizado.' });
        } catch {
            setFeedback({ type: 'error', message: 'No se pudo guardar tu perfil.' });
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
                        <p className="eyebrow">Mi perfil</p>
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
                        <div>
                            <label className="mb-1.5 block text-xs font-medium text-slate-400">Teléfono</label>
                            <input
                                className="w-full rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
                                onChange={(event) => setPhone(event.target.value)}
                                placeholder="+52 55 0000 0000"
                                value={phone}
                            />
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
