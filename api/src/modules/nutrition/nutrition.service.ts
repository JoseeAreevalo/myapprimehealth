import { coachClientsRepository } from '../people/people.repository';
import { AuthenticatedUser } from '../identity/identity.types';
import { notificationsRepository } from '../notifications/notifications.repository';
import { nutritionMealLogsRepository, nutritionMealsRepository, nutritionPlansRepository } from './nutrition.repository';
import { MealStatus, NutritionMealInput, NutritionPlan, NutritionPlanWithMeals } from './nutrition.types';

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
    throw new ForbiddenError('This client is not assigned to you.');
  }
}

function assertCanActAsClient(requester: AuthenticatedUser, clientId: number): void {
  if (requester.role === 'super_admin') return;
  if (requester.id === clientId) return;
  throw new ForbiddenError('You do not have permission to act on behalf of this client.');
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
      if (requester.role === 'client') {
        throw new ForbiddenError('Clients cannot create nutrition plans.');
      }
      if (requester.role === 'coach') {
        await assertCoachOwnsClient(requester.id, input.clientId);
      }

      if (!input.planKey || !input.label) {
        throw new ValidationError('A plan key and label are required.');
      }
      if (!Number.isFinite(input.goalCalories) || input.goalCalories <= 0) {
        throw new ValidationError('goalCalories must be a positive number.');
      }
      if (!Array.isArray(input.meals) || input.meals.length === 0) {
        throw new ValidationError('At least one meal is required.');
      }
      for (const meal of input.meals) {
        if (!meal.name || !Number.isFinite(meal.calories) || meal.calories < 0) {
          throw new ValidationError('Each meal requires a name and a non-negative calorie count.');
        }
      }

      const plan = await nutritionPlansRepository.create({
        clientId: input.clientId,
        coachId: requester.role === 'super_admin' ? input.clientId : requester.id,
        planKey: input.planKey,
        label: input.label,
        goalCalories: input.goalCalories,
      });
      const meals = await nutritionMealsRepository.createMany(plan.id, input.meals);

      await notificationsRepository.create(
        input.clientId,
        'plan_assigned',
        'New nutrition plan',
        `Your coach assigned you the "${input.label}" plan.`,
      );

      return { ...plan, meals: meals.map((meal) => ({ ...meal, status: 'planned' as MealStatus })) };
    },

    async activatePlan(requester: AuthenticatedUser, clientId: number, planId: number): Promise<void> {
      assertCanActAsClient(requester, clientId);

      const plan = await nutritionPlansRepository.findById(planId);
      if (!plan || plan.clientId !== clientId) {
        throw new NotFoundError('Nutrition plan not found.');
      }

      await nutritionPlansRepository.activate(clientId, planId);
    },

    async logMeal(requester: AuthenticatedUser, mealId: number, status: MealStatus): Promise<void> {
      const meal = await nutritionMealsRepository.findById(mealId);
      if (!meal) {
        throw new NotFoundError('Meal not found.');
      }

      const plan = await nutritionPlansRepository.findById(meal.planId);
      if (!plan) {
        throw new NotFoundError('Meal not found.');
      }

      assertCanActAsClient(requester, plan.clientId);

      if (!['completed', 'next', 'planned'].includes(status)) {
        throw new ValidationError('Invalid meal status.');
      }

      await nutritionMealLogsRepository.upsert(mealId, plan.clientId, todayIsoDate(), status);
    },
  };
}
