import { Injectable, computed, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { User } from '../models/user';
import { environment } from '../../environments/environment';

interface LoginRequest {
  email: string;
  password: string;
}

interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

interface AuthResponse {
  user: User;
  token: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly currentUserSignal = signal<User | null>(null);

  readonly currentUser = computed(() => this.currentUserSignal());
  readonly isLoggedIn = computed(() => this.currentUserSignal() !== null);
  readonly isAdmin = computed(() => !!this.currentUserSignal()?.isAdmin);

  constructor() {
    this.loadUserFromStorage();
  }

  private normalizeUser(raw: any): User {
    return {
      id: raw.id,
      email: raw.email,
      name: raw.name,
      isAdmin: raw.isAdmin ?? (raw.role === 'ADMIN')
    } as User;
  }

  login(email: string, password: string): Observable<AuthResponse> {
    const loginData: LoginRequest = { email, password };
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, loginData)
      .pipe(
        tap(response => {
          const user = this.normalizeUser(response.user as any);
          this.currentUserSignal.set(user);
          localStorage.setItem('authToken', response.token);
          localStorage.setItem('currentUser', JSON.stringify(user));
        })
      );
  }

  register(name: string, email: string, password: string): Observable<AuthResponse> {
    const registerData: RegisterRequest = { name, email, password };
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/register`, registerData)
      .pipe(
        tap(response => {
          const user = this.normalizeUser(response.user as any);
          this.currentUserSignal.set(user);
          localStorage.setItem('authToken', response.token);
          localStorage.setItem('currentUser', JSON.stringify(user));
        })
      );
  }

  logout(): void {
    this.currentUserSignal.set(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
  }

  me(): Observable<User> {
    return this.http.get<any>(`${environment.apiUrl}/auth/me`)
      .pipe(
        tap(raw => this.currentUserSignal.set(this.normalizeUser(raw)))
      );
  }

  private loadUserFromStorage(): void {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      try {
        const raw = JSON.parse(storedUser);
        this.currentUserSignal.set(this.normalizeUser(raw));
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('currentUser');
      }
    }
  }

  getAuthToken(): string | null {
    return localStorage.getItem('authToken');
  }
}

