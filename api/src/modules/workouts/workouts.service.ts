import { AuthenticatedUser } from '../identity/identity.types';
import { workoutsRepository } from './workouts.repository';
import { Workout } from './workouts.types';

class ForbiddenError extends Error {}
class ValidationError extends Error {}

export { ForbiddenError, ValidationError };

export function createWorkoutsService() {
  return {
    async getToday(requester: AuthenticatedUser): Promise<Workout | null> {
      const workout = await workoutsRepository.findForToday(requester.id);
      return workout ?? null;
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
  };
}
