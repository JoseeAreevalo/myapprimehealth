// Best-effort visual identifier per exercise, matched locally by keyword on the exercise name.
// This avoids hotlinking arbitrary third-party images (reliability/security), while still giving
// users a quick visual cue of what kind of exercise it is, automatically, with no upload needed.
interface ExerciseVisual {
    emoji: string;
    className: string;
}

const DEFAULT_VISUAL: ExerciseVisual = { emoji: '🏋️', className: 'bg-white/8 text-slate-200' };

const KEYWORD_VISUALS: { keywords: string[]; visual: ExerciseVisual }[] = [
    { keywords: ['press banca', 'press plano', 'press inclinado', 'press declinado', 'apertura', 'pecho', 'pectoral', 'flexion'], visual: { emoji: '🏋️', className: 'bg-amber-500/15 text-amber-300' } },
    { keywords: ['dominada', 'jalon', 'remo', 'peso muerto', 'espalda', 'dorsal', 'pull'], visual: { emoji: '🧗', className: 'bg-teal-500/15 text-teal-300' } },
    { keywords: ['sentadilla', 'squat', 'zancada', 'prensa', 'pierna', 'cuadriceps', 'femoral', 'gemelo', 'pantorrilla'], visual: { emoji: '🦵', className: 'bg-emerald-500/15 text-emerald-300' } },
    { keywords: ['press militar', 'press hombro', 'elevacion', 'hombro', 'deltoide'], visual: { emoji: '🤸', className: 'bg-sky-500/15 text-sky-300' } },
    { keywords: ['curl', 'biceps'], visual: { emoji: '💪', className: 'bg-violet-500/15 text-violet-300' } },
    { keywords: ['triceps', 'fondo', 'extension'], visual: { emoji: '💪', className: 'bg-fuchsia-500/15 text-fuchsia-300' } },
    { keywords: ['abdomen', 'plancha', 'crunch', 'core', 'abdominal'], visual: { emoji: '🧘', className: 'bg-rose-500/15 text-rose-300' } },
    { keywords: ['gluteo', 'hip thrust', 'puente'], visual: { emoji: '🍑', className: 'bg-pink-500/15 text-pink-300' } },
    { keywords: ['correr', 'cinta', 'bicicleta', 'cardio', 'trote', 'elipt'], visual: { emoji: '🏃', className: 'bg-cyan-500/15 text-cyan-300' } },
];

function stripAccents(value: string): string {
    return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function getExerciseVisual(name: string): ExerciseVisual {
    const normalized = stripAccents(name.trim().toLowerCase());
    if (!normalized) return DEFAULT_VISUAL;
    const match = KEYWORD_VISUALS.find(({ keywords }) => keywords.some((keyword) => normalized.includes(keyword)));
    return match?.visual ?? DEFAULT_VISUAL;
}
