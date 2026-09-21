export type NotificationType = 'plan_assigned' | 'checkin_reviewed' | 'coach_assigned';

export interface Notification {
  id: number;
  userId: number;
  type: NotificationType;
  title: string;
  body: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationPreferences {
  userId: number;
  emailEnabled: boolean;
  checkinReminders: boolean;
  coachMessages: boolean;
}
