function diffColor(diff: number): string {
  if (diff === 0) return 'text-emerald-300';
  return Math.abs(diff) <= 50 ? 'text-amber-300' : 'text-rose-300';
}

function DiffTag({ diff }: { diff: number }) {
  if (diff === 0) return null;
  return <span className="text-slate-500"> ({diff > 0 ? '+' : ''}{Math.round(diff)} vs meta)</span>;
}

// Recomputes on every render from controlled-input state, so totals update live as the user types.
// Macros (g) are the primary input; kcal is always the derived/final metric, per Atwater general
// factors: protein 4 kcal/g, carbohydrate 4 kcal/g, fat 9 kcal/g (USDA/FAO standard).
export default function NutritionLiveTotals({
  goalCalories,
  mealsTotalCalories,
  macroTotalCalories,
}: {
  goalCalories: number;
  mealsTotalCalories: number;
  macroTotalCalories: number;
}) {
  const mealsDiff = mealsTotalCalories - goalCalories;
  const macroDiff = macroTotalCalories - goalCalories;

  return (
    <div className="rounded-lg border border-white/8 bg-white/[0.02] p-2.5">
      <p className="text-[11px] text-slate-400">
        Calorías resultantes de los macros:{' '}
        <span className={`text-sm font-semibold ${diffColor(macroDiff)}`}>{Math.round(macroTotalCalories)} kcal</span>
        <DiffTag diff={macroDiff} />
      </p>
      <p className="mt-1 text-[10px] text-slate-500">4 kcal/g proteína · 4 kcal/g carbohidratos · 9 kcal/g grasa (factores de Atwater)</p>
      <p className="mt-2 text-[11px] text-slate-400">
        Suma de comidas: <span className={`font-semibold ${diffColor(mealsDiff)}`}>{Math.round(mealsTotalCalories)} kcal</span>
        <DiffTag diff={mealsDiff} />
      </p>
    </div>
  );
}
