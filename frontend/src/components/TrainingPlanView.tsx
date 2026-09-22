import { useState } from 'react';
import { CalendarDays, Dumbbell, Pencil, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTrainingPlan, DayDraft, ExerciseDraft, TrainingDay, TrainingExercise } from '../hooks/useTrainingPlan';
import ExerciseAutocomplete, { registerExerciseName } from './ExerciseAutocomplete';
import TrainingCalendar from './TrainingCalendar';
import { dayVolumeTotals, loggedVolume } from '../utils/trainingMath';

const emptyExercise = (): ExerciseDraft => ({ name: '', targetSets: '3', targetReps: '10', targetWeightKg: '', targetRir: '2' });
const emptyDay = (weekday: number | null): DayDraft => ({ label: '', weekday, exercises: [emptyExercise()] });
const WEEKDAY_LABELS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

function CreatePlanForm({ onCreate }: { onCreate: (label: string, days: DayDraft[], durationWeeks?: number) => Promise<void> }) {
    const { token } = useAuth();
    const [label, setLabel] = useState('Mi plan de entrenamiento');
    const [durationWeeks, setDurationWeeks] = useState('4');
    const [days, setDays] = useState<DayDraft[]>([emptyDay(1), emptyDay(3), emptyDay(5)]);
    const [submitting, setSubmitting] = useState(false);
    const [feedback, setFeedback] = useState('');

    const addDay = () =>
        setDays((current) => {
            if (current.length >= 7) return current;
            const used = new Set(current.map((day) => day.weekday));
            const nextWeekday = [1, 2, 3, 4, 5, 6, 7].find((weekday) => !used.has(weekday)) ?? null;
            return [...current, emptyDay(nextWeekday)];
        });
    const removeDay = (index: number) => setDays((current) => current.filter((_, i) => i !== index));
    const updateDayLabel = (index: number, value: string) =>
        setDays((current) => current.map((day, i) => (i === index ? { ...day, label: value } : day)));
    const updateDayWeekday = (index: number, weekday: number | null) =>
        setDays((current) => current.map((day, i) => (i === index ? { ...day, weekday } : day)));

    const addExercise = (dayIndex: number) =>
        setDays((current) => current.map((day, i) => (i === dayIndex ? { ...day, exercises: [...day.exercises, emptyExercise()] } : day)));
    const removeExercise = (dayIndex: number, exIndex: number) =>
        setDays((current) =>
            current.map((day, i) => (i === dayIndex ? { ...day, exercises: day.exercises.filter((_, j) => j !== exIndex) } : day)),
        );
    const updateExercise = (dayIndex: number, exIndex: number, field: keyof ExerciseDraft, value: string) =>
        setDays((current) =>
            current.map((day, i) =>
                i === dayIndex
                    ? { ...day, exercises: day.exercises.map((ex, j) => (j === exIndex ? { ...ex, [field]: value } : ex)) }
                    : day,
            ),
        );

    const handleSubmit = async () => {
        if (days.some((day) => !day.label.trim())) {
            setFeedback('Indica qué músculo se trabajará en cada día antes de guardar.');
            return;
        }
        setSubmitting(true);
        setFeedback('');
        try {
            await onCreate(label, days, durationWeeks ? Number(durationWeeks) : undefined);
            await Promise.all(
                days.flatMap((day) => day.exercises.map((exercise) => registerExerciseName(exercise.name, token))),
            );
        } catch {
            setFeedback('No se pudo crear el plan.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="mb-1 block text-[11px] text-slate-500">Nombre del plan de entrenamiento</label>
                    <input
                        className="w-full rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
                        onChange={(event) => setLabel(event.target.value)}
                        placeholder="Nombre del plan"
                        value={label}
                    />
                </div>
                <div>
                    <label className="mb-1 block text-[11px] text-slate-500">Duración del plan (semanas)</label>
                    <input
                        className="w-full rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
                        max={52}
                        min={1}
                        onChange={(event) => setDurationWeeks(event.target.value)}
                        placeholder="4"
                        type="number"
                        value={durationWeeks}
                    />
                </div>
            </div>
            <div className="space-y-4">
                {days.map((day, dayIndex) => (
                    <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4" key={dayIndex}>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="mb-1 block text-[10px] text-slate-500">Día de la semana</label>
                                <select
                                    className="w-full rounded-lg border border-white/8 bg-slate-900 px-2 py-1.5 text-sm text-slate-100"
                                    onChange={(event) => updateDayWeekday(dayIndex, event.target.value ? Number(event.target.value) : null)}
                                    value={day.weekday ?? ''}
                                >
                                    <option className="bg-slate-900 text-slate-100" value="">Sin asignar</option>
                                    {WEEKDAY_LABELS.map((weekdayLabel, weekdayIndex) => {
                                        const weekdayValue = weekdayIndex + 1;
                                        const usedElsewhere = days.some((other, otherIndex) => otherIndex !== dayIndex && other.weekday === weekdayValue);
                                        if (usedElsewhere) return null;
                                        return (
                                            <option className="bg-slate-900 text-slate-100" key={weekdayValue} value={weekdayValue}>
                                                {weekdayLabel}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>
                            <div className="flex items-end gap-2">
                                <div className="flex-1">
                                    <label className="mb-1 block text-[10px] text-slate-500">Músculo a trabajar (obligatorio)</label>
                                    <input
                                        className="w-full rounded-lg border border-white/8 bg-white/[0.03] px-2 py-1.5 text-sm text-slate-100"
                                        onChange={(event) => updateDayLabel(dayIndex, event.target.value)}
                                        placeholder="Ej: Pecho y tríceps"
                                        value={day.label}
                                    />
                                </div>
                                <button
                                    className="rounded-lg bg-rose-500/15 px-2 py-1.5 text-xs text-rose-300 hover:bg-rose-500/25 disabled:opacity-30"
                                    disabled={days.length <= 1}
                                    onClick={() => removeDay(dayIndex)}
                                    type="button"
                                >
                                    <Trash2 size={13} />
                                </button>
                            </div>
                        </div>
                        <div className="mt-3 space-y-2">
                            <div className="grid grid-cols-[1.2fr_0.5fr_0.5fr_0.6fr_0.5fr_auto] gap-1.5 px-0.5 text-[10px] text-slate-500">
                                <span>Ejercicio</span>
                                <span>Series</span>
                                <span>Repeticiones</span>
                                <span>Peso (kg)</span>
                                <span>RIR</span>
                                <span />
                            </div>
                            {day.exercises.map((exercise, exIndex) => (
                                <div className="grid grid-cols-[1.2fr_0.5fr_0.5fr_0.6fr_0.5fr_auto] gap-1.5" key={exIndex}>
                                    <ExerciseAutocomplete
                                        className="w-full min-w-0 rounded-lg border border-white/8 bg-white/[0.03] px-2 py-1 text-xs text-slate-100"
                                        onChange={(newValue) => updateExercise(dayIndex, exIndex, 'name', newValue)}
                                        value={exercise.name}
                                    />
                                    <input
                                        className="w-full min-w-0 rounded-lg border border-white/8 bg-white/[0.03] px-2 py-1 text-xs text-slate-100"
                                        onChange={(event) => updateExercise(dayIndex, exIndex, 'targetSets', event.target.value)}
                                        placeholder="Series"
                                        type="number"
                                        value={exercise.targetSets}
                                    />
                                    <input
                                        className="w-full min-w-0 rounded-lg border border-white/8 bg-white/[0.03] px-2 py-1 text-xs text-slate-100"
                                        onChange={(event) => updateExercise(dayIndex, exIndex, 'targetReps', event.target.value)}
                                        placeholder="Reps"
                                        type="number"
                                        value={exercise.targetReps}
                                    />
                                    <input
                                        className="w-full min-w-0 rounded-lg border border-white/8 bg-white/[0.03] px-2 py-1 text-xs text-slate-100"
                                        onChange={(event) => updateExercise(dayIndex, exIndex, 'targetWeightKg', event.target.value)}
                                        placeholder="kg"
                                        type="number"
                                        value={exercise.targetWeightKg}
                                    />
                                    <input
                                        className="w-full min-w-0 rounded-lg border border-white/8 bg-white/[0.03] px-2 py-1 text-xs text-slate-100"
                                        onChange={(event) => updateExercise(dayIndex, exIndex, 'targetRir', event.target.value)}
                                        placeholder="RIR"
                                        type="number"
                                        value={exercise.targetRir}
                                    />
                                    <button
                                        className="rounded-lg bg-rose-500/15 px-2 text-xs text-rose-300 hover:bg-rose-500/25 disabled:opacity-30"
                                        disabled={day.exercises.length <= 1}
                                        onClick={() => removeExercise(dayIndex, exIndex)}
                                        type="button"
                                    >
                                        <Trash2 size={13} />
                                    </button>
                                </div>
                            ))}
                            {(() => {
                                const totals = dayVolumeTotals(day.exercises);
                                return (
                                    <p className="text-[11px] text-slate-500">
                                        Total del día: <span className="font-semibold text-slate-300">{totals.totalSets} series</span> ·{' '}
                                        <span className="font-semibold text-slate-300">{totals.totalReps} reps</span> ·{' '}
                                        <span className="font-semibold text-slate-300">{Math.round(totals.totalVolumeKg)} kg</span> de volumen estimado
                                    </p>
                                );
                            })()}
                            <button
                                className="flex items-center gap-1.5 text-xs font-medium text-amber-300 hover:text-amber-200"
                                onClick={() => addExercise(dayIndex)}
                                type="button"
                            >
                                <Plus size={13} /> Agregar ejercicio
                            </button>
                        </div>
                    </div>
                ))}
            </div>
            <button
                className="flex items-center gap-1.5 text-sm font-medium text-amber-300 hover:text-amber-200 disabled:opacity-30"
                disabled={days.length >= 7}
                onClick={addDay}
                type="button"
            >
                <Plus size={15} /> Agregar día
            </button>
            {days.length >= 7 && <p className="text-xs text-slate-500">Una semana tiene máximo 7 días.</p>}
            {feedback && <p className="text-xs text-rose-300">{feedback}</p>}
            <button
                className="w-full rounded-xl bg-amber-500 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-400 disabled:opacity-50"
                disabled={submitting}
                onClick={handleSubmit}
                type="button"
            >
                {submitting ? 'Creando…' : 'Guardar plan de entrenamiento'}
            </button>
        </div>
    );
}

function ExerciseLogRow({
    exercise,
    onLog,
}: {
    exercise: TrainingExercise;
    onLog: (exerciseId: number, sets: { setNumber: number; actualReps: number | null; actualWeightKg: number | null; actualRir: number | null }[]) => Promise<void>;
}) {
    const initial = Array.from({ length: exercise.targetSets }, (_, i) => {
        const existing = exercise.logs.find((log) => log.setNumber === i + 1);
        return {
            reps: existing?.actualReps != null ? String(existing.actualReps) : '',
            weight: existing?.actualWeightKg != null ? String(existing.actualWeightKg) : '',
            rir: existing?.actualRir != null ? String(existing.actualRir) : '',
        };
    });
    const [rows, setRows] = useState(initial);
    const [saving, setSaving] = useState(false);

    const updateRow = (index: number, field: 'reps' | 'weight' | 'rir', value: string) => {
        setRows((current) => current.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await onLog(
                exercise.id,
                rows.map((row, index) => ({
                    setNumber: index + 1,
                    actualReps: row.reps ? Number(row.reps) : null,
                    actualWeightKg: row.weight ? Number(row.weight) : null,
                    actualRir: row.rir ? Number(row.rir) : null,
                })),
            );
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="rounded-xl border border-white/7 bg-white/[0.03] p-3">
            <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-100">{exercise.name}</p>
                <p className="text-xs text-slate-500">
                    Meta: {exercise.targetSets}x{exercise.targetReps}{exercise.targetWeightKg != null ? ` @ ${exercise.targetWeightKg}kg` : ''}
                    {exercise.targetRir != null ? ` · RIR ${exercise.targetRir}` : ''}
                </p>
            </div>
            <div className="mt-2 space-y-1.5">
                <div className="grid grid-cols-[auto_1fr_1fr_1fr] gap-2 px-0.5 text-[10px] text-slate-500">
                    <span className="w-12" />
                    <span>Reps</span>
                    <span>Peso (kg)</span>
                    <span>RIR</span>
                </div>
                {rows.map((row, index) => (
                    <div className="grid grid-cols-[auto_1fr_1fr_1fr] items-center gap-2" key={index}>
                        <span className="w-12 text-xs text-slate-500">Serie {index + 1}</span>
                        <input
                            className="rounded-lg border border-white/8 bg-white/[0.03] px-2 py-1 text-xs text-slate-100"
                            onChange={(event) => updateRow(index, 'reps', event.target.value)}
                            placeholder="Reps"
                            type="number"
                            value={row.reps}
                        />
                        <input
                            className="rounded-lg border border-white/8 bg-white/[0.03] px-2 py-1 text-xs text-slate-100"
                            onChange={(event) => updateRow(index, 'weight', event.target.value)}
                            placeholder="kg"
                            type="number"
                            value={row.weight}
                        />
                        <input
                            className="rounded-lg border border-white/8 bg-white/[0.03] px-2 py-1 text-xs text-slate-100"
                            onChange={(event) => updateRow(index, 'rir', event.target.value)}
                            placeholder="RIR"
                            type="number"
                            value={row.rir}
                        />
                    </div>
                ))}
            </div>
            <p className="mt-2 text-[11px] text-slate-500">
                Volumen registrado hoy: <span className="font-semibold text-slate-300">{Math.round(loggedVolume(rows))} kg</span>
            </p>
            <button
                className="mt-2 w-full rounded-lg bg-amber-500/15 py-1.5 text-xs font-semibold text-amber-200 hover:bg-amber-500/25 disabled:opacity-50"
                disabled={saving}
                onClick={handleSave}
                type="button"
            >
                {saving ? 'Guardando…' : 'Guardar serie de hoy'}
            </button>
        </div>
    );
}

// Lets a coach/client reassign an existing day to a different weekday or update its note.
function DayWeekdayEditor({
    day,
    usedWeekdays,
    onSave,
}: {
    day: TrainingDay;
    usedWeekdays: Set<number | null>;
    onSave: (updates: { label?: string; weekday?: number | null }) => Promise<void>;
}) {
    const [weekday, setWeekday] = useState<number | null>(day.weekday);
    const [note, setNote] = useState(day.label);
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (!note.trim()) return;
        setSaving(true);
        try {
            await onSave({ label: note.trim(), weekday });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="mt-3 flex items-end gap-2 rounded-xl border border-white/7 bg-white/[0.02] p-3">
            <div>
                <label className="mb-1 block text-[10px] text-slate-500">Día de la semana de este día</label>
                <select
                    className="rounded-lg border border-white/8 bg-slate-900 px-2 py-1.5 text-xs text-slate-100"
                    onChange={(event) => setWeekday(event.target.value ? Number(event.target.value) : null)}
                    value={weekday ?? ''}
                >
                    <option className="bg-slate-900 text-slate-100" value="">Sin asignar</option>
                    {WEEKDAY_LABELS.map((weekdayLabel, weekdayIndex) => {
                        const weekdayValue = weekdayIndex + 1;
                        const usedElsewhere = weekdayValue !== day.weekday && usedWeekdays.has(weekdayValue);
                        if (usedElsewhere) return null;
                        return (
                            <option className="bg-slate-900 text-slate-100" key={weekdayValue} value={weekdayValue}>
                                {weekdayLabel}
                            </option>
                        );
                    })}
                </select>
            </div>
            <div className="flex-1">
                <label className="mb-1 block text-[10px] text-slate-500">Músculo a trabajar (obligatorio)</label>
                <input
                    className="w-full rounded-lg border border-white/8 bg-white/[0.03] px-2 py-1.5 text-xs text-slate-100"
                    onChange={(event) => setNote(event.target.value)}
                    placeholder="Ej: Pecho y tríceps"
                    value={note}
                />
            </div>
            <button
                className="rounded-lg bg-white/8 px-3 py-1.5 text-xs text-slate-100 hover:bg-white/15 disabled:opacity-50"
                disabled={saving}
                onClick={handleSave}
                type="button"
            >
                {saving ? 'Guardando…' : 'Guardar día'}
            </button>
        </div>
    );
}

export default function TrainingPlanView({ clientId, canManage = true }: { clientId: number; canManage?: boolean }) {
    const { token } = useAuth();
    const { plan, loading, error, createPlan, updatePlan, deletePlan, addDay, updateDay, deleteDay, addExercise, deleteExercise, logSets } = useTrainingPlan(clientId);
    const [selectedDayId, setSelectedDayId] = useState<number | null>(null);
    const [editing, setEditing] = useState(false);
    const [showCalendar, setShowCalendar] = useState(false);
    const [newDayLabel, setNewDayLabel] = useState('');
    const [newDayWeekday, setNewDayWeekday] = useState<number | null>(null);
    const [durationDraft, setDurationDraft] = useState('');
    const [newExercise, setNewExercise] = useState<ExerciseDraft>(emptyExercise());
    const [confirmingReset, setConfirmingReset] = useState(false);
    const [resetting, setResetting] = useState(false);

    if (loading) return <p className="text-sm text-slate-500">Cargando…</p>;
    if (error) return <p className="text-sm text-rose-300">{error}</p>;

    if (!plan) {
        return (
            <section className="rounded-3xl border border-white/8 bg-panel/70 p-6 shadow-panel">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="eyebrow">Entrenamiento</p>
                        <h2 className="mt-2 font-display text-xl font-semibold tracking-[-0.03em] text-slate-50">{canManage ? 'Configura tu semana' : 'Sin plan asignado'}</h2>
                    </div>
                    <Dumbbell className="text-amber-300" size={20} />
                </div>
                <p className="mt-3 text-sm text-slate-400">
                    {canManage
                        ? 'Define cuántos días entrenas por semana y qué ejercicios corresponden a cada día.'
                        : 'Tu coach aún no te ha asignado un plan de entrenamiento.'}
                </p>
                <button
                    className="mt-3 flex items-center gap-1.5 text-xs font-medium text-slate-300 hover:text-slate-100"
                    onClick={() => setShowCalendar((current) => !current)}
                    type="button"
                >
                    <CalendarDays size={13} /> {showCalendar ? 'Ocultar calendario' : 'Ver calendario de entrenamientos'}
                </button>
                {showCalendar && (
                    <div className="mt-3">
                        <TrainingCalendar clientId={clientId} />
                    </div>
                )}
                {canManage && (
                    <div className="mt-5">
                        <CreatePlanForm onCreate={createPlan} />
                    </div>
                )}
            </section>
        );
    }

    const activeDay = plan.days.find((day) => day.id === selectedDayId) ?? plan.days[0] ?? null;

    const handleAddExercise = async () => {
        if (!activeDay || !newExercise.name || !newExercise.targetSets || !newExercise.targetReps || !newExercise.targetRir) return;
        await addExercise(activeDay.id, {
            name: newExercise.name,
            targetSets: Number(newExercise.targetSets),
            targetReps: Number(newExercise.targetReps),
            targetWeightKg: newExercise.targetWeightKg ? Number(newExercise.targetWeightKg) : null,
            targetRir: Number(newExercise.targetRir),
        });
        await registerExerciseName(newExercise.name, token);
        setNewExercise(emptyExercise());
    };

    const handleAddDay = async () => {
        if (!newDayLabel.trim() || plan.days.length >= 7) return;
        await addDay(newDayLabel.trim(), newDayWeekday);
        setNewDayLabel('');
        setNewDayWeekday(null);
    };

    const handleSaveDuration = async () => {
        const weeks = Number(durationDraft);
        if (!Number.isFinite(weeks) || weeks < 1) return;
        await updatePlan({ durationWeeks: weeks });
    };

    const handleResetPlan = async () => {
        setResetting(true);
        try {
            await deletePlan();
        } finally {
            setResetting(false);
            setConfirmingReset(false);
        }
    };

    const usedWeekdays = new Set(plan.days.map((day) => day.weekday));
    const dayDisplayLabel = (day: { weekday: number | null; label: string }) => {
        if (day.weekday == null) return day.label;
        const weekdayName = WEEKDAY_LABELS[day.weekday - 1];
        return day.label && day.label !== weekdayName ? `${weekdayName} · ${day.label}` : weekdayName;
    };

    return (
        <section className="rounded-3xl border border-white/8 bg-panel/70 p-6 shadow-panel">
            <div className="flex items-center justify-between">
                <div>
                    <p className="eyebrow">Entrenamiento</p>
                    <h2 className="mt-2 font-display text-xl font-semibold tracking-[-0.03em] text-slate-50">{plan.label}</h2>
                    <p className="mt-1 text-xs text-slate-500">Duración: {plan.durationWeeks} semana{plan.durationWeeks === 1 ? '' : 's'}</p>
                </div>
                {canManage && (
                    <button
                        className="flex items-center gap-1.5 text-xs font-medium text-amber-300 hover:text-amber-200"
                        onClick={() => {
                            setEditing((current) => !current);
                            setDurationDraft(String(plan.durationWeeks));
                        }}
                        type="button"
                    >
                        <Pencil size={13} /> {editing ? 'Listo' : 'Editar'}
                    </button>
                )}
            </div>

            {editing && (
                <div className="mt-3 flex items-end gap-2">
                    <div>
                        <label className="mb-1 block text-[10px] text-slate-500">Duración del plan (semanas)</label>
                        <input
                            className="w-24 rounded-lg border border-white/8 bg-white/[0.03] px-2 py-1.5 text-xs text-slate-100"
                            min={1}
                            max={52}
                            onChange={(event) => setDurationDraft(event.target.value)}
                            type="number"
                            value={durationDraft}
                        />
                    </div>
                    <button className="rounded-lg bg-white/8 px-3 py-1.5 text-xs text-slate-100 hover:bg-white/15" onClick={handleSaveDuration} type="button">
                        Guardar duración
                    </button>
                    <button
                        className="ml-auto rounded-lg bg-rose-500/15 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/25"
                        onClick={() => setConfirmingReset(true)}
                        type="button"
                    >
                        Reiniciar configuración
                    </button>
                </div>
            )}

            {confirmingReset && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 px-4" onClick={() => setConfirmingReset(false)}>
                    <div
                        className="w-full max-w-sm rounded-2xl border border-white/10 bg-panel p-6 shadow-2xl"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <h3 className="font-display text-lg font-semibold text-slate-50">¿Reiniciar configuración?</h3>
                        <p className="mt-2 text-sm text-slate-400">
                            Esto borrará por completo tu plan de entrenamiento actual: todos los días, ejercicios y metas configuradas. Esta acción no se puede deshacer.
                        </p>
                        <div className="mt-5 flex justify-end gap-2">
                            <button
                                className="rounded-lg bg-white/8 px-4 py-2 text-sm text-slate-100 hover:bg-white/15"
                                disabled={resetting}
                                onClick={() => setConfirmingReset(false)}
                                type="button"
                            >
                                Cancelar
                            </button>
                            <button
                                className="rounded-lg bg-rose-500 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-400 disabled:opacity-50"
                                disabled={resetting}
                                onClick={handleResetPlan}
                                type="button"
                            >
                                {resetting ? 'Reiniciando…' : 'Sí, reiniciar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <button
                className="mt-3 flex items-center gap-1.5 text-xs font-medium text-slate-300 hover:text-slate-100"
                onClick={() => setShowCalendar((current) => !current)}
                type="button"
            >
                <CalendarDays size={13} /> {showCalendar ? 'Ocultar calendario' : 'Ver calendario de entrenamientos'}
            </button>
            {showCalendar && (
                <div className="mt-3">
                    <TrainingCalendar clientId={clientId} onViewWeeklyPlan={() => setShowCalendar(false)} planDays={plan.days} />
                </div>
            )}

            <p className="mt-4 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Días de la semana configurados</p>
            <div className="mt-1.5 flex flex-wrap gap-2">
                {plan.days.map((day) => (
                    <button
                        className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${(activeDay?.id ?? plan.days[0]?.id) === day.id ? 'bg-amber-500 text-white' : 'bg-white/5 text-slate-300 hover:bg-white/10'
                            }`}
                        key={day.id}
                        onClick={() => setSelectedDayId(day.id)}
                        type="button"
                    >
                        {dayDisplayLabel(day)}
                    </button>
                ))}
            </div>

            {editing && (
                <div className="mt-3 flex gap-2">
                    <select
                        className="rounded-lg border border-white/8 bg-slate-900 px-2 py-1.5 text-xs text-slate-100"
                        onChange={(event) => setNewDayWeekday(event.target.value ? Number(event.target.value) : null)}
                        value={newDayWeekday ?? ''}
                    >
                        <option className="bg-slate-900 text-slate-100" value="">Día de la semana</option>
                        {WEEKDAY_LABELS.map((weekdayLabel, weekdayIndex) => {
                            const weekdayValue = weekdayIndex + 1;
                            if (usedWeekdays.has(weekdayValue)) return null;
                            return (
                                <option className="bg-slate-900 text-slate-100" key={weekdayValue} value={weekdayValue}>
                                    {weekdayLabel}
                                </option>
                            );
                        })}
                    </select>
                    <input
                        className="flex-1 rounded-lg border border-white/8 bg-white/[0.03] px-2 py-1.5 text-xs text-slate-100"
                        onChange={(event) => setNewDayLabel(event.target.value)}
                        placeholder="Músculo a trabajar (obligatorio)"
                        value={newDayLabel}
                    />
                    <button
                        className="rounded-lg bg-white/8 px-3 text-xs text-slate-100 hover:bg-white/15 disabled:opacity-30"
                        disabled={plan.days.length >= 7 || !newDayLabel.trim()}
                        onClick={handleAddDay}
                        type="button"
                    >
                        Agregar día
                    </button>
                    {activeDay && (
                        <button
                            className="rounded-lg bg-rose-500/15 px-3 text-xs text-rose-300 hover:bg-rose-500/25"
                            onClick={() => deleteDay(activeDay.id)}
                            type="button"
                        >
                            Borrar día
                        </button>
                    )}
                </div>
            )}

            {editing && activeDay && (
                <DayWeekdayEditor
                    day={activeDay}
                    key={activeDay.id}
                    onSave={(updates) => updateDay(activeDay.id, updates)}
                    usedWeekdays={usedWeekdays}
                />
            )}

            {activeDay && (
                <div className="mt-5 space-y-3">
                    {activeDay.exercises.map((exercise) =>
                        editing ? (
                            <div className="flex items-center justify-between rounded-xl border border-white/7 bg-white/[0.03] px-3 py-2 text-xs text-slate-200" key={exercise.id}>
                                <span>
                                    {exercise.name} · {exercise.targetSets}x{exercise.targetReps}
                                    {exercise.targetWeightKg != null ? ` @ ${exercise.targetWeightKg}kg` : ''}
                                </span>
                                <button className="text-rose-300 hover:text-rose-200" onClick={() => deleteExercise(exercise.id)} type="button">
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ) : (
                            <ExerciseLogRow exercise={exercise} key={exercise.id} onLog={logSets} />
                        ),
                    )}

                    {editing && (
                        <div className="border-t border-white/7 pt-3">
                            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Agregar ejercicio a este día</p>
                            <div className="grid grid-cols-[1.2fr_0.5fr_0.5fr_0.6fr_0.5fr_auto] gap-1.5 px-0.5 text-[10px] text-slate-500">
                                <span>Ejercicio</span>
                                <span>Series</span>
                                <span>Repeticiones</span>
                                <span>Peso (kg)</span>
                                <span>RIR</span>
                                <span />
                            </div>
                            <div className="mt-1 grid grid-cols-[1.2fr_0.5fr_0.5fr_0.6fr_0.5fr_auto] gap-1.5">
                                <ExerciseAutocomplete
                                    className="w-full min-w-0 rounded-lg border border-white/8 bg-white/[0.03] px-2 py-1 text-xs text-slate-100"
                                    onChange={(newValue) => setNewExercise((current) => ({ ...current, name: newValue }))}
                                    value={newExercise.name}
                                />
                                <input
                                    className="w-full min-w-0 rounded-lg border border-white/8 bg-white/[0.03] px-2 py-1 text-xs text-slate-100"
                                    onChange={(event) => setNewExercise((current) => ({ ...current, targetSets: event.target.value }))}
                                    placeholder="Series"
                                    type="number"
                                    value={newExercise.targetSets}
                                />
                                <input
                                    className="w-full min-w-0 rounded-lg border border-white/8 bg-white/[0.03] px-2 py-1 text-xs text-slate-100"
                                    onChange={(event) => setNewExercise((current) => ({ ...current, targetReps: event.target.value }))}
                                    placeholder="Reps"
                                    type="number"
                                    value={newExercise.targetReps}
                                />
                                <input
                                    className="w-full min-w-0 rounded-lg border border-white/8 bg-white/[0.03] px-2 py-1 text-xs text-slate-100"
                                    onChange={(event) => setNewExercise((current) => ({ ...current, targetWeightKg: event.target.value }))}
                                    placeholder="kg"
                                    type="number"
                                    value={newExercise.targetWeightKg}
                                />
                                <input
                                    className="w-full min-w-0 rounded-lg border border-white/8 bg-white/[0.03] px-2 py-1 text-xs text-slate-100"
                                    onChange={(event) => setNewExercise((current) => ({ ...current, targetRir: event.target.value }))}
                                    placeholder="RIR"
                                    type="number"
                                    value={newExercise.targetRir}
                                />
                                <button className="rounded-lg bg-amber-500 px-2 text-xs font-semibold text-white hover:bg-amber-400" onClick={handleAddExercise} type="button">
                                    <Plus size={13} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </section>
    );
}
