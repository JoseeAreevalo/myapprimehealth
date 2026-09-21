import { AuthenticatedUser } from '../identity/identity.types';
import { coachClientsRepository, peopleRepository, profilesRepository } from './people.repository';
import { CoachClientLink, PersonSummary, Profile } from './people.types';

class ForbiddenError extends Error {}
class NotFoundError extends Error {}
class ValidationError extends Error {}

export { ForbiddenError, NotFoundError, ValidationError };

function assertCanViewOwnOrElevated(requester: AuthenticatedUser, targetUserId: number): void {
  if (requester.role === 'super_admin') return;
  if (requester.id === targetUserId) return;
  throw new ForbiddenError('You do not have permission to view this profile.');
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
        throw new ForbiddenError('Clients cannot list a coach roster.');
      }
      if (requester.role === 'coach' && requester.id !== coachId) {
        throw new ForbiddenError('Coaches can only view their own client roster.');
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
        throw new ForbiddenError('Clients cannot assign coaches.');
      }
      if (requester.role === 'coach' && requester.id !== coachId) {
        throw new ForbiddenError('Coaches can only assign clients to themselves.');
      }

      const coach = await peopleRepository.findById(coachId);
      if (!coach || coach.role !== 'coach') {
        throw new ValidationError('The specified coach does not exist.');
      }

      const client = await peopleRepository.findById(clientId);
      if (!client || client.role !== 'client') {
        throw new ValidationError('The specified client does not exist.');
      }

      const existing = await coachClientsRepository.findActiveByClientId(clientId);
      if (existing) {
        throw new ValidationError('This client already has an active coach assignment.');
      }

      return coachClientsRepository.assign(coachId, clientId);
    },

    async endAssignment(requester: AuthenticatedUser, linkId: number): Promise<void> {
      const link = await coachClientsRepository.findById(linkId);
      if (!link) {
        throw new NotFoundError('Coach assignment not found.');
      }

      if (requester.role === 'client') {
        throw new ForbiddenError('Clients cannot end coach assignments.');
      }
      if (requester.role === 'coach' && requester.id !== link.coachId) {
        throw new ForbiddenError('Coaches can only end their own client assignments.');
      }

      await coachClientsRepository.end(linkId);
    },
  };
}
