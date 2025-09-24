import { Component, signal, computed, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BooksService } from '../../services/books.service';
import { BookCardComponent } from '../../components/shared/book-card/book-card.component';
import { SearchBarComponent } from '../../components/shared/search-bar/search-bar.component';

@Component({
  selector: 'app-catalog-page',
  standalone: true,
  imports: [BookCardComponent, SearchBarComponent],
  templateUrl: './catalog.page.html',
  styleUrl: './catalog.page.scss'
})
export class CatalogPage {
  private readonly q = signal<string>('');
  private readonly booksService = inject(BooksService);
  readonly books = this.booksService.books;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router
  ) {
    // Initial load
    this.booksService.loadBooks().subscribe({
      error: (error) => console.error('Failed to load books:', error)
    });
    
    const qp = this.route.snapshot.queryParamMap.get('q') ?? '';
    this.q.set(qp);
    this.route.queryParamMap.subscribe(params => {
      const text = params.get('q') ?? '';
      this.q.set(text);
      if (text) {
        this.booksService.search({ text }).subscribe({
          error: (error) => console.error('Search failed:', error)
        });
      } else {
        this.booksService.loadBooks().subscribe({
          error: (error) => console.error('Reload books failed:', error)
        });
      }
    });
  }

  onSearch(text: string) {
    this.router.navigate([], { relativeTo: this.route, queryParams: { q: text || null }, queryParamsHandling: 'merge' });
  }
}

