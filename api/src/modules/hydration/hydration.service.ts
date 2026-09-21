import { AuthenticatedUser } from '../identity/identity.types';
import { hydrationRepository } from './hydration.repository';
import { WaterLog } from './hydration.types';

class ValidationError extends Error { }

export { ValidationError };

export function createHydrationService() {
    return {
        async getToday(requester: AuthenticatedUser): Promise<WaterLog> {
            const log = await hydrationRepository.findForToday(requester.id);
            return log ?? { userId: requester.id, logDate: new Date().toISOString().slice(0, 10), consumedMl: 0 };
        },

        async setToday(requester: AuthenticatedUser, consumedMl: number): Promise<WaterLog> {
            if (!Number.isFinite(consumedMl) || consumedMl < 0) {
                throw new ValidationError('La cantidad de agua debe ser un n\u00famero no negativo.');
            }
            return hydrationRepository.setForToday(requester.id, consumedMl);
        },
    };
}
