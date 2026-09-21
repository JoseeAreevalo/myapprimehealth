import { coachClientsRepository } from '../people/people.repository';
import { AuthenticatedUser } from '../identity/identity.types';
import { exercisesRepository } from './exercises.repository';
import { Exercise } from './exercises.types';

class ForbiddenError extends Error {}
class ValidationError extends Error {}

export { ForbiddenError, ValidationError };

// Clients being coached must follow their coach's catalog; only self-managed clients, coaches, and admins may extend it.
async function assertCanExtendCatalog(requester: AuthenticatedUser): Promise<void> {
  if (requester.role !== 'client') return;
  const link = await coachClientsRepository.findActiveByClientId(requester.id);
  if (link) {
    throw new ForbiddenError('Tu coach define los ejercicios disponibles; no puedes agregar nuevos.');
  }
}

export function createExercisesService() {
  return {
    async search(query: string): Promise<Exercise[]> {
      if (!query || query.trim().length < 2) {
        throw new ValidationError('Escribe al menos 2 caracteres para buscar.');
      }
      return exercisesRepository.search(query.trim());
    },

    async create(requester: AuthenticatedUser, input: { name: string; muscleGroup?: string | null }): Promise<Exercise> {
      await assertCanExtendCatalog(requester);

      if (!input.name || !input.name.trim()) {
        throw new ValidationError('El nombre del ejercicio es obligatorio.');
      }

      return exercisesRepository.create({ name: input.name.trim(), muscleGroup: input.muscleGroup, createdBy: requester.id });
    },
  };
}
