import { Request, Response, Router } from 'express';
import { authenticate } from '../identity/token.service';
import { ValidationError, createHydrationService } from './hydration.service';

export const hydrationRouter = Router();
const hydrationService = createHydrationService();

/**
 * @swagger
 * tags:
 *   - name: Hydration
 *     description: Daily water intake tracking
 */

hydrationRouter.get('/today', authenticate, async (req: Request, res: Response): Promise<void> => {
    try {
        const log = await hydrationService.getToday(req.authenticatedUser!);
        res.status(200).json({ log });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'No se pudo cargar tu registro de agua.';
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message } });
    }
});

hydrationRouter.put('/today', authenticate, async (req: Request, res: Response): Promise<void> => {
    try {
        const log = await hydrationService.setToday(req.authenticatedUser!, Number(req.body.consumedMl));
        res.status(200).json({ log });
    } catch (error) {
        if (error instanceof ValidationError) {
            res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: error.message } });
            return;
        }
        const message = error instanceof Error ? error.message : 'No se pudo guardar tu registro de agua.';
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message } });
    }
});

export default hydrationRouter;
