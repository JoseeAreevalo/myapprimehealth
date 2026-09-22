export interface ActivityPlan {
    id: number;
    clientId: number;
    coachId: number;
    isActive: boolean;
}

export interface CardioTarget {
    id: number;
    planId: number;
    weekday: number;
    minutes: number;
}

export interface StepsTarget {
    id: number;
    planId: number;
    weekday: number;
    stepsTarget: number;
}

export interface ActivityLog {
    clientId: number;
    logDate: string;
    actualCardioMinutes: number | null;
    actualSteps: number | null;
}

export interface ActivityPlanWithTargets extends ActivityPlan {
    cardioTargets: CardioTarget[];
    stepsTargets: StepsTarget[];
    todayLog: ActivityLog | null;
}

export interface CardioTargetInput {
    weekday: number;
    minutes: number;
}

export interface StepsTargetInput {
    weekday: number;
    stepsTarget: number;
}
