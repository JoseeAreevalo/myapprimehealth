import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { refreshSessionsRepository, usersRepository } from './identity.repository';
import { createAccessToken, createRefreshExpiry, createRefreshToken, hashToken } from './token.service';
import { AuthenticatedUser, LoginResult, UserRole } from './identity.types';

const DEFAULT_ROLE: UserRole = 'client';

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function toAuthenticatedUser(user: { id: number; email: string; fullName: string | null; role: UserRole }): AuthenticatedUser {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
  };
}

async function issueSession(user: AuthenticatedUser): Promise<LoginResult> {
  const accessToken = createAccessToken(user);
  const refreshToken = createRefreshToken();

  await refreshSessionsRepository.create({
    id: randomUUID(),
    userId: user.id,
    tokenHash: hashToken(refreshToken),
    expiresAt: createRefreshExpiry().toISOString(),
  });

  return { accessToken, refreshToken, user };
}

export function createIdentityService() {
  return {
    async bootstrapSuperAdmin(): Promise<void> {
      const email = 'super_admin@primehealth.local';
      const existing = await usersRepository.findByEmail(email);
      if (existing) return;

      const passwordHash = await bcrypt.hash('PrimeHealth123!', 12);
      await usersRepository.create(email, passwordHash, 'Super Admin', 'super_admin');
    },

    async register(input: { email: string; password: string; fullName?: string | null; role?: string }): Promise<LoginResult> {
      const email = normalizeEmail(input.email);
      const password = String(input.password ?? '');
      const fullName = input.fullName ?? null;

      if (!email || !password) {
        throw new Error('El correo y la contraseña son obligatorios.');
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error('El formato del correo no es válido.');
      }

      if (password.length < 8) {
        throw new Error('La contraseña debe tener al menos 8 caracteres.');
      }

      if (await usersRepository.findByEmail(email)) {
        throw new Error('Ese correo ya está en uso.');
      }

      // Self-registration is always a client; coaches and admins are provisioned by an administrator.
      const passwordHash = await bcrypt.hash(password, 12);
      const createdUser = await usersRepository.create(email, passwordHash, fullName, DEFAULT_ROLE);

      return issueSession(toAuthenticatedUser(createdUser));
    },

    async login(input: { email: string; password: string }): Promise<LoginResult> {
      const email = normalizeEmail(input.email);
      const password = String(input.password ?? '');

      if (!email || !password) {
        throw new Error('El correo y la contraseña son obligatorios.');
      }

      const userRecord = await usersRepository.findByEmail(email);
      if (!userRecord || !userRecord.isActive) {
        throw new Error('Credenciales inválidas.');
      }

      const passwordMatches = await bcrypt.compare(password, userRecord.passwordHash);
      if (!passwordMatches) {
        throw new Error('Credenciales inválidas.');
      }

      return issueSession(toAuthenticatedUser(userRecord));
    },

    async refresh(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
      const token = (refreshToken ?? '').trim();
      if (!token) {
        throw new Error('El refresh token es obligatorio.');
      }

      const tokenHash = hashToken(token);
      const session = await refreshSessionsRepository.findByTokenHash(tokenHash);
      if (!session) {
        throw new Error('Refresh token inválido.');
      }

      if (session.revokedAt) {
        // Reuse of an already-rotated token indicates the token family may be compromised.
        await refreshSessionsRepository.revokeAllForUser(session.userId);
        throw new Error('Refresh token inválido.');
      }

      if (new Date(session.expiresAt).getTime() < Date.now()) {
        throw new Error('El refresh token expiró.');
      }

      const user = await usersRepository.findById(session.userId);
      if (!user || !user.isActive) {
        throw new Error('Refresh token inválido.');
      }

      const authenticatedUser = toAuthenticatedUser(user);
      const newRefreshToken = createRefreshToken();
      const newSession = await refreshSessionsRepository.create({
        id: randomUUID(),
        userId: user.id,
        tokenHash: hashToken(newRefreshToken),
        expiresAt: createRefreshExpiry().toISOString(),
      });
      await refreshSessionsRepository.revoke(session.id, newSession.id);

      return {
        accessToken: createAccessToken(authenticatedUser),
        refreshToken: newRefreshToken,
      };
    },

    async logout(refreshToken: string): Promise<void> {
      const token = (refreshToken ?? '').trim();
      if (!token) return;

      const session = await refreshSessionsRepository.findByTokenHash(hashToken(token));
      if (session && !session.revokedAt) {
        await refreshSessionsRepository.revoke(session.id, null);
      }
    },

    async getCurrentUser(id: number): Promise<AuthenticatedUser> {
      const user = await usersRepository.findById(id);
      if (!user || !user.isActive) {
        throw new Error('Usuario no encontrado.');
      }

      return toAuthenticatedUser(user);
    },

    async updateOwnAccount(id: number, updates: { fullName?: string | null; email?: string }): Promise<AuthenticatedUser> {
      const patch: { fullName?: string | null; email?: string } = {};

      if (updates.fullName !== undefined) {
        patch.fullName = updates.fullName?.trim() || null;
      }

      if (updates.email !== undefined) {
        const email = normalizeEmail(updates.email);
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          throw new Error('El formato del correo no es válido.');
        }
        const existing = await usersRepository.findByEmail(email);
        if (existing && existing.id !== id) {
          throw new Error('Ese correo ya está en uso.');
        }
        patch.email = email;
      }

      const updated = await usersRepository.updateAccount(id, patch);
      if (!updated) {
        throw new Error('Usuario no encontrado.');
      }

      return toAuthenticatedUser(updated);
    },
  };
}
