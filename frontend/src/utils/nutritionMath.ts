// Shared calorie/macro math for live-updating nutrition plan totals.
export function sumMealCalories(meals: { calories: string | number }[]): number {
  return meals.reduce((sum, meal) => sum + (Number(meal.calories) || 0), 0);
}

export function macroCalories(proteinG: string | number, carbsG: string | number, fatG: string | number): number {
  return (Number(proteinG) || 0) * 4 + (Number(carbsG) || 0) * 4 + (Number(fatG) || 0) * 9;
}
