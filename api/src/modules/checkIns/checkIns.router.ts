import { Request, Response, Router } from 'express';
import { authenticate } from '../identity/token.service';
import { ForbiddenError, NotFoundError, ValidationError, createCheckInsService } from './checkIns.service';

export const checkInsRouter = Router();
const checkInsService = createCheckInsService();

/**
 * @swagger
 * tags:
 *   - name: CheckIns
 *     description: Weekly client check-ins and coach review
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

checkInsRouter.post('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const checkIn = await checkInsService.submitWeeklyCheckIn(req.authenticatedUser!, {
      weightKg: req.body.weightKg,
      measurements: req.body.measurements,
      adherencePercent: req.body.adherencePercent,
      notes: req.body.notes,
    });
    res.status(201).json({ checkIn });
  } catch (error) {
    handleError(res, error, 'Unable to submit the check-in.');
  }
});

checkInsRouter.get('/clients/:clientId', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const checkIns = await checkInsService.listForClient(req.authenticatedUser!, Number(req.params.clientId));
    res.status(200).json({ data: checkIns, meta: { total: checkIns.length } });
  } catch (error) {
    handleError(res, error, 'Unable to load check-ins.');
  }
});

checkInsRouter.get('/coaches/:coachId/pending', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const checkIns = await checkInsService.listPendingForCoach(req.authenticatedUser!, Number(req.params.coachId));
    res.status(200).json({ data: checkIns, meta: { total: checkIns.length } });
  } catch (error) {
    handleError(res, error, 'Unable to load the review queue.');
  }
});

checkInsRouter.patch('/:id/review', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const checkIn = await checkInsService.review(req.authenticatedUser!, Number(req.params.id), req.body.feedback);
    res.status(200).json({ checkIn });
  } catch (error) {
    handleError(res, error, 'Unable to review the check-in.');
  }
});

export default checkInsRouter;
