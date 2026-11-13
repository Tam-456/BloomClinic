import { Component, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../shared/services/auth';
import { ConfirmDialogService } from '../../../shared/services/confirm-dialog'; // <-- Thêm dòng này
import { User } from '../../../shared/interfaces/user.interface';

@Component({
  selector: 'app-admin-layout',
  standalone: false,
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.scss',
})
export class AdminLayout implements OnInit {
  currentUser = signal<User | null>(null);
  isSidebarCollapsed = signal<boolean>(false);

  constructor(
    private authService: AuthService,
    private confirmDialog: ConfirmDialogService, // <-- Inject service popup
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
    this.isSidebarCollapsed.update((v) => !v);
  }

  onLogout(): void {
    this.confirmDialog.confirm({
      title: 'Đăng xuất khỏi Bloom?',
      message: 'Bạn có chắc chắn muốn kết thúc phiên đăng nhập hiện tại không?',
      confirmText: 'Đăng xuất',
      cancelText: 'Ở lại',
      type: 'danger',
      action: () => {
        this.authService.logout().subscribe({
          next: () => this.router.navigate(['/login']),
          error: () => this.router.navigate(['/login'])
        });
      }
    });
  }
}