import { Request, Response, Router } from 'express';
import { authenticate } from '../identity/token.service';
import { ForbiddenError, NotFoundError, ValidationError, createNutritionService } from './nutrition.service';

export const nutritionRouter = Router();
const nutritionService = createNutritionService();

/**
 * @swagger
 * tags:
 *   - name: Nutrition
 *     description: Nutrition plans, meals, and daily meal logs
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

nutritionRouter.get('/clients/:clientId/plans', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const plans = await nutritionService.listPlans(req.authenticatedUser!, Number(req.params.clientId));
    res.status(200).json({ data: plans, meta: { total: plans.length } });
  } catch (error) {
    handleError(res, error, 'No se pudieron cargar los planes de nutrición.');
  }
});

nutritionRouter.get('/clients/:clientId/today', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const plan = await nutritionService.getTodayPlan(req.authenticatedUser!, Number(req.params.clientId));
    res.status(200).json({ plan });
  } catch (error) {
    handleError(res, error, 'No se pudo cargar el plan de hoy.');
  }
});

nutritionRouter.post('/plans', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const plan = await nutritionService.createPlan(req.authenticatedUser!, {
      clientId: Number(req.body.clientId),
      planKey: req.body.planKey,
      label: req.body.label,
      goalCalories: Number(req.body.goalCalories),
      meals: Array.isArray(req.body.meals) ? req.body.meals : [],
    });
    res.status(201).json({ plan });
  } catch (error) {
    handleError(res, error, 'No se pudo crear el plan de nutrición.');
  }
});

nutritionRouter.patch('/clients/:clientId/plans/:planId/activate', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    await nutritionService.activatePlan(req.authenticatedUser!, Number(req.params.clientId), Number(req.params.planId));
    res.status(204).send();
  } catch (error) {
    handleError(res, error, 'No se pudo activar el plan de nutrición.');
  }
});

nutritionRouter.patch('/meals/:mealId/log', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    await nutritionService.logMeal(req.authenticatedUser!, Number(req.params.mealId), req.body.status);
    res.status(204).send();
  } catch (error) {
    handleError(res, error, 'No se pudo actualizar el registro de la comida.');
  }
});

export default nutritionRouter;
