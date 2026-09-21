export interface WeightPoint {
  weekStartDate: string;
  weightKg: number;
}

export interface AdherencePoint {
  weekStartDate: string;
  adherencePercent: number;
}

export interface ProgressSummary {
  totalCheckIns: number;
  reviewedCheckIns: number;
  startingWeightKg: number | null;
  currentWeightKg: number | null;
  weightChangeKg: number | null;
  averageAdherencePercent: number | null;
}

export interface ClientProgress {
  clientId: number;
  summary: ProgressSummary;
  weightSeries: WeightPoint[];
  adherenceSeries: AdherencePoint[];
}
