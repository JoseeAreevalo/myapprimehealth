export interface TrainingPlan {
    id: number;
    clientId: number;
    coachId: number;
    label: string;
    isActive: boolean;
}

export interface TrainingExerciseInput {
    name: string;
    targetSets: number;
    targetReps: number;
    targetWeightKg?: number | null;
}

export interface TrainingDayInput {
    label: string;
    exercises: TrainingExerciseInput[];
}

export interface TrainingExercise {
    id: number;
    dayId: number;
    name: string;
    targetSets: number;
    targetReps: number;
    targetWeightKg: number | null;
    sortOrder: number;
}

export interface SetLog {
    setNumber: number;
    actualReps: number | null;
    actualWeightKg: number | null;
}

export interface TrainingExerciseWithLogs extends TrainingExercise {
    logs: SetLog[];
}

export interface TrainingDay {
    id: number;
    planId: number;
    dayOrder: number;
    label: string;
}

export interface TrainingDayWithExercises extends TrainingDay {
    exercises: TrainingExerciseWithLogs[];
}

export interface TrainingPlanWithDays extends TrainingPlan {
    days: TrainingDayWithExercises[];
}
