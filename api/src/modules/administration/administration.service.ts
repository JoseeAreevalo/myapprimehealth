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
        throw new ValidationError('Se requiere un correo válido.');
      }
      if (password.length < 8) {
        throw new ValidationError('La contraseña debe tener al menos 8 caracteres.');
      }
      if (!userRoles.includes(input.role as UserRole)) {
        throw new ValidationError(`El rol debe ser uno de: ${userRoles.join(', ')}.`);
      }
      if (await usersRepository.findByEmail(email)) {
        throw new ValidationError('Ese correo ya está en uso.');
      }

      const passwordHash = await bcrypt.hash(password, 12);
      const user = await usersRepository.create(email, passwordHash, input.fullName ?? null, input.role as UserRole);
      return toAdminUserView(user);
    },

    async updateUser(id: number, updates: { role?: string; isActive?: boolean }): Promise<AdminUserView> {
      if (updates.role !== undefined && !userRoles.includes(updates.role as UserRole)) {
        throw new ValidationError(`El rol debe ser uno de: ${userRoles.join(', ')}.`);
      }

      const user = await usersRepository.updateRoleAndStatus(id, {
        role: updates.role as UserRole | undefined,
        isActive: updates.isActive,
      });
      if (!user) {
        throw new ValidationError('Usuario no encontrado.');
      }
      return toAdminUserView(user);
    },
  };
}
