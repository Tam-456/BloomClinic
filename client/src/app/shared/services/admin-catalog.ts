import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Product } from '../interfaces/product.interface';

@Injectable({
  providedIn: 'root'
})
export class AdminCatalogService {
  private apiUrl = '/api/admin/products';

  private httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
    withCredentials: true
  };

  constructor(private http: HttpClient) {}

  // 1. Lấy danh sách toàn bộ sản phẩm
  getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(this.apiUrl, this.httpOptions);
  }

  // 2. Thêm mới sản phẩm/thuốc
  createProduct(product: Partial<Product>): Observable<Product> {
    return this.http.post<Product>(this.apiUrl, product, this.httpOptions);
  }

  // 3. Cập nhật thông tin hoặc số lượng tồn kho
  updateProduct(productId: string, data: Partial<Product>): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${productId}`, data, this.httpOptions);
  }

  // 4. Xóa sản phẩm
  deleteProduct(productId: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${productId}`, this.httpOptions);
  }
}