export interface Notification {
  id: string;
  userId: string;
  type: 'DUE_SOON' | 'OVERDUE' | 'RESERVATION_AVAILABLE';
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationCounts {
  total: number;
  unread: number;
}