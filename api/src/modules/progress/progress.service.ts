import { coachClientsRepository } from '../people/people.repository';
import { AuthenticatedUser } from '../identity/identity.types';
import { checkInsRepository } from '../checkIns/checkIns.repository';
import { ClientProgress } from './progress.types';

class ForbiddenError extends Error { }

export { ForbiddenError };

async function assertCanViewClient(requester: AuthenticatedUser, clientId: number): Promise<void> {
    if (requester.id === clientId) return;
    if (requester.role === 'super_admin') return;
    if (requester.role === 'coach') {
        const link = await coachClientsRepository.findActiveByClientId(clientId);
        if (link && link.coachId === requester.id) return;
    }
    throw new ForbiddenError('No tienes permiso para ver el progreso de este cliente.');
}

export function createProgressService() {
    return {
        async getClientProgress(requester: AuthenticatedUser, clientId: number): Promise<ClientProgress> {
            await assertCanViewClient(requester, clientId);

            const checkIns = await checkInsRepository.listByClientId(clientId);
            const chronological = [...checkIns].sort((a, b) => a.weekStartDate.localeCompare(b.weekStartDate));

            const weightSeries = chronological
                .filter((entry) => entry.weightKg != null)
                .map((entry) => ({ weekStartDate: entry.weekStartDate, weightKg: entry.weightKg as number }));

            const adherenceSeries = chronological
                .filter((entry) => entry.adherencePercent != null)
                .map((entry) => ({ weekStartDate: entry.weekStartDate, adherencePercent: entry.adherencePercent as number }));

            const startingWeightKg = weightSeries[0]?.weightKg ?? null;
            const currentWeightKg = weightSeries[weightSeries.length - 1]?.weightKg ?? null;
            const weightChangeKg =
                startingWeightKg != null && currentWeightKg != null ? Number((currentWeightKg - startingWeightKg).toFixed(2)) : null;
            const averageAdherencePercent =
                adherenceSeries.length > 0
                    ? Math.round(adherenceSeries.reduce((total, point) => total + point.adherencePercent, 0) / adherenceSeries.length)
                    : null;

            return {
                clientId,
                summary: {
                    totalCheckIns: checkIns.length,
                    reviewedCheckIns: checkIns.filter((entry) => entry.status === 'reviewed').length,
                    startingWeightKg,
                    currentWeightKg,
                    weightChangeKg,
                    averageAdherencePercent,
                },
                weightSeries,
                adherenceSeries,
            };
        },
    };
}
