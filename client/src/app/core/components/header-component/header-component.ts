import { Component, HostListener, signal, inject } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../../shared/services/auth';

@Component({
  selector: 'app-header-component',
  standalone: false,
  styleUrl: './header-component.scss',
  templateUrl: './header-component.html',
})
export class HeaderComponent {
  authService = inject(AuthService);
  private router = inject(Router);

  mobileOpen = signal(false);
  scrolled = signal(false);
  isAdminRoute = signal(this.router.url.startsWith('/admin'));

  constructor() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.isAdminRoute.set(event.urlAfterRedirects.startsWith('/admin'));
    });
  }

  toggleMobile(): void { this.mobileOpen.update((v) => !v); }
  closeMobile(): void { this.mobileOpen.set(false); }

  @HostListener('window:scroll')
  onScroll(): void {
    this.scrolled.set(window.scrollY > 10);
  }

  onLogout(): void {
    this.authService.logout().subscribe(() => {
      this.router.navigate(['/']);
    });
  }
}