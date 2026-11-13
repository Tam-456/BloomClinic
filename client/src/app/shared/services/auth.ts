import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';
import { AuthService as RealAuthService } from './auth.service';
import { User } from '../interfaces/user.interface';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Dùng chung 1 nguồn dữ liệu duy nhất với auth.service.ts của Long
  private realAuth = inject(RealAuthService);

  // Giữ nguyên các biến & signal để tương thích 100% với code cũ của Tâm
  currentUser = this.realAuth.currentUser;
  currentUser$ = toObservable(this.realAuth.currentUser);

  checkSession(): Observable<User | null> {
    return of(this.realAuth.currentUser());
  }

  getCurrentUser(): Observable<User | null> {
    return of(this.realAuth.currentUser());
  }

  login(credentials: { username: string; password: string }): Observable<any> {
    return this.realAuth.login({
      username: credentials.username,
      password: credentials.password,
      rememberMe: false
    });
  }

  logout(): Observable<any> {
    // Khi AdminLayout / Header / CustomerLayout gọi logout(), nó sẽ xóa sạch state bên auth.service.ts!
    return this.realAuth.logout();
  }

  get currentUserValue(): User | null {
    return this.realAuth.currentUser();
  }

  get isLoggedIn(): boolean {
    return !!this.realAuth.currentUser();
  }
}