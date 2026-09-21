import { coachClientsRepository } from '../people/people.repository';
import { AuthenticatedUser } from '../identity/identity.types';
import { notificationsRepository } from '../notifications/notifications.repository';
import { nutritionMealLogsRepository, nutritionMealsRepository, nutritionPlansRepository } from './nutrition.repository';
import { MealStatus, NutritionMeal, NutritionMealInput, NutritionPlan, NutritionPlanWithMeals } from './nutrition.types';

class ForbiddenError extends Error {}
class NotFoundError extends Error {}
class ValidationError extends Error {}

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

function assertCanActAsClient(requester: AuthenticatedUser, clientId: number): void {
  if (requester.role === 'super_admin') return;
  if (requester.id === clientId) return;
  throw new ForbiddenError('No tienes permiso para actuar en nombre de este cliente.');
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

export function createNutritionService() {
  return {
    async listPlans(requester: AuthenticatedUser, clientId: number): Promise<NutritionPlan[]> {
      if (requester.role === 'client') {
        assertCanActAsClient(requester, clientId);
      } else if (requester.role === 'coach') {
        await assertCoachOwnsClient(requester.id, clientId);
      }
      return nutritionPlansRepository.listByClientId(clientId);
    },

    async getTodayPlan(requester: AuthenticatedUser, clientId: number): Promise<NutritionPlanWithMeals | null> {
      if (requester.role === 'client') {
        assertCanActAsClient(requester, clientId);
      } else if (requester.role === 'coach') {
        await assertCoachOwnsClient(requester.id, clientId);
      }

      const plan = await nutritionPlansRepository.findActiveByClientId(clientId);
      if (!plan) return null;

      const meals = await nutritionMealsRepository.listByPlanId(plan.id);
      const logs = await nutritionMealLogsRepository.listForDate(clientId, todayIsoDate());

      return {
        ...plan,
        meals: meals.map((meal) => ({ ...meal, status: logs.get(meal.id) ?? 'planned' })),
      };
    },

    async createPlan(
      requester: AuthenticatedUser,
      input: { clientId: number; planKey: string; label: string; goalCalories: number; meals: NutritionMealInput[] },
    ): Promise<NutritionPlanWithMeals> {
      await assertCanManagePlan(requester, input.clientId);

      if (!input.planKey || !input.label) {
        throw new ValidationError('Se requieren una clave y una etiqueta para el plan.');
      }
      if (!Number.isFinite(input.goalCalories) || input.goalCalories <= 0) {
        throw new ValidationError('goalCalories debe ser un número positivo.');
      }
      if (!Array.isArray(input.meals) || input.meals.length === 0) {
        throw new ValidationError('Se requiere al menos una comida.');
      }
      for (const meal of input.meals) {
        if (!meal.name || !Number.isFinite(meal.calories) || meal.calories < 0) {
          throw new ValidationError('Cada comida requiere un nombre y una cantidad de calorías no negativa.');
        }
      }

      const plan = await nutritionPlansRepository.create({
        clientId: input.clientId,
        coachId: requester.id === input.clientId ? input.clientId : requester.id,
        planKey: input.planKey,
        label: input.label,
        goalCalories: input.goalCalories,
      });
      const meals = await nutritionMealsRepository.createMany(plan.id, input.meals);

      if (requester.id !== input.clientId) {
        await notificationsRepository.create(
          input.clientId,
          'plan_assigned',
          'Nuevo plan de nutrición',
          `Tu coach te asignó el plan "${input.label}".`,
        );
      }

      return { ...plan, meals: meals.map((meal) => ({ ...meal, status: 'planned' as MealStatus })) };
    },

    async updatePlan(
      requester: AuthenticatedUser,
      planId: number,
      updates: { label?: string; goalCalories?: number },
    ): Promise<NutritionPlan> {
      const plan = await nutritionPlansRepository.findById(planId);
      if (!plan) {
        throw new NotFoundError('Plan de nutrición no encontrado.');
      }
      await assertCanManagePlan(requester, plan.clientId);

      if (updates.goalCalories != null && (!Number.isFinite(updates.goalCalories) || updates.goalCalories <= 0)) {
        throw new ValidationError('goalCalories debe ser un número positivo.');
      }

      return nutritionPlansRepository.update(planId, updates);
    },

    async addMeal(requester: AuthenticatedUser, planId: number, meal: NutritionMealInput): Promise<NutritionMeal> {
      const plan = await nutritionPlansRepository.findById(planId);
      if (!plan) {
        throw new NotFoundError('Plan de nutrición no encontrado.');
      }
      await assertCanManagePlan(requester, plan.clientId);

      if (!meal.name || !Number.isFinite(meal.calories) || meal.calories < 0) {
        throw new ValidationError('La comida requiere un nombre y una cantidad de calorías no negativa.');
      }

      const sortOrder = await nutritionMealsRepository.countByPlanId(planId);
      return nutritionMealsRepository.create(planId, meal, sortOrder);
    },

    async updateMeal(
      requester: AuthenticatedUser,
      mealId: number,
      updates: { name?: string; mealTime?: string | null; calories?: number },
    ): Promise<NutritionMeal> {
      const meal = await nutritionMealsRepository.findById(mealId);
      if (!meal) {
        throw new NotFoundError('Comida no encontrada.');
      }
      const plan = await nutritionPlansRepository.findById(meal.planId);
      if (!plan) {
        throw new NotFoundError('Comida no encontrada.');
      }
      await assertCanManagePlan(requester, plan.clientId);

      if (updates.calories != null && (!Number.isFinite(updates.calories) || updates.calories < 0)) {
        throw new ValidationError('Las calorías deben ser un número no negativo.');
      }

      return nutritionMealsRepository.update(mealId, updates);
    },

    async deleteMeal(requester: AuthenticatedUser, mealId: number): Promise<void> {
      const meal = await nutritionMealsRepository.findById(mealId);
      if (!meal) {
        throw new NotFoundError('Comida no encontrada.');
      }
      const plan = await nutritionPlansRepository.findById(meal.planId);
      if (!plan) {
        throw new NotFoundError('Comida no encontrada.');
      }
      await assertCanManagePlan(requester, plan.clientId);

      await nutritionMealsRepository.delete(mealId);
    },

    async activatePlan(requester: AuthenticatedUser, clientId: number, planId: number): Promise<void> {
      assertCanActAsClient(requester, clientId);

      const plan = await nutritionPlansRepository.findById(planId);
      if (!plan || plan.clientId !== clientId) {
        throw new NotFoundError('Plan de nutrición no encontrado.');
      }

      await nutritionPlansRepository.activate(clientId, planId);
    },

    async logMeal(requester: AuthenticatedUser, mealId: number, status: MealStatus): Promise<void> {
      const meal = await nutritionMealsRepository.findById(mealId);
      if (!meal) {
        throw new NotFoundError('Comida no encontrada.');
      }

      const plan = await nutritionPlansRepository.findById(meal.planId);
      if (!plan) {
        throw new NotFoundError('Comida no encontrada.');
      }

      assertCanActAsClient(requester, plan.clientId);

      if (!['completed', 'next', 'planned'].includes(status)) {
        throw new ValidationError('Estado de comida inválido.');
      }

      await nutritionMealLogsRepository.upsert(mealId, plan.clientId, todayIsoDate(), status);
    },
  };
}
