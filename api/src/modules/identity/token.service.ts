import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { AuthenticatedUser, UserRole, userRoles } from './identity.types';

const jwtSecret = process.env.JWT_ACCESS_SECRET;

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

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  if (!jwtSecret) {
    next(new Error('JWT_ACCESS_SECRET must be configured.'));
    return;
  }

  const header = req.header('authorization');
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: { code: 'UNAUTHENTICATED', message: 'A valid access token is required.' } });
    return;
  }

  try {
    const payload = jwt.verify(header.slice(7), jwtSecret);
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

    req.authenticatedUser = { id: payload.sub, email: payload.email, fullName: payload.fullName, role: payload.role };
    next();
  } catch {
    res.status(401).json({ error: { code: 'UNAUTHENTICATED', message: 'The access token is invalid or expired.' } });
  }
}
