import { pool } from '../../db/pool';
import { Workout, WorkoutStatus } from './workouts.types';

interface WorkoutRow {
  id: number;
  user_id: number;
  name: string;
  duration_minutes: number;
  workout_date: string;
  status: WorkoutStatus;
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
