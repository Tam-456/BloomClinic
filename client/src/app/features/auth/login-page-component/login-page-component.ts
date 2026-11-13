import { Component, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService, ILoginPayload } from '../../../shared/services/auth.service';
@Component({
  selector: 'app-login-page-component',
  standalone: false,
  styleUrl: './login-page-component.scss',
  templateUrl: './login-page-component.html',
})
export class LoginPageComponent {
  model: ILoginPayload = { username: '', password: '', rememberMe: false };
  errMessage = signal('');
  loading = signal(false);
  justRegistered = false;
  showPassword = false;
  showForgotFlow = false;
  resetPhone = '';
  resetCode = '';
  resetPassword = '';
  resetPasswordConfirm = '';
  resetStep = false;
  resetComplete = false;
  resetLoading = false;
  resetError = '';
  resetMessage = '';
  returnUrl: string | null = null;

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.justRegistered = this.route.snapshot.queryParamMap.get('registered') === '1';
    const url = this.route.snapshot.queryParamMap.get('returnUrl');
    // Chỉ nhận đường dẫn nội bộ, tránh bị chèn link ra ngoài (open redirect)
    this.returnUrl = url && url.startsWith('/') && !url.startsWith('//') ? url : null;
  }

  onLogin(): void {
    this.errMessage.set('');
    this.loading.set(true);
    this.authService.login(this.model).subscribe({
      next: (res) => {
        this.loading.set(false);
        const user = res.data.user;

        // 1. Nếu là Admin hoặc Nhân viên (Staff) -> Chuyển thẳng vào Trung Tâm Điều Hành
        if (user.role === 'admin' || user.role === 'staff') {
          const adminReturnUrl = this.returnUrl?.startsWith('/admin') ? this.returnUrl : null;
          this.router.navigateByUrl(adminReturnUrl ?? '/admin/operations');
          return;
        }

        // 2. Nếu là Khách hàng (Customer) -> Chuyển vào Cổng Khách Hàng
        if (user.role === 'customer') {
          const customerReturnUrl = this.returnUrl?.startsWith('/customer') ? this.returnUrl : null;
          this.router.navigateByUrl(customerReturnUrl ?? '/customer/overview');
          return;
        }

        // 3. Fallback mặc định
        this.router.navigateByUrl(this.returnUrl ?? '/');
      },
      error: (err) => {
        this.loading.set(false);
        this.errMessage.set(err.error?.message ?? 'Không kết nối được máy chủ');
      }
    });
  }

  requestResetCode(): void {
    this.resetError = '';
    this.resetMessage = '';
    if (!this.resetPhone.trim()) {
      this.resetError = 'Vui lòng nhập số điện thoại đã đăng ký.';
      return;
    }
    this.resetLoading = true;
    this.authService.requestPasswordReset(this.resetPhone.trim()).subscribe({
      next: (res) => {
        this.resetLoading = false;
        this.resetStep = true;
        this.resetMessage = res.message || '';
      },
      error: (err) => {
        this.resetLoading = false;
        this.resetError = err.error?.message ?? 'Chưa thể gửi mã xác minh. Vui lòng thử lại sau.';
      }
    });
  }

  completePasswordReset(): void {
    this.resetError = '';
    if (!/^\d{6}$/.test(this.resetCode.trim())) {
      this.resetError = 'Mã xác minh gồm 6 chữ số.';
      return;
    }
    if (this.resetPassword.length < 6) {
      this.resetError = 'Mật khẩu mới phải từ 6 ký tự.';
      return;
    }
    if (this.resetPassword !== this.resetPasswordConfirm) {
      this.resetError = 'Mật khẩu nhập lại không khớp.';
      return;
    }
    this.resetLoading = true;
    this.authService.confirmPasswordReset({ code: this.resetCode.trim(), newPassword: this.resetPassword }).subscribe({
      next: (res) => {
        this.resetLoading = false;
        this.resetComplete = true;
        this.resetMessage = res.message || '';
      },
      error: (err) => {
        this.resetLoading = false;
        this.resetError = err.error?.message ?? 'Không thể cập nhật mật khẩu. Vui lòng thử lại.';
      }
    });
  }

  closeForgotFlow(): void {
    this.showForgotFlow = false;
    this.resetStep = false;
    this.resetComplete = false;
    this.resetCode = '';
    this.resetPassword = '';
    this.resetPasswordConfirm = '';
    this.resetError = '';
    this.resetMessage = '';
  }
}
