import { AuthenticatedUser } from '../identity/identity.types';
import { coachClientsRepository } from '../people/people.repository';
import { notificationsRepository } from './notifications.repository';
import { NotificationType } from './notifications.types';

export async function notifyPlanChange(
    requester: AuthenticatedUser,
    clientId: number,
    domain: 'nutrición' | 'entrenamiento',
    detail: string,
): Promise<void> {
    const isSelf = requester.id === clientId;
    const link = await coachClientsRepository.findActiveByClientId(clientId);

    if (isSelf) {
        if (link) {
            await notificationsRepository.create(
                link.coachId,
                'client_plan_updated',
                `Cliente actualizó su plan de ${domain}`,
                `${requester.fullName ?? requester.email} modificó ${detail}.`,
            );
        }
        return;
    }

    await notificationsRepository.create(
        clientId,
        'plan_updated',
        `Tu plan de ${domain} fue actualizado`,
        `${requester.fullName ?? 'Tu coach'} modificó ${detail}.`,
    );
}

export async function notifyClientProgress(
    clientId: number,
    type: Extract<NotificationType, 'nutrition_completed' | 'training_completed'>,
    title: string,
    body: string,
): Promise<void> {
    const link = await coachClientsRepository.findActiveByClientId(clientId);
    if (!link) return;
    await notificationsRepository.create(link.coachId, type, title, body);
}
