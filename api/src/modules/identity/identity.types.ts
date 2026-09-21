export const userRoles = ['super_admin', 'coach', 'client'] as const;

export type UserRole = (typeof userRoles)[number];

export interface AuthenticatedUser {
  id: number;
  email: string;
  role: UserRole;
  fullName: string | null;
}

export interface IdentityUser {
  id: number;
  email: string;
  passwordHash: string;
  fullName: string | null;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export interface RefreshSession {
  id: string;
  userId: number;
  tokenHash: string;
  createdAt: string;
  expiresAt: string;
  revokedAt: string | null;
  replacedByTokenId: string | null;
  rotationCounter: number;
  updatedAt: string;
}

export interface AuditEntry {
  id: number;
  action: string;
  actorUserId: number | null;
  targetType: string | null;
  targetId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  user: AuthenticatedUser;
}
