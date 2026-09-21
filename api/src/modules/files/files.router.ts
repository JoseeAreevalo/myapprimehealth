import { Request, Response, Router } from 'express';
import multer from 'multer';
import { authenticate } from '../identity/token.service';
import { ForbiddenError, NotFoundError, ValidationError, createFilesService } from './files.service';

export const filesRouter = Router();
const filesService = createFilesService();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

/**
 * @swagger
 * tags:
 *   - name: Files
 *     description: Secure photo uploads attached to check-ins
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

filesRouter.post(
  '/check-ins/:checkInId/photos',
  authenticate,
  upload.single('photo'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'A photo file is required.' } });
        return;
      }
      const file = await filesService.uploadCheckInPhoto(req.authenticatedUser!, Number(req.params.checkInId), req.file);
      res.status(201).json({ file });
    } catch (error) {
      handleError(res, error, 'Unable to upload the photo.');
    }
  },
);

filesRouter.get('/check-ins/:checkInId/photos', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const files = await filesService.listCheckInPhotos(req.authenticatedUser!, Number(req.params.checkInId));
    res.status(200).json({ data: files, meta: { total: files.length } });
  } catch (error) {
    handleError(res, error, 'Unable to load photos.');
  }
});

filesRouter.get('/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { meta, buffer } = await filesService.getFileForDownload(req.authenticatedUser!, Number(req.params.id));
    res.setHeader('Content-Type', meta.mimeType);
    res.setHeader('Cache-Control', 'private, max-age=0, no-store');
    res.send(buffer);
  } catch (error) {
    handleError(res, error, 'Unable to load the file.');
  }
});

filesRouter.delete('/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    await filesService.deleteFile(req.authenticatedUser!, Number(req.params.id));
    res.status(204).send();
  } catch (error) {
    handleError(res, error, 'Unable to delete the file.');
  }
});

export default filesRouter;
