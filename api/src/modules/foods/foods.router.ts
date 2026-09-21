import { Request, Response, Router } from 'express';
import { authenticate } from '../identity/token.service';
import { ForbiddenError, NotFoundError, ValidationError, createFoodsService } from './foods.service';

export const foodsRouter = Router();
const foodsService = createFoodsService();

/**
 * @swagger
 * tags:
 *   - name: Foods
 *     description: Food/macro database and barcode lookup
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

foodsRouter.get('/', authenticate, async (req: Request, res: Response): Promise<void> => {
    try {
        const foods = await foodsService.search(String(req.query.search ?? ''));
        res.status(200).json({ data: foods, meta: { total: foods.length } });
    } catch (error) {
        handleError(res, error, 'No se pudieron buscar los alimentos.');
    }
});

foodsRouter.post('/', authenticate, async (req: Request, res: Response): Promise<void> => {
    try {
        const food = await foodsService.create(req.authenticatedUser!, {
            name: req.body.name,
            caloriesPer100g: Number(req.body.caloriesPer100g),
            proteinG: req.body.proteinG != null ? Number(req.body.proteinG) : undefined,
            carbsG: req.body.carbsG != null ? Number(req.body.carbsG) : undefined,
            fatG: req.body.fatG != null ? Number(req.body.fatG) : undefined,
        });
        res.status(201).json({ food });
    } catch (error) {
        handleError(res, error, 'No se pudo crear el alimento.');
    }
});

foodsRouter.get('/barcode/:code', authenticate, async (req: Request, res: Response): Promise<void> => {
    try {
        const food = await foodsService.lookupBarcode(req.params.code);
        res.status(200).json({ food });
    } catch (error) {
        handleError(res, error, 'No se pudo buscar el c\u00f3digo de barras.');
    }
});

export default foodsRouter;
