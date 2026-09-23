import { Request, Response, Router } from 'express';
import { authenticate } from '../identity/token.service';
import { ValidationError, createAssistantService } from './assistant.service';

export const assistantRouter = Router();
const assistantService = createAssistantService();

/**
 * @swagger
 * tags:
 *   - name: Assistant
 *     description: AI help chatbot
 */

assistantRouter.post('/chat', authenticate, async (req: Request, res: Response): Promise<void> => {
    try {
        const history = Array.isArray(req.body.history) ? req.body.history : [];
        const reply = await assistantService.chat(req.authenticatedUser!, req.body.message, history);
        res.status(200).json({ reply });
    } catch (error) {
        if (error instanceof ValidationError) {
            res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: error.message } });
            return;
        }
        const message = error instanceof Error ? error.message : 'No se pudo obtener una respuesta.';
        console.error('[assistant]', error);
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message } });
    }
});

export default assistantRouter;
