// Shared training-plan math for live-updating volume totals as sets/reps/weight are edited.
export function dayVolumeTotals(exercises: { targetSets: string; targetReps: string; targetWeightKg: string }[]) {
  return exercises.reduce(
    (acc, exercise) => {
      const sets = Number(exercise.targetSets) || 0;
      const reps = Number(exercise.targetReps) || 0;
      const weight = Number(exercise.targetWeightKg) || 0;
      return {
        totalSets: acc.totalSets + sets,
        totalReps: acc.totalReps + sets * reps,
        totalVolumeKg: acc.totalVolumeKg + sets * reps * weight,
      };
    },
    { totalSets: 0, totalReps: 0, totalVolumeKg: 0 },
  );
}

export function loggedVolume(rows: { reps: string; weight: string }[]) {
  return rows.reduce((sum, row) => sum + (Number(row.reps) || 0) * (Number(row.weight) || 0), 0);
}
