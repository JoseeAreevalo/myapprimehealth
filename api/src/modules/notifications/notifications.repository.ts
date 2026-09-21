import { pool } from '../../db/pool';
import { Notification, NotificationPreferences, NotificationType } from './notifications.types';

interface NotificationRow {
  id: number;
  user_id: number;
  type: NotificationType;
  title: string;
  body: string | null;
  is_read: boolean;
  created_at: string;
}

interface PreferencesRow {
  user_id: number;
  email_enabled: boolean;
  checkin_reminders: boolean;
  coach_messages: boolean;
}

function toNotification(row: NotificationRow): Notification {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    title: row.title,
    body: row.body,
    isRead: row.is_read,
    createdAt: row.created_at,
  };
}

function toPreferences(row: PreferencesRow): NotificationPreferences {
  return {
    userId: row.user_id,
    emailEnabled: row.email_enabled,
    checkinReminders: row.checkin_reminders,
    coachMessages: row.coach_messages,
  };
}

export const notificationsRepository = {
  async create(userId: number, type: NotificationType, title: string, body?: string | null): Promise<Notification> {
    const { rows } = await pool.query<NotificationRow>(
      `INSERT INTO notifications (user_id, type, title, body)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [userId, type, title, body ?? null],
    );
    return toNotification(rows[0]);
  },

  async listForUser(userId: number, limit = 50): Promise<Notification[]> {
    const { rows } = await pool.query<NotificationRow>(
      'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2',
      [userId, limit],
    );
    return rows.map(toNotification);
  },

  async countUnread(userId: number): Promise<number> {
    const { rows } = await pool.query<{ count: string }>(
      'SELECT COUNT(*) AS count FROM notifications WHERE user_id = $1 AND is_read = FALSE',
      [userId],
    );
    return Number(rows[0]?.count ?? 0);
  },

  async markRead(id: number, userId: number): Promise<void> {
    await pool.query('UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2', [id, userId]);
  },

  async markAllRead(userId: number): Promise<void> {
    await pool.query('UPDATE notifications SET is_read = TRUE WHERE user_id = $1 AND is_read = FALSE', [userId]);
  },
};

export const notificationPreferencesRepository = {
  async find(userId: number): Promise<NotificationPreferences | undefined> {
    const { rows } = await pool.query<PreferencesRow>('SELECT * FROM notification_preferences WHERE user_id = $1', [userId]);
    return rows[0] ? toPreferences(rows[0]) : undefined;
  },

  async upsert(userId: number, input: { emailEnabled?: boolean; checkinReminders?: boolean; coachMessages?: boolean }): Promise<NotificationPreferences> {
    const { rows } = await pool.query<PreferencesRow>(
      `INSERT INTO notification_preferences (user_id, email_enabled, checkin_reminders, coach_messages)
       VALUES ($1, COALESCE($2, TRUE), COALESCE($3, TRUE), COALESCE($4, TRUE))
       ON CONFLICT (user_id) DO UPDATE SET
         email_enabled = COALESCE($2, notification_preferences.email_enabled),
         checkin_reminders = COALESCE($3, notification_preferences.checkin_reminders),
         coach_messages = COALESCE($4, notification_preferences.coach_messages),
         updated_at = now()
       RETURNING *`,
      [userId, input.emailEnabled ?? null, input.checkinReminders ?? null, input.coachMessages ?? null],
    );
    return toPreferences(rows[0]);
  },
};
