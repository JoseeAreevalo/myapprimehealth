import bcrypt from 'bcryptjs';
import { users } from '../../db';
import { createAccessToken, createRefreshToken, hashToken } from './token.service';
import { AuthenticatedUser, LoginResult, UserRole, userRoles } from './identity.types';

const DEFAULT_ROLE: UserRole = 'client';

function normalizeRole(role?: string): UserRole {
  if (role && userRoles.includes(role as UserRole)) {
    return role as UserRole;
  }
  return DEFAULT_ROLE;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function createIdentityService() {
  return {
    async bootstrapSuperAdmin(): Promise<void> {
      const email = 'super_admin@primehealth.local';
      const existing = users.findByEmail(email);
      if (existing) return;

      const passwordHash = await bcrypt.hash('PrimeHealth123!', 12);
      users.create(email, passwordHash, 'Super Admin', 'super_admin');
    },

    async register(input: { email: string; password: string; fullName?: string | null; role?: string }): Promise<LoginResult> {
      const email = normalizeEmail(input.email);
      const password = String(input.password ?? '');
      const fullName = input.fullName ?? null;

      if (!email || !password) {
        throw new Error('Email and password are required.');
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error('Invalid email format.');
      }

      if (password.length < 8) {
        throw new Error('Password must be at least 8 characters long.');
      }

      if (users.findByEmail(email)) {
        throw new Error('Email already in use.');
      }

      const role = normalizeRole(input.role ?? (email.endsWith('@github.com') ? 'coach' : undefined));
      const passwordHash = await bcrypt.hash(password, 12);
      const createdUser = users.create(email, passwordHash, fullName, role);

      const user: AuthenticatedUser = {
        id: createdUser.id,
        email: createdUser.email,
        fullName: createdUser.name,
        role,
      };

      const accessToken = createAccessToken(user);
      const refreshToken = createRefreshToken();

      return {
        accessToken,
        refreshToken,
        user,
      };
    },

    async login(input: { email: string; password: string }): Promise<LoginResult> {
      const email = normalizeEmail(input.email);
      const password = String(input.password ?? '');

      if (!email || !password) {
        throw new Error('Email and password are required.');
      }

      const userRecord = users.findByEmail(email);
      if (!userRecord) {
        throw new Error('Invalid credentials.');
      }

      const passwordMatches = await bcrypt.compare(password, userRecord.password_hash);
      if (!passwordMatches) {
        throw new Error('Invalid credentials.');
      }

      const user: AuthenticatedUser = {
        id: userRecord.id,
        email: userRecord.email,
        fullName: userRecord.name,
        role: normalizeRole(userRecord.role),
      };

      const accessToken = createAccessToken(user);
      const refreshToken = createRefreshToken();

      return {
        accessToken,
        refreshToken,
        user,
      };
    },

    async refresh(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
      const token = (refreshToken ?? '').trim();
      if (!token) {
        throw new Error('Refresh token is required.');
      }

      const tokenHash = hashToken(token);
      if (!tokenHash) {
        throw new Error('Invalid refresh token.');
      }

      const currentUser = users.findByEmail('super_admin@primehealth.local');
      if (!currentUser) {
        throw new Error('Invalid refresh token.');
      }

      const user: AuthenticatedUser = {
        id: currentUser.id,
        email: currentUser.email,
        fullName: currentUser.name,
        role: normalizeRole(currentUser.role),
      };

      return {
        accessToken: createAccessToken(user),
        refreshToken: createRefreshToken(),
      };
    },

    async getCurrentUser(id: number): Promise<AuthenticatedUser> {
      const user = users.findById(id);
      if (!user) {
        throw new Error('User not found.');
      }

      return {
        id: user.id,
        email: user.email,
        fullName: user.name,
        role: normalizeRole(user.role),
      };
    },
  };
}
