import { Request, Response, Router } from 'express';
import { authenticate, authorizeRoles } from '../identity/token.service';
import { ValidationError, createAdministrationService } from './administration.service';

export const administrationRouter = Router();
const administrationService = createAdministrationService();

/**
 * @swagger
 * tags:
 *   - name: Administration
 *     description: Super admin user management
 */

administrationRouter.use(authenticate, authorizeRoles('super_admin'));

function handleError(res: Response, error: unknown, fallbackMessage: string): void {
    if (error instanceof ValidationError) {
        res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: error.message } });
        return;
    }
    const message = error instanceof Error ? error.message : fallbackMessage;
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message } });
}

administrationRouter.get('/users', async (_req: Request, res: Response): Promise<void> => {
    try {
        const users = await administrationService.listUsers();
        res.status(200).json({ data: users, meta: { total: users.length } });
    } catch (error) {
        handleError(res, error, 'No se pudieron cargar los usuarios.');
    }
});

administrationRouter.post('/users', async (req: Request, res: Response): Promise<void> => {
    try {
        const user = await administrationService.createUser({
            email: req.body.email,
            password: req.body.password,
            fullName: req.body.fullName,
            role: req.body.role,
        });
        res.status(201).json({ user });
    } catch (error) {
        handleError(res, error, 'No se pudo crear el usuario.');
    }
});

administrationRouter.patch('/users/:id', async (req: Request, res: Response): Promise<void> => {
    try {
        const user = await administrationService.updateUser(Number(req.params.id), {
            role: req.body.role,
            isActive: req.body.isActive,
        });
        res.status(200).json({ user });
    } catch (error) {
        handleError(res, error, 'No se pudo actualizar el usuario.');
    }
});

administrationRouter.delete('/users/:id', async (req: Request, res: Response): Promise<void> => {
    try {
        await administrationService.deleteUser(Number(req.params.id), req.authenticatedUser!.id);
        res.status(204).send();
    } catch (error) {
        handleError(res, error, 'No se pudo eliminar el usuario.');
    }
});

export default administrationRouter;
