export interface User {
  _id?: string;                    // MongoDB ObjectId (chuỗi 24 hex)
  id?: string;                     // Hỗ trợ mock data / frontend của Long dùng id
  username: string;                // Tên đăng nhập (Email gốc)
  password?: string;               // Chỉ dùng khi gửi Form Login/Register
  passwordHash?: string;
  customerCode?: string;           // Mã hiển thị KH (KH-001, KH-002)
  fullName: string;                // Họ và tên
  gender?: 'Nam' | 'Nữ' | 'Khác';  // Giới tính cho trang hồ sơ
  dateOfBirth?: string;            // Ngày sinh (YYYY-MM-DD)
  phone: string;                   // Số điện thoại
  email: string;                   // Email liên hệ
  role: 'customer' | 'admin' | 'staff';
  membershipTier?: 'Standard' | 'Silver' | 'Gold' | 'Diamond';
  prepaidBalance?: number;         // Số dư ví trả trước (VND)
  totalSpent?: number;             // Tổng tiền đã chi tiêu để tính hạng thẻ
  avatar?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  deletedAt?: string | Date | null;
}

export type IAuthUser = User;
export type IUser = User;