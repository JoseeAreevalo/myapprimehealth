import { useEffect, useState } from 'react';
import { Flame, Footprints, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useActivityPlan, useActivityLogs } from '../hooks/useActivityPlan';

const WEEKDAY_LABELS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
type Assignment = 'A' | 'B' | 'none';
type AssignmentMap = Record<number, Assignment>;

const emptyAssignment = (): AssignmentMap => ({ 1: 'none', 2: 'none', 3: 'none', 4: 'none', 5: 'none', 6: 'none', 7: 'none' });

// Given each weekday's raw target value, figures out up to two distinct values ("A"/"B") and
// which weekdays use which — so the editor can show "set 2 values, pick which days use each"
// instead of one input per day.
function deriveTwoValues(byWeekday: Map<number, number>): { valueA: string; valueB: string; assignment: AssignmentMap } {
    const assignment = emptyAssignment();
    const distinctValues: number[] = [];
    byWeekday.forEach((value) => {
        if (!distinctValues.includes(value)) distinctValues.push(value);
    });
    byWeekday.forEach((value, weekday) => {
        const index = distinctValues.indexOf(value);
        assignment[weekday] = index === 0 ? 'A' : index === 1 ? 'B' : 'none';
    });
    return { valueA: distinctValues[0] != null ? String(distinctValues[0]) : '', valueB: distinctValues[1] != null ? String(distinctValues[1]) : '', assignment };
}

function WeekdayAssignmentGrid({
    assignment,
    onToggle,
    labelA,
    labelB,
}: {
    assignment: AssignmentMap;
    onToggle: (weekday: number, value: 'A' | 'B') => void;
    labelA: string;
    labelB: string;
}) {
    return (
        <div className="space-y-1.5">
            {WEEKDAY_LABELS.map((label, index) => {
                const weekday = index + 1;
                const current = assignment[weekday];
                return (
                    <div className="grid grid-cols-[1fr_auto_auto] items-center gap-1.5" key={label}>
                        <span className="text-xs text-slate-400">{label}</span>
                        <button
                            className={`rounded-lg border px-2.5 py-1 text-[11px] font-medium transition ${current === 'A' ? 'border-amber-400 bg-amber-500 text-white' : 'border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/8'
                                }`}
                            onClick={() => onToggle(weekday, 'A')}
                            type="button"
                        >
                            {labelA}
                        </button>
                        <button
                            className={`rounded-lg border px-2.5 py-1 text-[11px] font-medium transition ${current === 'B' ? 'border-teal-400 bg-teal-500 text-white' : 'border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/8'
                                }`}
                            onClick={() => onToggle(weekday, 'B')}
                            type="button"
                        >
                            {labelB}
                        </button>
                    </div>
                );
            })}
        </div>
    );
}

// Lets a user configure HEAT (structured cardio minutes/day) and NEAT (daily step goals) by
// setting 2 values and choosing which weekdays use each (instead of one input per day), and
// log/follow up day by day what was actually done. Used both for self-tracking and by a coach
// configuring a client (canManage=false hides editing; logging is only shown for the client themself).
export default function ActivityPlanView({
    clientId,
    canManage = true,
}: {
    clientId: number;
    canManage?: boolean;
}) {
    const { plan, loading, error, createPlan, deletePlan, setCardioTarget, removeCardioTarget, setStepsTarget, removeStepsTarget, logToday } = useActivityPlan(clientId);
    const { logs } = useActivityLogs(clientId);
    const { user } = useAuth();
    const isSelf = user?.id === clientId;

    const [cardioValueA, setCardioValueA] = useState('30');
    const [cardioValueB, setCardioValueB] = useState('15');
    const [cardioAssignment, setCardioAssignment] = useState<AssignmentMap>(emptyAssignment());
    const [stepsValueA, setStepsValueA] = useState('10');
    const [stepsValueB, setStepsValueB] = useState('6');
    const [stepsAssignment, setStepsAssignment] = useState<AssignmentMap>(emptyAssignment());
    const [confirmingReset, setConfirmingReset] = useState(false);
    const [logCardio, setLogCardio] = useState('');
    const [logSteps, setLogSteps] = useState('');
    const [savingLog, setSavingLog] = useState(false);
    const [savingTargets, setSavingTargets] = useState(false);

    // Pre-fill the editor from whatever is already configured, once the plan loads.
    useEffect(() => {
        if (!plan) return;
        const cardio = deriveTwoValues(new Map(plan.cardioTargets.map((target) => [target.weekday, target.minutes])));
        setCardioValueA(cardio.valueA || '30');
        setCardioValueB(cardio.valueB || '15');
        setCardioAssignment(cardio.assignment);
        const steps = deriveTwoValues(new Map(plan.stepsTargets.map((target) => [target.weekday, target.stepsTarget / 1000])));
        setStepsValueA(steps.valueA || '10');
        setStepsValueB(steps.valueB || '6');
        setStepsAssignment(steps.assignment);
    }, [plan]);

    if (loading) return <p className="text-sm text-slate-500">Cargando…</p>;
    if (error) return <p className="text-sm text-rose-300">{error}</p>;

    const toggleCardio = (weekday: number, value: 'A' | 'B') => {
        setCardioAssignment((current) => ({ ...current, [weekday]: current[weekday] === value ? 'none' : value }));
    };
    const toggleSteps = (weekday: number, value: 'A' | 'B') => {
        setStepsAssignment((current) => ({ ...current, [weekday]: current[weekday] === value ? 'none' : value }));
    };

    const handleCreate = async () => {
        const cardioTargets = Object.entries(cardioAssignment)
            .filter(([, assignment]) => assignment !== 'none')
            .map(([weekday, assignment]) => ({ weekday: Number(weekday), minutes: Number(assignment === 'A' ? cardioValueA : cardioValueB) }))
            .filter((target) => target.minutes > 0);
        const stepsTargets = Object.entries(stepsAssignment)
            .filter(([, assignment]) => assignment !== 'none')
            .map(([weekday, assignment]) => ({ weekday: Number(weekday), stepsTarget: Math.round(Number(assignment === 'A' ? stepsValueA : stepsValueB) * 1000) }))
            .filter((target) => target.stepsTarget > 0);
        if (cardioTargets.length === 0 && stepsTargets.length === 0) return;
        await createPlan(cardioTargets, stepsTargets);
    };

    const handleSaveTargets = async () => {
        setSavingTargets(true);
        try {
            const cardioByWeekday = new Map(plan!.cardioTargets.map((target) => [target.weekday, target]));
            const stepsByWeekday = new Map(plan!.stepsTargets.map((target) => [target.weekday, target]));
            await Promise.all([
                ...Array.from({ length: 7 }, (_, index) => {
                    const weekday = index + 1;
                    const assignment = cardioAssignment[weekday];
                    if (assignment === 'none') {
                        return cardioByWeekday.has(weekday) ? removeCardioTarget(weekday) : Promise.resolve();
                    }
                    const minutes = Number(assignment === 'A' ? cardioValueA : cardioValueB);
                    return minutes > 0 ? setCardioTarget(weekday, minutes) : Promise.resolve();
                }),
                ...Array.from({ length: 7 }, (_, index) => {
                    const weekday = index + 1;
                    const assignment = stepsAssignment[weekday];
                    if (assignment === 'none') {
                        return stepsByWeekday.has(weekday) ? removeStepsTarget(weekday) : Promise.resolve();
                    }
                    const stepsTarget = Math.round(Number(assignment === 'A' ? stepsValueA : stepsValueB) * 1000);
                    return stepsTarget > 0 ? setStepsTarget(weekday, stepsTarget) : Promise.resolve();
                }),
            ]);
        } finally {
            setSavingTargets(false);
        }
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
                    <div className="mt-4 space-y-5">
                        <div>
                            <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                <Flame size={12} /> Cardio (HEAT) · define 2 valores (minutos)
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                                <input
                                    className="rounded-lg border border-amber-400/30 bg-white/[0.03] px-2 py-1.5 text-xs text-slate-100"
                                    onChange={(event) => setCardioValueA(event.target.value)}
                                    placeholder="Valor A (min)"
                                    type="number"
                                    value={cardioValueA}
                                />
                                <input
                                    className="rounded-lg border border-teal-400/30 bg-white/[0.03] px-2 py-1.5 text-xs text-slate-100"
                                    onChange={(event) => setCardioValueB(event.target.value)}
                                    placeholder="Valor B (min)"
                                    type="number"
                                    value={cardioValueB}
                                />
                            </div>
                            <p className="mb-1 mt-2 text-[10px] text-slate-500">Selecciona qué días corresponden a cada valor:</p>
                            <WeekdayAssignmentGrid assignment={cardioAssignment} labelA={`A · ${cardioValueA || '—'} min`} labelB={`B · ${cardioValueB || '—'} min`} onToggle={toggleCardio} />
                        </div>
                        <div>
                            <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                <Footprints size={12} /> Pasos diarios (NEAT) · define 2 valores (miles)
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                                <input
                                    className="rounded-lg border border-amber-400/30 bg-white/[0.03] px-2 py-1.5 text-xs text-slate-100"
                                    onChange={(event) => setStepsValueA(event.target.value)}
                                    placeholder="Valor A (miles)"
                                    step={0.5}
                                    type="number"
                                    value={stepsValueA}
                                />
                                <input
                                    className="rounded-lg border border-teal-400/30 bg-white/[0.03] px-2 py-1.5 text-xs text-slate-100"
                                    onChange={(event) => setStepsValueB(event.target.value)}
                                    placeholder="Valor B (miles)"
                                    step={0.5}
                                    type="number"
                                    value={stepsValueB}
                                />
                            </div>
                            <p className="mb-1 mt-2 text-[10px] text-slate-500">Selecciona qué días corresponden a cada valor:</p>
                            <WeekdayAssignmentGrid assignment={stepsAssignment} labelA={`A · ${stepsValueA || '—'}k`} labelB={`B · ${stepsValueB || '—'}k`} onToggle={toggleSteps} />
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

    return (
        <section className="rounded-3xl border border-white/8 bg-panel/70 p-6 shadow-panel">
            <div className="flex items-center justify-between">
                <div>
                    <p className="eyebrow">Actividad</p>
                    <h2 className="mt-2 font-display text-xl font-semibold tracking-[-0.03em] text-slate-50">HEAT y NEAT</h2>
                </div>
                <Flame className="text-amber-300" size={20} />
            </div>

            {canManage ? (
                <div className="mt-4 space-y-5">
                    <div>
                        <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                            <Flame size={12} /> Cardio (HEAT) · 2 valores (minutos)
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                            <input
                                className="rounded-lg border border-amber-400/30 bg-white/[0.03] px-2 py-1.5 text-xs text-slate-100"
                                onChange={(event) => setCardioValueA(event.target.value)}
                                placeholder="Valor A (min)"
                                type="number"
                                value={cardioValueA}
                            />
                            <input
                                className="rounded-lg border border-teal-400/30 bg-white/[0.03] px-2 py-1.5 text-xs text-slate-100"
                                onChange={(event) => setCardioValueB(event.target.value)}
                                placeholder="Valor B (min)"
                                type="number"
                                value={cardioValueB}
                            />
                        </div>
                        <div className="mt-2">
                            <WeekdayAssignmentGrid assignment={cardioAssignment} labelA={`A · ${cardioValueA || '—'} min`} labelB={`B · ${cardioValueB || '—'} min`} onToggle={toggleCardio} />
                        </div>
                    </div>
                    <div>
                        <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                            <Footprints size={12} /> Pasos diarios (NEAT) · 2 valores (miles)
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                            <input
                                className="rounded-lg border border-amber-400/30 bg-white/[0.03] px-2 py-1.5 text-xs text-slate-100"
                                onChange={(event) => setStepsValueA(event.target.value)}
                                placeholder="Valor A (miles)"
                                step={0.5}
                                type="number"
                                value={stepsValueA}
                            />
                            <input
                                className="rounded-lg border border-teal-400/30 bg-white/[0.03] px-2 py-1.5 text-xs text-slate-100"
                                onChange={(event) => setStepsValueB(event.target.value)}
                                placeholder="Valor B (miles)"
                                step={0.5}
                                type="number"
                                value={stepsValueB}
                            />
                        </div>
                        <div className="mt-2">
                            <WeekdayAssignmentGrid assignment={stepsAssignment} labelA={`A · ${stepsValueA || '—'}k`} labelB={`B · ${stepsValueB || '—'}k`} onToggle={toggleSteps} />
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            className="flex-1 rounded-xl bg-amber-500 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-400 disabled:opacity-50"
                            disabled={savingTargets}
                            onClick={handleSaveTargets}
                            type="button"
                        >
                            {savingTargets ? 'Guardando…' : 'Guardar cambios'}
                        </button>
                        <button
                            className="rounded-xl bg-rose-500/15 px-4 text-xs font-semibold text-rose-300 hover:bg-rose-500/25"
                            onClick={() => setConfirmingReset(true)}
                            type="button"
                        >
                            Reiniciar
                        </button>
                    </div>
                </div>
            ) : (
                <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-slate-300">
                    <div className="rounded-xl border border-white/7 bg-white/[0.03] p-3">
                        <p className="text-slate-500">Cardio (HEAT)</p>
                        <p className="mt-1">{plan.cardioTargets.map((target) => `${WEEKDAY_LABELS[target.weekday - 1].slice(0, 3)}: ${target.minutes}min`).join(' · ') || 'Sin configurar'}</p>
                    </div>
                    <div className="rounded-xl border border-white/7 bg-white/[0.03] p-3">
                        <p className="text-slate-500">Pasos (NEAT)</p>
                        <p className="mt-1">{plan.stepsTargets.map((target) => `${WEEKDAY_LABELS[target.weekday - 1].slice(0, 3)}: ${(target.stepsTarget / 1000).toFixed(1)}k`).join(' · ') || 'Sin configurar'}</p>
                    </div>
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

            <div className="mt-5 border-t border-white/7 pt-4">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Seguimiento día a día</p>
                {logs.length === 0 && <p className="mt-2 text-xs text-slate-500">Aún no hay registros.</p>}
                {logs.length > 0 && (
                    <ul className="mt-2 max-h-56 space-y-1.5 overflow-y-auto">
                        {logs.map((log) => {
                            const weekday = new Date(`${log.logDate}T00:00:00`).getDay();
                            const isoWeekday = weekday === 0 ? 7 : weekday;
                            const cardioTarget = plan.cardioTargets.find((target) => target.weekday === isoWeekday)?.minutes ?? null;
                            const stepsTarget = plan.stepsTargets.find((target) => target.weekday === isoWeekday)?.stepsTarget ?? null;
                            const cardioMet = cardioTarget != null && log.actualCardioMinutes != null && log.actualCardioMinutes >= cardioTarget;
                            const stepsMet = stepsTarget != null && log.actualSteps != null && log.actualSteps >= stepsTarget;
                            return (
                                <li className="flex items-center justify-between rounded-lg border border-white/7 bg-white/[0.03] px-3 py-1.5 text-xs" key={log.logDate}>
                                    <span className="text-slate-400">{log.logDate}</span>
                                    <span className="flex items-center gap-2 text-slate-200">
                                        <span className={cardioTarget != null ? (cardioMet ? 'text-emerald-300' : 'text-slate-300') : ''}>
                                            {log.actualCardioMinutes ?? '—'}{cardioTarget != null ? `/${cardioTarget}` : ''} min
                                        </span>
                                        <span className={stepsTarget != null ? (stepsMet ? 'text-emerald-300' : 'text-slate-300') : ''}>
                                            {log.actualSteps ?? '—'}{stepsTarget != null ? `/${stepsTarget}` : ''} pasos
                                        </span>
                                    </span>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </section>
    );
}

