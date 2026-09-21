import { pool } from '../../db/pool';
import { Exercise } from './exercises.types';

interface ExerciseRow {
    id: number;
    name: string;
    muscle_group: string | null;
    source: string;
}

function toExercise(row: ExerciseRow): Exercise {
    return { id: row.id, name: row.name, muscleGroup: row.muscle_group, source: row.source };
}

// Common Spanish aliases/plurals that don't map to a muscle_group value by simply stripping the trailing "s".
const MUSCLE_GROUP_SYNONYMS: Record<string, string> = {
    abdomen: 'core',
    abdominales: 'core',
    abs: 'core',
    biceps: 'brazo',
    triceps: 'brazo',
    antebrazos: 'antebrazo',
    hombros: 'hombro',
    piernas: 'pierna',
    cuadriceps: 'pierna',
    femoral: 'pierna',
    gluteos: 'gluteo',
    nalgas: 'gluteo',
    pantorrillas: 'pantorrilla',
    gemelos: 'pantorrilla',
    espaldas: 'espalda',
    dorsales: 'espalda',
    trapecio: 'espalda',
    pechos: 'pecho',
    pectorales: 'pecho',
    olimpicos: 'olimpico',
};

function stripAccents(value: string): string {
    return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

// Expands a typed term (e.g. "brazos") into muscle_group values it should also match
// (raw, singularized, and any known synonym) so searching by target muscle works, not just by name.
function muscleGroupCandidates(query: string): string[] {
    const normalized = stripAccents(query.trim().toLowerCase());
    if (!normalized) return [];
    const candidates = new Set<string>([normalized]);
    if (normalized.endsWith('s')) candidates.add(normalized.slice(0, -1));
    const synonym = MUSCLE_GROUP_SYNONYMS[normalized];
    if (synonym) candidates.add(synonym);
    return Array.from(candidates);
}

export const exercisesRepository = {
    async search(query: string, limit = 20): Promise<Exercise[]> {
        const trimmed = query.trim();
        const values: (string | number)[] = [`%${trimmed}%`];
        const muscleClauses = muscleGroupCandidates(trimmed).map((candidate) => {
            values.push(`%${candidate}%`);
            return `muscle_group ILIKE $${values.length}`;
        });
        values.push(limit);

        const { rows } = await pool.query<ExerciseRow>(
            `SELECT * FROM exercises
       WHERE name ILIKE $1${muscleClauses.length ? ` OR ${muscleClauses.join(' OR ')}` : ''}
       ORDER BY CASE WHEN name ILIKE $1 THEN 0 ELSE 1 END, name ASC
       LIMIT $${values.length}`,
            values,
        );
        return rows.map(toExercise);
    },

    async findByNameCaseInsensitive(name: string): Promise<Exercise | undefined> {
        const { rows } = await pool.query<ExerciseRow>('SELECT * FROM exercises WHERE lower(name) = lower($1)', [name]);
        return rows[0] ? toExercise(rows[0]) : undefined;
    },

    async create(input: { name: string; muscleGroup?: string | null; createdBy?: number | null }): Promise<Exercise> {
        const { rows } = await pool.query<ExerciseRow>(
            `INSERT INTO exercises (name, muscle_group, source, created_by)
       VALUES ($1, $2, 'custom', $3)
       ON CONFLICT (lower(name)) DO UPDATE SET name = EXCLUDED.name
       RETURNING *`,
            [input.name, input.muscleGroup ?? null, input.createdBy ?? null],
        );
        return toExercise(rows[0]);
    },
};
