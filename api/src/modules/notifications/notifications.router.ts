import { Request, Response, Router } from 'express';
import { authenticate } from '../identity/token.service';
import { createNotificationsService } from './notifications.service';

export const notificationsRouter = Router();
const notificationsService = createNotificationsService();

/**
 * @swagger
 * tags:
 *   - name: Notifications
 *     description: In-app notifications and delivery preferences
 */

function handleError(res: Response, error: unknown, fallbackMessage: string): void {
  const message = error instanceof Error ? error.message : fallbackMessage;
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message } });
}

notificationsRouter.get('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { notifications, unreadCount } = await notificationsService.list(req.authenticatedUser!);
    res.status(200).json({ data: notifications, meta: { total: notifications.length, unreadCount } });
  } catch (error) {
    handleError(res, error, 'Unable to load notifications.');
  }
});

notificationsRouter.patch('/:id/read', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    await notificationsService.markRead(req.authenticatedUser!, Number(req.params.id));
    res.status(204).send();
  } catch (error) {
    handleError(res, error, 'Unable to update the notification.');
  }
});

notificationsRouter.patch('/read-all', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    await notificationsService.markAllRead(req.authenticatedUser!);
    res.status(204).send();
  } catch (error) {
    handleError(res, error, 'Unable to update notifications.');
  }
});

notificationsRouter.get('/preferences', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const preferences = await notificationsService.getPreferences(req.authenticatedUser!);
    res.status(200).json({ preferences });
  } catch (error) {
    handleError(res, error, 'Unable to load preferences.');
  }
});

notificationsRouter.put('/preferences', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const preferences = await notificationsService.updatePreferences(req.authenticatedUser!, {
      emailEnabled: req.body.emailEnabled,
      checkinReminders: req.body.checkinReminders,
      coachMessages: req.body.coachMessages,
    });
    res.status(200).json({ preferences });
  } catch (error) {
    handleError(res, error, 'Unable to update preferences.');
  }
});

export default notificationsRouter;
