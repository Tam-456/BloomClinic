export interface Booking {
  _id?: string;
  bookingCode: string;
  customerId: string; // users._id của khách (không tạo ID mới mỗi lần)
  customerName?: string; // snapshot
  customerPhone?: string; // snapshot
  serviceId: string; // services._id
  serviceName?: string;
  staffId?: string | null; // staffs._id
  appointmentDate: string; // YYYY-MM-DD
  appointmentTime: string; // HH:mm
  note?: string;
  status: 'pending' | 'confirmed' | 'in_treatment' | 'completed' | 'cancelled';
  depositAmount: number; // integer VND
  cancelReason?: string;
  cancelledAt?: string | Date;
  confirmedAt?: string | Date;
  completedAt?: string | Date;
  createdBy?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}
