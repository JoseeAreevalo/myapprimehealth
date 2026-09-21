export type CheckInStatus = 'submitted' | 'reviewed';

export interface CheckIn {
    id: number;
    clientId: number;
    coachId: number | null;
    weekStartDate: string;
    weightKg: number | null;
    measurements: Record<string, number> | null;
    adherencePercent: number | null;
    notes: string | null;
    status: CheckInStatus;
    coachFeedback: string | null;
    reviewedAt: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface CheckInInput {
    weightKg?: number | null;
    measurements?: Record<string, number> | null;
    adherencePercent?: number | null;
    notes?: string | null;
}
