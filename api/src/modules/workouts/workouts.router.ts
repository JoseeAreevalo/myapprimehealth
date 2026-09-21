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
    const { workout, sets } = await workoutsService.getToday(req.authenticatedUser!);
    res.status(200).json({ workout, sets });
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

workoutsRouter.post('/:id/sets', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const set = await workoutsService.addSet(req.authenticatedUser!, Number(req.params.id), {
      exerciseName: req.body.exerciseName,
      sets: Number(req.body.sets),
      reps: Number(req.body.reps),
      weightKg: req.body.weightKg != null ? Number(req.body.weightKg) : null,
    });
    res.status(201).json({ set });
  } catch (error) {
    handleError(res, error, 'No se pudo agregar la serie.');
  }
});

workoutsRouter.delete('/sets/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    await workoutsService.deleteSet(req.authenticatedUser!, Number(req.params.id));
    res.status(204).send();
  } catch (error) {
    handleError(res, error, 'No se pudo eliminar la serie.');
  }
});

export default workoutsRouter;
