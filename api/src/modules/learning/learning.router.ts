import { Request, Response, Router } from 'express';
import { authenticate } from '../identity/token.service';
import { AiNotConfiguredError, ForbiddenError, NotFoundError, ValidationError, createLearningService } from './learning.service';

export const learningRouter = Router();
const learningService = createLearningService();

/**
 * @swagger
 * tags:
 *   - name: Learning
 *     description: Aprendizaje knowledge-base notes
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
    if (error instanceof AiNotConfiguredError) {
        res.status(503).json({ error: { code: 'AI_NOT_CONFIGURED', message: error.message } });
        return;
    }
    const message = error instanceof Error ? error.message : fallbackMessage;
    console.error('[learning]', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message } });
}

learningRouter.get('/notes', authenticate, async (_req: Request, res: Response): Promise<void> => {
    try {
        const notes = await learningService.listNotes();
        res.status(200).json({ data: notes });
    } catch (error) {
        handleError(res, error, 'No se pudieron cargar las notas de aprendizaje.');
    }
});

learningRouter.post('/notes', authenticate, async (req: Request, res: Response): Promise<void> => {
    try {
        const note = await learningService.createNote(req.authenticatedUser!, { title: req.body.title, body: req.body.body });
        res.status(201).json({ note });
    } catch (error) {
        handleError(res, error, 'No se pudo crear la nota.');
    }
});

learningRouter.patch('/notes/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
    try {
        const note = await learningService.updateNote(req.authenticatedUser!, Number(req.params.id), {
            title: req.body.title,
            body: req.body.body,
        });
        res.status(200).json({ note });
    } catch (error) {
        handleError(res, error, 'No se pudo actualizar la nota.');
    }
});

learningRouter.delete('/notes/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
    try {
        await learningService.deleteNote(req.authenticatedUser!, Number(req.params.id));
        res.status(204).send();
    } catch (error) {
        handleError(res, error, 'No se pudo eliminar la nota.');
    }
});

learningRouter.post('/notes/generate', authenticate, async (req: Request, res: Response): Promise<void> => {
    try {
        const draft = await learningService.generateDraft(req.authenticatedUser!, req.body.prompt);
        res.status(200).json({ draft });
    } catch (error) {
        handleError(res, error, 'No se pudo generar la nota con IA.');
    }
});

export default learningRouter;
