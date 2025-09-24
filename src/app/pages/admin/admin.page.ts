import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { BooksService } from '../../services/books.service';
import { AdminLoansService } from '../../services/admin-loans.service';
import { AdminReservationsService } from '../../services/admin-reservations.service';
import { Book } from '../../models/book';

@Component({
  selector: 'app-admin-page',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './admin.page.html',
  styleUrl: './admin.page.scss'
})
export class AdminPage {
  private readonly booksSvc = inject(BooksService);
  private readonly adminLoans = inject(AdminLoansService);
  private readonly adminReservations = inject(AdminReservationsService);

  form: Partial<Book> = {
    title: '',
    author: '',
    genre: '',
    isbn: '',
    coverUrl: '',
    summary: '',
    totalCopies: 1,
  } as Partial<Book>;

  books = this.booksSvc.books;
  allLoans = this.adminLoans.loans;
  allReservations = this.adminReservations.reservations;

  constructor() {
    // Load admin data
    this.adminLoans.loadAll().subscribe();
    this.adminReservations.loadAll().subscribe();
  }

  forceReturn(loanId: string) {
    this.adminLoans.forceReturn(loanId).subscribe();
  }

  markReservationAvailable(id: string) {
    this.adminReservations.markAvailable(id).subscribe();
  }

  cancelReservation(id: string) {
    this.adminReservations.cancel(id).subscribe();
  }

  isOverdueLoan(l: { dueDate: string; returnDate?: string }): boolean {
    if (l.returnDate) return false;
    return new Date(l.dueDate).getTime() < Date.now();
  }

  saveBook() {
    if (!this.form.title || !this.form.author) return;
    if (this.form.id) {
      this.booksSvc.updateBook(this.form.id, this.form as Partial<Book>).subscribe({
        next: () => this.resetForm(),
        error: (error) => console.error('Error updating book:', error)
      });
    } else {
      this.booksSvc.addBook(this.form as any).subscribe({
        next: () => this.resetForm(),
        error: (error) => console.error('Error adding book:', error)
      });
    }
  }

  edit(book: Book) {
    this.form = { ...book };
  }

  remove(id: string) {
    this.booksSvc.deleteBook(id).subscribe({
      next: () => {
        if (this.form.id === id) this.resetForm();
      },
      error: (error) => console.error('Error deleting book:', error)
    });
  }

  setAvailable(id: string, value: number) {
    const v = Number(value);
    if (!Number.isFinite(v) || v < 0) return;
    this.booksSvc.setAvailableCopies(id, v).subscribe({
      error: (error) => console.error('Error updating available copies:', error)
    });
  }

  resetForm() {
    this.form = {
      title: '', author: '', genre: '', isbn: '', coverUrl: '', summary: '', totalCopies: 1,
    } as Partial<Book>;
  }
}

