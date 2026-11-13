import { Component, OnInit, computed, signal, inject } from '@angular/core';
import { ArticleCategory, IArticle } from '../../../shared/interfaces/article.interface';
import { PublicService } from '../../../shared/services/public.service';
import { articleCategoryLabel } from '../../../shared/utils/public-format';

@Component({
  selector: 'app-article-list-component',
  standalone: false,
  styleUrl: './article-list-component.scss',
  templateUrl: './article-list-component.html',
})
export class ArticleListComponent implements OnInit {
  private publicService = inject(PublicService);
  readonly categoryLabel = articleCategoryLabel;

  articles = signal<IArticle[]>([]);
  loading = signal(true);
  error = signal('');
  selectedCategory = signal<ArticleCategory | ''>('');
  searchKeyword = signal('');

  readonly categories: { value: ArticleCategory | ''; label: string }[] = [
    { value: '', label: 'Tất cả chủ đề' },
    { value: 'dieu-tri-mun', label: 'Điều trị mụn' },
    { value: 'dieu-tri-nam', label: 'Điều trị nám' },
    { value: 'dieu-tri-seo', label: 'Điều trị sẹo' },
    { value: 'cham-soc-da', label: 'Chăm sóc da' },
    { value: 'chong-lao-hoa', label: 'Chống lão hóa' },
    { value: 'cong-nghe', label: 'Công nghệ' },
  ];

  filteredArticles = computed(() => {
    let list = this.articles();
    const cat = this.selectedCategory();
    if (cat) {
      list = list.filter((a) => a.category === cat);
    }
    const q = this.searchKeyword().trim().toLowerCase();
    if (q) {
      list = list.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          (a.summary || '').toLowerCase().includes(q) ||
          this.categoryLabel(a.category).toLowerCase().includes(q)
      );
    }
    return list;
  });

  constructor() {}

  ngOnInit(): void {
    this.loadArticles();
  }

  selectCategory(category: ArticleCategory | ''): void {
    this.selectedCategory.set(category);
    this.loadArticles();
  }

  onSearch(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.searchKeyword.set(val);
  }

  clearSearch(): void {
    this.searchKeyword.set('');
  }

  private loadArticles(): void {
    this.loading.set(true);
    this.error.set('');
    const cat = this.selectedCategory() || undefined;
    this.publicService.getArticles(cat).subscribe({
      next: (response) => {
        this.articles.set(response.data || []);
      },
      error: () => {
        this.error.set('Chưa tải được bài viết. Vui lòng thử lại sau.');
        this.loading.set(false);
      },
      complete: () => this.loading.set(false),
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
}
