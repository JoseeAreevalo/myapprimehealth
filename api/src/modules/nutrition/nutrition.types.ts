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

export interface NutritionMealInput {
  name: string;
  detail?: string | null;
  mealTime?: string | null;
  calories: number;
  sortOrder?: number;
}

export interface NutritionMeal {
  id: number;
  planId: number;
  name: string;
  detail: string | null;
  mealTime: string | null;
  calories: number;
  sortOrder: number;
}

export interface NutritionMealWithStatus extends NutritionMeal {
  status: MealStatus;
}

export interface NutritionPlanWithMeals extends NutritionPlan {
  meals: NutritionMealWithStatus[];
}
