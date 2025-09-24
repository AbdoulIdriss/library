import { Component, Input } from '@angular/core';
import { NgClass } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Book } from '../../../models/book';

@Component({
  selector: 'app-book-card',
  standalone: true,
  imports: [RouterLink, NgClass],
  templateUrl: './book-card.component.html',
  styleUrl: './book-card.component.scss'
})
export class BookCardComponent {
  @Input({ required: true }) book!: Book;
}

