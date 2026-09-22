import { useState } from 'react';
import { Moon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCheckIns } from '../hooks/useCheckIns';
import CheckInPhotos from './CheckInPhotos';

export default function WeeklyCheckInCard() {
    const { user } = useAuth();
    const { latest, loading, error, submit } = useCheckIns();
    const [weightKg, setWeightKg] = useState('');
    const [adherencePercent, setAdherencePercent] = useState('');
    const [notes, setNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [feedback, setFeedback] = useState('');

    if (user?.role !== 'client') return null;

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        const adherence = adherencePercent ? Math.min(100, Math.max(0, Number(adherencePercent))) : null;
        setSubmitting(true);
        setFeedback('');
        try {
            await submit({
                weightKg: weightKg ? Number(weightKg) : null,
                adherencePercent: adherence,
                notes: notes || null,
            });
            setFeedback('Check-in enviado para esta semana.');
            setNotes('');
        } catch {
            setFeedback('No se pudo enviar tu check-in.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <section className="rounded-3xl border border-white/8 bg-panel/70 p-6 shadow-panel">
            <div className="flex items-center justify-between">
                <div>
                    <p className="eyebrow">Check-in semanal</p>
                    <h2 className="mt-2 font-display text-xl font-semibold tracking-[-0.03em] text-slate-50">Tu historia de progreso</h2>
                </div>
                <Moon className="text-amber-300" size={20} />
            </div>

            {loading && <p className="mt-6 text-sm text-slate-500">Cargando…</p>}
            {error && <p className="mt-6 text-sm text-rose-300">{error}</p>}

            {!loading && !error && (
                <>
                    {latest ? (
                        <div className="mt-6 rounded-xl border border-white/7 bg-white/[0.03] px-4 py-3">
                            <p className="text-sm text-slate-300">
                                Semana del <span className="font-medium text-slate-100">{latest.weekStartDate}</span> · {latest.status === 'reviewed' ? 'Revisado por tu coach' : 'Esperando revisión'}
                            </p>
                            {latest.coachFeedback && <p className="mt-2 text-sm text-amber-200">"{latest.coachFeedback}"</p>}
                            <CheckInPhotos canUpload checkInId={latest.id} />
                        </div>
                    ) : (
                        <p className="mt-6 text-sm text-slate-400">Aún no has enviado un check-in esta semana.</p>
                    )}

                    <form className="mt-5 space-y-3" onSubmit={handleSubmit}>
                        <div>
                            <label className="mb-1.5 block text-xs font-medium text-slate-400">Peso (kg)</label>
                            <input
                                className="w-full rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
                                onChange={(event) => setWeightKg(event.target.value)}
                                placeholder="Ej: 78.5"
                                type="number"
                                value={weightKg}
                            />
                        </div>
                        <div>
                            <label className="mb-1.5 block text-xs font-medium text-slate-400">% de adherencia (opcional)</label>
                            <input
                                className="w-full rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
                                max={100}
                                min={0}
                                onChange={(event) => setAdherencePercent(event.target.value)}
                                placeholder="Ej: 80"
                                type="number"
                                value={adherencePercent}
                            />
                        </div>
                        <div>
                            <label className="mb-1.5 block text-xs font-medium text-slate-400">¿Cómo estuvo tu semana?</label>
                            <textarea
                                className="w-full rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
                                onChange={(event) => setNotes(event.target.value)}
                                placeholder="Sensaciones, energía, dificultades…"
                                rows={2}
                                value={notes}
                            />
                        </div>
                        {feedback && <p className="text-xs text-amber-300">{feedback}</p>}
                        <button
                            className="w-full rounded-xl bg-white/7 py-2.5 text-sm font-medium text-slate-100 transition hover:bg-white/12 disabled:opacity-50"
                            disabled={submitting}
                            type="submit"
                        >
                            {submitting ? 'Enviando…' : 'Enviar check-in de esta semana'}
                        </button>
                    </form>
                </>
            )}
        </section>
    );
}
