export interface Reservation {
  id: string;
  userId: string;
  bookId: string;
  status: 'PENDING' | 'NOTIFIED' | 'CANCELLED';
  notifiedAt?: string;
  createdAt: string;
}

export interface CreateReservationRequest {
  bookId: string;
}

export interface ReservationWithBook extends Reservation {
  book: {
    id: string;
    title: string;
    author: string;
    coverUrl?: string;
  };
}