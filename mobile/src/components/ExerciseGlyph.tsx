import { getExerciseVisual } from '../utils/exerciseVisuals';

// Small automatic visual identifier for an exercise (no image upload needed).
export default function ExerciseGlyph({ name, size = 28 }: { name: string; size?: number }) {
    const { emoji, className } = getExerciseVisual(name);
    return (
        <span
            className={`grid shrink-0 place-items-center rounded-lg ${className}`}
            style={{ width: size, height: size, fontSize: size * 0.55 }}
            title={name}
        >
            {emoji}
        </span>
    );
}
