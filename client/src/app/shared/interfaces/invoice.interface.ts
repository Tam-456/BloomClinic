export interface InvoiceItem {
  itemId: string; // services._id hoặc products._id
  name: string; // snapshot tên lúc bán
  type: 'service' | 'product';
  quantity: number; // integer > 0
  unitPrice: number; // integer VND lúc bán
  amount: number; // quantity × unitPrice
}

export interface Invoice {
  _id?: string;
  invoiceCode: string;
  customerId: string; // users._id
  customerName?: string; // snapshot
  customerPhone?: string; // snapshot
  items: InvoiceItem[];
  totalAmount: number; // tổng dòng hàng trước discount
  discountAmount: number;
  depositDeduction?: number; // mặc định 0
  finalAmount?: number; // max(0, totalAmount - discountAmount - depositDeduction)
  paidAmount: number;
  debtAmount: number; // max(0, finalAmount - paidAmount)
  paymentMethod?: 'cash' | 'banking' | 'card' | 'prepaid_wallet';
  status: 'paid' | 'partially_paid' | 'issued' | 'voided' | 'exported' | 'normal' | 'draft' | 'edited' | 'deleted';
  debtStatus?: 'no_debt' | 'partial' | 'overdue';
  dueDate?: string | Date;
  shift?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  paymentHistory?: {
    paidAt: string;
    amount: number;
    paymentMethod: string;
    channel?: string;
    note?: string;
  }[];
}
