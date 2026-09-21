import { AuthenticatedUser } from '../identity/identity.types';
import { workoutSetsRepository, workoutsRepository } from './workouts.repository';
import { Workout, WorkoutSet } from './workouts.types';

class ForbiddenError extends Error {}
class ValidationError extends Error {}

export { ForbiddenError, ValidationError };

export function createWorkoutsService() {
  return {
    async getToday(requester: AuthenticatedUser): Promise<{ workout: Workout | null; sets: WorkoutSet[] }> {
      const workout = await workoutsRepository.findForToday(requester.id);
      if (!workout) return { workout: null, sets: [] };
      const sets = await workoutSetsRepository.listByWorkoutId(workout.id);
      return { workout, sets };
    },

    async setToday(requester: AuthenticatedUser, input: { name: string; durationMinutes: number }): Promise<Workout> {
      if (!input.name || !input.name.trim()) {
        throw new ValidationError('El nombre del entrenamiento es obligatorio.');
      }
      if (!Number.isFinite(input.durationMinutes) || input.durationMinutes <= 0) {
        throw new ValidationError('La duraci\u00f3n debe ser un n\u00famero positivo de minutos.');
      }

      return workoutsRepository.upsertForToday(requester.id, input.name.trim(), input.durationMinutes);
    },

    async complete(requester: AuthenticatedUser, workoutId: number): Promise<Workout> {
      const workout = await workoutsRepository.findById(workoutId);
      if (!workout || workout.userId !== requester.id) {
        throw new ForbiddenError('No tienes permiso para actualizar este entrenamiento.');
      }
      return workoutsRepository.complete(workoutId);
    },

    async addSet(
      requester: AuthenticatedUser,
      workoutId: number,
      input: { exerciseName: string; sets: number; reps: number; weightKg: number | null },
    ): Promise<WorkoutSet> {
      const workout = await workoutsRepository.findById(workoutId);
      if (!workout || workout.userId !== requester.id) {
        throw new ForbiddenError('No tienes permiso para modificar este entrenamiento.');
      }
      if (!input.exerciseName || !input.exerciseName.trim()) {
        throw new ValidationError('El nombre del ejercicio es obligatorio.');
      }
      if (!Number.isFinite(input.sets) || input.sets <= 0 || !Number.isFinite(input.reps) || input.reps <= 0) {
        throw new ValidationError('Series y repeticiones deben ser n\u00fameros positivos.');
      }

      return workoutSetsRepository.create({
        workoutId,
        exerciseName: input.exerciseName.trim(),
        sets: input.sets,
        reps: input.reps,
        weightKg: input.weightKg,
      });
    },

    async deleteSet(requester: AuthenticatedUser, setId: number): Promise<void> {
      const set = await workoutSetsRepository.findById(setId);
      if (!set) return;
      const workout = await workoutsRepository.findById(set.workoutId);
      if (!workout || workout.userId !== requester.id) {
        throw new ForbiddenError('No tienes permiso para modificar este entrenamiento.');
      }
      await workoutSetsRepository.delete(setId);
    },
  };
}
