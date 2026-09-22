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
    startDate: string | null;
    endDate: string | null;
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
    dayConfigId?: number | null;
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
    dayConfigId: number | null;
    items: NutritionMealItem[];
}

export interface NutritionMealWithStatus extends NutritionMeal {
    status: MealStatus;
    loggedItems?: LoggedMealItem[] | null;
    loggedCalories?: number | null;
}

// The grams actually served for a food item when a meal is logged, with macros recomputed
// from that amount (rather than the plan's target grams).
export interface LoggedMealItem {
    itemId: number;
    foodName: string;
    grams: number;
    calories: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
}

// A diet variant covering a checked set of weekdays (1=Lunes..7=Domingo), e.g. "Día de
// entrenamiento" vs "Día de descanso", each with its own meals.
export interface NutritionDayConfig {
    id: number;
    planId: number;
    label: string;
    weekdays: number[];
    sortOrder: number;
}

export interface NutritionDayConfigInput {
    label: string;
    weekdays: number[];
    meals: NutritionMealInput[];
}

export interface NutritionDayConfigWithMeals extends NutritionDayConfig {
    meals: NutritionMeal[];
}

export interface NutritionPlanWithMeals extends NutritionPlan {
    meals: NutritionMealWithStatus[];
    dayConfigs: NutritionDayConfigWithMeals[];
}
