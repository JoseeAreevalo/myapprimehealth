// Shared calorie/macro math for live-updating nutrition plan totals.
export function sumMealCalories(meals: { calories: string | number }[]): number {
  return meals.reduce((sum, meal) => sum + (Number(meal.calories) || 0), 0);
}

// Scales a per-100g nutritional value (assumed cooked/prepared weight) by a gram amount.
export function scalePer100g(valuePer100g: number, grams: number): number {
  return Math.round(((valuePer100g * grams) / 100) * 10) / 10;
}

export function macroCalories(proteinG: string | number, carbsG: string | number, fatG: string | number): number {
  return (Number(proteinG) || 0) * 4 + (Number(carbsG) || 0) * 4 + (Number(fatG) || 0) * 9;
}
