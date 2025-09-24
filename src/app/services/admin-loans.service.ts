import { Injectable, computed, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { Loan } from '../models/loan';

interface LoanWithBook extends Loan {
  book?: {
    id: string;
    title: string;
    author: string;
    coverUrl?: string;
  };
  user?: { id?: string; name: string; email: string };
}

@Injectable({ providedIn: 'root' })
export class AdminLoansService {
  private readonly http = inject(HttpClient);
  private readonly loansSignal = signal<LoanWithBook[]>([]);
  private readonly loadingSignal = signal(false);

  readonly loans = computed(() => this.loansSignal());
  readonly loading = computed(() => this.loadingSignal());

  loadAll(): Observable<LoanWithBook[]> {
    this.loadingSignal.set(true);
    return this.http.get<LoanWithBook[]>(`${environment.apiUrl}/loans/admin`)
      .pipe(
        tap(loans => {
          this.loansSignal.set(loans);
          this.loadingSignal.set(false);
        })
      );
  }

  forceReturn(loanId: string): Observable<LoanWithBook> {
    return this.http.post<LoanWithBook>(`${environment.apiUrl}/loans/admin/force-return`, { loanId })
      .pipe(
        tap(updated => {
          this.loansSignal.update(list => list.map(l => l.id === updated.id ? updated : l));
        })
      );
  }
}


