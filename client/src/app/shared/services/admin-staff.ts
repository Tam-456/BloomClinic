import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Staff } from '../interfaces/staff.interface';
import { Schedule } from '../interfaces/schedule.interface';

@Injectable({
  providedIn: 'root'
})
export class AdminStaffService {
  private apiUrl = '/api/admin';

  private httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
    withCredentials: true
  };

  constructor(private http: HttpClient) {}

  // 1. Lấy danh sách toàn bộ nhân sự
  getStaffs(): Observable<Staff[]> {
    return this.http.get<Staff[]>(`${this.apiUrl}/staffs`, this.httpOptions);
  }

  getSchedules(from: string, to: string) {
  return this.http.get<any>(
    `${this.apiUrl}/schedules`,
    {
      params: { from, to }
    }
  );
}

  // 2. Thiết lập ca trực hoặc duyệt lịch nghỉ
  createSchedule(scheduleData: Partial<Schedule>): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/schedules`, scheduleData, this.httpOptions);
  }
}