import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry, map } from 'rxjs/operators';

import { Booking } from '../interfaces/booking.interface';
import { Schedule } from '../interfaces/schedule.interface';
import { CustomerTreatment } from '../interfaces/treatment.interface';
import { Invoice } from '../interfaces/invoice.interface';

@Injectable({
  providedIn: 'root'
})
export class CustomerService {
  private apiUrl = '/api/customer'; // Proxy sẽ chuyển tiếp sang http://localhost:3002/api/customer

  private httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
    withCredentials: true // Bắt buộc để gửi nhận Cookie Session
  };

  constructor(private http: HttpClient) {}

  // 1. Lấy dữ liệu tổng quan dashboard (lịch sắp tới, hạng thành viên, số dư ví)
  getOverview(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/overview`, this.httpOptions).pipe(
      retry(2),
      catchError(this.handleError)
    );
  }

  // 2. Tra cứu ca trực / khung giờ trống của KTV (đã chặn ca nghỉ isOff)
  getAvailableSchedules(date: string, staffId?: string): Observable<Schedule[]> {
    let url = `${this.apiUrl}/available-schedules?date=${date}`;
    if (staffId) {
      url += `&staffId=${staffId}`;
    }
    return this.http.get<Schedule[]>(url, this.httpOptions).pipe(
      retry(2),
      catchError(this.handleError)
    );
  }

  // 3. Đặt lịch hẹn mới
  createBooking(bookingData: Partial<Booking>): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/bookings`, bookingData, this.httpOptions).pipe(
      catchError(this.handleError)
    );
  }
  // Cập nhật thông tin lịch hẹn đã đặt
  updateBooking(bookingId: string, bookingData: Partial<Booking>): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/bookings/${bookingId}`, bookingData, this.httpOptions).pipe(
      catchError(this.handleError)
    );
  }

  // 4. Lấy lịch sử đặt hẹn của chính mình
  getMyBookings(statusFilter?: string): Observable<Booking[]> {
  let url = `${this.apiUrl}/bookings`;
  if (statusFilter) {
    url += `?status=${statusFilter}`;
  }
  return this.http.get<any>(url, this.httpOptions).pipe(
    retry(2),
    map((res) => (Array.isArray(res) ? res : res?.data || [])),
    catchError(this.handleError)
  );
}

  // 5. Hủy lịch hẹn
  cancelBooking(bookingId: string, reason: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/bookings/${bookingId}/cancel`, { reason }, this.httpOptions).pipe(
      catchError(this.handleError)
    );
  }

  // 6. Theo dõi hồ sơ liệu trình cá nhân
getMyTreatments(): Observable<CustomerTreatment[]> {
  return this.http.get<any>(`${this.apiUrl}/treatments`, this.httpOptions).pipe(
    retry(2),
    map((res) => (Array.isArray(res) ? res : res?.data || [])),
    catchError(this.handleError)
  );
}

// 7. Lấy lịch sử hóa đơn cá nhân
getMyInvoices(): Observable<Invoice[]> {
  return this.http.get<any>(`${this.apiUrl}/invoices`, this.httpOptions).pipe(
    retry(2),
    map((res) => (Array.isArray(res) ? res : res?.data || [])),
    catchError(this.handleError)
  );
}

// Lấy danh sách dịch vụ / sản phẩm đã sử dụng
  getUsedHistory(type?: 'service' | 'product'): Observable<any[]> {
    const url = type
      ? `${this.apiUrl}/used-history?type=${type}`
      : `${this.apiUrl}/used-history`;

    return this.http.get<any>(url, this.httpOptions).pipe(
      map((res) => (Array.isArray(res) ? res : res?.data || [])),
      catchError(this.handleError)
    );
  }

  // Xử lý lỗi HTTP tập trung
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Đã có lỗi xảy ra, vui lòng thử lại sau.';
    if (error.error instanceof ErrorEvent) {
      // Lỗi phía Client
      errorMessage = `Lỗi mạng/Client: ${error.error.message}`;
    } else {
      // Lỗi trả về từ Backend (Express)
      if (error.error && error.error.message) {
        errorMessage = error.error.message;
      } else {
        errorMessage = `Lỗi Server [Mã ${error.status}]: ${error.statusText}`;
      }
    }
    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
  payInvoiceDebt(invoiceId: string, payload: { amount: number; paymentMethod: string }): Observable<any> {
    return this.http.post<any>(`/api/customer/invoices/${invoiceId}/pay-debt`, payload, { withCredentials: true });
  }

  // Cập nhật thông tin hồ sơ cá nhân xuống MongoDB
  updateProfile(profileData: {
    fullName: string;
    gender?: string;
    dateOfBirth?: string;
    phone: string;
    email: string;
  }): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/profile`, profileData, this.httpOptions).pipe(
      catchError(this.handleError)
    );
  }

  // Đổi mật khẩu tài khoản (gọi /api/auth/change-password)
  changePassword(payload: { oldPassword: string; newPassword: string }): Observable<any> {
    return this.http.post<any>('/api/auth/change-password', payload, this.httpOptions).pipe(
      catchError(this.handleError)
    );
  }
}