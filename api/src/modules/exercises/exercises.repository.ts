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

export const exercisesRepository = {
  async search(query: string, limit = 20): Promise<Exercise[]> {
    const { rows } = await pool.query<ExerciseRow>(
      'SELECT * FROM exercises WHERE name ILIKE $1 ORDER BY name ASC LIMIT $2',
      [`%${query}%`, limit],
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
