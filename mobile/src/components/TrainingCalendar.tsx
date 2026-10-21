import { useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTrainingHistory } from '../hooks/useTrainingHistory';
import { TrainingDay } from '../hooks/useTrainingPlan';
import ExerciseGlyph from './ExerciseGlyph';

const MONTH_NAMES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];
const WEEKDAY_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

function toIsoDate(year: number, month: number, day: number): string {
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

// Monday-first weekday index (0 = Monday .. 6 = Sunday) for the 1st of the given month.
function firstWeekdayIndex(year: number, month: number): number {
    const jsDay = new Date(year, month - 1, 1).getDay(); // 0 = Sunday
    return (jsDay + 6) % 7;
}

// Monday=1 .. Sunday=7, matching training_plan_days.weekday, for an "YYYY-MM-DD" date string.
function weekdayOfIsoDate(iso: string): number {
    const [y, m, d] = iso.split('-').map(Number);
    const jsDay = new Date(y, m - 1, d).getDay(); // 0 = Sunday
    return jsDay === 0 ? 7 : jsDay;
}

function addDaysToIso(iso: string, delta: number): string {
    const [y, m, d] = iso.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() + delta);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

// The plan's raw endDate may land on a weekday with no training scheduled (e.g. a rest day
// outside the routine); walk backwards up to a week to the last day that's actually scheduled,
// so the "revisión / check-in" marker always lands on a real training day instead of an empty one.
function lastConfiguredDateOnOrBefore(endDate: string, startDate: string | null | undefined, configuredWeekdays: Set<number>): string {
    if (configuredWeekdays.size === 0) return endDate;
    let candidate = endDate;
    for (let i = 0; i < 7; i++) {
        if (configuredWeekdays.has(weekdayOfIsoDate(candidate)) && (!startDate || candidate >= startDate)) return candidate;
        candidate = addDaysToIso(candidate, -1);
    }
    return endDate;
}

export default function TrainingCalendar({
    clientId,
    planDays = [],
    startDate,
    endDate,
    onViewWeeklyPlan,
}: {
    clientId: number;
    planDays?: TrainingDay[];
    startDate?: string | null;
    endDate?: string | null;
    onViewWeeklyPlan?: () => void;
}) {
    const { year, month, days, loading, error, goToPreviousMonth, goToNextMonth } = useTrainingHistory(clientId);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);

    const daysInMonth = new Date(year, month, 0).getDate();
    const leadingBlanks = firstWeekdayIndex(year, month);
    const cells: (number | null)[] = [...Array(leadingBlanks).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

    const historyByDate = new Map(days.map((day) => [day.date, day]));
    const planByWeekday = new Map(planDays.filter((day) => day.weekday != null).map((day) => [day.weekday as number, day]));
    const checkpointDate = endDate ? lastConfiguredDateOnOrBefore(endDate, startDate, new Set(planByWeekday.keys())) : null;
    const selectedDay = selectedDate ? historyByDate.get(selectedDate) : undefined;
    const selectedWithinRange = selectedDate ? (!startDate || selectedDate >= startDate) && (!endDate || selectedDate <= endDate) : false;
    const scheduledDay = selectedDate && selectedWithinRange ? planByWeekday.get(weekdayOfIsoDate(selectedDate)) : undefined;
    const todayIso = new Date().toISOString().slice(0, 10);

    return (
        <section className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-sm font-medium text-slate-100">
                    <CalendarDays className="text-amber-300" size={16} />
                    {MONTH_NAMES[month - 1]} {year}
                </div>
                <div className="flex gap-1">
                    <button className="rounded-lg border border-white/8 p-1 text-slate-300 hover:bg-white/8" onClick={goToPreviousMonth} type="button">
                        <ChevronLeft size={14} />
                    </button>
                    <button className="rounded-lg border border-white/8 p-1 text-slate-300 hover:bg-white/8" onClick={goToNextMonth} type="button">
                        <ChevronRight size={14} />
                    </button>
                </div>
            </div>

            {loading && <p className="mt-3 text-xs text-slate-500">Cargando…</p>}
            {error && <p className="mt-3 text-xs text-rose-300">{error}</p>}

            {!loading && endDate && (
                <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-full border border-fuchsia-400/30 bg-fuchsia-400/10 px-2 py-0.5 text-[10px] font-medium text-fuchsia-200">
                        Revisión / check-in
                    </span>
                </div>
            )}

            {!loading && (
                <>
                    <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[10px] text-slate-500">
                        {WEEKDAY_LABELS.map((label) => (
                            <span key={label}>{label}</span>
                        ))}
                    </div>
                    <div className="mt-1 grid grid-cols-7 gap-1">
                        {cells.map((day, index) => {
                            if (day === null) return <div key={`blank-${index}`} />;
                            const iso = toIsoDate(year, month, day);
                            const hasHistory = historyByDate.has(iso);
                            const withinRange = (!startDate || iso >= startDate) && (!endDate || iso <= endDate);
                            const isScheduled = withinRange && planByWeekday.has(weekdayOfIsoDate(iso));
                            const isToday = iso === todayIso;
                            const isSelected = iso === selectedDate;
                            const isCheckpoint = !!checkpointDate && iso === checkpointDate;
                            return (
                                <button
                                    className={`relative aspect-square rounded-lg text-xs transition ${isSelected ? 'bg-amber-500 text-white' : hasHistory ? 'bg-amber-500/20 text-amber-200 hover:bg-amber-500/30' : 'text-slate-400 hover:bg-white/8'
                                        } ${isToday && !isSelected ? 'ring-1 ring-amber-400/60' : ''} ${isCheckpoint && !isSelected ? 'ring-2 ring-fuchsia-400' : ''
                                        }`}
                                    key={iso}
                                    onClick={() => setSelectedDate((current) => (current === iso ? null : iso))}
                                    type="button"
                                >
                                    {day}
                                    {isScheduled && !isSelected && (
                                        <span className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-amber-400" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </>
            )}

            {selectedDate && (
                <div className="mt-4 space-y-3 border-t border-white/7 pt-3">
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-slate-300">{selectedDate}</p>
                        {onViewWeeklyPlan && (
                            <button
                                className="rounded-lg bg-white/8 px-2.5 py-1 text-[11px] font-medium text-slate-200 hover:bg-white/15"
                                onClick={onViewWeeklyPlan}
                                type="button"
                            >
                                Ver entrenamiento semanal
                            </button>
                        )}
                    </div>

                    <div className="space-y-2">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Rutina programada</p>
                        {!scheduledDay && <p className="text-xs text-slate-500">Día de descanso.</p>}
                        {scheduledDay?.exercises.map((exercise) => (
                            <div className="rounded-lg border border-amber-400/20 bg-amber-400/5 p-2.5" key={exercise.id}>
                                <p className="flex items-center gap-1.5 text-xs font-medium text-slate-100">
                                    <ExerciseGlyph name={exercise.name} size={18} /> {exercise.name}
                                </p>
                                <p className="mt-0.5 text-[11px] text-slate-400">
                                    Meta: {exercise.targetSets}x{exercise.targetReps}
                                    {exercise.targetWeightKg != null ? ` @ ${exercise.targetWeightKg}kg` : ''}
                                </p>
                            </div>
                        ))}
                    </div>

                    <div className="space-y-2">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Registrado ese día</p>
                        {!selectedDay && <p className="text-xs text-slate-500">No hay ejercicios registrados este día.</p>}
                        {selectedDay?.exercises.map((exercise) => (
                            <div className="rounded-lg border border-white/7 bg-white/[0.03] p-2.5" key={exercise.exerciseId}>
                                <p className="flex items-center gap-1.5 text-xs font-medium text-slate-100">
                                    <ExerciseGlyph name={exercise.exerciseName} size={18} /> {exercise.exerciseName} <span className="text-slate-500">· {exercise.dayLabel}</span>
                                </p>
                                <ul className="mt-1 space-y-0.5">
                                    {exercise.sets.map((set) => (
                                        <li className="text-[11px] text-slate-400" key={set.setNumber}>
                                            Serie {set.setNumber}: {set.actualReps ?? '—'} reps
                                            {set.actualWeightKg != null ? ` @ ${set.actualWeightKg}kg` : ''}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </section>
    );
}
