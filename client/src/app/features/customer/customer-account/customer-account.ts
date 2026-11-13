import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { CustomerService } from '../../../shared/services/customer';
import { User } from '../../../shared/interfaces/user.interface';

// Quy tắc mật khẩu khớp Backend: tối thiểu 6 ký tự 
const STRONG_PASSWORD_REGEX = /^.{6,}$/;

// Validator kiểm tra mật khẩu mới không trùng mật khẩu cũ
function differentPasswordValidator(control: AbstractControl): ValidationErrors | null {
  const currentPass = control.get('currentPassword')?.value;
  const newPass = control.get('newPassword')?.value;
  if (currentPass && newPass && currentPass === newPass) {
    return { sameAsCurrent: true };
  }
  return null;
}

// Validator kiểm tra xác nhận mật khẩu
function confirmPasswordValidator(control: AbstractControl): ValidationErrors | null {
  const newPass = control.get('newPassword')?.value;
  const confirmPass = control.get('confirmPassword')?.value;
  if (newPass && confirmPass && newPass !== confirmPass) {
    return { passwordMismatch: true };
  }
  return null;
}

@Component({
  selector: 'app-customer-account',
  standalone: false,
  templateUrl: './customer-account.html',
  styleUrl: './customer-account.scss',
})
export class CustomerAccount implements OnInit {
  profileForm!: FormGroup;
  passwordForm!: FormGroup;

  currentUser = signal<User | null>(null);
  isLoading = signal<boolean>(false);
  isSavingProfile = signal<boolean>(false);
  isSavingPassword = signal<boolean>(false);

  // Thông báo
  profileMessage = signal<string>('');
  profileError = signal<string>('');
  passwordMessage = signal<string>('');
  passwordError = signal<string>('');

  // Điều khiển Popup Modal
  isEditProfileModalOpen = signal<boolean>(false);
  isChangePasswordModalOpen = signal<boolean>(false);

  constructor(
    private fb: FormBuilder,
    private customerService: CustomerService
  ) {}

  ngOnInit(): void {
    this.initForms();
    this.loadUserProfile();
  }

  private initForms(): void {
    this.profileForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      gender: ['Nữ', [Validators.required]],
      dateOfBirth: ['1998-05-15', [Validators.required]],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10,11}$/)]],
      email: ['', [Validators.required, Validators.email]],
    });

    this.passwordForm = this.fb.group(
      {
        currentPassword: ['', [Validators.required]],
        newPassword: ['', [Validators.required, Validators.pattern(STRONG_PASSWORD_REGEX)]],
        confirmPassword: ['', [Validators.required]],
      },
      {
        validators: [differentPasswordValidator, confirmPasswordValidator]
      }
    );
  }

  // Lấy mã khách hàng chuẩn dạng Cxxx (khóa customerCode cũ)
  getDisplayCustomerId(user?: any): string {
    if (!user) return 'C001';
    if (user.customId && /^C\d+/i.test(user.customId)) return user.customId;
    if (user.customerCode && /^KH-(\d+)/i.test(user.customerCode)) {
      const num = user.customerCode.replace(/\D/g, '');
      return `C${num.padStart(3, '0')}`;
    }
    return user.customId || 'C001';
  }

  loadUserProfile(): void {
    this.isLoading.set(true);
    this.customerService.getOverview().subscribe({
      next: (res) => {
        if (res?.data?.user) {
          const user = res.data.user;
          user.customId = this.getDisplayCustomerId(user);
          if (!user.dateOfBirth && user.dob) {
            user.dateOfBirth = new Date(user.dob).toISOString().slice(0, 10);
          }
          this.currentUser.set(user);
          this.patchProfileForm(user);
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  private patchProfileForm(user: any): void {
    const rawDob = user.dateOfBirth || user.dob;
    const formattedDob = rawDob ? new Date(rawDob).toISOString().slice(0, 10) : '';
    this.profileForm.patchValue({
      fullName: user.fullName || '',
      gender: user.gender || 'Nữ',
      dateOfBirth: formattedDob,
      phone: user.phone || '',
      email: user.email || '',
    });
  }

  // --- POPUP CẬP NHẬT HỒ SƠ ---
  openEditProfileModal(): void {
    this.profileMessage.set('');
    this.profileError.set('');
    if (this.currentUser()) {
      this.patchProfileForm(this.currentUser()!);
    }
    this.isEditProfileModalOpen.set(true);
  }

  closeEditProfileModal(): void {
    this.isEditProfileModalOpen.set(false);
  }

  onSaveProfile(): void {
    if (this.profileForm.invalid) {
      this.profileError.set('Vui lòng kiểm tra lại thông tin, đảm bảo không bỏ trống các trường bắt buộc!');
      return;
    }

    this.isSavingProfile.set(true);
    this.profileError.set('');

    this.customerService.updateProfile(this.profileForm.value).subscribe({
      next: (res) => {
        const updatedUser = res?.data
          ? { ...this.currentUser()!, ...res.data, customId: this.getDisplayCustomerId(res.data) }
          : { ...this.currentUser()!, ...this.profileForm.value };
        this.currentUser.set(updatedUser);
        this.profileMessage.set('Cập nhật hồ sơ cá nhân thành công!');
        this.isSavingProfile.set(false);
        this.closeEditProfileModal();
      },
      error: (err) => {
        this.profileError.set(err?.message || 'Không thể cập nhật hồ sơ, vui lòng thử lại!');
        this.isSavingProfile.set(false);
      }
    });
  }

  // --- POPUP ĐỔI MẬT KHẨU ---
  openChangePasswordModal(): void {
    this.passwordMessage.set('');
    this.passwordError.set('');
    this.passwordForm.reset();
    this.isChangePasswordModalOpen.set(true);
  }

  closeChangePasswordModal(): void {
    this.isChangePasswordModalOpen.set(false);
  }

  onSavePassword(): void {
    this.passwordError.set('');

    const currentPass = this.passwordForm.get('currentPassword')?.value;
    if (!currentPass || !currentPass.trim()) {
      this.passwordError.set('Vui lòng nhập mật khẩu hiện tại!');
      return;
    }

    if (this.passwordForm.errors?.['sameAsCurrent']) {
      this.passwordError.set('Mật khẩu mới không được trùng với mật khẩu hiện tại!');
      return;
    }

    if (this.passwordForm.get('newPassword')?.invalid) {
      this.passwordError.set('Mật khẩu mới phải có tối thiểu 6 ký tự!');
      return;
    }

    if (this.passwordForm.errors?.['passwordMismatch']) {
      this.passwordError.set('Mật khẩu xác nhận không khớp với mật khẩu mới!');
      return;
    }

    this.isSavingPassword.set(true);
    this.customerService.changePassword({
      oldPassword: currentPass,
      newPassword: this.passwordForm.get('newPassword')?.value
    }).subscribe({
      next: () => {
        this.isSavingPassword.set(false);
        this.passwordMessage.set('Đổi mật khẩu thành công! Mật khẩu mới đã được lưu vào hệ thống.');
        this.closeChangePasswordModal();
      },
      error: (err) => {
        // Hiển thị thông báo lỗi từ Backend (ví dụ: "Mật khẩu hiện tại không chính xác!") ngay trong popup
        this.isSavingPassword.set(false);
        this.passwordError.set(err?.message || 'Mật khẩu hiện tại không chính xác!');
      }
    });
  }
}