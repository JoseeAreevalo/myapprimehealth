export type WorkoutStatus = 'planned' | 'completed';

export interface Workout {
  id: number;
  userId: number;
  name: string;
  durationMinutes: number;
  workoutDate: string;
  status: WorkoutStatus;
}

export interface WorkoutSet {
  id: number;
  workoutId: number;
  exerciseName: string;
  sets: number;
  reps: number;
  weightKg: number | null;
}
