import { pool } from '../../db/pool';
import { MealStatus, NutritionDayConfig, NutritionMeal, NutritionMealInput, NutritionMealItem, NutritionPlan } from './nutrition.types';

interface PlanRow {
    id: number;
    client_id: number;
    coach_id: number;
    plan_key: string;
    label: string;
    goal_calories: number;
    protein_g_target: string | null;
    carbs_g_target: string | null;
    fat_g_target: string | null;
    water_goal_ml: number;
    start_date: string | null;
    end_date: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

interface MealRow {
    id: number;
    plan_id: number;
    name: string;
    detail: string | null;
    meal_time: string | null;
    calories: number;
    sort_order: number;
    alternative_group: string | null;
    alternative_label: string | null;
    day_config_id: number | null;
}

interface DayConfigRow {
    id: number;
    plan_id: number;
    label: string;
    weekdays: number[];
    sort_order: number;
}

interface MealItemRow {
    id: number;
    meal_id: number;
    food_id: number | null;
    food_name: string;
    grams: string;
    calories: string;
    protein_g: string;
    carbs_g: string;
    fat_g: string;
    sort_order: number;
}

interface MealLogRow {
    meal_id: number;
    status: MealStatus;
}

function toPlan(row: PlanRow): NutritionPlan {
    return {
        id: row.id,
        clientId: row.client_id,
        coachId: row.coach_id,
        planKey: row.plan_key,
        label: row.label,
        goalCalories: row.goal_calories,
        proteinGTarget: row.protein_g_target === null ? null : Number(row.protein_g_target),
        carbsGTarget: row.carbs_g_target === null ? null : Number(row.carbs_g_target),
        fatGTarget: row.fat_g_target === null ? null : Number(row.fat_g_target),
        waterGoalMl: row.water_goal_ml,
        startDate: row.start_date,
        endDate: row.end_date,
        isActive: row.is_active,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

function toMeal(row: MealRow): Omit<NutritionMeal, 'items'> {
    return {
        id: row.id,
        planId: row.plan_id,
        name: row.name,
        detail: row.detail,
        mealTime: row.meal_time,
        calories: row.calories,
        sortOrder: row.sort_order,
        alternativeGroup: row.alternative_group,
        alternativeLabel: row.alternative_label,
        dayConfigId: row.day_config_id,
    };
}

function toDayConfig(row: DayConfigRow): NutritionDayConfig {
    return { id: row.id, planId: row.plan_id, label: row.label, weekdays: row.weekdays ?? [], sortOrder: row.sort_order };
}

function toMealItem(row: MealItemRow): NutritionMealItem {
    return {
        id: row.id,
        mealId: row.meal_id,
        foodId: row.food_id,
        foodName: row.food_name,
        grams: Number(row.grams),
        calories: Number(row.calories),
        proteinG: Number(row.protein_g),
        carbsG: Number(row.carbs_g),
        fatG: Number(row.fat_g),
        sortOrder: row.sort_order,
    };
}

export const nutritionPlansRepository = {
    async listByClientId(clientId: number): Promise<NutritionPlan[]> {
        const { rows } = await pool.query<PlanRow>(
            'SELECT * FROM nutrition_plans WHERE client_id = $1 ORDER BY created_at DESC',
            [clientId],
        );
        return rows.map(toPlan);
    },

    async findById(id: number): Promise<NutritionPlan | undefined> {
        const { rows } = await pool.query<PlanRow>('SELECT * FROM nutrition_plans WHERE id = $1', [id]);
        return rows[0] ? toPlan(rows[0]) : undefined;
    },

    async findActiveByClientId(clientId: number): Promise<NutritionPlan | undefined> {
        const { rows } = await pool.query<PlanRow>(
            'SELECT * FROM nutrition_plans WHERE client_id = $1 AND is_active = TRUE',
            [clientId],
        );
        return rows[0] ? toPlan(rows[0]) : undefined;
    },

    async create(input: {
        clientId: number;
        coachId: number;
        planKey: string;
        label: string;
        goalCalories: number;
        proteinGTarget?: number | null;
        carbsGTarget?: number | null;
        fatGTarget?: number | null;
        waterGoalMl?: number;
        startDate?: string | null;
        endDate?: string | null;
    }): Promise<NutritionPlan> {
        const { rows } = await pool.query<PlanRow>(
            `INSERT INTO nutrition_plans (client_id, coach_id, plan_key, label, goal_calories, protein_g_target, carbs_g_target, fat_g_target, water_goal_ml, start_date, end_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, COALESCE($9, 2000), $10, $11)
       RETURNING *`,
            [
                input.clientId,
                input.coachId,
                input.planKey,
                input.label,
                input.goalCalories,
                input.proteinGTarget ?? null,
                input.carbsGTarget ?? null,
                input.fatGTarget ?? null,
                input.waterGoalMl ?? null,
                input.startDate ?? null,
                input.endDate ?? null,
            ],
        );
        return toPlan(rows[0]);
    },

    async activate(clientId: number, planId: number): Promise<void> {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            await client.query('UPDATE nutrition_plans SET is_active = FALSE, updated_at = now() WHERE client_id = $1', [clientId]);
            await client.query('UPDATE nutrition_plans SET is_active = TRUE, updated_at = now() WHERE id = $1 AND client_id = $2', [planId, clientId]);
            await client.query('COMMIT');
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    },

    async update(
        id: number,
        updates: {
            label?: string;
            goalCalories?: number;
            proteinGTarget?: number | null;
            carbsGTarget?: number | null;
            fatGTarget?: number | null;
            waterGoalMl?: number;
            startDate?: string | null;
            endDate?: string | null;
        },
    ): Promise<NutritionPlan> {
        const { rows } = await pool.query<PlanRow>(
            `UPDATE nutrition_plans
       SET label = COALESCE($2, label),
           goal_calories = COALESCE($3, goal_calories),
           protein_g_target = COALESCE($4, protein_g_target),
           carbs_g_target = COALESCE($5, carbs_g_target),
           fat_g_target = COALESCE($6, fat_g_target),
           water_goal_ml = COALESCE($7, water_goal_ml),
           start_date = COALESCE($8, start_date),
           end_date = COALESCE($9, end_date),
           updated_at = now()
       WHERE id = $1
       RETURNING *`,
            [
                id,
                updates.label ?? null,
                updates.goalCalories ?? null,
                updates.proteinGTarget ?? null,
                updates.carbsGTarget ?? null,
                updates.fatGTarget ?? null,
                updates.waterGoalMl ?? null,
                updates.startDate ?? null,
                updates.endDate ?? null,
            ],
        );
        return toPlan(rows[0]);
    },

    async delete(id: number): Promise<void> {
        await pool.query('DELETE FROM nutrition_plans WHERE id = $1', [id]);
    },
};

export const nutritionMealsRepository = {
    async listByPlanId(planId: number): Promise<Omit<NutritionMeal, 'items'>[]> {
        const { rows } = await pool.query<MealRow>(
            'SELECT * FROM nutrition_meals WHERE plan_id = $1 ORDER BY sort_order ASC, id ASC',
            [planId],
        );
        return rows.map(toMeal);
    },

    async findById(id: number): Promise<Omit<NutritionMeal, 'items'> | undefined> {
        const { rows } = await pool.query<MealRow>('SELECT * FROM nutrition_meals WHERE id = $1', [id]);
        return rows[0] ? toMeal(rows[0]) : undefined;
    },

    async createMany(planId: number, meals: NutritionMealInput[]): Promise<Omit<NutritionMeal, 'items'>[]> {
        const created: Omit<NutritionMeal, 'items'>[] = [];
        for (const [index, meal] of meals.entries()) {
            const { rows } = await pool.query<MealRow>(
                `INSERT INTO nutrition_meals (plan_id, name, detail, meal_time, calories, sort_order, alternative_group, alternative_label, day_config_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
                [
                    planId,
                    meal.name,
                    meal.detail ?? null,
                    meal.mealTime ?? null,
                    meal.calories,
                    meal.sortOrder ?? index,
                    meal.alternativeGroup ?? null,
                    meal.alternativeLabel ?? null,
                    meal.dayConfigId ?? null,
                ],
            );
            created.push(toMeal(rows[0]));
        }
        return created;
    },

    async create(planId: number, meal: NutritionMealInput, sortOrder: number): Promise<Omit<NutritionMeal, 'items'>> {
        const { rows } = await pool.query<MealRow>(
            `INSERT INTO nutrition_meals (plan_id, name, detail, meal_time, calories, sort_order, alternative_group, alternative_label, day_config_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
            [
                planId,
                meal.name,
                meal.detail ?? null,
                meal.mealTime ?? null,
                meal.calories,
                sortOrder,
                meal.alternativeGroup ?? null,
                meal.alternativeLabel ?? null,
                meal.dayConfigId ?? null,
            ],
        );
        return toMeal(rows[0]);
    },

    async update(id: number, updates: { name?: string; mealTime?: string | null; calories?: number }): Promise<Omit<NutritionMeal, 'items'>> {
        const { rows } = await pool.query<MealRow>(
            `UPDATE nutrition_meals
       SET name = COALESCE($2, name), meal_time = COALESCE($3, meal_time), calories = COALESCE($4, calories)
       WHERE id = $1
       RETURNING *`,
            [id, updates.name ?? null, updates.mealTime ?? null, updates.calories ?? null],
        );
        return toMeal(rows[0]);
    },

    async delete(id: number): Promise<void> {
        await pool.query('DELETE FROM nutrition_meals WHERE id = $1', [id]);
    },

    async countByPlanId(planId: number): Promise<number> {
        const { rows } = await pool.query<{ count: string }>('SELECT COUNT(*) AS count FROM nutrition_meals WHERE plan_id = $1', [planId]);
        return Number(rows[0]?.count ?? 0);
    },
};

export const nutritionMealItemsRepository = {
    async listByMealId(mealId: number): Promise<NutritionMealItem[]> {
        const { rows } = await pool.query<MealItemRow>(
            'SELECT * FROM nutrition_meal_items WHERE meal_id = $1 ORDER BY sort_order ASC, id ASC',
            [mealId],
        );
        return rows.map(toMealItem);
    },

    async listByMealIds(mealIds: number[]): Promise<NutritionMealItem[]> {
        if (mealIds.length === 0) return [];
        const { rows } = await pool.query<MealItemRow>(
            'SELECT * FROM nutrition_meal_items WHERE meal_id = ANY($1) ORDER BY sort_order ASC, id ASC',
            [mealIds],
        );
        return rows.map(toMealItem);
    },

    async findById(id: number): Promise<NutritionMealItem | undefined> {
        const { rows } = await pool.query<MealItemRow>('SELECT * FROM nutrition_meal_items WHERE id = $1', [id]);
        return rows[0] ? toMealItem(rows[0]) : undefined;
    },

    async countByMealId(mealId: number): Promise<number> {
        const { rows } = await pool.query<{ count: string }>('SELECT COUNT(*) AS count FROM nutrition_meal_items WHERE meal_id = $1', [mealId]);
        return Number(rows[0]?.count ?? 0);
    },

    async create(
        mealId: number,
        item: { foodId?: number | null; foodName: string; grams: number; calories: number; proteinG: number; carbsG: number; fatG: number; sortOrder?: number },
    ): Promise<NutritionMealItem> {
        const { rows } = await pool.query<MealItemRow>(
            `INSERT INTO nutrition_meal_items (meal_id, food_id, food_name, grams, calories, protein_g, carbs_g, fat_g, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, COALESCE($9, 0))
       RETURNING *`,
            [mealId, item.foodId ?? null, item.foodName, item.grams, item.calories, item.proteinG, item.carbsG, item.fatG, item.sortOrder ?? null],
        );
        return toMealItem(rows[0]);
    },

    async delete(id: number): Promise<void> {
        await pool.query('DELETE FROM nutrition_meal_items WHERE id = $1', [id]);
    },

    async updateValues(
        id: number,
        updates: { grams: number; calories: number; proteinG: number; carbsG: number; fatG: number },
    ): Promise<NutritionMealItem> {
        const { rows } = await pool.query<MealItemRow>(
            `UPDATE nutrition_meal_items
       SET grams = $2, calories = $3, protein_g = $4, carbs_g = $5, fat_g = $6
       WHERE id = $1
       RETURNING *`,
            [id, updates.grams, updates.calories, updates.proteinG, updates.carbsG, updates.fatG],
        );
        return toMealItem(rows[0]);
    },
};

export const nutritionMealLogsRepository = {
    async listForDate(clientId: number, logDate: string): Promise<Map<number, MealStatus>> {
        const { rows } = await pool.query<MealLogRow>(
            'SELECT meal_id, status FROM nutrition_meal_logs WHERE client_id = $1 AND log_date = $2',
            [clientId, logDate],
        );
        return new Map(rows.map((row) => [row.meal_id, row.status]));
    },

    async upsert(mealId: number, clientId: number, logDate: string, status: MealStatus): Promise<void> {
        await pool.query(
            `INSERT INTO nutrition_meal_logs (meal_id, client_id, log_date, status)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (meal_id, log_date) DO UPDATE SET status = EXCLUDED.status, updated_at = now()`,
            [mealId, clientId, logDate, status],
        );
    },
};

export const nutritionDayConfigsRepository = {
    async listByPlanId(planId: number): Promise<NutritionDayConfig[]> {
        const { rows } = await pool.query<DayConfigRow>(
            'SELECT * FROM nutrition_day_configs WHERE plan_id = $1 ORDER BY sort_order ASC, id ASC',
            [planId],
        );
        return rows.map(toDayConfig);
    },

    async findById(id: number): Promise<NutritionDayConfig | undefined> {
        const { rows } = await pool.query<DayConfigRow>('SELECT * FROM nutrition_day_configs WHERE id = $1', [id]);
        return rows[0] ? toDayConfig(rows[0]) : undefined;
    },

    async create(planId: number, label: string, weekdays: number[], sortOrder: number): Promise<NutritionDayConfig> {
        const { rows } = await pool.query<DayConfigRow>(
            `INSERT INTO nutrition_day_configs (plan_id, label, weekdays, sort_order) VALUES ($1, $2, $3, $4) RETURNING *`,
            [planId, label, weekdays, sortOrder],
        );
        return toDayConfig(rows[0]);
    },

    async update(id: number, updates: { label?: string; weekdays?: number[] }): Promise<NutritionDayConfig> {
        const { rows } = await pool.query<DayConfigRow>(
            `UPDATE nutrition_day_configs SET label = COALESCE($2, label), weekdays = COALESCE($3, weekdays) WHERE id = $1 RETURNING *`,
            [id, updates.label ?? null, updates.weekdays ?? null],
        );
        return toDayConfig(rows[0]);
    },

    async countByPlanId(planId: number): Promise<number> {
        const { rows } = await pool.query<{ count: string }>('SELECT COUNT(*) AS count FROM nutrition_day_configs WHERE plan_id = $1', [planId]);
        return Number(rows[0]?.count ?? 0);
    },

    async delete(id: number): Promise<void> {
        await pool.query('DELETE FROM nutrition_day_configs WHERE id = $1', [id]);
    },
};
