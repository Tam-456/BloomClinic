export type CategoryGroup =
  | 'dieu-tri-da'
  | 'cham-soc-da'
  | 'tre-hoa-nang-co'
  | 'triet-long';

export interface Service {
  _id?: string;
  serviceCode?: string;
  customId?: string;
  serviceName: string;
  slug: string;
  categoryGroup: CategoryGroup | string;
  price: number;
  durationMinutes: number;
  description: string;
  detail?: string;
  image?: string;
  status: 'active' | 'inactive';
  isBestSeller?: boolean;
  soldCount?: number;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  deletedAt?: string | Date | null;
}
export type IService = Service;