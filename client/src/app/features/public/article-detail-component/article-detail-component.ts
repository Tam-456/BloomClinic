import { Component, OnInit, signal, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IArticle } from '../../../shared/interfaces/article.interface';
import { IStaff } from '../../../shared/interfaces/staff.interface';
import { PublicService } from '../../../shared/services/public.service';
import { articleCategoryLabel } from '../../../shared/utils/public-format';
import { getArticleAuthor } from '../../../shared/mock/articles.mock';

@Component({
  selector: 'app-article-detail-component',
  standalone: false,
  styleUrl: './article-detail-component.scss',
  templateUrl: './article-detail-component.html',
})
export class ArticleDetailComponent implements OnInit {
  private publicService = inject(PublicService);
  readonly categoryLabel = articleCategoryLabel;

  article = signal<IArticle | null>(null);
  author = signal<IStaff | null>(null);
  relatedArticles = signal<IArticle[]>([]);
  loading = signal(true);
  error = signal('');
  copied = signal(false);

  constructor(
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const slug = params.get('slug');
      if (!slug) {
        this.error.set('Không tìm thấy bài viết.');
        this.article.set(null);
        this.loading.set(false);
        return;
      }

      this.loading.set(true);
      this.error.set('');

      this.publicService.getArticleBySlug(slug).subscribe({
        next: (response) => {
          if (!response || !response.success || !response.data) {
            this.error.set('Không tìm thấy bài viết yêu cầu.');
            this.article.set(null);
            this.loading.set(false);
            return;
          }
          const art = response.data;
          this.article.set(art);
          this.author.set(getArticleAuthor(art.authorStaffId || '') || null);
          this.loadRelated(art.category, art.slug);
        },
        error: () => {
          this.error.set('Không tìm thấy bài viết hoặc nội dung hiện không khả dụng.');
          this.article.set(null);
          this.loading.set(false);
        },
        complete: () => this.loading.set(false),
      });
    });
  }

  private loadRelated(category: string, currentSlug: string): void {
    this.publicService.getArticles(category).subscribe({
      next: (res) => {
        let others = (res.data || []).filter((a) => a.slug !== currentSlug);
        if (others.length === 0) {
          // Fallback to all articles
          this.publicService.getArticles().subscribe((allRes) => {
            this.relatedArticles.set((allRes.data || []).filter((a) => a.slug !== currentSlug).slice(0, 3));
          });
        } else {
          this.relatedArticles.set(others.slice(0, 3));
        }
      },
    });
  }

  formatDate(date?: string | Date | null): string {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
}

  copyLink(): void {
    if (typeof window !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2500);
    }
  }
}
