export type MealStatus = 'completed' | 'next' | 'planned';

export interface NutritionPlan {
    id: number;
    clientId: number;
    coachId: number;
    planKey: string;
    label: string;
    goalCalories: number;
    proteinGTarget: number | null;
    carbsGTarget: number | null;
    fatGTarget: number | null;
    waterGoalMl: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface NutritionMealItem {
    id: number;
    mealId: number;
    foodId: number | null;
    foodName: string;
    grams: number;
    calories: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
    sortOrder: number;
}

// Either references a catalog food (macros looked up server-side, assumed cooked/prepared weight)
// or, for a freeform item not yet in the catalog, carries its own per-100g values.
export interface NutritionMealItemDraft {
    foodId?: number | null;
    foodName: string;
    grams: number;
    caloriesPer100g?: number;
    proteinGPer100g?: number;
    carbsGPer100g?: number;
    fatGPer100g?: number;
}

export interface NutritionMealInput {
    name: string;
    detail?: string | null;
    mealTime?: string | null;
    calories: number;
    sortOrder?: number;
    alternativeGroup?: string | null;
    alternativeLabel?: string | null;
    items?: NutritionMealItemDraft[];
}

export interface NutritionMeal {
    id: number;
    planId: number;
    name: string;
    detail: string | null;
    mealTime: string | null;
    calories: number;
    sortOrder: number;
    alternativeGroup: string | null;
    alternativeLabel: string | null;
    items: NutritionMealItem[];
}

export interface NutritionMealWithStatus extends NutritionMeal {
    status: MealStatus;
}

export interface NutritionPlanWithMeals extends NutritionPlan {
    meals: NutritionMealWithStatus[];
}
