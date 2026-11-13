import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { IApiResponse } from '../interfaces/api-response.interface';
import { IAuthUser, IUser } from '../interfaces/user.interface';

export interface ILoginPayload {
    username: string;
    password: string;
    rememberMe: boolean;
}

export interface IRegisterPayload {
    fullName: string;
    phone: string;
    email: string;
    password: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
    private readonly api = '/api/auth';

    // Singleton chia sẻ trạng thái đăng nhập cho Header, Guard, các trang (chương III)
    currentUser = signal<IAuthUser | null>(null);

    constructor(private http: HttpClient) { }

    login(payload: ILoginPayload): Observable<IApiResponse<{ user: IAuthUser }>> {
        return this.http
            .post<IApiResponse<{ user: IAuthUser }>>(`${this.api}/login`, payload)
            .pipe(tap((res) => this.currentUser.set(res.data.user)));
    }

    register(payload: IRegisterPayload): Observable<IApiResponse<{ user: IAuthUser }>> {
        return this.http.post<IApiResponse<{ user: IAuthUser }>>(`${this.api}/register`, payload);
    }

    requestPasswordReset(phone: string): Observable<IApiResponse<null>> {
        return this.http.post<IApiResponse<null>>(`${this.api}/password-reset/request`, { phone });
    }

    confirmPasswordReset(payload: { code: string; newPassword: string }): Observable<IApiResponse<null>> {
        return this.http.post<IApiResponse<null>>(`${this.api}/password-reset/confirm`, payload);
    }

    logout(): Observable<any> {
    // 1. Xóa ngay lập tức ở Frontend
    this.currentUser.set(null);
    try {
      localStorage.removeItem('bloom_user');
      localStorage.removeItem('bloom_mock_user');
      sessionStorage.clear();
    } catch {}

    // 2. Gọi API hủy session phía Express server
    return this.http.post<any>('/api/auth/logout', {}, { withCredentials: true }).pipe(
      catchError(() => of({ success: true }))
    );
  }

    // Khôi phục đăng nhập từ cookie session (dùng ở Bước 5 khi F5 trang)
    loadProfile(): Observable<IUser | null> {
        return this.http.get<IApiResponse<IUser>>(`${this.api}/profile`).pipe(
            tap((res) => {
          if (res?.data) {
            this.currentUser.set({
              ...res.data,
              id: res.data._id || (res.data as any).id || '',
            });
          }
        }),
            map((res) => res.data),
            catchError(() => {
                this.currentUser.set(null);
                return of(null);
            })
        );
    }
}
