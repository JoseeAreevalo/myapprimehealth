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
      proteinGTarget: req.body.proteinGTarget != null ? Number(req.body.proteinGTarget) : undefined,
      carbsGTarget: req.body.carbsGTarget != null ? Number(req.body.carbsGTarget) : undefined,
      fatGTarget: req.body.fatGTarget != null ? Number(req.body.fatGTarget) : undefined,
      waterGoalMl: req.body.waterGoalMl != null ? Number(req.body.waterGoalMl) : undefined,
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

nutritionRouter.patch('/plans/:planId', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const plan = await nutritionService.updatePlan(req.authenticatedUser!, Number(req.params.planId), {
      label: req.body.label,
      goalCalories: req.body.goalCalories != null ? Number(req.body.goalCalories) : undefined,
      proteinGTarget: req.body.proteinGTarget != null ? Number(req.body.proteinGTarget) : undefined,
      carbsGTarget: req.body.carbsGTarget != null ? Number(req.body.carbsGTarget) : undefined,
      fatGTarget: req.body.fatGTarget != null ? Number(req.body.fatGTarget) : undefined,
      waterGoalMl: req.body.waterGoalMl != null ? Number(req.body.waterGoalMl) : undefined,
    });
    res.status(200).json({ plan });
  } catch (error) {
    handleError(res, error, 'No se pudo actualizar el plan de nutrición.');
  }
});

nutritionRouter.post('/plans/:planId/meals', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const meal = await nutritionService.addMeal(req.authenticatedUser!, Number(req.params.planId), {
      name: req.body.name,
      mealTime: req.body.mealTime,
      calories: Number(req.body.calories),
    });
    res.status(201).json({ meal });
  } catch (error) {
    handleError(res, error, 'No se pudo agregar la comida.');
  }
});

nutritionRouter.patch('/meals/:mealId', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const meal = await nutritionService.updateMeal(req.authenticatedUser!, Number(req.params.mealId), {
      name: req.body.name,
      mealTime: req.body.mealTime,
      calories: req.body.calories != null ? Number(req.body.calories) : undefined,
    });
    res.status(200).json({ meal });
  } catch (error) {
    handleError(res, error, 'No se pudo actualizar la comida.');
  }
});

nutritionRouter.delete('/meals/:mealId', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    await nutritionService.deleteMeal(req.authenticatedUser!, Number(req.params.mealId));
    res.status(204).send();
  } catch (error) {
    handleError(res, error, 'No se pudo eliminar la comida.');
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
