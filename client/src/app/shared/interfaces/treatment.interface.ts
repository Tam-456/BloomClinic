/**
 * Chi tiết nội dung từng buổi trong gói phác đồ chuẩn
 */
export interface TreatmentSessionDetail {
  sessionNumber: number;
  title: string;
  description?: string;
}

/**
 * 1. Danh mục gói phác đồ điều trị chuẩn (Bảng treatments)
 */
export interface Treatment {
  _id?: string;                  // MongoDB ObjectId (24 ký tự hex)
  packageCode?: string;          // Mã gói hiển thị nghiệp vụ (ví dụ: TL001, TL002)
  treatmentName: string;         // Tên gói liệu trình
  totalSessions: number;         // Tổng số buổi quy định
  price: number;                 // Đơn giá trọn gói (VND)
  description?: string;          // Mô tả phác đồ
  technology?: string;           // Công nghệ áp dụng (Laser Pico, Bio-Light,...)
  sessionDetails?: TreatmentSessionDetail[]; // Chi tiết từng buổi khám
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

/**
 * Nhật ký ghi nhận một buổi thực hiện liệu trình
 */
export interface TreatmentHistoryItem {
  date: string;                  // Ngày làm (YYYY-MM-DD)
  staffId: string;               // Khóa ngoại trỏ sang staffs._id
  staffName?: string;            // Snapshot tên Bác sĩ / KTV phụ trách buổi đó
  note: string;                  // Ghi chú tiến trình, phản ứng của da
}

/**
 * 2. Hồ sơ liệu trình thực tế của khách hàng (Bảng customer_treatments)
 */
export interface CustomerTreatment {
  _id?: string;                  // MongoDB ObjectId (24 ký tự hex)
  customerId: string;            // Khóa ngoại trỏ sang users._id
  customerName?: string;         // Snapshot họ tên khách hàng (để render UI nhanh)
  customerPhone?: string;        // Snapshot số điện thoại khách hàng
  treatmentId: string;           // Khóa ngoại trỏ sang treatments._id
  treatmentName: string;         // Tên gói liệu trình đang theo
  totalSessions: number;         // Tổng số buổi cần làm
  usedSessions: number;          // Số buổi đã thực hiện
  remainingSessions: number;     // Số buổi còn lại (totalSessions - usedSessions)
  history: TreatmentHistoryItem[]; // Danh sách nhật ký các buổi đã làm
  status: 'active' | 'completed'; // Trạng thái: đang làm hay đã kết thúc
  createdAt?: string | Date;
  updatedAt?: string | Date;
}