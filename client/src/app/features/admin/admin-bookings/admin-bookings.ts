import { Component, OnInit, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AdminBookingService } from '../../../shared/services/admin-booking';
import { AdminStaffService } from '../../../shared/services/admin-staff';
import { Booking } from '../../../shared/interfaces/booking.interface';
import { Staff } from '../../../shared/interfaces/staff.interface';
import { ConfirmDialogService } from '../../../shared/services/confirm-dialog';

export interface NewBookingForm {
  customerId?: string;
  customerName: string;
  customerPhone: string;
  serviceId: string;
  staffId: string;
  appointmentDate: string;
  appointmentTime: string;
  depositAmount: number;
  note: string;
}

export interface GroupedCustomerBooking {
  customerKey: string;
  customerId?: string;
  customerName: string;
  customerPhone: string;
  latestBooking: Booking;
  allBookings: Booking[];
  totalAppointments: number;
  activeCount: number;
}

@Component({
  selector: 'app-admin-bookings',
  standalone: false,
  templateUrl: './admin-bookings.html',
  styleUrl: './admin-bookings.scss',
})
export class AdminBookings implements OnInit {
  bookings = signal<Booking[]>([]);
  staffList = signal<Staff[]>([]);
  customerList = signal<any[]>([]);

  selectedFilter = signal<string>('all');
  searchKeyword = signal<string>('');
  selectedDate = signal<string>('');

  isLoading = signal<boolean>(false);
  successMessage = signal<string>('');
  errorMessage = signal<string>('');

  specialties = [
    { id: 'dieu-tri-da', name: 'Điều trị da' },
    { id: 'cham-soc-da', name: 'Chăm sóc da' },
    { id: 'tre-hoa-nang-co', name: 'Trẻ hóa & Nâng cơ' },
    { id: 'triet-long', name: 'Triệt lông công nghệ' }
  ];

  qualifiedStaffs = computed(() => {
    return this.staffList().filter(
      (s) => s.roleType === 'doctor' || s.roleType === 'ktv'
    );
  });

  isCreateModalOpen = signal<boolean>(false);
  modalErrorMessage = signal<string>('');

  isEditModalOpen = signal<boolean>(false);
  editingBookingId = signal<string>('');

  isHistoryModalOpen = signal<boolean>(false);
  selectedCustomerHistory = signal<GroupedCustomerBooking | null>(null);

  customerSuggestions = signal<any[]>([]);
  showCustomerDropdown = signal<boolean>(false);

  newBooking: NewBookingForm = this.createEmptyBookingForm();
  editBooking: NewBookingForm = this.createEmptyBookingForm();

  private readonly statusPriority: Record<string, number> = {
    pending: 1,
    confirmed: 2,
    in_treatment: 3,
    completed: 4,
    cancelled: 5
  };

  // ==========================================
  // LOGIC SẮP XẾP VÀ CHỌN LỊCH HIỂN THỊ ĐẠI DIỆN
  // ==========================================
  groupedCustomerBookings = computed(() => {
    const keyword = this.searchKeyword().toLowerCase().trim();
    const filter = this.selectedFilter();
    const date = this.selectedDate();
    const nowTime = new Date().getTime();

    // 1. Gom tất cả các lịch hẹn theo từng khách hàng
    const map = new Map<string, Booking[]>();
    for (const b of this.bookings()) {
      const key = b.customerPhone || (b.customerId ? String(b.customerId) : b._id) || 'unknown';
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(b);
    }

    // Bảng trọng số trạng thái ưu tiên giải quyết
    const statusPriority: Record<string, number> = {
      in_treatment: 1, // Đang khám cần hoàn thành/theo dõi
      confirmed: 2,    // Đã duyệt sắp vào khám
      pending: 3,      // Chờ duyệt
      completed: 4,    // Đã xong
      cancelled: 5     // Đã hủy
    };

    // Hàm tính điểm ưu tiên của từng cuộc hẹn (Càng nhỏ càng ưu tiên lên đầu)
    const getBookingScore = (b: Booking, currentFilter: string): number => {
      let priorityScore = (statusPriority[b.status] || 99) * 1000000;

      // Nếu đang lọc theo 1 trạng thái cụ thể (ví dụ: 'pending'):
      // Đơn đúng trạng thái filter sẽ nhận điểm ưu tiên cao nhất (-10,000,000)
      if (currentFilter !== 'all' && b.status === currentFilter) {
        priorityScore = -10000000;
      }

      // Xét thời gian: Lịch nào gần thời điểm hiện tại nhất sẽ được ưu tiên trước
      const bTime = new Date(`${b.appointmentDate}T${b.appointmentTime || '00:00'}`).getTime();
      const timeDiffMinutes = Math.abs(bTime - nowTime) / (1000 * 60);

      return priorityScore + timeDiffMinutes;
    };

    const groups: GroupedCustomerBooking[] = [];

    map.forEach((bList, key) => {
      // Sắp xếp toàn bộ lịch của khách: đơn cần giải quyết trước luôn lên vị trí số 0
      const sortedHistory = [...bList].sort((a, b) => {
        return getBookingScore(a, filter) - getBookingScore(b, filter);
      });

      // Lịch đứng đầu sau khi chấm điểm chính là lịch đại diện cần hiển thị ra bảng chính
      const representativeBooking = sortedHistory[0];

      // Đếm số lịch chưa hoàn thành
      const activeCount = bList.filter(
        b => b.status === 'pending' || b.status === 'confirmed' || b.status === 'in_treatment'
      ).length;

      const cName = (typeof representativeBooking.customerId === 'object' && representativeBooking.customerId !== null)
        ? (representativeBooking.customerId as any).fullName
        : (representativeBooking.customerName || 'Khách hàng');

      const cPhone = (typeof representativeBooking.customerId === 'object' && representativeBooking.customerId !== null)
        ? (representativeBooking.customerId as any).phone
        : (representativeBooking.customerPhone || '');

      groups.push({
        customerKey: key,
        customerId: typeof representativeBooking.customerId === 'object' ? (representativeBooking.customerId as any)._id : representativeBooking.customerId,
        customerName: cName,
        customerPhone: cPhone,
        latestBooking: representativeBooking, // Đơn đại diện chuẩn theo trạng thái đang lọc
        allBookings: sortedHistory,
        totalAppointments: sortedHistory.length,
        activeCount: activeCount
      });
    });

    // 2. Lọc danh sách khách hàng
    const filtered = groups.filter((g) => {
      // Khi chọn filter trạng thái (ví dụ: Chờ duyệt), khách hàng PHẢI có ít nhất 1 lịch thuộc trạng thái đó
      const matchFilter = filter === 'all' || g.allBookings.some(b => b.status === filter);

      // Nếu có chọn ngày cụ thể
      const matchDate = !date || g.allBookings.some(b => b.appointmentDate === date);

      // Tìm kiếm từ khóa
      const matchKeyword =
        !keyword ||
        g.customerName.toLowerCase().includes(keyword) ||
        g.customerPhone.includes(keyword) ||
        g.allBookings.some(b => (b.bookingCode || '').toLowerCase().includes(keyword));

      return matchFilter && matchDate && matchKeyword;
    });

    // 3. Sắp xếp thứ tự các dòng khách hàng trên bảng chính
    return filtered.sort((a, b) => {
      return getBookingScore(a.latestBooking, filter) - getBookingScore(b.latestBooking, filter);
    });
  });

  constructor(
    private bookingService: AdminBookingService,
    private staffService: AdminStaffService,
    private confirmDialog: ConfirmDialogService,
    private http: HttpClient
    
  ) {}

  ngOnInit(): void {
    this.loadBookings();
    this.loadStaffs();
    this.loadCustomers();
  }

  loadBookings(): void {
    this.bookingService.getAllBookings().subscribe({
      next: (res: any) => {
        const list = Array.isArray(res) ? res : (res?.data || []);
        this.bookings.set(list);
        // Tự động làm mới bảng lịch sử nếu đang mở
        this.refreshSelectedCustomerHistory();
      },
      error: (err) => console.error('Lỗi tải Bookings:', err)
    });
  }

  loadStaffs(): void {
    this.staffService.getStaffs().subscribe({
      next: (res: any) => {
        const list = Array.isArray(res) ? res : (res?.data || []);
        this.staffList.set(list);
      },
      error: (err) => console.error('Lỗi nạp nhân sự:', err)
    });
  }

  loadCustomers(): void {
    this.http.get<any>('/api/admin/customers').subscribe({
      next: (res) => {
        const list = res?.data || res || [];
        this.customerList.set(list);
      },
      error: (err) => console.error('Lỗi nạp khách hàng:', err)
    });
  }

  getSpecialtyName(serviceIdOrCategory?: any): string {
    if (!serviceIdOrCategory) return 'Điều trị da';
    const cat = typeof serviceIdOrCategory === 'object'
      ? (serviceIdOrCategory.categoryGroup || serviceIdOrCategory.serviceName)
      : serviceIdOrCategory;
    const found = this.specialties.find(s => s.id === cat || s.name === cat);
    return found ? found.name : 'Điều trị da';
  }

  // Helper lấy ID string thuần túy dù staffId là object hay string
  getStaffIdString(staffId: any): string {
    if (!staffId) return '';
    return typeof staffId === 'object' ? (staffId._id || '') : String(staffId);
  }

  getStaffName(staffId?: any): string {
    if (!staffId) return 'Chưa phân công';
    // Nếu bản thân staffId đã là object chứa staffName (do populate)
    if (typeof staffId === 'object' && staffId.staffName) {
      return staffId.staffName;
    }
    const sId = typeof staffId === 'object' ? staffId._id : staffId;
    const found = this.staffList().find(s => s._id === sId);
    return found ? found.staffName : 'Chưa phân công';
  }

  onCustomerNameChange(name: string): void {
    this.newBooking.customerName = name;
    if (!name || name.trim().length === 0) {
      this.customerSuggestions.set([]);
      this.showCustomerDropdown.set(false);
      return;
    }
    const cleanKw = name.toLowerCase().trim();
    const matched = this.customerList().filter(
      c => (c.fullName && c.fullName.toLowerCase().includes(cleanKw)) ||
           (c.phone && c.phone.includes(cleanKw))
    );

    const exact = this.customerList().find(c => c.fullName && c.fullName.toLowerCase() === cleanKw);
    if (exact) {
      this.selectCustomer(exact);
      return;
    }

    this.customerSuggestions.set(matched.slice(0, 5));
    this.showCustomerDropdown.set(matched.length > 0);
  }

  onCustomerPhoneChange(phone: string): void {
    this.newBooking.customerPhone = phone;
    const cleanPhone = phone.trim();
    if (cleanPhone.length >= 9) {
      const found = this.customerList().find(c => c.phone && c.phone.trim() === cleanPhone);
      if (found) {
        this.selectCustomer(found);
      }
    }
  }

  selectCustomer(customer: any): void {
    this.newBooking.customerId = customer._id;
    this.newBooking.customerName = customer.fullName;
    this.newBooking.customerPhone = customer.phone || '';
    this.showCustomerDropdown.set(false);
  }

  openCustomerHistory(group: GroupedCustomerBooking): void {
    this.selectedCustomerHistory.set(group);
    this.isHistoryModalOpen.set(true);
  }

  closeCustomerHistory(): void {
    this.isHistoryModalOpen.set(false);
    this.selectedCustomerHistory.set(null);
  }

  private createEmptyBookingForm(): NewBookingForm {
    return {
      customerName: '',
      customerPhone: '',
      serviceId: this.specialties[0].id,
      staffId: '',
      appointmentDate: new Date().toISOString().substring(0, 10),
      appointmentTime: '09:00',
      depositAmount: 0,
      note: '',
    };
  }

  // Cập nhật lại dữ liệu hiển thị bên trong Popup Lịch sử nếu modal đang mở
  private refreshSelectedCustomerHistory(): void {
    const current = this.selectedCustomerHistory();
    if (!current) return;

    // Tìm lại nhóm khách hàng tương ứng từ danh sách vừa được cập nhật
    const updatedGroup = this.groupedCustomerBookings().find(
      (g) => g.customerKey === current.customerKey
    );

    if (updatedGroup) {
      this.selectedCustomerHistory.set({ ...updatedGroup });
    }
  }

  openCreateModal(): void {
    this.newBooking = this.createEmptyBookingForm();
    this.modalErrorMessage.set('');
    this.showCustomerDropdown.set(false);
    this.isCreateModalOpen.set(true);
  }

  closeCreateModal(): void {
    this.isCreateModalOpen.set(false);
    this.showCustomerDropdown.set(false);
  }

  submitCreateBooking(): void {
    this.modalErrorMessage.set('');

    if (!this.newBooking.customerName.trim()) {
      this.modalErrorMessage.set('Vui lòng nhập tên khách hàng.');
      return;
    }
    if (!this.newBooking.customerPhone.trim()) {
      this.modalErrorMessage.set('Vui lòng nhập số điện thoại khách hàng.');
      return;
    }

    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const dateStr = this.newBooking.appointmentDate.replace(/-/g, '');
    const bookingCode = `BK-${dateStr}-${randomSuffix}`;

    const payload: any = {
      ...this.newBooking,
      bookingCode,
      status: 'pending'
    };

    this.http.post<any>('/api/admin/bookings', payload).subscribe({
      next: () => {
        this.successMessage.set(`Đã tạo lịch hẹn thành công (${bookingCode})!`);
        this.loadBookings();
        this.closeCreateModal();
      },
      error: (err) => {
        this.modalErrorMessage.set(err?.error?.message || 'Lỗi khi lưu lịch hẹn vào cơ sở dữ liệu!');
      }
    });
  }

  openEditModal(booking: Booking, event?: Event): void {
    if (event) event.stopPropagation();

    if (booking.status === 'completed' || booking.status === 'cancelled' || booking.status === 'in_treatment') {
      return;
    }

    this.editingBookingId.set(booking._id!);

    const cName = typeof booking.customerId === 'object' && booking.customerId !== null
      ? (booking.customerId as any).fullName
      : booking.customerName || '';

    const cPhone = typeof booking.customerId === 'object' && booking.customerId !== null
      ? (booking.customerId as any).phone
      : booking.customerPhone || '';

    const sId = typeof booking.serviceId === 'object' && booking.serviceId !== null
      ? (booking.serviceId as any).categoryGroup || (booking.serviceId as any)._id
      : booking.serviceId;

    const stId = typeof booking.staffId === 'object' && booking.staffId !== null
      ? (booking.staffId as any)._id
      : (booking.staffId || '');

    this.editBooking = {
      customerName: cName,
      customerPhone: cPhone,
      serviceId: sId || this.specialties[0].id,
      staffId: stId,
      appointmentDate: booking.appointmentDate,
      appointmentTime: booking.appointmentTime,
      depositAmount: booking.depositAmount || 0,
      note: booking.note || '',
    };

    this.modalErrorMessage.set('');
    this.isEditModalOpen.set(true);
  }

  closeEditModal(): void {
    this.isEditModalOpen.set(false);
  }

  submitEditBooking(): void {
    const bookingId = this.editingBookingId();

    const payload = {
      customerName: this.editBooking.customerName?.trim(),
      customerPhone: this.editBooking.customerPhone?.trim(),
      serviceId: this.editBooking.serviceId,
      // Nếu staffId là rỗng thì gửi null để tránh lỗi ObjectId
      staffId: this.editBooking.staffId ? this.editBooking.staffId : null,
      appointmentDate: this.editBooking.appointmentDate,
      appointmentTime: this.editBooking.appointmentTime,
      depositAmount: Number(this.editBooking.depositAmount) || 0,
      note: this.editBooking.note || '',
    };

    this.http.put<any>(`/api/admin/bookings/${bookingId}`, payload).subscribe({
      next: () => {
        this.successMessage.set('Đã cập nhật lịch hẹn thành công!');
        this.loadBookings();
        this.closeEditModal();
        if (this.isHistoryModalOpen()) {
          this.refreshSelectedCustomerHistory();
        }
      },
      error: (err) => {
        console.error('Lỗi sửa lịch:', err);
        this.modalErrorMessage.set(err?.error?.message || 'Không thể cập nhật lịch hẹn.');
      }
    });
  }

  onUpdateStatusWithConfirm(booking: Booking, newStatus: string, event?: Event): void {
    if (event) event.stopPropagation();

    if (newStatus === 'in_treatment' && !booking.staffId) {
      alert('Vui lòng chỉ định Bác sĩ hoặc Kỹ thuật viên phụ trách trước khi cho bệnh nhân vào khám!');
      return;
    }

    const assignedDoctorName = this.getStaffName(booking.staffId);

    const titles: Record<string, string> = {
      confirmed: 'Duyệt lịch hẹn',
      cancelled: 'Từ chối / Hủy lịch hẹn',
      in_treatment: 'Chuyển vào ca khám',
      completed: 'Xác nhận hoàn thành ca',
    };

    const messages: Record<string, string> = {
      confirmed: `Duyệt lịch hẹn ${booking.bookingCode} của khách ${booking.customerName}?`,
      cancelled: `Từ chối / Hủy cuộc hẹn ${booking.bookingCode}?`,
      in_treatment: `Bắt đầu ca điều trị cho bệnh nhân ${booking.customerName} (Phụ trách: ${assignedDoctorName})?`,
      completed: `Xác nhận đã hoàn thành dịch vụ cho mã ${booking.bookingCode}?`,
    };

    this.confirmDialog.confirm({
      title: titles[newStatus] || 'Cập nhật lịch hẹn',
      message: messages[newStatus] || 'Xác nhận đổi trạng thái?',
      confirmText: 'Xác nhận',
      type: newStatus === 'cancelled' ? 'danger' : 'primary',
      action: () => {
        this.onUpdateStatus(booking._id!, newStatus, this.getStaffIdString(booking.staffId));
      },
    });
  }

  onUpdateStatus(bookingId: string, newStatus: any, staffId?: string, event?: Event): void {
    if (event) event.stopPropagation();

    const currentBooking = this.bookings().find(b => b._id === bookingId);
    const targetStaffId = staffId !== undefined ? staffId : (currentBooking?.staffId || '');

    // 1. Cập nhật lạc quan (Optimistic update)
    this.bookings.update((list) =>
      list.map((b) =>
        b._id === bookingId
          ? { 
              ...b, 
              status: newStatus, 
              staffId: targetStaffId ? targetStaffId : b.staffId 
            }
          : b
      )
    );

    // Đồng bộ vào popup lịch sử
    this.refreshSelectedCustomerHistory();

    // 2. Gửi request trực tiếp bằng HttpClient để đảm bảo đúng URL và phương thức
    this.http.put<any>(`/api/admin/bookings/${bookingId}/status`, {
      status: newStatus,
      staffId: targetStaffId
    }).subscribe({
      next: () => {
        this.successMessage.set('Đã cập nhật trạng thái lịch hẹn thành công!');
        this.loadBookings();
      },
      error: (err) => {
        console.error('Lỗi cập nhật trạng thái:', err);
        // Thử lại với PATCH nếu backend chỉ chấp nhận PATCH
        this.http.patch<any>(`/api/admin/bookings/${bookingId}/status`, {
          status: newStatus,
          staffId: targetStaffId
        }).subscribe({
          next: () => {
            this.successMessage.set('Đã cập nhật trạng thái lịch hẹn thành công!');
            this.loadBookings();
          },
          error: (patchErr) => {
            console.error('Lỗi khi thử PATCH:', patchErr);
            this.loadBookings();
          }
        });
      }
    });
  }
}