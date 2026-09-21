import { Request, Response, Router } from 'express';
import { authenticate } from '../identity/token.service';
import { ForbiddenError, ValidationError, createExercisesService } from './exercises.service';

export const exercisesRouter = Router();
const exercisesService = createExercisesService();

/**
 * @swagger
 * tags:
 *   - name: Exercises
 *     description: Exercise name catalog for training plans
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

exercisesRouter.get('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const exercises = await exercisesService.search(String(req.query.search ?? ''));
    res.status(200).json({ data: exercises, meta: { total: exercises.length } });
  } catch (error) {
    handleError(res, error, 'No se pudieron buscar los ejercicios.');
  }
});

exercisesRouter.post('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const exercise = await exercisesService.create(req.authenticatedUser!, {
      name: req.body.name,
      muscleGroup: req.body.muscleGroup,
    });
    res.status(201).json({ exercise });
  } catch (error) {
    handleError(res, error, 'No se pudo crear el ejercicio.');
  }
});

export default exercisesRouter;
