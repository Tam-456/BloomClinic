// Bloom Beauty & Wellness – Public Service
// MOCK implementation returning of(mock) data conforming to IApiResponse<T>.

import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { IApiResponse } from '../interfaces/api-response.interface';
import { IArticle } from '../interfaces/article.interface';
import { IService, CategoryGroup } from '../interfaces/service.interface';
import { IStaff } from '../interfaces/staff.interface';
import { MOCK_SERVICES_LIST } from '../mock/services.mock';
import { MOCK_ARTICLES_LIST } from '../mock/articles.mock';
import { MOCK_DOCTORS } from '../mock/home.mock';

export interface IPublicSearchResult {
  services: IService[];
  articles: IArticle[];
}

function mockResponse<T>(data: T, message = 'Thành công'): IApiResponse<T> {
  return {
    success: true,
    message,
    data,
  };
}

@Injectable({ providedIn: 'root' })
export class PublicService {
  /** Lấy danh sách dịch vụ (lọc theo group nếu có) */
  getServices(group?: CategoryGroup): Observable<IApiResponse<IService[]>> {
    let list = MOCK_SERVICES_LIST;
    if (group) {
      list = list.filter((s) => s.categoryGroup === group);
    }
    return of(mockResponse(list));
  }

  /** Lấy chi tiết dịch vụ theo slug */
  getServiceBySlug(slug: string): Observable<IApiResponse<IService>> {
    const service = MOCK_SERVICES_LIST.find((s) => s.slug === slug);
    if (!service) {
      return of({
        success: false,
        message: 'Không tìm thấy dịch vụ',
        data: null as unknown as IService,
      });
    }
    return of(mockResponse(service));
  }

  /** Lấy bảng giá theo nhóm dịch vụ */
  getPriceList(group?: CategoryGroup): Observable<IApiResponse<IService[]>> {
    return this.getServices(group);
  }

  /** Lấy danh sách bác sĩ chuyên gia */
  getProfessors(): Observable<IApiResponse<IStaff[]>> {
    return of(mockResponse(MOCK_DOCTORS));
  }

  /** Lấy danh sách bài viết kiến thức (lọc theo category nếu có) */
  getArticles(category?: string): Observable<IApiResponse<IArticle[]>> {
    let list = MOCK_ARTICLES_LIST;
    if (category) {
      list = list.filter((a) => a.category === category);
    }
    return of(mockResponse(list));
  }

  /** Lấy chi tiết bài viết theo slug */
  getArticleBySlug(slug: string): Observable<IApiResponse<IArticle>> {
    const article = MOCK_ARTICLES_LIST.find((a) => a.slug === slug);
    if (!article) {
      return of({
        success: false,
        message: 'Không tìm thấy bài viết',
        data: null as unknown as IArticle,
      });
    }
    return of(mockResponse(article));
  }

  //** Tìm kiếm chung cho thanh tìm kiếm */
  search(query: string): Observable<IApiResponse<IPublicSearchResult>> {
    const q = (query || '').toLowerCase().trim();
    const services = MOCK_SERVICES_LIST.filter(
      (s) =>
        s.serviceName.toLowerCase().includes(q) ||
        (s.description?.toLowerCase().includes(q) ?? false)
    );
    const articles = MOCK_ARTICLES_LIST.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        (a.summary?.toLowerCase().includes(q) ?? false)
    );
    return of(mockResponse({ services, articles }));
  }
}
