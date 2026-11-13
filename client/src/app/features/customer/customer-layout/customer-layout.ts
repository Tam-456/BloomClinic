import { Component, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../shared/services/auth';
import { User } from '../../../shared/interfaces/user.interface';

@Component({
  selector: 'app-customer-layout',
  standalone: false,
  templateUrl: './customer-layout.html',
  styleUrl: './customer-layout.scss',
})
export class CustomerLayout implements OnInit {
  currentUser = signal<User | null>(null);
  isSidebarCollapsed = signal<boolean>(false); // Trạng thái đóng/mở sidebar

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.getCurrentUser().subscribe({
      next: (user) => this.currentUser.set(user),
      error: () => {
        this.currentUser.set(this.authService.currentUserValue);
      }
    });
  }

  toggleSidebar(): void {
    this.isSidebarCollapsed.update(v => !v);
  }

  onLogout(): void {
    if (confirm('Bạn có chắc chắn muốn đăng xuất?')) {
      this.authService.logout().subscribe(() => {
        this.router.navigate(['/login']);
      });
    }
  }
}