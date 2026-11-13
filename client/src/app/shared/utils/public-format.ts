import { ArticleCategory } from '../interfaces/article.interface';
import { CategoryGroup } from '../interfaces/service.interface';

const SERVICE_GROUP_LABELS: Record<CategoryGroup, string> = {
  'dieu-tri-da': 'Điều trị da',
  'cham-soc-da': 'Chăm sóc da',
  'tre-hoa-nang-co': 'Trẻ hóa & nâng cơ',
  'triet-long': 'Triệt lông',
};

const ARTICLE_CATEGORY_LABELS: Record<ArticleCategory, string> = {
  'dieu-tri-mun': 'Điều trị mụn',
  'dieu-tri-nam': 'Điều trị nám',
  'dieu-tri-seo': 'Điều trị sẹo',
  'cham-soc-da': 'Chăm sóc da',
  'cong-nghe': 'Công nghệ',
  'chong-lao-hoa': 'Chống lão hóa',
};

export function serviceGroupLabel(group: any): string {
  if (!group) return '';
  return SERVICE_GROUP_LABELS[group as CategoryGroup] ?? group;
}

export function articleCategoryLabel(category: any): string {
  if (!category) return '';
  return ARTICLE_CATEGORY_LABELS[category as ArticleCategory] ?? category;
}

export function formatVnd(amount: number): string {
  if (typeof amount !== 'number' || isNaN(amount)) return '0 ₫';
  return `${new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(amount)} ₫`;
}