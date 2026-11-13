export interface ProductBatch {
  id: string;
  receivedDate: string;
  manufactureDate: string;
  expiryDate: string;
  quantityReceived: number;
  remainingQuantity: number;
  note?: string;
  documentImagePreview?: string | null;
  documentFileName?: string;
}

export interface Product {
  _id?: string;
  productCode: string;
  productName: string;
  price: number;
  costPrice?: number;
  stockQuantity: number;
  unit: string;
  image?: string;

  category?: 'treatment' | 'cosmeceutical' | 'supplement';

  // Thông tin chi tiết sản phẩm
  brand?: string;
  manufacturer?: string;
  ingredients?: string;
  uses?: string;
  volume?: string;
  cautions?: string;

  // Quản lý tồn kho theo lô
  batches?: ProductBatch[];
}