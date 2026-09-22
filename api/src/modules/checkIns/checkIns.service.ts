import { coachClientsRepository } from '../people/people.repository';
import { AuthenticatedUser } from '../identity/identity.types';
import { notificationsRepository } from '../notifications/notifications.repository';
import { checkInsRepository } from './checkIns.repository';
import { CheckIn, CheckInInput } from './checkIns.types';

class ForbiddenError extends Error { }
class NotFoundError extends Error { }
class ValidationError extends Error { }

export { ForbiddenError, NotFoundError, ValidationError };

function assertCanActAsClient(requester: AuthenticatedUser, clientId: number): void {
    if (requester.role === 'super_admin') return;
    if (requester.id === clientId) return;
    throw new ForbiddenError('No tienes permiso para actuar en nombre de este cliente.');
}

async function assertCoachOwnsClient(coachId: number, clientId: number): Promise<void> {
    const link = await coachClientsRepository.findActiveByClientId(clientId);
    if (!link || link.coachId !== coachId) {
        throw new ForbiddenError('Este cliente no está asignado a ti.');
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
            // Always self-referential (writes to requester.id), so every role may track their own week.
            if (input.adherencePercent != null && (input.adherencePercent < 0 || input.adherencePercent > 100)) {
                throw new ValidationError('El porcentaje de adherencia debe estar entre 0 y 100.');
            }

            const activeCoach = await coachClientsRepository.findActiveByClientId(requester.id);
            return checkInsRepository.upsertForWeek(requester.id, activeCoach?.coachId ?? null, getWeekStartDate(), input);
        },

        async listForClient(requester: AuthenticatedUser, clientId: number): Promise<CheckIn[]> {
            if (requester.id === clientId || requester.role === 'super_admin') {
                return checkInsRepository.listByClientId(clientId);
            }
            if (requester.role === 'client') {
                assertCanActAsClient(requester, clientId);
            } else if (requester.role === 'coach') {
                await assertCoachOwnsClient(requester.id, clientId);
            }
            return checkInsRepository.listByClientId(clientId);
        },

        async listPendingForCoach(requester: AuthenticatedUser, coachId: number): Promise<CheckIn[]> {
            if (requester.role === 'client') {
                throw new ForbiddenError('Los clientes no pueden ver una cola de revisión de coach.');
            }
            if (requester.role === 'coach' && requester.id !== coachId) {
                throw new ForbiddenError('Los coaches solo pueden ver su propia cola de revisión.');
            }
            return checkInsRepository.listPendingByCoachId(coachId);
        },

        async review(requester: AuthenticatedUser, checkInId: number, feedback: string): Promise<CheckIn> {
            const checkIn = await checkInsRepository.findById(checkInId);
            if (!checkIn) {
                throw new NotFoundError('Check-in no encontrado.');
            }
            if (requester.role === 'client') {
                throw new ForbiddenError('Los clientes no pueden revisar check-ins.');
            }
            if (requester.role === 'coach' && checkIn.coachId !== requester.id) {
                throw new ForbiddenError('Solo puedes revisar check-ins de tus propios clientes.');
            }
            if (!feedback || !feedback.trim()) {
                throw new ValidationError('Se requiere un comentario para revisar un check-in.');
            }

            const reviewed = await checkInsRepository.review(checkInId, feedback.trim());
            await notificationsRepository.create(
                checkIn.clientId,
                'checkin_reviewed',
                'Tu coach revisó tu check-in',
                feedback.trim(),
            );
            return reviewed;
        },
    };
}
