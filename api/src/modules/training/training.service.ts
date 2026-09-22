import { coachClientsRepository } from '../people/people.repository';
import { AuthenticatedUser } from '../identity/identity.types';
import {
    trainingDaysRepository,
    trainingExercisesRepository,
    trainingPlansRepository,
    trainingSetLogsRepository,
} from './training.repository';
import { TrainingDay, TrainingDayInput, TrainingExercise, TrainingExerciseInput, TrainingHistoryDay, TrainingPlan, TrainingPlanWithDays } from './training.types';

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

// Self-service (own plan) is always allowed; otherwise only super_admin or the client's own coach may manage it.
async function assertCanManagePlan(requester: AuthenticatedUser, clientId: number): Promise<void> {
    if (requester.id === clientId || requester.role === 'super_admin') return;
    if (requester.role === 'coach') {
        await assertCoachOwnsClient(requester.id, clientId);
        return;
    }
    throw new ForbiddenError('No tienes permiso para modificar este plan.');
}

function validateExerciseInput(exercise: TrainingExerciseInput): void {
    if (!exercise.name || !exercise.name.trim()) {
        throw new ValidationError('Cada ejercicio requiere un nombre.');
    }
    if (!Number.isFinite(exercise.targetSets) || exercise.targetSets <= 0) {
        throw new ValidationError('Las series objetivo deben ser un número positivo.');
    }
    if (!Number.isFinite(exercise.targetReps) || exercise.targetReps <= 0) {
        throw new ValidationError('Las repeticiones objetivo deben ser un número positivo.');
    }
    if (exercise.targetRir == null || !Number.isInteger(exercise.targetRir) || exercise.targetRir < 0 || exercise.targetRir > 10) {
        throw new ValidationError('El RIR objetivo es obligatorio y debe estar entre 0 y 10.');
    }
}

function validateWeekday(weekday: number | null | undefined): void {
    if (weekday == null) return;
    if (!Number.isInteger(weekday) || weekday < 1 || weekday > 7) {
        throw new ValidationError('El día de la semana debe estar entre 1 (lunes) y 7 (domingo).');
    }
}

function validateDurationWeeks(durationWeeks: number | null | undefined): void {
    if (durationWeeks == null) return;
    if (!Number.isInteger(durationWeeks) || durationWeeks < 1 || durationWeeks > 52) {
        throw new ValidationError('La duración del plan debe ser de 1 a 52 semanas.');
    }
}

export function createTrainingService() {
    return {
        async getActivePlan(requester: AuthenticatedUser, clientId: number): Promise<TrainingPlanWithDays | null> {
            if (requester.role === 'client' && requester.id !== clientId) {
                throw new ForbiddenError('No tienes permiso para ver este plan.');
            }
            if (requester.role === 'coach' && requester.id !== clientId) {
                await assertCoachOwnsClient(requester.id, clientId);
            }

            const plan = await trainingPlansRepository.findActiveByClientId(clientId);
            if (!plan) return null;

            const days = await trainingDaysRepository.listByPlanId(plan.id);
            const logDate = todayIsoDate();

            const daysWithExercises = await Promise.all(
                days.map(async (day) => {
                    const exercises = await trainingExercisesRepository.listByDayId(day.id);
                    const logsByExercise = await trainingSetLogsRepository.listForExercisesAndDate(
                        exercises.map((exercise) => exercise.id),
                        logDate,
                    );
                    return {
                        ...day,
                        exercises: exercises.map((exercise) => ({ ...exercise, logs: logsByExercise.get(exercise.id) ?? [] })),
                    };
                }),
            );

            return { ...plan, days: daysWithExercises };
        },

        async createPlan(
            requester: AuthenticatedUser,
            input: { clientId: number; label: string; durationWeeks?: number; days: TrainingDayInput[] },
        ): Promise<TrainingPlanWithDays> {
            await assertCanManagePlan(requester, input.clientId);

            if (!input.label || !input.label.trim()) {
                throw new ValidationError('El plan requiere un nombre.');
            }
            validateDurationWeeks(input.durationWeeks);
            if (!Array.isArray(input.days) || input.days.length === 0) {
                throw new ValidationError('Se requiere al menos un día de entrenamiento.');
            }
            if (input.days.length > 7) {
                throw new ValidationError('Una semana tiene máximo 7 días.');
            }
            const usedWeekdays = new Set<number>();
            for (const day of input.days) {
                if (!day.label || !day.label.trim()) {
                    throw new ValidationError('Cada día requiere un nombre.');
                }
                validateWeekday(day.weekday);
                if (day.weekday != null) {
                    if (usedWeekdays.has(day.weekday)) {
                        throw new ValidationError('No puedes asignar el mismo día de la semana a dos días del plan.');
                    }
                    usedWeekdays.add(day.weekday);
                }
                if (!Array.isArray(day.exercises) || day.exercises.length === 0) {
                    throw new ValidationError('Cada día requiere al menos un ejercicio.');
                }
                day.exercises.forEach(validateExerciseInput);
            }

            const plan = await trainingPlansRepository.create({
                clientId: input.clientId,
                coachId: requester.id === input.clientId ? input.clientId : requester.id,
                label: input.label,
                durationWeeks: input.durationWeeks,
            });

            const days = await Promise.all(
                input.days.map(async (dayInput, index) => {
                    const day = await trainingDaysRepository.create(plan.id, dayInput.label, index + 1, dayInput.weekday);
                    const exercises = await Promise.all(
                        dayInput.exercises.map((exercise, exerciseIndex) => trainingExercisesRepository.create(day.id, exercise, exerciseIndex)),
                    );
                    return { ...day, exercises: exercises.map((exercise) => ({ ...exercise, logs: [] })) };
                }),
            );

            return { ...plan, days };
        },

        async updatePlan(requester: AuthenticatedUser, planId: number, updates: { label?: string; durationWeeks?: number }): Promise<TrainingPlan> {
            const plan = await trainingPlansRepository.findById(planId);
            if (!plan) {
                throw new NotFoundError('Plan de entrenamiento no encontrado.');
            }
            await assertCanManagePlan(requester, plan.clientId);
            validateDurationWeeks(updates.durationWeeks);
            return trainingPlansRepository.update(planId, updates);
        },

        async deletePlan(requester: AuthenticatedUser, planId: number): Promise<void> {
            const plan = await trainingPlansRepository.findById(planId);
            if (!plan) {
                throw new NotFoundError('Plan de entrenamiento no encontrado.');
            }
            await assertCanManagePlan(requester, plan.clientId);
            await trainingPlansRepository.delete(planId);
        },

        async addDay(requester: AuthenticatedUser, planId: number, label: string, weekday?: number | null): Promise<void> {
            const plan = await trainingPlansRepository.findById(planId);
            if (!plan) {
                throw new NotFoundError('Plan de entrenamiento no encontrado.');
            }
            await assertCanManagePlan(requester, plan.clientId);
            if (!label || !label.trim()) {
                throw new ValidationError('El día requiere un nombre.');
            }
            validateWeekday(weekday);
            const existingDays = await trainingDaysRepository.listByPlanId(planId);
            if (existingDays.length >= 7) {
                throw new ValidationError('Una semana tiene máximo 7 días.');
            }
            if (weekday != null && existingDays.some((day) => day.weekday === weekday)) {
                throw new ValidationError('Ya hay un día asignado a ese día de la semana.');
            }
            await trainingDaysRepository.create(planId, label.trim(), existingDays.length + 1, weekday);
        },

        async updateDay(
            requester: AuthenticatedUser,
            dayId: number,
            updates: { label?: string; weekday?: number | null },
        ): Promise<TrainingDay> {
            const day = await trainingDaysRepository.findById(dayId);
            if (!day) {
                throw new NotFoundError('Día de entrenamiento no encontrado.');
            }
            const plan = await trainingPlansRepository.findById(day.planId);
            if (!plan) {
                throw new NotFoundError('Plan de entrenamiento no encontrado.');
            }
            await assertCanManagePlan(requester, plan.clientId);
            validateWeekday(updates.weekday);
            if (updates.weekday != null) {
                const existingDays = await trainingDaysRepository.listByPlanId(day.planId);
                if (existingDays.some((other) => other.id !== dayId && other.weekday === updates.weekday)) {
                    throw new ValidationError('Ya hay un día asignado a ese día de la semana.');
                }
            }
            return trainingDaysRepository.update(dayId, updates);
        },

        async deleteDay(requester: AuthenticatedUser, dayId: number): Promise<void> {
            const day = await trainingDaysRepository.findById(dayId);
            if (!day) return;
            const plan = await trainingPlansRepository.findById(day.planId);
            if (!plan) return;
            await assertCanManagePlan(requester, plan.clientId);
            await trainingDaysRepository.delete(dayId);
        },

        async addExercise(requester: AuthenticatedUser, dayId: number, input: TrainingExerciseInput): Promise<TrainingExercise> {
            const day = await trainingDaysRepository.findById(dayId);
            if (!day) {
                throw new NotFoundError('Día de entrenamiento no encontrado.');
            }
            const plan = await trainingPlansRepository.findById(day.planId);
            if (!plan) {
                throw new NotFoundError('Plan de entrenamiento no encontrado.');
            }
            await assertCanManagePlan(requester, plan.clientId);
            validateExerciseInput(input);

            const sortOrder = await trainingExercisesRepository.countByDayId(dayId);
            return trainingExercisesRepository.create(dayId, input, sortOrder);
        },

        async updateExercise(
            requester: AuthenticatedUser,
            exerciseId: number,
            updates: { name?: string; targetSets?: number; targetReps?: number; targetWeightKg?: number | null; targetRir?: number | null },
        ): Promise<TrainingExercise> {
            const exercise = await trainingExercisesRepository.findById(exerciseId);
            if (!exercise) {
                throw new NotFoundError('Ejercicio no encontrado.');
            }
            const day = await trainingDaysRepository.findById(exercise.dayId);
            if (!day) {
                throw new NotFoundError('Ejercicio no encontrado.');
            }
            const plan = await trainingPlansRepository.findById(day.planId);
            if (!plan) {
                throw new NotFoundError('Ejercicio no encontrado.');
            }
            await assertCanManagePlan(requester, plan.clientId);

            return trainingExercisesRepository.update(exerciseId, updates);
        },

        async deleteExercise(requester: AuthenticatedUser, exerciseId: number): Promise<void> {
            const exercise = await trainingExercisesRepository.findById(exerciseId);
            if (!exercise) return;
            const day = await trainingDaysRepository.findById(exercise.dayId);
            if (!day) return;
            const plan = await trainingPlansRepository.findById(day.planId);
            if (!plan) return;
            await assertCanManagePlan(requester, plan.clientId);
            await trainingExercisesRepository.delete(exerciseId);
        },

        async logSets(
            requester: AuthenticatedUser,
            exerciseId: number,
            sets: { setNumber: number; actualReps: number | null; actualWeightKg: number | null; actualRir: number | null }[],
        ): Promise<void> {
            const exercise = await trainingExercisesRepository.findById(exerciseId);
            if (!exercise) {
                throw new NotFoundError('Ejercicio no encontrado.');
            }
            const day = await trainingDaysRepository.findById(exercise.dayId);
            if (!day) {
                throw new NotFoundError('Ejercicio no encontrado.');
            }
            const plan = await trainingPlansRepository.findById(day.planId);
            if (!plan) {
                throw new NotFoundError('Ejercicio no encontrado.');
            }
            await assertCanManagePlan(requester, plan.clientId);

            const logDate = todayIsoDate();
            for (const set of sets) {
                await trainingSetLogsRepository.upsertSet(exerciseId, logDate, set.setNumber, set.actualReps, set.actualWeightKg, set.actualRir ?? null);
            }
        },

        async getMonthHistory(requester: AuthenticatedUser, clientId: number, year: number, month: number): Promise<TrainingHistoryDay[]> {
            if (requester.role === 'client' && requester.id !== clientId) {
                throw new ForbiddenError('No tienes permiso para ver este historial.');
            }
            if (requester.role === 'coach' && requester.id !== clientId) {
                await assertCoachOwnsClient(requester.id, clientId);
            }
            if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) {
                throw new ValidationError('Año o mes inválido.');
            }

            const pad = (value: number) => String(value).padStart(2, '0');
            const fromDate = `${year}-${pad(month)}-01`;
            const lastDay = new Date(year, month, 0).getDate();
            const toDate = `${year}-${pad(month)}-${pad(lastDay)}`;

            const rows = await trainingSetLogsRepository.listHistoryForClient(clientId, fromDate, toDate);

            const dayMap = new Map<string, Map<number, TrainingHistoryDay['exercises'][number]>>();
            for (const row of rows) {
                if (!dayMap.has(row.log_date)) dayMap.set(row.log_date, new Map());
                const exercisesForDay = dayMap.get(row.log_date)!;
                if (!exercisesForDay.has(row.exercise_id)) {
                    exercisesForDay.set(row.exercise_id, {
                        exerciseId: row.exercise_id,
                        exerciseName: row.exercise_name,
                        dayLabel: row.day_label,
                        sets: [],
                    });
                }
                exercisesForDay.get(row.exercise_id)!.sets.push({
                    setNumber: row.set_number,
                    actualReps: row.actual_reps,
                    actualWeightKg: row.actual_weight_kg === null ? null : Number(row.actual_weight_kg),
                    actualRir: row.actual_rir,
                });
            }

            return Array.from(dayMap.entries())
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([date, exercises]) => ({ date, exercises: Array.from(exercises.values()) }));
        },
    };
}
