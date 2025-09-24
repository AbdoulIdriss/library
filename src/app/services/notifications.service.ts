import { Injectable, computed, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Notification, NotificationCounts } from '../models/notification';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class NotificationsService {
  private readonly http = inject(HttpClient);
  private readonly notificationsSignal = signal<Notification[]>([]);
  private readonly loadingSignal = signal(false);

  readonly notifications = computed(() => this.notificationsSignal());
  readonly loading = computed(() => this.loadingSignal());
  readonly unreadCount = computed(() => 
    this.notificationsSignal().filter(n => !n.isRead).length
  );

  loadNotifications(): Observable<Notification[]> {
    this.loadingSignal.set(true);
    return this.http.get<Notification[]>(`${environment.apiUrl}/notifications`)
      .pipe(
        tap(notifications => {
          this.notificationsSignal.set(notifications);
          this.loadingSignal.set(false);
        })
      );
  }

  markAsRead(notificationId: string): Observable<void> {
    return this.http.post<void>(`${environment.apiUrl}/notifications/${notificationId}/read`, {})
      .pipe(
        tap(() => {
          this.notificationsSignal.update(notifications =>
            notifications.map(n =>
              n.id === notificationId ? { ...n, isRead: true } : n
            )
          );
        })
      );
  }

  markAllAsRead(): Observable<void> {
    const unreadIds = this.notificationsSignal()
      .filter(n => !n.isRead)
      .map(n => n.id);

    if (unreadIds.length === 0) {
      return new Observable(observer => observer.complete());
    }

    // Mark all as read locally first for immediate UI feedback
    this.notificationsSignal.update(notifications =>
      notifications.map(n => ({ ...n, isRead: true }))
    );

    // Then sync with backend
    return this.http.post<void>(`${environment.apiUrl}/notifications/mark-all-read`, {})
      .pipe(
        tap(() => {
          // Already updated locally, no need to update again
        })
      );
  }

  getNotificationCounts(): NotificationCounts {
    const notifications = this.notificationsSignal();
    return {
      total: notifications.length,
      unread: notifications.filter(n => !n.isRead).length
    };
  }

  getRecentNotifications(limit: number = 5): Notification[] {
    return this.notificationsSignal()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  getNotificationsByType(type: Notification['type']): Notification[] {
    return this.notificationsSignal().filter(n => n.type === type);
  }
}