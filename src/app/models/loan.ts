export interface Loan {
  id: string;
  bookId: string;
  userId: string;
  loanDate: string; // ISO date
  dueDate: string; // ISO date
  returnDate?: string; // ISO date when returned
  fineCents?: number; // calculated fine in cents
}

