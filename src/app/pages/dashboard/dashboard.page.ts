import { Component, inject, computed, signal } from '@angular/core';
import { DatePipe, DecimalPipe, CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { LoansService } from '../../services/loans.service';
import { ReservationsService } from '../../services/reservations.service';
import { NotificationsService } from '../../services/notifications.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [DatePipe, DecimalPipe, CommonModule],
  templateUrl: './dashboard.page.html',
  styleUrl: './dashboard.page.scss'
})
export class DashboardPage {
  private readonly auth = inject(AuthService);
  private readonly loans = inject(LoansService);
  private readonly reservations = inject(ReservationsService);
  private readonly notifications = inject(NotificationsService);
  private readonly router = inject(Router);

  loadingLoans = signal(false);
  loadingReservations = signal(false);
  error = signal('');

  readonly user = this.auth.currentUser;
  readonly userLoans = this.loans.loans;
  readonly activeLoans = computed(() => this.loans.getActiveLoans());
  readonly overdueLoans = computed(() => this.loans.getOverdueLoans());
  readonly userReservations = computed(() => this.reservations.getUserReservations());
  readonly recentNotifications = computed(() => this.notifications.getRecentNotifications(5));

  constructor() {
    if (!this.auth.isLoggedIn()) {
      this.router.navigateByUrl('/login');
      return;
    }

    this.loadDashboardData();
  }

  private loadDashboardData() {
    // Load loans
    this.loadingLoans.set(true);
    this.loans.loadLoans().subscribe({
      next: () => this.loadingLoans.set(false),
      error: (error) => {
        this.error.set('Failed to load loans');
        this.loadingLoans.set(false);
      }
    });

    // Load reservations
    this.loadingReservations.set(true);
    this.reservations.loadReservations().subscribe({
      next: () => this.loadingReservations.set(false),
      error: (error) => {
        this.error.set('Failed to load reservations');
        this.loadingReservations.set(false);
      }
    });

    // Load notifications
    this.notifications.loadNotifications().subscribe({
      error: (error) => console.error('Failed to load notifications:', error)
    });
  }

  returnBook(loanId: string) {
    this.loans.returnBook(loanId).subscribe({
      next: () => {
        // Loan updated in service automatically
      },
      error: (error) => {
        this.error.set('Failed to return book');
      }
    });
  }

  cancelReservation(reservationId: string) {
    this.reservations.cancelReservation(reservationId).subscribe({
      next: () => {
        // Reservation updated in service automatically
      },
      error: (error) => {
        this.error.set('Failed to cancel reservation');
      }
    });
  }

  getDaysUntilDue(dueDate: string): number {
    const due = new Date(dueDate);
    const now = new Date();
    const diffTime = due.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  isOverdue(dueDate: string): boolean {
    return this.getDaysUntilDue(dueDate) < 0;
  }

  isDueSoon(dueDate: string): boolean {
    const days = this.getDaysUntilDue(dueDate);
    return days >= 0 && days <= 3;
  }

  getStatusColor(dueDate: string): string {
    if (this.isOverdue(dueDate)) return 'text-red-600 bg-red-50';
    if (this.isDueSoon(dueDate)) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  }

  refreshData() {
    this.error.set('');
    this.loadDashboardData();
  }

  // Expose Math for template usage
  readonly Math = Math;
}

