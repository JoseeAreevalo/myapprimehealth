import { pool } from '../../db/pool';
import { Workout, WorkoutSet, WorkoutStatus } from './workouts.types';

interface WorkoutRow {
  id: number;
  user_id: number;
  name: string;
  duration_minutes: number;
  workout_date: string;
  status: WorkoutStatus;
}

interface WorkoutSetRow {
  id: number;
  workout_id: number;
  exercise_name: string;
  sets: number;
  reps: number;
  weight_kg: string | null;
}

function toWorkout(row: WorkoutRow): Workout {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    durationMinutes: row.duration_minutes,
    workoutDate: row.workout_date,
    status: row.status,
  };
}

function toWorkoutSet(row: WorkoutSetRow): WorkoutSet {
  return {
    id: row.id,
    workoutId: row.workout_id,
    exerciseName: row.exercise_name,
    sets: row.sets,
    reps: row.reps,
    weightKg: row.weight_kg === null ? null : Number(row.weight_kg),
  };
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export const workoutsRepository = {
  async findForToday(userId: number): Promise<Workout | undefined> {
    const { rows } = await pool.query<WorkoutRow>(
      'SELECT * FROM workouts WHERE user_id = $1 AND workout_date = $2',
      [userId, todayIsoDate()],
    );
    return rows[0] ? toWorkout(rows[0]) : undefined;
  },

  async findById(id: number): Promise<Workout | undefined> {
    const { rows } = await pool.query<WorkoutRow>('SELECT * FROM workouts WHERE id = $1', [id]);
    return rows[0] ? toWorkout(rows[0]) : undefined;
  },

  async upsertForToday(userId: number, name: string, durationMinutes: number): Promise<Workout> {
    const { rows } = await pool.query<WorkoutRow>(
      `INSERT INTO workouts (user_id, name, duration_minutes, workout_date)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, workout_date) DO UPDATE SET
         name = EXCLUDED.name,
         duration_minutes = EXCLUDED.duration_minutes,
         status = 'planned',
         updated_at = now()
       RETURNING *`,
      [userId, name, durationMinutes, todayIsoDate()],
    );
    return toWorkout(rows[0]);
  },

  async complete(id: number): Promise<Workout> {
    const { rows } = await pool.query<WorkoutRow>(
      `UPDATE workouts SET status = 'completed', updated_at = now() WHERE id = $1 RETURNING *`,
      [id],
    );
    return toWorkout(rows[0]);
  },
};

export const workoutSetsRepository = {
  async listByWorkoutId(workoutId: number): Promise<WorkoutSet[]> {
    const { rows } = await pool.query<WorkoutSetRow>(
      'SELECT * FROM workout_sets WHERE workout_id = $1 ORDER BY id ASC',
      [workoutId],
    );
    return rows.map(toWorkoutSet);
  },

  async create(input: { workoutId: number; exerciseName: string; sets: number; reps: number; weightKg: number | null }): Promise<WorkoutSet> {
    const { rows } = await pool.query<WorkoutSetRow>(
      `INSERT INTO workout_sets (workout_id, exercise_name, sets, reps, weight_kg)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [input.workoutId, input.exerciseName, input.sets, input.reps, input.weightKg],
    );
    return toWorkoutSet(rows[0]);
  },

  async findById(id: number): Promise<WorkoutSet | undefined> {
    const { rows } = await pool.query<WorkoutSetRow>('SELECT * FROM workout_sets WHERE id = $1', [id]);
    return rows[0] ? toWorkoutSet(rows[0]) : undefined;
  },

  async delete(id: number): Promise<void> {
    await pool.query('DELETE FROM workout_sets WHERE id = $1', [id]);
  },
};
