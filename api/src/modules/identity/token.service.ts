import { createHash, randomBytes } from 'crypto';
import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { AuthenticatedUser, UserRole, userRoles } from './identity.types';

const accessTokenSecret = process.env.JWT_ACCESS_SECRET ?? process.env.JWT_SECRET ?? 'development-access-secret';

declare global {
  namespace Express {
    interface Request {
      authenticatedUser?: AuthenticatedUser;
    }
  }
}

function isUserRole(value: unknown): value is UserRole {
  return typeof value === 'string' && userRoles.includes(value as UserRole);
}

export function createAccessToken(user: Pick<AuthenticatedUser, 'id' | 'email' | 'role' | 'fullName'>): string {
  return jwt.sign(
    {
      sub: String(user.id),
      email: user.email,
      role: user.role,
      fullName: user.fullName ?? '',
    },
    accessTokenSecret,
    { expiresIn: '15m' },
  );
}

export function createRefreshToken(): string {
  return randomBytes(32).toString('hex');
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const header = req.header('authorization');
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: { code: 'UNAUTHENTICATED', message: 'A valid access token is required.' } });
    return;
  }

  try {
    const payload = jwt.verify(header.slice(7), accessTokenSecret);
    if (
      typeof payload !== 'object' ||
      payload === null ||
      typeof payload.sub !== 'string' ||
      typeof payload.email !== 'string' ||
      typeof payload.fullName !== 'string' ||
      !isUserRole(payload.role)
    ) {
      res.status(401).json({ error: { code: 'UNAUTHENTICATED', message: 'The access token is invalid.' } });
      return;
    }

    req.authenticatedUser = {
      id: Number(payload.sub),
      email: payload.email,
      fullName: payload.fullName || null,
      role: payload.role,
    };
    next();
  } catch {
    res.status(401).json({ error: { code: 'UNAUTHENTICATED', message: 'The access token is invalid or expired.' } });
  }
}

export function authorizeRoles(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.authenticatedUser) {
      res.status(401).json({ error: { code: 'UNAUTHENTICATED', message: 'A valid access token is required.' } });
      return;
    }

    if (!roles.includes(req.authenticatedUser.role)) {
      res.status(403).json({ error: { code: 'FORBIDDEN', message: 'You do not have permission to perform this action.' } });
      return;
    }

    next();
  };
}
