import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/admin.guard';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./pages/catalog/catalog.page').then(m => m.CatalogPage) },
  { path: 'book/:id', loadComponent: () => import('./pages/book-detail/book-detail.page').then(m => m.BookDetailPage) },
  { path: 'dashboard', canActivate: [authGuard], loadComponent: () => import('./pages/dashboard/dashboard.page').then(m => m.DashboardPage) },
  { path: 'admin', canActivate: [adminGuard], loadComponent: () => import('./pages/admin/admin.page').then(m => m.AdminPage) },
  { path: 'login', loadComponent: () => import('./pages/login/login.page').then(m => m.LoginPage) },
  { path: '**', redirectTo: '' }
];
