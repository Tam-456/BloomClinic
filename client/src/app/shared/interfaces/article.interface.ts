export type ArticleCategory =
  | 'dieu-tri-mun'
  | 'dieu-tri-nam'
  | 'dieu-tri-seo'
  | 'cham-soc-da'
  | 'cong-nghe'
  | 'chong-lao-hoa';

export interface Article {
  _id?: string;
  title: string;
  slug: string;
  category: ArticleCategory;
  authorStaffId?: string;
  authorName?: string;
  summary?: string;
  contentHtml?: string;
  thumbnail?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}
export type IArticle = Article;