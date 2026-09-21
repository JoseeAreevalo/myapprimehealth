import { Request, Response, Router } from 'express';
import { authenticate } from '../identity/token.service';
import { ForbiddenError, ValidationError, createWorkoutsService } from './workouts.service';

export const workoutsRouter = Router();
const workoutsService = createWorkoutsService();

/**
 * @swagger
 * tags:
 *   - name: Workouts
 *     description: Personal daily workout tracking
 */

function handleError(res: Response, error: unknown, fallbackMessage: string): void {
  if (error instanceof ForbiddenError) {
    res.status(403).json({ error: { code: 'FORBIDDEN', message: error.message } });
    return;
  }
  if (error instanceof ValidationError) {
    res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: error.message } });
    return;
  }
  const message = error instanceof Error ? error.message : fallbackMessage;
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message } });
}

workoutsRouter.get('/today', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const workout = await workoutsService.getToday(req.authenticatedUser!);
    res.status(200).json({ workout });
  } catch (error) {
    handleError(res, error, 'No se pudo cargar el entrenamiento de hoy.');
  }
});

workoutsRouter.put('/today', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const workout = await workoutsService.setToday(req.authenticatedUser!, {
      name: req.body.name,
      durationMinutes: Number(req.body.durationMinutes),
    });
    res.status(200).json({ workout });
  } catch (error) {
    handleError(res, error, 'No se pudo guardar el entrenamiento.');
  }
});

workoutsRouter.patch('/:id/complete', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const workout = await workoutsService.complete(req.authenticatedUser!, Number(req.params.id));
    res.status(200).json({ workout });
  } catch (error) {
    handleError(res, error, 'No se pudo actualizar el entrenamiento.');
  }
});

export default workoutsRouter;
