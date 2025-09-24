import { Injectable, computed, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Reservation, CreateReservationRequest, ReservationWithBook } from '../models/reservation';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ReservationsService {
  private readonly http = inject(HttpClient);
  private readonly reservationsSignal = signal<ReservationWithBook[]>([]);
  private readonly loadingSignal = signal(false);

  readonly reservations = computed(() => this.reservationsSignal());
  readonly loading = computed(() => this.loadingSignal());

  loadReservations(): Observable<ReservationWithBook[]> {
    this.loadingSignal.set(true);
    return this.http.get<ReservationWithBook[]>(`${environment.apiUrl}/reservations`)
      .pipe(
        tap(reservations => {
          this.reservationsSignal.set(reservations);
          this.loadingSignal.set(false);
        })
      );
  }

  createReservation(bookId: string): Observable<Reservation> {
    const request: CreateReservationRequest = { bookId };
    return this.http.post<Reservation>(`${environment.apiUrl}/reservations`, request)
      .pipe(
        tap(newReservation => {
          // Refresh reservations to get the populated data
          this.loadReservations().subscribe();
        })
      );
  }

  cancelReservation(reservationId: string): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/reservations/${reservationId}`)
      .pipe(
        tap(() => {
          this.reservationsSignal.update(reservations => 
            reservations.filter(r => r.id !== reservationId)
          );
        })
      );
  }

  getUserReservations(): ReservationWithBook[] {
    return this.reservationsSignal().filter(r => r.status !== 'CANCELLED');
  }

  hasActiveReservation(bookId: string): boolean {
    return this.reservationsSignal().some(r => 
      r.bookId === bookId && r.status === 'PENDING'
    );
  }
}