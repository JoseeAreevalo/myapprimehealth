import { coachClientsRepository } from '../people/people.repository';
import { AuthenticatedUser } from '../identity/identity.types';
import {
    activityLogsRepository,
    activityPlansRepository,
    cardioTargetsRepository,
    stepsTargetsRepository,
} from './activity.repository';
import { ActivityLog, ActivityPlanWithTargets, CardioTargetInput, StepsTargetInput } from './activity.types';

class ForbiddenError extends Error { }
class NotFoundError extends Error { }
class ValidationError extends Error { }

export { ForbiddenError, NotFoundError, ValidationError };

function todayIsoDate(): string {
    return new Date().toISOString().slice(0, 10);
}

async function assertCoachOwnsClient(coachId: number, clientId: number): Promise<void> {
    const link = await coachClientsRepository.findActiveByClientId(clientId);
    if (!link || link.coachId !== coachId) {
        throw new ForbiddenError('Este cliente no está asignado a ti.');
    }
}

// Self-service is always allowed; otherwise only super_admin or the client's own coach may manage it.
async function assertCanManage(requester: AuthenticatedUser, clientId: number): Promise<void> {
    if (requester.id === clientId || requester.role === 'super_admin') return;
    if (requester.role === 'coach') {
        await assertCoachOwnsClient(requester.id, clientId);
        return;
    }
    throw new ForbiddenError('No tienes permiso para modificar esta configuración.');
}

async function assertCanView(requester: AuthenticatedUser, clientId: number): Promise<void> {
    if (requester.id === clientId || requester.role === 'super_admin') return;
    if (requester.role === 'coach') {
        await assertCoachOwnsClient(requester.id, clientId);
        return;
    }
    throw new ForbiddenError('No tienes permiso para ver esta configuración.');
}

function validateWeekday(weekday: number): void {
    if (!Number.isInteger(weekday) || weekday < 1 || weekday > 7) {
        throw new ValidationError('El día de la semana debe estar entre 1 (lunes) y 7 (domingo).');
    }
}

export function createActivityService() {
    return {
        async getPlan(requester: AuthenticatedUser, clientId: number): Promise<ActivityPlanWithTargets | null> {
            await assertCanView(requester, clientId);

            const plan = await activityPlansRepository.findActiveByClientId(clientId);
            if (!plan) return null;

            const [cardioTargets, stepsTargets, todayLog] = await Promise.all([
                cardioTargetsRepository.listByPlanId(plan.id),
                stepsTargetsRepository.listByPlanId(plan.id),
                activityLogsRepository.findForDate(clientId, todayIsoDate()),
            ]);

            return { ...plan, cardioTargets, stepsTargets, todayLog: todayLog ?? null };
        },

        async createPlan(
            requester: AuthenticatedUser,
            clientId: number,
            input: { cardioTargets: CardioTargetInput[]; stepsTargets: StepsTargetInput[] },
        ): Promise<ActivityPlanWithTargets> {
            await assertCanManage(requester, clientId);

            input.cardioTargets.forEach((target) => {
                validateWeekday(target.weekday);
                if (!Number.isFinite(target.minutes) || target.minutes <= 0) {
                    throw new ValidationError('Los minutos de cardio deben ser un número positivo.');
                }
            });
            input.stepsTargets.forEach((target) => {
                validateWeekday(target.weekday);
                if (!Number.isFinite(target.stepsTarget) || target.stepsTarget <= 0) {
                    throw new ValidationError('La meta de pasos debe ser un número positivo.');
                }
            });

            const plan = await activityPlansRepository.create(clientId, requester.id === clientId ? clientId : requester.id);

            const cardioTargets = await Promise.all(
                input.cardioTargets.map((target) => cardioTargetsRepository.upsert(plan.id, target.weekday, target.minutes)),
            );
            const stepsTargets = await Promise.all(
                input.stepsTargets.map((target) => stepsTargetsRepository.upsert(plan.id, target.weekday, target.stepsTarget)),
            );

            return { ...plan, cardioTargets, stepsTargets, todayLog: null };
        },

        async updateCardioTarget(requester: AuthenticatedUser, planId: number, input: CardioTargetInput): Promise<void> {
            const plan = await activityPlansRepository.findById(planId);
            if (!plan) throw new NotFoundError('Configuración de actividad no encontrada.');
            await assertCanManage(requester, plan.clientId);
            validateWeekday(input.weekday);
            if (!Number.isFinite(input.minutes) || input.minutes <= 0) {
                throw new ValidationError('Los minutos de cardio deben ser un número positivo.');
            }
            await cardioTargetsRepository.upsert(planId, input.weekday, input.minutes);
        },

        async removeCardioTarget(requester: AuthenticatedUser, planId: number, weekday: number): Promise<void> {
            const plan = await activityPlansRepository.findById(planId);
            if (!plan) return;
            await assertCanManage(requester, plan.clientId);
            await cardioTargetsRepository.deleteByWeekday(planId, weekday);
        },

        async updateStepsTarget(requester: AuthenticatedUser, planId: number, input: StepsTargetInput): Promise<void> {
            const plan = await activityPlansRepository.findById(planId);
            if (!plan) throw new NotFoundError('Configuración de actividad no encontrada.');
            await assertCanManage(requester, plan.clientId);
            validateWeekday(input.weekday);
            if (!Number.isFinite(input.stepsTarget) || input.stepsTarget <= 0) {
                throw new ValidationError('La meta de pasos debe ser un número positivo.');
            }
            await stepsTargetsRepository.upsert(planId, input.weekday, input.stepsTarget);
        },

        async removeStepsTarget(requester: AuthenticatedUser, planId: number, weekday: number): Promise<void> {
            const plan = await activityPlansRepository.findById(planId);
            if (!plan) return;
            await assertCanManage(requester, plan.clientId);
            await stepsTargetsRepository.deleteByWeekday(planId, weekday);
        },

        async deletePlan(requester: AuthenticatedUser, planId: number): Promise<void> {
            const plan = await activityPlansRepository.findById(planId);
            if (!plan) return;
            await assertCanManage(requester, plan.clientId);
            await activityPlansRepository.delete(planId);
        },

        async logToday(
            requester: AuthenticatedUser,
            clientId: number,
            updates: { actualCardioMinutes?: number | null; actualSteps?: number | null },
        ): Promise<void> {
            // Logging is always self-referential — anyone (client, coach, super_admin) may log their own activity.
            if (requester.id !== clientId) {
                throw new ForbiddenError('Solo puedes registrar tu propia actividad.');
            }
            if (updates.actualCardioMinutes != null && (!Number.isFinite(updates.actualCardioMinutes) || updates.actualCardioMinutes < 0)) {
                throw new ValidationError('Los minutos registrados deben ser un número no negativo.');
            }
            if (updates.actualSteps != null && (!Number.isFinite(updates.actualSteps) || updates.actualSteps < 0)) {
                throw new ValidationError('Los pasos registrados deben ser un número no negativo.');
            }
            await activityLogsRepository.upsert(clientId, todayIsoDate(), updates);
        },

        async getRecentLogs(requester: AuthenticatedUser, clientId: number, days = 14): Promise<ActivityLog[]> {
            await assertCanView(requester, clientId);
            const to = new Date();
            const from = new Date();
            from.setDate(from.getDate() - days);
            return activityLogsRepository.listRecentForClient(clientId, from.toISOString().slice(0, 10), to.toISOString().slice(0, 10));
        },
    };
}
