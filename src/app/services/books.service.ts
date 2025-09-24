import { Injectable, computed, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, tap } from 'rxjs';
import { Book, BookSearchQuery } from '../models/book';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class BooksService {
  private readonly http = inject(HttpClient);
  private readonly booksSignal = signal<Book[]>([]);
  private readonly loadingSignal = signal(false);

  readonly books = computed(() => this.booksSignal());
  readonly loading = computed(() => this.loadingSignal());

  constructor() {
    this.loadBooks();
  }

  loadBooks(params?: Partial<BookSearchQuery & { page: number; pageSize: number }>): Observable<Book[]> {
    this.loadingSignal.set(true);
    const httpParams: Record<string, string> = {};
    if (params) {
      if (params.text) httpParams['q'] = params.text;
      if (params.title) httpParams['title'] = params.title;
      if (params.author) httpParams['author'] = params.author;
      if (params.genre) httpParams['genre'] = params.genre;
      if (params.isbn) httpParams['isbn'] = params.isbn;
      if ((params as any).page) httpParams['page'] = String((params as any).page);
      if ((params as any).pageSize) httpParams['pageSize'] = String((params as any).pageSize);
    }
    return this.http.get<{ items: any[] }>(`${environment.apiUrl}/books`, { params: httpParams })
      .pipe(
        map(res => res.items.map(item => this.normalizeBook(item))),
        tap(books => {
          this.booksSignal.set(books);
          this.loadingSignal.set(false);
        })
      );
  }

  search(query: BookSearchQuery): Observable<Book[]> {
    return this.loadBooks(query);
  }

  getById(id: string): Observable<Book> {
    return this.http.get<any>(`${environment.apiUrl}/books/${id}`).pipe(
      map(item => this.normalizeBook(item))
    );
  }

  addBook(book: Omit<Book, 'id' | 'availableCopies'> & { availableCopies?: number }): Observable<Book> {
    return this.http.post<any>(`${environment.apiUrl}/books`, book)
      .pipe(
        map(item => this.normalizeBook(item)),
        tap(newBook => {
          this.booksSignal.update(books => [newBook, ...books]);
        })
      );
  }

  deleteBook(id: string): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/books/${id}`)
      .pipe(
        tap(() => {
          this.booksSignal.update(books => books.filter(b => b.id !== id));
        })
      );
  }

  updateBook(id: string, changes: Partial<Book>): Observable<Book> {
    return this.http.put<any>(`${environment.apiUrl}/books/${id}`, changes)
      .pipe(
        map(item => this.normalizeBook(item)),
        tap(updatedBook => {
          this.booksSignal.update(books =>
            books.map(b => b.id === id ? updatedBook : b)
          );
        })
      );
  }

  // Helper method to get a book from the local signal (synchronous)
  getBookFromCache(id: string): Book | undefined {
    return this.booksSignal().find((b) => b.id === id);
  }

  setAvailableCopies(id: string, availableCopies: number): Observable<Book> {
    return this.updateBook(id, { availableCopies });
  }

  private normalizeBook(item: any): Book {
    return {
      id: item.id || item._id,
      isbn: item.isbn,
      title: item.title,
      author: item.author,
      genre: item.genre ?? '',
      coverUrl: item.coverUrl ?? '',
      summary: item.summary ?? '',
      totalCopies: item.totalCopies ?? 0,
      availableCopies: item.availableCopies ?? 0,
    } as Book;
  }
}

