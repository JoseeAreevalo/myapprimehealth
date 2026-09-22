import { useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { NutritionDayConfig } from '../hooks/useNutritionToday';

const MONTH_NAMES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];
const WEEKDAY_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

// Bold, distinct background per day-config so training-day vs rest-day diets are easy to tell apart.
const CONFIG_COLORS = [
    { bg: 'bg-amber-500', text: 'text-white', badge: 'border-amber-400/30 bg-amber-400/10' },
    { bg: 'bg-teal-500', text: 'text-white', badge: 'border-teal-400/30 bg-teal-400/10' },
    { bg: 'bg-violet-500', text: 'text-white', badge: 'border-violet-400/30 bg-violet-400/10' },
    { bg: 'bg-rose-500', text: 'text-white', badge: 'border-rose-400/30 bg-rose-400/10' },
];

// Trains/rest labels are colored consistently (amber/teal); anything else falls back to cycling colors.
function colorIndexFor(label: string, fallbackIndex: number): number {
    const normalized = label.toLowerCase();
    if (normalized.includes('entrenamiento')) return 0;
    if (normalized.includes('descanso')) return 1;
    return (fallbackIndex % 2) + 2;
}

function toIsoDate(year: number, month: number, day: number): string {
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function firstWeekdayIndex(year: number, month: number): number {
    const jsDay = new Date(year, month - 1, 1).getDay();
    return (jsDay + 6) % 7;
}

function weekdayOfIsoDate(iso: string): number {
    const [y, m, d] = iso.split('-').map(Number);
    const jsDay = new Date(y, m - 1, d).getDay();
    return jsDay === 0 ? 7 : jsDay;
}

export default function NutritionCalendar({ dayConfigs, startDate, endDate }: { dayConfigs: NutritionDayConfig[]; startDate?: string | null; endDate?: string | null }) {
    const now = new Date();
    const [year, setYear] = useState(now.getFullYear());
    const [month, setMonth] = useState(now.getMonth() + 1);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);

    const configByWeekday = new Map<number, { config: NutritionDayConfig; colorIndex: number }>();
    dayConfigs.forEach((config, index) => {
        config.weekdays.forEach((weekday) => configByWeekday.set(weekday, { config, colorIndex: colorIndexFor(config.label, index) }));
    });

    const daysInMonth = new Date(year, month, 0).getDate();
    const leadingBlanks = firstWeekdayIndex(year, month);
    const cells: (number | null)[] = [...Array(leadingBlanks).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
    const todayIso = now.toISOString().slice(0, 10);

    const goToPreviousMonth = () => {
        if (month === 1) {
            setYear((y) => y - 1);
            setMonth(12);
        } else {
            setMonth((m) => m - 1);
        }
    };
    const goToNextMonth = () => {
        if (month === 12) {
            setYear((y) => y + 1);
            setMonth(1);
        } else {
            setMonth((m) => m + 1);
        }
    };

    const selectedWithinRange = selectedDate ? (!startDate || selectedDate >= startDate) && (!endDate || selectedDate <= endDate) : false;
    const selectedEntry = selectedDate && selectedWithinRange ? configByWeekday.get(weekdayOfIsoDate(selectedDate)) : undefined;

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

            {dayConfigs.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                    {dayConfigs.map((config, index) => (
                        <span
                            className={`rounded-full border px-2 py-0.5 text-[10px] font-medium text-slate-200 ${CONFIG_COLORS[colorIndexFor(config.label, index)].badge}`}
                            key={config.id}
                        >
                            {config.label}
                        </span>
                    ))}
                </div>
            )}

            <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[10px] text-slate-500">
                {WEEKDAY_LABELS.map((label) => (
                    <span key={label}>{label}</span>
                ))}
            </div>
            <div className="mt-1 grid grid-cols-7 gap-1">
                {cells.map((day, index) => {
                    if (day === null) return <div key={`blank-${index}`} />;
                    const iso = toIsoDate(year, month, day);
                    const withinRange = (!startDate || iso >= startDate) && (!endDate || iso <= endDate);
                    const entry = withinRange ? configByWeekday.get(weekdayOfIsoDate(iso)) : undefined;
                    const isToday = iso === todayIso;
                    const isSelected = iso === selectedDate;
                    const palette = entry ? CONFIG_COLORS[entry.colorIndex] : null;
                    return (
                        <button
                            className={`aspect-square rounded-lg text-xs font-medium transition ${isSelected
                                ? 'bg-white text-ink'
                                : palette
                                    ? `${palette.bg} ${palette.text} hover:opacity-90`
                                    : 'bg-white/5 text-slate-500 hover:bg-white/8'
                                } ${isToday && !isSelected ? 'ring-2 ring-white/60' : ''}`}
                            key={iso}
                            onClick={() => setSelectedDate((current) => (current === iso ? null : iso))}
                            type="button"
                        >
                            {day}
                        </button>
                    );
                })}
            </div>

            {selectedDate && (
                <div className="mt-4 space-y-2 border-t border-white/7 pt-3">
                    <p className="text-xs font-semibold text-slate-300">{selectedDate}</p>
                    {!selectedEntry && <p className="text-xs text-slate-500">Sin dieta asignada para este día.</p>}
                    {selectedEntry && (
                        <div className="space-y-2">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{selectedEntry.config.label}</p>
                            {selectedEntry.config.meals.map((meal) => (
                                <div className="rounded-lg border border-white/7 bg-white/[0.03] p-2.5" key={meal.id}>
                                    <p className="text-xs font-medium text-slate-100">
                                        {meal.name} {meal.mealTime ? <span className="text-slate-500">· {meal.mealTime}</span> : null}
                                    </p>
                                    <p className="mt-0.5 text-[11px] text-slate-400">{Math.round(meal.calories)} kcal</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </section>
    );
}
