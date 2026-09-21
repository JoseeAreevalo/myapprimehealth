import bcrypt from 'bcryptjs';
import { usersRepository } from '../identity/identity.repository';
import { UserRole, userRoles } from '../identity/identity.types';

class ValidationError extends Error {}

export { ValidationError };

export interface AdminUserView {
  id: number;
  email: string;
  fullName: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
}

function toAdminUserView(user: { id: number; email: string; fullName: string | null; role: UserRole; isActive: boolean; createdAt: string }): AdminUserView {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt,
  };
}

export function createAdministrationService() {
  return {
    async listUsers(): Promise<AdminUserView[]> {
      const users = await usersRepository.listAll();
      return users.map(toAdminUserView);
    },

    async createUser(input: { email: string; password: string; fullName?: string | null; role: string }): Promise<AdminUserView> {
      const email = input.email?.trim().toLowerCase();
      const password = String(input.password ?? '');

      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new ValidationError('A valid email is required.');
      }
      if (password.length < 8) {
        throw new ValidationError('Password must be at least 8 characters long.');
      }
      if (!userRoles.includes(input.role as UserRole)) {
        throw new ValidationError(`Role must be one of: ${userRoles.join(', ')}.`);
      }
      if (await usersRepository.findByEmail(email)) {
        throw new ValidationError('Email already in use.');
      }

      const passwordHash = await bcrypt.hash(password, 12);
      const user = await usersRepository.create(email, passwordHash, input.fullName ?? null, input.role as UserRole);
      return toAdminUserView(user);
    },

    async updateUser(id: number, updates: { role?: string; isActive?: boolean }): Promise<AdminUserView> {
      if (updates.role !== undefined && !userRoles.includes(updates.role as UserRole)) {
        throw new ValidationError(`Role must be one of: ${userRoles.join(', ')}.`);
      }

      const user = await usersRepository.updateRoleAndStatus(id, {
        role: updates.role as UserRole | undefined,
        isActive: updates.isActive,
      });
      if (!user) {
        throw new ValidationError('User not found.');
      }
      return toAdminUserView(user);
    },
  };
}
