import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Service } from '../interfaces/service.interface';
import { Article } from '../interfaces/article.interface';
import { Staff } from '../interfaces/staff.interface';

@Injectable({
  providedIn: 'root'
})
export class PublicService {
  private apiUrl = '/api/public';

  private httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' })
  };

  constructor(private http: HttpClient) {}

  /** Danh sách dịch vụ active (public catalog) */
  getServices(): Observable<Service[]> {
    return this.http.get<Service[]>(`${this.apiUrl}/services`, this.httpOptions).pipe(
      catchError(() => of([]))
    );
  }

  getServiceBySlug(slug: string): Observable<Service | null> {
    return this.http.get<Service>(`${this.apiUrl}/services/${slug}`, this.httpOptions).pipe(
      catchError(() => of(null))
    );
  }

  /** Bài viết đã published */
  getArticles(category?: string): Observable<Article[]> {
    let url = `${this.apiUrl}/articles`;
    if (category) {
      url += `?category=${category}`;
    }
    return this.http.get<Article[]>(url, this.httpOptions).pipe(
      catchError(() => of([]))
    );
  }

  getArticleBySlug(slug: string): Observable<Article | null> {
    return this.http.get<Article>(`${this.apiUrl}/articles/${slug}`, this.httpOptions).pipe(
      catchError(() => of(null))
    );
  }

  /** Bảng giá / policy — endpoint public */
  getPriceList(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/price-list`, this.httpOptions).pipe(
      catchError(() => of(null))
    );
  }

  getPolicy(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/policy`, this.httpOptions).pipe(
      catchError(() => of(null))
    );
  }

  /** Danh sách bác sĩ / chuyên gia (staff public) */
  getProfessors(): Observable<Staff[]> {
    return this.http.get<Staff[]>(`${this.apiUrl}/staffs`, this.httpOptions).pipe(
      catchError(() => of([]))
    );
  }
}
