function diffColor(diff: number): string {
  if (diff === 0) return 'text-emerald-300';
  return Math.abs(diff) <= 50 ? 'text-amber-300' : 'text-rose-300';
}

function DiffTag({ diff }: { diff: number }) {
  if (diff === 0) return null;
  return <span className="text-slate-500"> ({diff > 0 ? '+' : ''}{Math.round(diff)} vs meta)</span>;
}

// Recomputes on every render from controlled-input state, so totals update live as the user types.
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
    <div className="grid grid-cols-2 gap-2 rounded-lg border border-white/8 bg-white/[0.02] p-2.5 text-[11px] text-slate-400">
      <p>
        Suma de comidas: <span className={`font-semibold ${diffColor(mealsDiff)}`}>{Math.round(mealsTotalCalories)} kcal</span>
        <DiffTag diff={mealsDiff} />
      </p>
      <p>
        Según macros: <span className={`font-semibold ${diffColor(macroDiff)}`}>{Math.round(macroTotalCalories)} kcal</span>
        <DiffTag diff={macroDiff} />
      </p>
    </div>
  );
}
