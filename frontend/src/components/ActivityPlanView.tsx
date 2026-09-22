import { useState } from 'react';
import { Flame, Footprints, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useActivityPlan } from '../hooks/useActivityPlan';

const WEEKDAY_LABELS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

// Lets a user configure HEAT (structured cardio minutes/day) and NEAT (daily step goals) per
// weekday, and log what was actually done today. Used both for self-tracking and by a coach
// configuring a client (canManage=false hides editing; logging is only shown for the client themself).
export default function ActivityPlanView({
    clientId,
    canManage = true,
}: {
    clientId: number;
    canManage?: boolean;
}) {
    const { plan, loading, error, createPlan, deletePlan, setCardioTarget, removeCardioTarget, setStepsTarget, removeStepsTarget, logToday } = useActivityPlan(clientId);
    const { user } = useAuth();
    const isSelf = user?.id === clientId;
    const [draftCardio, setDraftCardio] = useState<Record<number, string>>({});
    const [draftSteps, setDraftSteps] = useState<Record<number, string>>({});
    const [confirmingReset, setConfirmingReset] = useState(false);
    const [logCardio, setLogCardio] = useState('');
    const [logSteps, setLogSteps] = useState('');
    const [savingLog, setSavingLog] = useState(false);

    if (loading) return <p className="text-sm text-slate-500">Cargando…</p>;
    if (error) return <p className="text-sm text-rose-300">{error}</p>;

    const handleCreate = async () => {
        const cardioTargets = Object.entries(draftCardio)
            .filter(([, value]) => value.trim() !== '')
            .map(([weekday, minutes]) => ({ weekday: Number(weekday), minutes: Number(minutes) }));
        const stepsTargets = Object.entries(draftSteps)
            .filter(([, value]) => value.trim() !== '')
            .map(([weekday, thousands]) => ({ weekday: Number(weekday), stepsTarget: Math.round(Number(thousands) * 1000) }));
        if (cardioTargets.length === 0 && stepsTargets.length === 0) return;
        await createPlan(cardioTargets, stepsTargets);
        setDraftCardio({});
        setDraftSteps({});
    };

    const handleSaveLog = async () => {
        setSavingLog(true);
        try {
            await logToday({
                actualCardioMinutes: logCardio ? Number(logCardio) : undefined,
                actualSteps: logSteps ? Number(logSteps) : undefined,
            });
            setLogCardio('');
            setLogSteps('');
        } finally {
            setSavingLog(false);
        }
    };

    if (!plan) {
        return (
            <section className="rounded-3xl border border-white/8 bg-panel/70 p-6 shadow-panel">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="eyebrow">Actividad</p>
                        <h2 className="mt-2 font-display text-xl font-semibold tracking-[-0.03em] text-slate-50">HEAT y NEAT</h2>
                    </div>
                    <Flame className="text-amber-300" size={20} />
                </div>
                {!canManage && <p className="mt-3 text-sm text-slate-400">Tu coach aún no ha configurado tu actividad.</p>}
                {canManage && (
                    <div className="mt-4 space-y-4">
                        <div>
                            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Cardio (HEAT) · minutos por día</p>
                            <div className="space-y-1.5">
                                {WEEKDAY_LABELS.map((label, index) => (
                                    <div className="grid grid-cols-[1fr_auto] items-center gap-2" key={label}>
                                        <span className="text-xs text-slate-400">{label}</span>
                                        <input
                                            className="w-24 rounded-lg border border-white/8 bg-white/[0.03] px-2 py-1 text-xs text-slate-100"
                                            onChange={(event) => setDraftCardio((current) => ({ ...current, [index + 1]: event.target.value }))}
                                            placeholder="min"
                                            type="number"
                                            value={draftCardio[index + 1] ?? ''}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div>
                            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Pasos diarios (NEAT) · meta en miles</p>
                            <div className="space-y-1.5">
                                {WEEKDAY_LABELS.map((label, index) => (
                                    <div className="grid grid-cols-[1fr_auto] items-center gap-2" key={label}>
                                        <span className="text-xs text-slate-400">{label}</span>
                                        <input
                                            className="w-24 rounded-lg border border-white/8 bg-white/[0.03] px-2 py-1 text-xs text-slate-100"
                                            onChange={(event) => setDraftSteps((current) => ({ ...current, [index + 1]: event.target.value }))}
                                            placeholder="miles"
                                            step={0.5}
                                            type="number"
                                            value={draftSteps[index + 1] ?? ''}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                        <button
                            className="w-full rounded-xl bg-amber-500 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-400"
                            onClick={handleCreate}
                            type="button"
                        >
                            Guardar configuración
                        </button>
                    </div>
                )}
            </section>
        );
    }

    const cardioByWeekday = new Map(plan.cardioTargets.map((target) => [target.weekday, target]));
    const stepsByWeekday = new Map(plan.stepsTargets.map((target) => [target.weekday, target]));

    return (
        <section className="rounded-3xl border border-white/8 bg-panel/70 p-6 shadow-panel">
            <div className="flex items-center justify-between">
                <div>
                    <p className="eyebrow">Actividad</p>
                    <h2 className="mt-2 font-display text-xl font-semibold tracking-[-0.03em] text-slate-50">HEAT y NEAT</h2>
                </div>
                <Flame className="text-amber-300" size={20} />
            </div>

            <div className="mt-4 grid grid-cols-[1fr_auto_auto] gap-2 text-xs text-slate-500">
                <span>Día</span>
                <span className="flex items-center gap-1"><Flame size={12} /> Cardio (min)</span>
                <span className="flex items-center gap-1"><Footprints size={12} /> Pasos (miles)</span>
            </div>
            <div className="mt-1 space-y-1">
                {WEEKDAY_LABELS.map((label, index) => {
                    const weekday = index + 1;
                    const cardio = cardioByWeekday.get(weekday);
                    const steps = stepsByWeekday.get(weekday);
                    return (
                        <div className="grid grid-cols-[1fr_auto_auto] items-center gap-2 rounded-lg border border-white/7 bg-white/[0.02] px-2 py-1.5" key={label}>
                            <span className="text-xs text-slate-300">{label}</span>
                            {canManage ? (
                                <input
                                    className="w-20 rounded-lg border border-white/8 bg-white/[0.03] px-2 py-1 text-xs text-slate-100"
                                    defaultValue={cardio?.minutes ?? ''}
                                    onBlur={(event) => {
                                        const value = event.target.value;
                                        if (!value) {
                                            if (cardio) removeCardioTarget(weekday);
                                            return;
                                        }
                                        setCardioTarget(weekday, Number(value));
                                    }}
                                    placeholder="—"
                                    type="number"
                                />
                            ) : (
                                <span className="w-20 text-center text-xs text-slate-400">{cardio ? `${cardio.minutes} min` : '—'}</span>
                            )}
                            {canManage ? (
                                <input
                                    className="w-20 rounded-lg border border-white/8 bg-white/[0.03] px-2 py-1 text-xs text-slate-100"
                                    defaultValue={steps ? steps.stepsTarget / 1000 : ''}
                                    onBlur={(event) => {
                                        const value = event.target.value;
                                        if (!value) {
                                            if (steps) removeStepsTarget(weekday);
                                            return;
                                        }
                                        setStepsTarget(weekday, Math.round(Number(value) * 1000));
                                    }}
                                    placeholder="—"
                                    step={0.5}
                                    type="number"
                                />
                            ) : (
                                <span className="w-20 text-center text-xs text-slate-400">{steps ? `${(steps.stepsTarget / 1000).toFixed(1)}k` : '—'}</span>
                            )}
                        </div>
                    );
                })}
            </div>

            {canManage && (
                <div className="mt-3 flex justify-end">
                    <button
                        className="rounded-lg bg-rose-500/15 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/25"
                        onClick={() => setConfirmingReset(true)}
                        type="button"
                    >
                        Reiniciar configuración
                    </button>
                </div>
            )}

            {confirmingReset && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 px-4" onClick={() => setConfirmingReset(false)}>
                    <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-panel p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}>
                        <h3 className="font-display text-lg font-semibold text-slate-50">¿Reiniciar configuración?</h3>
                        <p className="mt-2 text-sm text-slate-400">Esto borrará toda la configuración de cardio y pasos. Esta acción no se puede deshacer.</p>
                        <div className="mt-5 flex justify-end gap-2">
                            <button className="rounded-lg bg-white/8 px-4 py-2 text-sm text-slate-100 hover:bg-white/15" onClick={() => setConfirmingReset(false)} type="button">
                                Cancelar
                            </button>
                            <button
                                className="rounded-lg bg-rose-500 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-400"
                                onClick={async () => {
                                    await deletePlan();
                                    setConfirmingReset(false);
                                }}
                                type="button"
                            >
                                <Trash2 className="inline" size={14} /> Sí, reiniciar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="mt-5 border-t border-white/7 pt-4">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Registro de hoy</p>
                {!isSelf ? (
                    <p className="mt-2 text-sm text-slate-300">
                        {plan.todayLog?.actualCardioMinutes != null ? `${plan.todayLog.actualCardioMinutes} min de cardio` : 'Sin cardio registrado'} ·{' '}
                        {plan.todayLog?.actualSteps != null ? `${plan.todayLog.actualSteps} pasos` : 'Sin pasos registrados'}
                    </p>
                ) : (
                    <div className="mt-2 flex items-end gap-2">
                        <div>
                            <label className="mb-1 block text-[10px] text-slate-500">Minutos de cardio hoy</label>
                            <input
                                className="w-28 rounded-lg border border-white/8 bg-white/[0.03] px-2 py-1.5 text-xs text-slate-100"
                                onChange={(event) => setLogCardio(event.target.value)}
                                placeholder={plan.todayLog?.actualCardioMinutes != null ? String(plan.todayLog.actualCardioMinutes) : '0'}
                                type="number"
                                value={logCardio}
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-[10px] text-slate-500">Pasos hoy</label>
                            <input
                                className="w-28 rounded-lg border border-white/8 bg-white/[0.03] px-2 py-1.5 text-xs text-slate-100"
                                onChange={(event) => setLogSteps(event.target.value)}
                                placeholder={plan.todayLog?.actualSteps != null ? String(plan.todayLog.actualSteps) : '0'}
                                type="number"
                                value={logSteps}
                            />
                        </div>
                        <button
                            className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-400 disabled:opacity-50"
                            disabled={savingLog || (!logCardio && !logSteps)}
                            onClick={handleSaveLog}
                            type="button"
                        >
                            {savingLog ? 'Guardando…' : 'Registrar'}
                        </button>
                    </div>
                )}
            </div>
        </section>
    );
}
