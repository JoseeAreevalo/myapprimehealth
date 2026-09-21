export interface Profile {
  userId: number;
  phone: string | null;
  birthDate: string | null;
  bio: string | null;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export type CoachClientStatus = 'active' | 'paused' | 'ended';

export interface CoachClientLink {
  id: number;
  coachId: number;
  clientId: number;
  status: CoachClientStatus;
  assignedAt: string;
  endedAt: string | null;
}

export interface PersonSummary {
  id: number;
  email: string;
  fullName: string | null;
  role: string;
}
