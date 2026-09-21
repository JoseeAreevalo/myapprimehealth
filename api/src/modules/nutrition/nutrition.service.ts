import { coachClientsRepository } from '../people/people.repository';
import { AuthenticatedUser } from '../identity/identity.types';
import { foodsRepository } from '../foods/foods.repository';
import { notificationsRepository } from '../notifications/notifications.repository';
import { nutritionMealItemsRepository, nutritionMealLogsRepository, nutritionMealsRepository, nutritionPlansRepository } from './nutrition.repository';
import { MealStatus, NutritionMeal, NutritionMealInput, NutritionMealItem, NutritionMealItemDraft, NutritionPlan, NutritionPlanWithMeals } from './nutrition.types';

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

// Scales a catalog food's (assumed cooked/prepared) per-100g macros by the item's gram amount, or
// falls back to caller-supplied per-100g values for a freeform item not yet in the catalog.
async function resolveMealItem(draft: NutritionMealItemDraft): Promise<{
    foodId: number | null;
    foodName: string;
    grams: number;
    calories: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
}> {
    if (!draft.foodName || !Number.isFinite(draft.grams) || draft.grams <= 0) {
        throw new ValidationError('Cada alimento requiere un nombre y una cantidad en gramos mayor a 0.');
    }

    let per100g = {
        calories: draft.caloriesPer100g,
        protein: draft.proteinGPer100g,
        carbs: draft.carbsGPer100g,
        fat: draft.fatGPer100g,
    };

    if (draft.foodId != null) {
        const food = await foodsRepository.findById(draft.foodId);
        if (!food) {
            throw new ValidationError(`El alimento "${draft.foodName}" ya no existe en el catálogo.`);
        }
        per100g = { calories: food.caloriesPer100g, protein: food.proteinG, carbs: food.carbsG, fat: food.fatG };
    }

    if (per100g.calories == null) {
        throw new ValidationError(`Faltan datos nutricionales para "${draft.foodName}".`);
    }

    const scale = draft.grams / 100;
    return {
        foodId: draft.foodId ?? null,
        foodName: draft.foodName,
        grams: draft.grams,
        calories: Math.round(per100g.calories * scale * 10) / 10,
        proteinG: Math.round((per100g.protein ?? 0) * scale * 10) / 10,
        carbsG: Math.round((per100g.carbs ?? 0) * scale * 10) / 10,
        fatG: Math.round((per100g.fat ?? 0) * scale * 10) / 10,
    };
}

async function createMealItems(mealId: number, drafts: NutritionMealItemDraft[]): Promise<NutritionMealItem[]> {
    const created: NutritionMealItem[] = [];
    for (const [index, draft] of drafts.entries()) {
        const resolved = await resolveMealItem(draft);
        created.push(await nutritionMealItemsRepository.create(mealId, { ...resolved, sortOrder: index }));
    }
    return created;
}

function sumItemCalories(items: NutritionMealItem[]): number {
    return Math.round(items.reduce((sum, item) => sum + item.calories, 0) * 10) / 10;
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
            const items = await nutritionMealItemsRepository.listByMealIds(meals.map((meal) => meal.id));
            const logs = await nutritionMealLogsRepository.listForDate(clientId, todayIsoDate());

            return {
                ...plan,
                meals: meals.map((meal) => ({
                    ...meal,
                    items: items.filter((item) => item.mealId === meal.id),
                    status: logs.get(meal.id) ?? 'planned',
                })),
            };
        },

        async createPlan(
            requester: AuthenticatedUser,
            input: {
                clientId: number;
                planKey: string;
                label: string;
                goalCalories: number;
                proteinGTarget?: number | null;
                carbsGTarget?: number | null;
                fatGTarget?: number | null;
                waterGoalMl?: number;
                meals: NutritionMealInput[];
            },
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
                proteinGTarget: input.proteinGTarget,
                carbsGTarget: input.carbsGTarget,
                fatGTarget: input.fatGTarget,
                waterGoalMl: input.waterGoalMl,
            });
            const meals = await nutritionMealsRepository.createMany(plan.id, input.meals);
            const mealsWithItems: NutritionMeal[] = [];
            for (const [index, meal] of meals.entries()) {
                const drafts = input.meals[index]?.items ?? [];
                const items = drafts.length > 0 ? await createMealItems(meal.id, drafts) : [];
                const calories = items.length > 0 ? sumItemCalories(items) : meal.calories;
                mealsWithItems.push({ ...meal, calories, items });
            }

            if (requester.id !== input.clientId) {
                await notificationsRepository.create(
                    input.clientId,
                    'plan_assigned',
                    'Nuevo plan de nutrición',
                    `Tu coach te asignó el plan "${input.label}".`,
                );
            }

            return { ...plan, meals: mealsWithItems.map((meal) => ({ ...meal, status: 'planned' as MealStatus })) };
        },

        async updatePlan(
            requester: AuthenticatedUser,
            planId: number,
            updates: {
                label?: string;
                goalCalories?: number;
                proteinGTarget?: number | null;
                carbsGTarget?: number | null;
                fatGTarget?: number | null;
                waterGoalMl?: number;
            },
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
            const created = await nutritionMealsRepository.create(planId, meal, sortOrder);
            const items = meal.items && meal.items.length > 0 ? await createMealItems(created.id, meal.items) : [];
            const calories = items.length > 0 ? sumItemCalories(items) : created.calories;
            return { ...created, calories, items };
        },

        async addMealItem(requester: AuthenticatedUser, mealId: number, draft: NutritionMealItemDraft): Promise<NutritionMeal> {
            const meal = await nutritionMealsRepository.findById(mealId);
            if (!meal) {
                throw new NotFoundError('Comida no encontrada.');
            }
            const plan = await nutritionPlansRepository.findById(meal.planId);
            if (!plan) {
                throw new NotFoundError('Comida no encontrada.');
            }
            await assertCanManagePlan(requester, plan.clientId);

            await createMealItems(mealId, [draft]);
            const items = await nutritionMealItemsRepository.listByMealId(mealId);
            const calories = sumItemCalories(items);
            const updated = await nutritionMealsRepository.update(mealId, { calories });
            return { ...updated, items };
        },

        async deleteMealItem(requester: AuthenticatedUser, itemId: number): Promise<NutritionMeal> {
            const item = await nutritionMealItemsRepository.findById(itemId);
            if (!item) {
                throw new NotFoundError('Alimento no encontrado.');
            }
            const meal = await nutritionMealsRepository.findById(item.mealId);
            if (!meal) {
                throw new NotFoundError('Comida no encontrada.');
            }
            const plan = await nutritionPlansRepository.findById(meal.planId);
            if (!plan) {
                throw new NotFoundError('Comida no encontrada.');
            }
            await assertCanManagePlan(requester, plan.clientId);

            await nutritionMealItemsRepository.delete(itemId);
            const items = await nutritionMealItemsRepository.listByMealId(meal.id);
            const calories = items.length > 0 ? sumItemCalories(items) : meal.calories;
            const updated = await nutritionMealsRepository.update(meal.id, { calories });
            return { ...updated, items };
        },

        async updateMealItemGrams(requester: AuthenticatedUser, itemId: number, grams: number): Promise<NutritionMeal> {
            const item = await nutritionMealItemsRepository.findById(itemId);
            if (!item) {
                throw new NotFoundError('Alimento no encontrado.');
            }
            const meal = await nutritionMealsRepository.findById(item.mealId);
            if (!meal) {
                throw new NotFoundError('Comida no encontrada.');
            }
            const plan = await nutritionPlansRepository.findById(meal.planId);
            if (!plan) {
                throw new NotFoundError('Comida no encontrada.');
            }
            await assertCanManagePlan(requester, plan.clientId);

            if (!Number.isFinite(grams) || grams <= 0) {
                throw new ValidationError('Los gramos deben ser un número mayor a 0.');
            }

            const ratio = grams / item.grams;
            await nutritionMealItemsRepository.updateValues(itemId, {
                grams,
                calories: Math.round(item.calories * ratio * 10) / 10,
                proteinG: Math.round(item.proteinG * ratio * 10) / 10,
                carbsG: Math.round(item.carbsG * ratio * 10) / 10,
                fatG: Math.round(item.fatG * ratio * 10) / 10,
            });
            const items = await nutritionMealItemsRepository.listByMealId(meal.id);
            const calories = sumItemCalories(items);
            const updated = await nutritionMealsRepository.update(meal.id, { calories });
            return { ...updated, items };
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

            const updated = await nutritionMealsRepository.update(mealId, updates);
            const items = await nutritionMealItemsRepository.listByMealId(mealId);
            return { ...updated, items };
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
