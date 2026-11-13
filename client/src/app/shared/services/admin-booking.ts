import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Booking } from '../interfaces/booking.interface';

@Injectable({
  providedIn: 'root'
})
export class AdminBookingService {
  private apiUrl = '/api/admin/bookings';

  private httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
    withCredentials: true
  };

  constructor(private http: HttpClient) {}

  // 1. Lấy danh sách toàn bộ lịch hẹn (hỗ trợ lọc theo trạng thái)
  getAllBookings(status?: string): Observable<Booking[]> {
    let url = this.apiUrl;
    if (status && status !== 'all') {
      url += `?status=${status}`;
    }
    return this.http.get<Booking[]>(url, this.httpOptions);
  }

  // 2. Cập nhật trạng thái lịch hẹn (confirmed, in_treatment, completed, cancelled)
  updateBookingStatus(bookingId: string, status: string, staffId?: string): Observable<any> {
    return this.http.put<any>(
      `${this.apiUrl}/${bookingId}/status`,
      { status, staffId },
      this.httpOptions
    );
  }
}