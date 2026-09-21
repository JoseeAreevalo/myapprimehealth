import { useState } from 'react';
import { Dumbbell, Pencil, Plus, Trash2 } from 'lucide-react';
import { useTrainingPlan, DayDraft, ExerciseDraft, TrainingExercise } from '../hooks/useTrainingPlan';
import ExerciseAutocomplete, { registerExerciseName } from './ExerciseAutocomplete';

const emptyExercise = (): ExerciseDraft => ({ name: '', targetSets: '3', targetReps: '10', targetWeightKg: '' });
const emptyDay = (index: number): DayDraft => ({ label: `Día ${index}`, exercises: [emptyExercise()] });

function CreatePlanForm({ onCreate }: { onCreate: (label: string, days: DayDraft[]) => Promise<void> }) {
  const [label, setLabel] = useState('Mi plan de entrenamiento');
  const [days, setDays] = useState<DayDraft[]>([emptyDay(1), emptyDay(2), emptyDay(3)]);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState('');

  const addDay = () => setDays((current) => [...current, emptyDay(current.length + 1)]);
  const removeDay = (index: number) => setDays((current) => current.filter((_, i) => i !== index));
  const updateDayLabel = (index: number, value: string) =>
    setDays((current) => current.map((day, i) => (i === index ? { ...day, label: value } : day)));

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
    setSubmitting(true);
    setFeedback('');
    try {
      await onCreate(label, days);
      await Promise.all(
        days.flatMap((day) => day.exercises.map((exercise) => registerExerciseName(exercise.name))),
      );
    } catch {
      setFeedback('No se pudo crear el plan.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-[11px] text-slate-500">Nombre del plan de entrenamiento</label>
        <input
          className="w-full rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
          onChange={(event) => setLabel(event.target.value)}
          placeholder="Nombre del plan"
          value={label}
        />
      </div>
      <div className="space-y-4">
        {days.map((day, dayIndex) => (
          <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4" key={dayIndex}>
            <label className="mb-1 block text-[10px] text-slate-500">Nombre del día (ej. "Día 1", "Pecho y tríceps")</label>
            <div className="flex items-center gap-2">
              <input
                className="flex-1 rounded-lg border border-white/8 bg-white/[0.03] px-2 py-1.5 text-sm text-slate-100"
                onChange={(event) => updateDayLabel(dayIndex, event.target.value)}
                value={day.label}
              />
              <button
                className="rounded-lg bg-rose-500/15 px-2 py-1.5 text-xs text-rose-300 hover:bg-rose-500/25 disabled:opacity-30"
                disabled={days.length <= 1}
                onClick={() => removeDay(dayIndex)}
                type="button"
              >
                <Trash2 size={13} />
              </button>
            </div>
            <div className="mt-3 space-y-2">
              <div className="grid grid-cols-[1.4fr_0.6fr_0.6fr_0.7fr_auto] gap-1.5 px-0.5 text-[10px] text-slate-500">
                <span>Ejercicio</span>
                <span>Series</span>
                <span>Repeticiones</span>
                <span>Peso (kg)</span>
                <span />
              </div>
              {day.exercises.map((exercise, exIndex) => (
                <div className="grid grid-cols-[1.4fr_0.6fr_0.6fr_0.7fr_auto] gap-1.5" key={exIndex}>
                  <ExerciseAutocomplete
                    className="rounded-lg border border-white/8 bg-white/[0.03] px-2 py-1 text-xs text-slate-100"
                    onChange={(newValue) => updateExercise(dayIndex, exIndex, 'name', newValue)}
                    value={exercise.name}
                  />
                  <input
                    className="rounded-lg border border-white/8 bg-white/[0.03] px-2 py-1 text-xs text-slate-100"
                    onChange={(event) => updateExercise(dayIndex, exIndex, 'targetSets', event.target.value)}
                    placeholder="Series"
                    type="number"
                    value={exercise.targetSets}
                  />
                  <input
                    className="rounded-lg border border-white/8 bg-white/[0.03] px-2 py-1 text-xs text-slate-100"
                    onChange={(event) => updateExercise(dayIndex, exIndex, 'targetReps', event.target.value)}
                    placeholder="Reps"
                    type="number"
                    value={exercise.targetReps}
                  />
                  <input
                    className="rounded-lg border border-white/8 bg-white/[0.03] px-2 py-1 text-xs text-slate-100"
                    onChange={(event) => updateExercise(dayIndex, exIndex, 'targetWeightKg', event.target.value)}
                    placeholder="kg"
                    type="number"
                    value={exercise.targetWeightKg}
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
      <button className="flex items-center gap-1.5 text-sm font-medium text-amber-300 hover:text-amber-200" onClick={addDay} type="button">
        <Plus size={15} /> Agregar día
      </button>
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
  onLog: (exerciseId: number, sets: { setNumber: number; actualReps: number | null; actualWeightKg: number | null }[]) => Promise<void>;
}) {
  const initial = Array.from({ length: exercise.targetSets }, (_, i) => {
    const existing = exercise.logs.find((log) => log.setNumber === i + 1);
    return { reps: existing?.actualReps != null ? String(existing.actualReps) : '', weight: existing?.actualWeightKg != null ? String(existing.actualWeightKg) : '' };
  });
  const [rows, setRows] = useState(initial);
  const [saving, setSaving] = useState(false);

  const updateRow = (index: number, field: 'reps' | 'weight', value: string) => {
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
        </p>
      </div>
      <div className="mt-2 space-y-1.5">
        {rows.map((row, index) => (
          <div className="grid grid-cols-[auto_1fr_1fr] items-center gap-2" key={index}>
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
          </div>
        ))}
      </div>
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

export default function TrainingPlanView({ clientId }: { clientId: number }) {
  const { plan, loading, error, createPlan, addDay, deleteDay, addExercise, deleteExercise, logSets } = useTrainingPlan(clientId);
  const [selectedDayId, setSelectedDayId] = useState<number | null>(null);
  const [editing, setEditing] = useState(false);
  const [newDayLabel, setNewDayLabel] = useState('');
  const [newExercise, setNewExercise] = useState<ExerciseDraft>(emptyExercise());

  if (loading) return <p className="text-sm text-slate-500">Cargando…</p>;
  if (error) return <p className="text-sm text-rose-300">{error}</p>;

  if (!plan) {
    return (
      <section className="rounded-3xl border border-white/8 bg-panel/70 p-6 shadow-panel">
        <div className="flex items-center justify-between">
          <div>
            <p className="eyebrow">Entrenamiento</p>
            <h2 className="mt-2 font-display text-xl font-semibold tracking-[-0.03em] text-slate-50">Configura tu semana</h2>
          </div>
          <Dumbbell className="text-amber-300" size={20} />
        </div>
        <p className="mt-3 text-sm text-slate-400">
          Define cuántos días entrenas por semana y qué ejercicios corresponden a cada día.
        </p>
        <div className="mt-5">
          <CreatePlanForm onCreate={createPlan} />
        </div>
      </section>
    );
  }

  const activeDay = plan.days.find((day) => day.id === selectedDayId) ?? plan.days[0] ?? null;

  const handleAddExercise = async () => {
    if (!activeDay || !newExercise.name || !newExercise.targetSets || !newExercise.targetReps) return;
    await addExercise(activeDay.id, {
      name: newExercise.name,
      targetSets: Number(newExercise.targetSets),
      targetReps: Number(newExercise.targetReps),
      targetWeightKg: newExercise.targetWeightKg ? Number(newExercise.targetWeightKg) : null,
    });
    await registerExerciseName(newExercise.name);
    setNewExercise(emptyExercise());
  };

  const handleAddDay = async () => {
    if (!newDayLabel.trim()) return;
    await addDay(newDayLabel.trim());
    setNewDayLabel('');
  };

  return (
    <section className="rounded-3xl border border-white/8 bg-panel/70 p-6 shadow-panel">
      <div className="flex items-center justify-between">
        <div>
          <p className="eyebrow">Entrenamiento</p>
          <h2 className="mt-2 font-display text-xl font-semibold tracking-[-0.03em] text-slate-50">{plan.label}</h2>
        </div>
        <button
          className="flex items-center gap-1.5 text-xs font-medium text-amber-300 hover:text-amber-200"
          onClick={() => setEditing((current) => !current)}
          type="button"
        >
          <Pencil size={13} /> {editing ? 'Listo' : 'Editar'}
        </button>
      </div>

      <p className="mt-4 text-[11px] font-semibold uppercase tracking-wide text-slate-500">D\u00edas de la semana configurados</p>
      <div className="mt-1.5 flex flex-wrap gap-2">
        {plan.days.map((day) => (
          <button
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
              (activeDay?.id ?? plan.days[0]?.id) === day.id ? 'bg-amber-500 text-white' : 'bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
            key={day.id}
            onClick={() => setSelectedDayId(day.id)}
            type="button"
          >
            {day.label}
          </button>
        ))}
      </div>

      {editing && (
        <div className="mt-3 flex gap-2">
          <input
            className="flex-1 rounded-lg border border-white/8 bg-white/[0.03] px-2 py-1.5 text-xs text-slate-100"
            onChange={(event) => setNewDayLabel(event.target.value)}
            placeholder="Nombre del nuevo día"
            value={newDayLabel}
          />
          <button className="rounded-lg bg-white/8 px-3 text-xs text-slate-100 hover:bg-white/15" onClick={handleAddDay} type="button">
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
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Agregar ejercicio a este d\u00eda</p>
              <div className="grid grid-cols-[1.4fr_0.6fr_0.6fr_0.7fr_auto] gap-1.5 px-0.5 text-[10px] text-slate-500">
                <span>Ejercicio</span>
                <span>Series</span>
                <span>Repeticiones</span>
                <span>Peso (kg)</span>
                <span />
              </div>
              <div className="mt-1 grid grid-cols-[1.4fr_0.6fr_0.6fr_0.7fr_auto] gap-1.5">
                <ExerciseAutocomplete
                  className="rounded-lg border border-white/8 bg-white/[0.03] px-2 py-1 text-xs text-slate-100"
                  onChange={(newValue) => setNewExercise((current) => ({ ...current, name: newValue }))}
                  value={newExercise.name}
                />
                <input
                  className="rounded-lg border border-white/8 bg-white/[0.03] px-2 py-1 text-xs text-slate-100"
                  onChange={(event) => setNewExercise((current) => ({ ...current, targetSets: event.target.value }))}
                  placeholder="Series"
                  type="number"
                  value={newExercise.targetSets}
                />
                <input
                  className="rounded-lg border border-white/8 bg-white/[0.03] px-2 py-1 text-xs text-slate-100"
                  onChange={(event) => setNewExercise((current) => ({ ...current, targetReps: event.target.value }))}
                  placeholder="Reps"
                  type="number"
                  value={newExercise.targetReps}
                />
                <input
                  className="rounded-lg border border-white/8 bg-white/[0.03] px-2 py-1 text-xs text-slate-100"
                  onChange={(event) => setNewExercise((current) => ({ ...current, targetWeightKg: event.target.value }))}
                  placeholder="kg"
                  type="number"
                  value={newExercise.targetWeightKg}
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
