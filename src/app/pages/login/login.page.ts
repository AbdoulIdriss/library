import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { formatHttpError } from '../../utils/http-error.util';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './login.page.html',
  styleUrl: './login.page.scss'
})
export class LoginPage {
  isLogin = true; 
  email = '';
  password = '';
  name = '';
  confirmPassword = '';
  loading = false;
  error = '';
  
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  toggleMode() {
    this.isLogin = !this.isLogin;
    this.clearForm();
    this.error = '';
  }

  clearForm() {
    this.email = '';
    this.password = '';
    this.name = '';
    this.confirmPassword = '';
  }

  onSubmit() {
    if (this.loading) return;
    this.error = '';
    this.loading = true;
    if (this.isLogin) {
      this.handleLogin();
    } else {
      this.handleRegister();
    }
  }

  private handleLogin() {
    if (!this.email || !this.password) {
      this.error = 'Please fill in all fields';
      this.loading = false;
      return;
    }

    this.auth.login(this.email, this.password).subscribe({
      next: () => {
        this.loading = false;
        const dest = this.auth.isAdmin() ? '/admin' : '/dashboard';
        this.router.navigateByUrl(dest);
      },
      error: (err) => {
        this.loading = false;
        this.error = formatHttpError(err, {
          401: 'Invalid email or password',
          0: 'Cannot reach the server. Please try again.'
        }, 'Sign in failed. Please try again.');
      }
    });
  }

  private handleRegister() {
    if (!this.name || !this.email || !this.password || !this.confirmPassword) {
      this.error = 'Please fill in all fields';
      this.loading = false;
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.error = 'Passwords do not match';
      this.loading = false;
      return;
    }

    if (this.password.length < 6) {
      this.error = 'Password must be at least 6 characters long';
      this.loading = false;
      return;
    }

    this.auth.register(this.name, this.email, this.password).subscribe({
      next: () => {
        this.loading = false;
        const dest = this.auth.isAdmin() ? '/admin' : '/dashboard';
        this.router.navigateByUrl(dest);
      },
      error: (err) => {
        this.loading = false;
        this.error = formatHttpError(err, {
          409: 'Email already registered',
          0: 'Cannot reach the server. Please try again.'
        }, 'Registration failed. Please try again.');
      }
    });
  }
}

