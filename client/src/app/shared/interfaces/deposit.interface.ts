export interface Deposit {
  _id?: string;
  customerId: string; // users._id
  bookingId?: string; // bookings._id
  invoiceId?: string; // invoices._id
  amount: number; // integer VND — giao dịch thật
  depositStatus: 'held' | 'refunded' | 'settled';
  paymentMethod?: 'cash' | 'banking' | 'card';
  note?: string;
  receivedByStaffId?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  settledAt?: string | Date;
  refundedAt?: string | Date;
}
