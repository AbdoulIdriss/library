import { Component, inject, signal } from '@angular/core';
import { NgClass, AsyncPipe, CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { BooksService } from '../../services/books.service';
import { AuthService } from '../../services/auth.service';
import { LoansService } from '../../services/loans.service';
import { ReservationsService } from '../../services/reservations.service';
import { Router } from '@angular/router';
import { Observable, filter, map, switchMap } from 'rxjs';
import { formatHttpError } from '../../utils/http-error.util';
import { Book } from '../../models/book';

@Component({
  selector: 'app-book-detail-page',
  standalone: true,
  imports: [NgClass, AsyncPipe, CommonModule],
  templateUrl: './book-detail.page.html',
  styleUrl: './book-detail.page.scss'
})
export class BookDetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly books = inject(BooksService);
  private readonly auth = inject(AuthService);
  private readonly loans = inject(LoansService);
  private readonly reservations = inject(ReservationsService);
  private readonly router = inject(Router);
  
  showAuthModal = false;
  loadingBorrow = signal(false);
  loadingReserve = signal(false);
  successMessage = signal('');
  errorMessage = signal('');
  
  readonly bookId$: Observable<string> = this.route.paramMap.pipe(
    map(params => params.get('id')),
    filter((id): id is string => !!id)
  );
  readonly book$: Observable<Book> = this.bookId$.pipe(
    switchMap(id => this.books.getById(id))
  );

  constructor() {
    // Load user's reservations to check if book is already reserved
    if (this.auth.isLoggedIn()) {
      this.reservations.loadReservations().subscribe();
      this.loans.loadLoans().subscribe();
    }
  }

  onBorrow() {
    if (!this.auth.isLoggedIn()) {
      this.showAuthModal = true;
      return;
    }

    if (this.loadingBorrow()) return;

    this.clearMessages();
    this.loadingBorrow.set(true);

    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.errorMessage.set('Invalid book id');
      this.loadingBorrow.set(false);
      return;
    }
    this.loans.borrowBook(id).subscribe({
      next: () => {
        this.successMessage.set('Book borrowed successfully! Check your dashboard for loan details.');
        this.loadingBorrow.set(false);
      },
      error: (error) => {
        this.errorMessage.set(formatHttpError(error, {
          401: 'Please sign in to borrow a book.',
          403: 'You do not have permission to borrow this book.',
          404: 'Book not found.',
          409: (error?.error?.error || '').includes('Already') ? 'You already borrowed this book.' : 'Book is not available to borrow right now.',
          0: 'Cannot reach the server. Please check your connection and try again.'
        }, 'Failed to borrow book. Please try again.'));
        this.loadingBorrow.set(false);
      }
    });
  }

  onReserve() {
    if (!this.auth.isLoggedIn()) {
      this.showAuthModal = true;
      return;
    }

    if (this.loadingReserve()) return;

    this.clearMessages();
    this.loadingReserve.set(true);

    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.errorMessage.set('Invalid book id');
      this.loadingReserve.set(false);
      return;
    }
    this.reservations.createReservation(id).subscribe({
      next: () => {
        this.successMessage.set('Book reserved successfully! You\'ll be notified when it becomes available.');
        this.loadingReserve.set(false);
      },
      error: (error) => {
        this.errorMessage.set(formatHttpError(error, {
          401: 'Please sign in to reserve a book.',
          403: 'You do not have permission to reserve this book.',
          404: 'Book not found.',
          409: 'You already have an active reservation for this book.',
          0: 'Cannot reach the server. Please check your connection and try again.'
        }, 'Failed to reserve book. Please try again.'));
        this.loadingReserve.set(false);
      }
    });
  }

  canBorrowBook(book: Book): boolean {
    return book.availableCopies > 0 && !this.hasActiveLoan() && !this.hasActiveReservation();
  }

  canReserveBook(book: Book): boolean {
    return book.availableCopies === 0 && !this.hasActiveLoan() && !this.hasActiveReservation();
  }

  hasActiveLoan(): boolean {
    const id = (this.route.snapshot.paramMap.get('id') || '');
    return id ? this.loans.hasActiveLoan(id) : false;
  }

  hasActiveReservation(): boolean {
    const id = (this.route.snapshot.paramMap.get('id') || '');
    return id ? this.reservations.hasActiveReservation(id) : false;
  }

  private clearMessages() {
    this.successMessage.set('');
    this.errorMessage.set('');
  }

  // uses shared util

  closeModal() { this.showAuthModal = false; }
  goToAuth() {
    this.showAuthModal = false;
    this.router.navigateByUrl('/login');
  }
}

