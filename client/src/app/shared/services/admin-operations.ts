import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry, map } from 'rxjs/operators';
import { Deposit } from '../interfaces/deposit.interface';
import { Invoice } from '../interfaces/invoice.interface';

@Injectable({
  providedIn: 'root'
})
export class AdminOperationsService {
  private apiUrl = '/api/admin';

  private httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
    withCredentials: true
  };

  constructor(private http: HttpClient) {}

  /** 1. Lấy chỉ số KPIs Dashboard vận hành */
  getKpis(): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}/dashboard/stats`,
      this.httpOptions
    ).pipe(
      retry(1),
      map(res => res.data || res),
      catchError(this.handleError)
    );
  }

  /** 2. Lấy danh sách cọc + công nợ */
  getDepositsAndDebts(): Observable<{ deposits: any[]; debts: any[] }> {
    return this.http.get<any>(
      `${this.apiUrl}/deposits-debt`,
      this.httpOptions
    ).pipe(
      retry(1),
      map(res => res.data || res),
      catchError(this.handleError)
    );
  }

  /** 3. Cập nhật trạng thái cọc (held → settled / refunded) */
  updateDepositStatus(
    depositId: string,
    depositStatus: 'held' | 'refunded' | 'settled',
    note?: string
  ): Observable<Deposit> {
    return this.http.put<Deposit>(
      `${this.apiUrl}/deposits/${depositId}/status`,
      { depositStatus, note },
      this.httpOptions
    ).pipe(catchError(this.handleError));
  }

  /** 4. Quyết toán cấn trừ cọc */
  settleDeposit(depositId: string): Observable<any> {
    return this.http.put<any>(
      `${this.apiUrl}/deposits/${depositId}/settle`,
      {},
      this.httpOptions
    ).pipe(catchError(this.handleError));
  }

  /** 5. Thu nợ trên hóa đơn hiện có */
  collectDebt(
    invoiceId: string,
    payload: {
      paidAmount: number;
      paymentMethod: 'cash' | 'banking' | 'card' | 'prepaid_wallet';
      note?: string;
    }
  ): Observable<Invoice> {
    return this.http.post<Invoice>(
      `${this.apiUrl}/invoices/${invoiceId}/collect`,
      payload,
      this.httpOptions
    ).pipe(catchError(this.handleError));
  }

  /** 6. Thu hồi nợ / cấn trừ nợ (PUT) */
  clearDebt(
    invoiceId: string,
    paidAmount: number,
    paymentMethod: string = 'cash'
  ): Observable<any> {
    return this.http.put<any>(
      `${this.apiUrl}/invoices/${invoiceId}/clear-debt`,
      { paidAmount, paymentMethod },
      this.httpOptions
    ).pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Lỗi thao tác operations.';
    if (error.error && error.error.message) {
      errorMessage = error.error.message;
    } else {
      errorMessage = `Mã lỗi [${error.status}]: ${error.statusText}`;
    }
    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}