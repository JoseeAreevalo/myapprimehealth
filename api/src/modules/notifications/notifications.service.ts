import { AuthenticatedUser } from '../identity/identity.types';
import { notificationPreferencesRepository, notificationsRepository } from './notifications.repository';
import { Notification, NotificationPreferences } from './notifications.types';

export function createNotificationsService() {
    return {
        async list(requester: AuthenticatedUser): Promise<{ notifications: Notification[]; unreadCount: number }> {
            const [notifications, unreadCount] = await Promise.all([
                notificationsRepository.listForUser(requester.id),
                notificationsRepository.countUnread(requester.id),
            ]);
            return { notifications, unreadCount };
        },

        async markRead(requester: AuthenticatedUser, id: number): Promise<void> {
            await notificationsRepository.markRead(id, requester.id);
        },

        async markAllRead(requester: AuthenticatedUser): Promise<void> {
            await notificationsRepository.markAllRead(requester.id);
        },

        async getPreferences(requester: AuthenticatedUser): Promise<NotificationPreferences> {
            const existing = await notificationPreferencesRepository.find(requester.id);
            return (
                existing ?? {
                    userId: requester.id,
                    emailEnabled: true,
                    checkinReminders: true,
                    coachMessages: true,
                }
            );
        },

        async updatePreferences(
            requester: AuthenticatedUser,
            updates: { emailEnabled?: boolean; checkinReminders?: boolean; coachMessages?: boolean },
        ): Promise<NotificationPreferences> {
            return notificationPreferencesRepository.upsert(requester.id, updates);
        },
    };
}
