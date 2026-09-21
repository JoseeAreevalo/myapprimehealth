import { Request, Response, Router } from 'express';
import { createIdentityService } from './identity.service';
import { authenticate, authorizeRoles } from './token.service';

export const identityRouter = Router();
const identityService = createIdentityService();

void identityService.bootstrapSuperAdmin();

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
    const message = error instanceof Error ? error.message : 'Registration failed.';
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
    const message = error instanceof Error ? error.message : 'Login failed.';
    res.status(401).json({ error: { code: 'UNAUTHENTICATED', message } });
  }
});

identityRouter.post('/refresh', async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await identityService.refresh(req.body.refreshToken);
    res.status(200).json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Refresh failed.';
    res.status(401).json({ error: { code: 'INVALID_REFRESH_TOKEN', message } });
  }
});

identityRouter.post('/logout', async (req: Request, res: Response): Promise<void> => {
  try {
    await identityService.logout(req.body.refreshToken);
    res.status(204).send();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Logout failed.';
    res.status(400).json({ error: { code: 'LOGOUT_FAILED', message } });
  }
});

identityRouter.get('/me', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await identityService.getCurrentUser(req.authenticatedUser!.id);
    res.status(200).json({ user });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to load the current user.';
    res.status(404).json({ error: { code: 'USER_NOT_FOUND', message } });
  }
});

identityRouter.get('/admin-only', authenticate, authorizeRoles('super_admin'), (_req, res): void => {
  res.status(200).json({ message: 'Access granted.' });
});

export default identityRouter;
