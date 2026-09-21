export interface Food {
  id: number;
  name: string;
  caloriesPer100g: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  barcode: string | null;
  source: string;
}
