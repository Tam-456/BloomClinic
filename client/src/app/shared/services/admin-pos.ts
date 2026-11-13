import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';

import { Invoice } from '../interfaces/invoice.interface';
import { Product } from '../interfaces/product.interface';
import { Service } from '../interfaces/service.interface';
import { Deposit } from '../interfaces/deposit.interface';

@Injectable({
  providedIn: 'root'
})
export class AdminPosService {
  private apiUrl = '/api/admin';

  private httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
    withCredentials: true
  };

  constructor(private http: HttpClient) {}

  // 1. Lấy danh sách sản phẩm và dịch vụ để đưa vào giỏ hàng POS
  getCatalogForPos(): Observable<{ products: Product[]; services: Service[] }> {
    return this.http.get<any>(`${this.apiUrl}/pos/catalog`, this.httpOptions).pipe(
      retry(2),
      catchError(this.handleError)
    );
  }

  // 2. Thanh toán đơn hàng hoặc lưu Hóa đơn nháp
  checkout(orderPayload: {
    customerId: string;
    items: any[];
    totalAmount: number;
    discountAmount: number;
    paidAmount: number;
    debtAmount: number;
    paymentMethod: string;
    isDraft?: boolean;
  }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/pos/checkout`, orderPayload, this.httpOptions).pipe(
      catchError(this.handleError)
    );
  }

  // 3. Nạp tiền hoặc kiểm tra ví trả trước của khách hàng
  topupPrepaidWallet(customerId: string, amount: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/pos/prepaid-wallet`, { customerId, amount }, this.httpOptions).pipe(
      catchError(this.handleError)
    );
  }

  // 4. Lấy danh sách đặt cọc và công nợ bệnh nhân
  getDepositsAndDebts(): Observable<{ deposits: Deposit[]; debts: Invoice[] }> {
    return this.http.get<any>(`${this.apiUrl}/deposits-debt`, this.httpOptions).pipe(
      retry(2),
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Lỗi trong quá trình xử lý POS.';
    if (error.error && error.error.message) {
      errorMessage = error.error.message;
    } else {
      errorMessage = `Mã lỗi [${error.status}]: ${error.statusText}`;
    }
    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}