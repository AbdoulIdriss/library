export interface Book {
  id: string; // could be UUID
  isbn: string; // 13-digit ISBN
  title: string;
  author: string;
  genre: string;
  coverUrl: string;
  summary: string;
  totalCopies: number;
  availableCopies: number;
}

export interface BookSearchQuery {
  text?: string; // free text across title/author
  title?: string;
  author?: string;
  genre?: string;
  isbn?: string;
}

