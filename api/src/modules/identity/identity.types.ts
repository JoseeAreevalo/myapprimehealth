export const userRoles = ['superAdmin', 'coach', 'client'] as const;

export type UserRole = (typeof userRoles)[number];

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
  fullName: string;
}
