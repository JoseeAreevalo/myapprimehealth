import { scalePer100g } from '../utils/nutritionMath';
import FoodSearchAdd, { FoodOption } from './FoodSearchAdd';

export interface MealItemDraft {
    foodId: number;
    foodName: string;
    grams: string;
    caloriesPer100g: number;
    proteinGPer100g: number;
    carbsGPer100g: number;
    fatGPer100g: number;
}

export function mealItemsTotals(items: MealItemDraft[]) {
    return items.reduce(
        (acc, item) => {
            const grams = Number(item.grams) || 0;
            return {
                calories: acc.calories + scalePer100g(item.caloriesPer100g, grams),
                proteinG: acc.proteinG + scalePer100g(item.proteinGPer100g, grams),
                carbsG: acc.carbsG + scalePer100g(item.carbsGPer100g, grams),
                fatG: acc.fatG + scalePer100g(item.fatGPer100g, grams),
            };
        },
        { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 },
    );
}

// Draft-mode food-item builder for a meal that doesn't exist in the DB yet (items are submitted
// together with the plan/meal). For an already-saved meal, items are added/removed via the API instead.
export default function MealItemsEditor({ items, onChange }: { items: MealItemDraft[]; onChange: (items: MealItemDraft[]) => void }) {
    const addItem = (food: FoodOption) => {
        onChange([
            ...items,
            { foodId: food.id, foodName: food.name, grams: '100', caloriesPer100g: food.caloriesPer100g, proteinGPer100g: food.proteinG, carbsGPer100g: food.carbsG, fatGPer100g: food.fatG },
        ]);
    };
    const updateGrams = (index: number, grams: string) => onChange(items.map((item, i) => (i === index ? { ...item, grams } : item)));
    const removeItem = (index: number) => onChange(items.filter((_, i) => i !== index));
    const totals = mealItemsTotals(items);

    return (
        <div className="space-y-1.5 rounded-lg border border-white/7 bg-white/[0.02] p-2">
            <FoodSearchAdd onSelect={addItem} />
            {items.length > 0 && (
                <ul className="space-y-1">
                    {items.map((item, index) => (
                        <li className="flex items-center gap-2 text-[11px]" key={index}>
                            <span className="flex-1 truncate text-slate-300">{item.foodName}</span>
                            <input
                                className="w-14 rounded-lg border border-white/8 bg-white/[0.03] px-1.5 py-1 text-slate-100"
                                onChange={(event) => updateGrams(index, event.target.value)}
                                type="number"
                                value={item.grams}
                            />
                            <span className="text-slate-500">g</span>
                            <span className="w-14 text-right text-slate-400">{Math.round(scalePer100g(item.caloriesPer100g, Number(item.grams) || 0))} kcal</span>
                            <button className="text-rose-300 hover:text-rose-200" onClick={() => removeItem(index)} type="button">
                                ✕
                            </button>
                        </li>
                    ))}
                </ul>
            )}
            {items.length > 0 && (
                <p className="text-[10px] text-slate-500">
                    Subtotal: <span className="font-semibold text-slate-300">{Math.round(totals.calories)} kcal</span> · P {totals.proteinG.toFixed(1)}g · C{' '}
                    {totals.carbsG.toFixed(1)}g · G {totals.fatG.toFixed(1)}g
                </p>
            )}
        </div>
    );
}
