import { Component, signal, HostListener, ElementRef, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../shared/services/auth.service';

@Component({
  selector: 'app-user-toolbar-component',
  standalone: false,
  styleUrl: './user-toolbar-component.scss',
  templateUrl: './user-toolbar-component.html',
})
export class UserToolbarComponent {
  private authService = inject(AuthService);
  dropdownOpen = signal(false);
  logoutDialogOpen = signal(false);
  logoutNotice = signal('');
  logoutError = signal('');
  logoutLoading = signal(false);
  private noticeTimer?: ReturnType<typeof setTimeout>;

  constructor(private router: Router, private elRef: ElementRef) {}

  toggleDropdown(): void { this.dropdownOpen.update((v) => !v); }
  closeDropdown(): void { this.dropdownOpen.set(false); }

  requestLogout(): void {
    this.closeDropdown();
    this.logoutError.set('');
    this.logoutDialogOpen.set(true);
  }

  cancelLogout(): void {
    if (!this.logoutLoading()) this.logoutDialogOpen.set(false);
  }

  confirmLogout(): void {
    if (this.logoutLoading()) return;
    this.logoutLoading.set(true);
    this.logoutError.set('');
    this.authService.logout().subscribe({
      next: () => {
        this.logoutLoading.set(false);
        this.logoutDialogOpen.set(false);
        this.logoutNotice.set('Bạn đã đăng xuất thành công. Hẹn gặp lại bạn tại Bloom!');
        clearTimeout(this.noticeTimer);
        this.noticeTimer = setTimeout(() => this.logoutNotice.set(''), 4500);
        this.router.navigate(['/']);
      },
      error: () => {
        this.logoutLoading.set(false);
        this.logoutError.set('Chưa thể đăng xuất lúc này. Vui lòng thử lại.');
      },
    });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elRef.nativeElement.contains(event.target)) this.closeDropdown();
  }
}
