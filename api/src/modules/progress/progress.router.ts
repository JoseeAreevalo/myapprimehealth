import { Request, Response, Router } from 'express';
import { authenticate } from '../identity/token.service';
import { ForbiddenError, createProgressService } from './progress.service';

export const progressRouter = Router();
const progressService = createProgressService();

/**
 * @swagger
 * tags:
 *   - name: Progress
 *     description: Chart-ready progress read models derived from check-ins
 */

progressRouter.get('/clients/:clientId', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const progress = await progressService.getClientProgress(req.authenticatedUser!, Number(req.params.clientId));
    res.status(200).json({ progress });
  } catch (error) {
    if (error instanceof ForbiddenError) {
      res.status(403).json({ error: { code: 'FORBIDDEN', message: error.message } });
      return;
    }
    const message = error instanceof Error ? error.message : 'No se pudo cargar el progreso.';
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message } });
  }
});

export default progressRouter;
