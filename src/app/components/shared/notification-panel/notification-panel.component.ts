import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationsService } from '../../../services/notifications.service';
import { AuthService } from '../../../services/auth.service';
import { Notification } from '../../../models/notification';

@Component({
  selector: 'app-notification-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification-panel.component.html',
  styleUrl: './notification-panel.component.scss'
})
export class NotificationPanelComponent {
  private readonly notificationsService = inject(NotificationsService);
  private readonly authService = inject(AuthService);

  isOpen = signal(false);
  
  readonly notifications = this.notificationsService.notifications;
  readonly unreadCount = this.notificationsService.unreadCount;
  readonly loading = this.notificationsService.loading;
  readonly isLoggedIn = this.authService.isLoggedIn;

  constructor() {
    // Load notifications if user is logged in
    if (this.isLoggedIn()) {
      this.loadNotifications();
    }
  }

  togglePanel() {
    if (!this.isLoggedIn()) return;
    
    this.isOpen.update(open => !open);
    
    if (this.isOpen() && this.notifications().length === 0) {
      this.loadNotifications();
    }
  }

  closePanel() {
    this.isOpen.set(false);
  }

  loadNotifications() {
    this.notificationsService.loadNotifications().subscribe({
      error: (error) => console.error('Failed to load notifications:', error)
    });
  }

  markAsRead(notification: Notification, event: Event) {
    event.stopPropagation();
    
    if (notification.isRead) return;
    
    this.notificationsService.markAsRead(notification.id).subscribe({
      error: (error) => console.error('Failed to mark notification as read:', error)
    });
  }

  markAllAsRead() {
    if (this.unreadCount() === 0) return;
    
    this.notificationsService.markAllAsRead().subscribe({
      error: (error) => console.error('Failed to mark all notifications as read:', error)
    });
  }

  getNotificationIcon(type: Notification['type']): string {
    switch (type) {
      case 'DUE_SOON':
        return '⏰';
      case 'OVERDUE':
        return '⚠️';
      case 'RESERVATION_AVAILABLE':
        return '📚';
      default:
        return '📢';
    }
  }

  getNotificationColor(type: Notification['type']): string {
    switch (type) {
      case 'DUE_SOON':
        return 'text-yellow-600';
      case 'OVERDUE':
        return 'text-red-600';
      case 'RESERVATION_AVAILABLE':
        return 'text-green-600';
      default:
        return 'text-blue-600';
    }
  }

  getRecentNotifications(): Notification[] {
    return this.notificationsService.getRecentNotifications(10);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMinutes = Math.floor(diffTime / (1000 * 60));
        return diffMinutes <= 1 ? 'Just now' : `${diffMinutes}m ago`;
      }
      return `${diffHours}h ago`;
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  }

  trackByNotificationId(index: number, notification: Notification): string {
    return notification.id;
  }
}
