import { Request, Response, Router } from 'express';
import { authenticate } from '../identity/token.service';
import { ForbiddenError, NotFoundError, ValidationError, createTrainingService } from './training.service';

export const trainingRouter = Router();
const trainingService = createTrainingService();

/**
 * @swagger
 * tags:
 *   - name: Training
 *     description: Weekly training plans, exercises, and set-by-set execution logs
 */

function handleError(res: Response, error: unknown, fallbackMessage: string): void {
  if (error instanceof ForbiddenError) {
    res.status(403).json({ error: { code: 'FORBIDDEN', message: error.message } });
    return;
  }
  if (error instanceof NotFoundError) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: error.message } });
    return;
  }
  if (error instanceof ValidationError) {
    res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: error.message } });
    return;
  }
  const message = error instanceof Error ? error.message : fallbackMessage;
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message } });
}

trainingRouter.get('/clients/:clientId/plan', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const plan = await trainingService.getActivePlan(req.authenticatedUser!, Number(req.params.clientId));
    res.status(200).json({ plan });
  } catch (error) {
    handleError(res, error, 'No se pudo cargar el plan de entrenamiento.');
  }
});

trainingRouter.post('/plans', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const plan = await trainingService.createPlan(req.authenticatedUser!, {
      clientId: Number(req.body.clientId),
      label: req.body.label,
      days: Array.isArray(req.body.days) ? req.body.days : [],
    });
    res.status(201).json({ plan });
  } catch (error) {
    handleError(res, error, 'No se pudo crear el plan de entrenamiento.');
  }
});

trainingRouter.patch('/plans/:planId', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const plan = await trainingService.updatePlan(req.authenticatedUser!, Number(req.params.planId), { label: req.body.label });
    res.status(200).json({ plan });
  } catch (error) {
    handleError(res, error, 'No se pudo actualizar el plan de entrenamiento.');
  }
});

trainingRouter.post('/plans/:planId/days', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    await trainingService.addDay(req.authenticatedUser!, Number(req.params.planId), req.body.label);
    res.status(201).send();
  } catch (error) {
    handleError(res, error, 'No se pudo agregar el d\u00eda.');
  }
});

trainingRouter.delete('/days/:dayId', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    await trainingService.deleteDay(req.authenticatedUser!, Number(req.params.dayId));
    res.status(204).send();
  } catch (error) {
    handleError(res, error, 'No se pudo eliminar el d\u00eda.');
  }
});

trainingRouter.post('/days/:dayId/exercises', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const exercise = await trainingService.addExercise(req.authenticatedUser!, Number(req.params.dayId), {
      name: req.body.name,
      targetSets: Number(req.body.targetSets),
      targetReps: Number(req.body.targetReps),
      targetWeightKg: req.body.targetWeightKg != null ? Number(req.body.targetWeightKg) : null,
    });
    res.status(201).json({ exercise });
  } catch (error) {
    handleError(res, error, 'No se pudo agregar el ejercicio.');
  }
});

trainingRouter.patch('/exercises/:exerciseId', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const exercise = await trainingService.updateExercise(req.authenticatedUser!, Number(req.params.exerciseId), {
      name: req.body.name,
      targetSets: req.body.targetSets != null ? Number(req.body.targetSets) : undefined,
      targetReps: req.body.targetReps != null ? Number(req.body.targetReps) : undefined,
      targetWeightKg: req.body.targetWeightKg != null ? Number(req.body.targetWeightKg) : undefined,
    });
    res.status(200).json({ exercise });
  } catch (error) {
    handleError(res, error, 'No se pudo actualizar el ejercicio.');
  }
});

trainingRouter.delete('/exercises/:exerciseId', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    await trainingService.deleteExercise(req.authenticatedUser!, Number(req.params.exerciseId));
    res.status(204).send();
  } catch (error) {
    handleError(res, error, 'No se pudo eliminar el ejercicio.');
  }
});

trainingRouter.put('/exercises/:exerciseId/logs', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    await trainingService.logSets(req.authenticatedUser!, Number(req.params.exerciseId), Array.isArray(req.body.sets) ? req.body.sets : []);
    res.status(204).send();
  } catch (error) {
    handleError(res, error, 'No se pudo guardar el registro del ejercicio.');
  }
});

trainingRouter.get('/clients/:clientId/history', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const now = new Date();
    const year = req.query.year != null ? Number(req.query.year) : now.getFullYear();
    const month = req.query.month != null ? Number(req.query.month) : now.getMonth() + 1;
    const days = await trainingService.getMonthHistory(req.authenticatedUser!, Number(req.params.clientId), year, month);
    res.status(200).json({ data: days });
  } catch (error) {
    handleError(res, error, 'No se pudo cargar el historial de entrenamiento.');
  }
});

export default trainingRouter;
