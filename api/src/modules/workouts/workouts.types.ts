export type WorkoutStatus = 'planned' | 'completed';

export interface Workout {
  id: number;
  userId: number;
  name: string;
  durationMinutes: number;
  workoutDate: string;
  status: WorkoutStatus;
}
