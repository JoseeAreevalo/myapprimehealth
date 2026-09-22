import { Request, Response, Router } from 'express';
import { authenticate } from '../identity/token.service';
import { ForbiddenError, NotFoundError, ValidationError, createActivityService } from './activity.service';

export const activityRouter = Router();
const activityService = createActivityService();

/**
 * @swagger
 * tags:
 *   - name: Activity
 *     description: HEAT (cardio) and NEAT (daily steps) tracking
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
    console.error('[activity]', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message } });
}

activityRouter.get('/clients/:clientId/plan', authenticate, async (req: Request, res: Response): Promise<void> => {
    try {
        const plan = await activityService.getPlan(req.authenticatedUser!, Number(req.params.clientId));
        res.status(200).json({ plan });
    } catch (error) {
        handleError(res, error, 'No se pudo cargar la configuración de actividad.');
    }
});

activityRouter.post('/clients/:clientId/plan', authenticate, async (req: Request, res: Response): Promise<void> => {
    try {
        const plan = await activityService.createPlan(req.authenticatedUser!, Number(req.params.clientId), {
            cardioTargets: Array.isArray(req.body.cardioTargets) ? req.body.cardioTargets : [],
            stepsTargets: Array.isArray(req.body.stepsTargets) ? req.body.stepsTargets : [],
        });
        res.status(201).json({ plan });
    } catch (error) {
        handleError(res, error, 'No se pudo crear la configuración de actividad.');
    }
});

activityRouter.delete('/plans/:planId', authenticate, async (req: Request, res: Response): Promise<void> => {
    try {
        await activityService.deletePlan(req.authenticatedUser!, Number(req.params.planId));
        res.status(204).send();
    } catch (error) {
        handleError(res, error, 'No se pudo eliminar la configuración de actividad.');
    }
});

activityRouter.patch('/plans/:planId/cardio', authenticate, async (req: Request, res: Response): Promise<void> => {
    try {
        await activityService.updateCardioTarget(req.authenticatedUser!, Number(req.params.planId), {
            weekday: Number(req.body.weekday),
            minutes: Number(req.body.minutes),
        });
        res.status(204).send();
    } catch (error) {
        handleError(res, error, 'No se pudo actualizar la meta de cardio.');
    }
});

activityRouter.delete('/plans/:planId/cardio/:weekday', authenticate, async (req: Request, res: Response): Promise<void> => {
    try {
        await activityService.removeCardioTarget(req.authenticatedUser!, Number(req.params.planId), Number(req.params.weekday));
        res.status(204).send();
    } catch (error) {
        handleError(res, error, 'No se pudo eliminar la meta de cardio.');
    }
});

activityRouter.patch('/plans/:planId/steps', authenticate, async (req: Request, res: Response): Promise<void> => {
    try {
        await activityService.updateStepsTarget(req.authenticatedUser!, Number(req.params.planId), {
            weekday: Number(req.body.weekday),
            stepsTarget: Number(req.body.stepsTarget),
        });
        res.status(204).send();
    } catch (error) {
        handleError(res, error, 'No se pudo actualizar la meta de pasos.');
    }
});

activityRouter.delete('/plans/:planId/steps/:weekday', authenticate, async (req: Request, res: Response): Promise<void> => {
    try {
        await activityService.removeStepsTarget(req.authenticatedUser!, Number(req.params.planId), Number(req.params.weekday));
        res.status(204).send();
    } catch (error) {
        handleError(res, error, 'No se pudo eliminar la meta de pasos.');
    }
});

activityRouter.patch('/clients/:clientId/log', authenticate, async (req: Request, res: Response): Promise<void> => {
    try {
        await activityService.logToday(req.authenticatedUser!, Number(req.params.clientId), {
            actualCardioMinutes: req.body.actualCardioMinutes != null ? Number(req.body.actualCardioMinutes) : undefined,
            actualSteps: req.body.actualSteps != null ? Number(req.body.actualSteps) : undefined,
        });
        res.status(204).send();
    } catch (error) {
        handleError(res, error, 'No se pudo registrar tu actividad de hoy.');
    }
});

activityRouter.get('/clients/:clientId/logs', authenticate, async (req: Request, res: Response): Promise<void> => {
    try {
        const logs = await activityService.getRecentLogs(req.authenticatedUser!, Number(req.params.clientId));
        res.status(200).json({ data: logs });
    } catch (error) {
        handleError(res, error, 'No se pudo cargar el historial de actividad.');
    }
});

export default activityRouter;
