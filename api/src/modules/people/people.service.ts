import { AuthenticatedUser } from '../identity/identity.types';
import { notificationsRepository } from '../notifications/notifications.repository';
import { coachClientsRepository, peopleRepository, profilesRepository } from './people.repository';
import { CoachClientLink, PersonSummary, Profile } from './people.types';

class ForbiddenError extends Error {}
class NotFoundError extends Error {}
class ValidationError extends Error {}

export { ForbiddenError, NotFoundError, ValidationError };

function assertCanViewOwnOrElevated(requester: AuthenticatedUser, targetUserId: number): void {
  if (requester.role === 'super_admin') return;
  if (requester.id === targetUserId) return;
  throw new ForbiddenError('No tienes permiso para ver este perfil.');
}

export function createPeopleService() {
  return {
    async getProfile(requester: AuthenticatedUser, userId: number): Promise<Profile | null> {
      assertCanViewOwnOrElevated(requester, userId);
      const profile = await profilesRepository.findByUserId(userId);
      return profile ?? null;
    },

    async upsertOwnProfile(
      requester: AuthenticatedUser,
      input: { phone?: string | null; birthDate?: string | null; bio?: string | null; avatarUrl?: string | null },
    ): Promise<Profile> {
      return profilesRepository.upsert(requester.id, input);
    },

    async listCoachClients(requester: AuthenticatedUser, coachId: number): Promise<PersonSummary[]> {
      if (requester.role === 'client') {
        throw new ForbiddenError('Los clientes no pueden listar una cartera de coach.');
      }
      if (requester.role === 'coach' && requester.id !== coachId) {
        throw new ForbiddenError('Los coaches solo pueden ver su propia cartera de clientes.');
      }

      const links = await coachClientsRepository.listActiveByCoachId(coachId);
      const clients = await Promise.all(links.map((link) => peopleRepository.findById(link.clientId)));
      return clients.filter((client): client is PersonSummary => Boolean(client));
    },

    async getClientCoach(requester: AuthenticatedUser, clientId: number): Promise<PersonSummary | null> {
      assertCanViewOwnOrElevated(requester, clientId);
      const link = await coachClientsRepository.findActiveByClientId(clientId);
      if (!link) return null;
      const coach = await peopleRepository.findById(link.coachId);
      return coach ?? null;
    },

    async assignClientToCoach(requester: AuthenticatedUser, coachId: number, clientId: number): Promise<CoachClientLink> {
      if (requester.role === 'client') {
        throw new ForbiddenError('Los clientes no pueden asignar coaches.');
      }
      if (requester.role === 'coach' && requester.id !== coachId) {
        throw new ForbiddenError('Los coaches solo pueden asignarse clientes a sí mismos.');
      }

      const coach = await peopleRepository.findById(coachId);
      if (!coach || coach.role !== 'coach') {
        throw new ValidationError('El coach especificado no existe.');
      }

      const client = await peopleRepository.findById(clientId);
      if (!client || client.role !== 'client') {
        throw new ValidationError('El cliente especificado no existe.');
      }

      const existing = await coachClientsRepository.findActiveByClientId(clientId);
      if (existing) {
        throw new ValidationError('Este cliente ya tiene un coach activo asignado.');
      }

      const link = await coachClientsRepository.assign(coachId, clientId);
      await notificationsRepository.create(clientId, 'coach_assigned', 'Tienes un nuevo coach', 'Te han asignado un nuevo coach.');
      return link;
    },

    async endAssignment(requester: AuthenticatedUser, linkId: number): Promise<void> {
      const link = await coachClientsRepository.findById(linkId);
      if (!link) {
        throw new NotFoundError('Asignación de coach no encontrada.');
      }

      if (requester.role === 'client') {
        throw new ForbiddenError('Los clientes no pueden finalizar asignaciones de coach.');
      }
      if (requester.role === 'coach' && requester.id !== link.coachId) {
        throw new ForbiddenError('Los coaches solo pueden finalizar sus propias asignaciones de clientes.');
      }

      await coachClientsRepository.end(linkId);
    },
  };
}
