export interface TrainingPlan {
    id: number;
    clientId: number;
    coachId: number;
    label: string;
    durationWeeks: number;
    isActive: boolean;
}

export interface TrainingExerciseInput {
    name: string;
    targetSets: number;
    targetReps: number;
    targetWeightKg?: number | null;
    targetRir?: number | null;
}

export interface TrainingDayInput {
    label: string;
    weekday?: number | null;
    exercises: TrainingExerciseInput[];
}

export interface TrainingExercise {
    id: number;
    dayId: number;
    name: string;
    targetSets: number;
    targetReps: number;
    targetWeightKg: number | null;
    targetRir: number | null;
    sortOrder: number;
}

export interface SetLog {
    setNumber: number;
    actualReps: number | null;
    actualWeightKg: number | null;
    actualRir: number | null;
}

export interface TrainingExerciseWithLogs extends TrainingExercise {
    logs: SetLog[];
}

export interface TrainingDay {
    id: number;
    planId: number;
    dayOrder: number;
    label: string;
    weekday: number | null;
}

export interface TrainingDayWithExercises extends TrainingDay {
    exercises: TrainingExerciseWithLogs[];
}

export interface TrainingPlanWithDays extends TrainingPlan {
    days: TrainingDayWithExercises[];
}

export interface TrainingHistoryExercise {
    exerciseId: number;
    exerciseName: string;
    dayLabel: string;
    sets: SetLog[];
}

export interface TrainingHistoryDay {
    date: string;
    exercises: TrainingHistoryExercise[];
}
