import { Injectable, computed, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Loan } from '../models/loan';
import { environment } from '../../environments/environment';

interface BorrowBookRequest {
  bookId: string;
}

interface ReturnBookRequest {
  loanId: string;
}

interface LoanWithBook extends Loan {
  book?: {
    id: string;
    title: string;
    author: string;
    coverUrl?: string;
  };
}

@Injectable({ providedIn: 'root' })
export class LoansService {
  private readonly http = inject(HttpClient);
  private readonly loansSignal = signal<LoanWithBook[]>([]);
  private readonly loadingSignal = signal(false);

  readonly loans = computed(() => this.loansSignal());
  readonly loading = computed(() => this.loadingSignal());

  loadLoans(): Observable<LoanWithBook[]> {
    this.loadingSignal.set(true);
    return this.http.get<LoanWithBook[]>(`${environment.apiUrl}/loans`)
      .pipe(
        tap(loans => {
          this.loansSignal.set(loans);
          this.loadingSignal.set(false);
        })
      );
  }

  borrowBook(bookId: string): Observable<Loan> {
    const request: BorrowBookRequest = { bookId };
    return this.http.post<Loan>(`${environment.apiUrl}/loans/borrow`, request)
      .pipe(
        tap(() => {
          // Refresh loans to get updated data
          this.loadLoans().subscribe();
        })
      );
  }

  returnBook(loanId: string): Observable<void> {
    const request: ReturnBookRequest = { loanId };
    return this.http.post<void>(`${environment.apiUrl}/loans/return`, request)
      .pipe(
        tap(() => {
          // Update local state immediately for better UX
          this.loansSignal.update(loans =>
            loans.map(loan =>
              loan.id === loanId
                ? { ...loan, returnDate: new Date().toISOString() }
                : loan
            )
          );
        })
      );
  }

  getUserLoans(): LoanWithBook[] {
    return this.loansSignal();
  }

  getActiveLoans(): LoanWithBook[] {
    return this.loansSignal().filter(loan => !loan.returnDate);
  }

  getOverdueLoans(): LoanWithBook[] {
    const now = new Date();
    return this.loansSignal().filter(loan => 
      !loan.returnDate && new Date(loan.dueDate) < now
    );
  }

  hasActiveLoan(bookId: string): boolean {
    return this.loansSignal().some(loan => 
      loan.bookId === bookId && !loan.returnDate
    );
  }

  calculateFine(dueDate: string, returnDate?: string): number {
    const due = new Date(dueDate).getTime();
    const returned = returnDate ? new Date(returnDate).getTime() : new Date().getTime();
    
    if (returned <= due) return 0;
    
    const daysLate = Math.ceil((returned - due) / (1000 * 60 * 60 * 24));
    const centsPerDay = 100; // $1/day
    return daysLate * centsPerDay;
  }
}

