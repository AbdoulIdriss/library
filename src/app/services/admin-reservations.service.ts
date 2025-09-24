import { Injectable, computed, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { Reservation } from '../models/reservation';

interface ReservationWithBook extends Reservation {
  book?: {
    id: string;
    title: string;
    author: string;
    coverUrl?: string;
  };
  user?: { id?: string; name: string; email: string };
}

@Injectable({ providedIn: 'root' })
export class AdminReservationsService {
  private readonly http = inject(HttpClient);
  private readonly reservationsSignal = signal<ReservationWithBook[]>([]);
  private readonly loadingSignal = signal(false);

  readonly reservations = computed(() => this.reservationsSignal());
  readonly loading = computed(() => this.loadingSignal());

  loadAll(): Observable<ReservationWithBook[]> {
    this.loadingSignal.set(true);
    return this.http.get<ReservationWithBook[]>(`${environment.apiUrl}/reservations/admin`)
      .pipe(
        tap(items => {
          this.reservationsSignal.set(items);
          this.loadingSignal.set(false);
        })
      );
  }

  markAvailable(id: string): Observable<ReservationWithBook> {
    return this.http.post<ReservationWithBook>(`${environment.apiUrl}/reservations/admin/${id}/mark-available`, {})
      .pipe(
        tap(updated => {
          this.reservationsSignal.update(list => list.map(r => r.id === updated.id ? updated : r));
        })
      );
  }

  cancel(id: string): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/reservations/admin/${id}`)
      .pipe(
        tap(() => {
          this.reservationsSignal.update(list => list.filter(r => r.id !== id));
        })
      );
  }
}


