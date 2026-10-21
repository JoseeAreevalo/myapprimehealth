import { useState } from 'react';
import axios from 'axios';
import { Flame } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useActivityPlan } from '../hooks/useActivityPlan';
import { todayWeekday } from '../utils/weekday';

// Quick "how much did you do today" widget for the Resumen page. Only shows the cardio/steps
// field the coach actually configured for today's weekday — hidden entirely if neither is set.
export default function QuickActivityLogCard() {
    const { user } = useAuth();
    const { plan, loading, logToday } = useActivityPlan(user?.id ?? null);
    const [logCardio, setLogCardio] = useState('');
    const [logSteps, setLogSteps] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    if (loading || !plan) return null;

    const isoWeekday = todayWeekday();
    const cardioTargetToday = plan.cardioTargets.find((target) => target.weekday === isoWeekday)?.minutes ?? 0;
    const stepsTargetToday = plan.stepsTargets.find((target) => target.weekday === isoWeekday)?.stepsTarget ?? 0;
    if (cardioTargetToday <= 0 && stepsTargetToday <= 0) return null;

    const handleSave = async () => {
        setSaving(true);
        setError('');
        try {
            await logToday({
                actualCardioMinutes: logCardio ? Number(logCardio) : undefined,
                actualSteps: logSteps ? Number(logSteps) : undefined,
            });
            setLogCardio('');
            setLogSteps('');
        } catch (err) {
            setError((axios.isAxiosError(err) ? err.response?.data?.error?.message : undefined) || 'No se pudo guardar el registro.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <article className="metric-card">
            <div className="flex items-start justify-between">
                <div>
                    <p className="eyebrow">Actividad de hoy</p>
                    <p className="mt-2 text-sm text-slate-400">
                        {cardioTargetToday > 0 && `Meta: ${cardioTargetToday} min de cardio`}
                        {cardioTargetToday > 0 && stepsTargetToday > 0 && ' · '}
                        {stepsTargetToday > 0 && `${(stepsTargetToday / 1000).toFixed(1)}k pasos`}
                    </p>
                </div>
                <span className="grid size-11 place-items-center rounded-xl bg-amber-500/15 text-amber-300"><Flame size={20} /></span>
            </div>
            <div className="mt-5 flex items-end gap-2">
                {cardioTargetToday > 0 && (
                    <div className="flex-1">
                        <label className="mb-1 block text-[10px] text-slate-500">Cardio (min)</label>
                        <input
                            className="w-full rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
                            onChange={(event) => setLogCardio(event.target.value)}
                            placeholder={plan.todayLog?.actualCardioMinutes != null ? String(plan.todayLog.actualCardioMinutes) : '0'}
                            type="number"
                            value={logCardio}
                        />
                    </div>
                )}
                {stepsTargetToday > 0 && (
                    <div className="flex-1">
                        <label className="mb-1 block text-[10px] text-slate-500">Pasos</label>
                        <input
                            className="w-full rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
                            onChange={(event) => setLogSteps(event.target.value)}
                            placeholder={plan.todayLog?.actualSteps != null ? String(plan.todayLog.actualSteps) : '0'}
                            type="number"
                            value={logSteps}
                        />
                    </div>
                )}
                <button
                    className="shrink-0 rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-400 disabled:opacity-50"
                    disabled={saving || (!logCardio && !logSteps)}
                    onClick={handleSave}
                    type="button"
                >
                    {saving ? 'Guardando…' : 'Registrar'}
                </button>
            </div>
            {error && <p className="mt-2 text-xs text-rose-300">{error}</p>}
        </article>
    );
}
