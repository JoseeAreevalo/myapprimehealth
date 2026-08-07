import { Router } from 'express';
import { authenticate } from './token.service';

export const identityRouter = Router();

/**
 * @swagger
 * tags:
 *   - name: Identity
 *     description: Authentication and session management
 */

/**
 * @swagger
 * /api/v1/identity/me:
 *   get:
 *     summary: Return the authenticated user's identity
 *     tags: [Identity]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Authenticated user
 *       401:
 *         description: Missing, invalid, or expired access token
 */
identityRouter.get('/me', authenticate, (req, res) => {
  res.status(200).json({ user: req.authenticatedUser });
});
