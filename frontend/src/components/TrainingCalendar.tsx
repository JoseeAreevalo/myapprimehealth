import { useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTrainingHistory } from '../hooks/useTrainingHistory';

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

export default function TrainingCalendar({ clientId }: { clientId: number }) {
    const { year, month, days, loading, error, goToPreviousMonth, goToNextMonth } = useTrainingHistory(clientId);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);

    const daysInMonth = new Date(year, month, 0).getDate();
    const leadingBlanks = firstWeekdayIndex(year, month);
    const cells: (number | null)[] = [...Array(leadingBlanks).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

    const historyByDate = new Map(days.map((day) => [day.date, day]));
    const selectedDay = selectedDate ? historyByDate.get(selectedDate) : undefined;
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
                            const isToday = iso === todayIso;
                            const isSelected = iso === selectedDate;
                            return (
                                <button
                                    className={`aspect-square rounded-lg text-xs transition ${isSelected ? 'bg-amber-500 text-white' : hasHistory ? 'bg-amber-500/20 text-amber-200 hover:bg-amber-500/30' : 'text-slate-400 hover:bg-white/8'
                                        } ${isToday && !isSelected ? 'ring-1 ring-amber-400/60' : ''}`}
                                    key={iso}
                                    onClick={() => setSelectedDate((current) => (current === iso ? null : iso))}
                                    type="button"
                                >
                                    {day}
                                </button>
                            );
                        })}
                    </div>
                </>
            )}

            {selectedDate && (
                <div className="mt-4 space-y-2 border-t border-white/7 pt-3">
                    <p className="text-xs font-semibold text-slate-300">{selectedDate}</p>
                    {!selectedDay && <p className="text-xs text-slate-500">No hay ejercicios registrados este día.</p>}
                    {selectedDay?.exercises.map((exercise) => (
                        <div className="rounded-lg border border-white/7 bg-white/[0.03] p-2.5" key={exercise.exerciseId}>
                            <p className="text-xs font-medium text-slate-100">
                                {exercise.exerciseName} <span className="text-slate-500">· {exercise.dayLabel}</span>
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
            )}
        </section>
    );
}
