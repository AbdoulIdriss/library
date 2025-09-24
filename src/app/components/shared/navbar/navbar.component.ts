import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { NotificationPanelComponent } from '../notification-panel/notification-panel.component';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, FormsModule, NotificationPanelComponent],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent {
  q = '';
  mobileOpen = signal(false);
  constructor(public auth: AuthService, private readonly router: Router) {}
  logout() {
    const wasAdmin = this.auth.isAdmin();
    this.auth.logout();
    this.router.navigateByUrl(wasAdmin ? '/login' : '/');
  }
  toggleMobile() {
    this.mobileOpen.update(v => !v);
  }
  onSearch() {
    const query = this.q.trim();
    this.router.navigate(['/'], { queryParams: { q: query || null }, queryParamsHandling: 'merge' });
  }
}

