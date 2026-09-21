import { Request, Response, Router } from 'express';
import { authenticate } from '../identity/token.service';
import { ForbiddenError, NotFoundError, ValidationError, createPeopleService } from './people.service';

export const peopleRouter = Router();
const peopleService = createPeopleService();

/**
 * @swagger
 * tags:
 *   - name: People
 *     description: Profiles and coach-client relationships
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

peopleRouter.get('/me/profile', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const profile = await peopleService.getProfile(req.authenticatedUser!, req.authenticatedUser!.id);
    res.status(200).json({ profile });
  } catch (error) {
    handleError(res, error, 'No se pudo cargar el perfil.');
  }
});

peopleRouter.put('/me/profile', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const profile = await peopleService.upsertOwnProfile(req.authenticatedUser!, {
      phone: req.body.phone,
      birthDate: req.body.birthDate,
      bio: req.body.bio,
      avatarUrl: req.body.avatarUrl,
    });
    res.status(200).json({ profile });
  } catch (error) {
    handleError(res, error, 'No se pudo actualizar el perfil.');
  }
});

peopleRouter.get('/coaches/:coachId/clients', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const coachId = Number(req.params.coachId);
    const clients = await peopleService.listCoachClients(req.authenticatedUser!, coachId);
    res.status(200).json({ data: clients, meta: { total: clients.length } });
  } catch (error) {
    handleError(res, error, 'No se pudo cargar la cartera de clientes.');
  }
});

peopleRouter.get('/clients/:clientId/coach', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const clientId = Number(req.params.clientId);
    const coach = await peopleService.getClientCoach(req.authenticatedUser!, clientId);
    res.status(200).json({ coach });
  } catch (error) {
    handleError(res, error, 'No se pudo cargar el coach asignado.');
  }
});

peopleRouter.post('/coach-assignments', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const coachId = Number(req.body.coachId);
    const clientId = Number(req.body.clientId);
    const link = await peopleService.assignClientToCoach(req.authenticatedUser!, coachId, clientId);
    res.status(201).json({ assignment: link });
  } catch (error) {
    handleError(res, error, 'No se pudo crear la asignación de coach.');
  }
});

peopleRouter.delete('/coach-assignments/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    await peopleService.endAssignment(req.authenticatedUser!, Number(req.params.id));
    res.status(204).send();
  } catch (error) {
    handleError(res, error, 'No se pudo finalizar la asignación de coach.');
  }
});

export default peopleRouter;
