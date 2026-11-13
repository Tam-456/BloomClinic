import { Component, signal, inject } from '@angular/core';
import {
  AbstractControl, FormControl, FormGroup, ValidationErrors, Validators
} from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../shared/services/auth.service';

function passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
  const pass = group.get('password')?.value;
  const confirm = group.get('confirmPass')?.value;
  return pass === confirm ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-register-page-component',
  standalone: false,
  styleUrl: './register-page-component.scss',
  templateUrl: './register-page-component.html',
})
export class RegisterPageComponent {
  private authService = inject(AuthService);
  showPassword = false;
  showConfirmPassword = false;
  errMessage = signal('');
  loading = signal(false);

  regForm: FormGroup = new FormGroup(
    {
      fullName: new FormControl('', [Validators.required, Validators.minLength(3)]),
      phone: new FormControl('', [
        Validators.required,
        Validators.pattern(/^(0|\+84)(\s*\d){9}$/)
      ]),
      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', [Validators.required, Validators.minLength(6)]),
      confirmPass: new FormControl('', [Validators.required])
    },
    { validators: passwordMatchValidator }
  );

  constructor( private router: Router) { }

  // Rút gọn khi viết template
  get f() {
    return this.regForm.controls;
  }

  onSubmit(): void {
    this.errMessage.set('');
    if (this.regForm.invalid) {
      this.regForm.markAllAsTouched();
      return;
    }
    const { fullName, phone, email, password } = this.regForm.value;
    this.loading.set(true);
    this.authService.register({ fullName, phone, email, password }).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/login'], { queryParams: { registered: 1 } });
      },
      error: (err) => {
        this.loading.set(false);
        this.errMessage.set(err.error?.message ?? 'Không kết nối được máy chủ');
      }
    });
  }
}
