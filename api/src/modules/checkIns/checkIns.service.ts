import { coachClientsRepository } from '../people/people.repository';
import { AuthenticatedUser } from '../identity/identity.types';
import { checkInsRepository } from './checkIns.repository';
import { CheckIn, CheckInInput } from './checkIns.types';

class ForbiddenError extends Error {}
class NotFoundError extends Error {}
class ValidationError extends Error {}

export { ForbiddenError, NotFoundError, ValidationError };

function assertCanActAsClient(requester: AuthenticatedUser, clientId: number): void {
  if (requester.role === 'super_admin') return;
  if (requester.id === clientId) return;
  throw new ForbiddenError('You do not have permission to act on behalf of this client.');
}

async function assertCoachOwnsClient(coachId: number, clientId: number): Promise<void> {
  const link = await coachClientsRepository.findActiveByClientId(clientId);
  if (!link || link.coachId !== coachId) {
    throw new ForbiddenError('This client is not assigned to you.');
  }
}

export function getWeekStartDate(reference: Date = new Date()): string {
  const date = new Date(Date.UTC(reference.getUTCFullYear(), reference.getUTCMonth(), reference.getUTCDate()));
  const day = date.getUTCDay();
  const daysSinceMonday = (day + 6) % 7;
  date.setUTCDate(date.getUTCDate() - daysSinceMonday);
  return date.toISOString().slice(0, 10);
}

export function createCheckInsService() {
  return {
    async submitWeeklyCheckIn(requester: AuthenticatedUser, input: CheckInInput): Promise<CheckIn> {
      if (requester.role !== 'client') {
        throw new ForbiddenError('Only clients can submit a weekly check-in.');
      }
      if (input.adherencePercent != null && (input.adherencePercent < 0 || input.adherencePercent > 100)) {
        throw new ValidationError('adherencePercent must be between 0 and 100.');
      }

      const activeCoach = await coachClientsRepository.findActiveByClientId(requester.id);
      return checkInsRepository.upsertForWeek(requester.id, activeCoach?.coachId ?? null, getWeekStartDate(), input);
    },

    async listForClient(requester: AuthenticatedUser, clientId: number): Promise<CheckIn[]> {
      if (requester.role === 'client') {
        assertCanActAsClient(requester, clientId);
      } else if (requester.role === 'coach') {
        await assertCoachOwnsClient(requester.id, clientId);
      }
      return checkInsRepository.listByClientId(clientId);
    },

    async listPendingForCoach(requester: AuthenticatedUser, coachId: number): Promise<CheckIn[]> {
      if (requester.role === 'client') {
        throw new ForbiddenError('Clients cannot view a coach review queue.');
      }
      if (requester.role === 'coach' && requester.id !== coachId) {
        throw new ForbiddenError('Coaches can only view their own review queue.');
      }
      return checkInsRepository.listPendingByCoachId(coachId);
    },

    async review(requester: AuthenticatedUser, checkInId: number, feedback: string): Promise<CheckIn> {
      const checkIn = await checkInsRepository.findById(checkInId);
      if (!checkIn) {
        throw new NotFoundError('Check-in not found.');
      }
      if (requester.role === 'client') {
        throw new ForbiddenError('Clients cannot review check-ins.');
      }
      if (requester.role === 'coach' && checkIn.coachId !== requester.id) {
        throw new ForbiddenError('You can only review check-ins for your own clients.');
      }
      if (!feedback || !feedback.trim()) {
        throw new ValidationError('Feedback is required to review a check-in.');
      }

      return checkInsRepository.review(checkInId, feedback.trim());
    },
  };
}
