import { Request, Response, Router } from 'express';
import { createIdentityService } from './identity.service';
import { authenticate, authorizeRoles } from './token.service';

export const identityRouter = Router();
const identityService = createIdentityService();

// Called by index.ts after migrations run - must not execute at import time (users table may not exist yet).
export function bootstrapSuperAdmin(): Promise<void> {
  return identityService.bootstrapSuperAdmin();
}

/**
 * @swagger
 * tags:
 *   - name: Identity
 *     description: Authentication and session management
 */

identityRouter.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await identityService.register({
      email: req.body.email,
      password: req.body.password,
      fullName: req.body.fullName,
      role: req.body.role,
    });
    res.status(201).json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo completar el registro.';
    res.status(400).json({ error: { code: 'REGISTRATION_FAILED', message } });
  }
});

identityRouter.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await identityService.login({
      email: req.body.email,
      password: req.body.password,
    });
    res.status(200).json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo iniciar sesión.';
    res.status(401).json({ error: { code: 'UNAUTHENTICATED', message } });
  }
});

identityRouter.post('/refresh', async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await identityService.refresh(req.body.refreshToken);
    res.status(200).json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo renovar la sesión.';
    res.status(401).json({ error: { code: 'INVALID_REFRESH_TOKEN', message } });
  }
});

identityRouter.post('/logout', async (req: Request, res: Response): Promise<void> => {
  try {
    await identityService.logout(req.body.refreshToken);
    res.status(204).send();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo cerrar sesión.';
    res.status(400).json({ error: { code: 'LOGOUT_FAILED', message } });
  }
});

identityRouter.get('/me', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await identityService.getCurrentUser(req.authenticatedUser!.id);
    res.status(200).json({ user });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo cargar el usuario actual.';
    res.status(404).json({ error: { code: 'USER_NOT_FOUND', message } });
  }
});

identityRouter.patch('/me', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await identityService.updateOwnAccount(req.authenticatedUser!.id, {
      fullName: req.body.fullName,
      email: req.body.email,
    });
    res.status(200).json({ user });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo actualizar tu cuenta.';
    res.status(400).json({ error: { code: 'ACCOUNT_UPDATE_FAILED', message } });
  }
});

identityRouter.get('/admin-only', authenticate, authorizeRoles('super_admin'), (_req, res): void => {
  res.status(200).json({ message: 'Acceso concedido.' });
});

export default identityRouter;
