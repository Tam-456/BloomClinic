import { Component, OnInit, signal } from '@angular/core';
import { CustomerService } from '../../../shared/services/customer';
import { Booking } from '../../../shared/interfaces/booking.interface';
import { Schedule } from '../../../shared/interfaces/schedule.interface';
import { ConfirmDialogService } from '../../../shared/services/confirm-dialog';

@Component({
  selector: 'app-customer-booking-history',
  standalone: false,
  templateUrl: './customer-booking-history.html',
  styleUrl: './customer-booking-history.scss',
})
export class CustomerBookingHistory implements OnInit {
  bookings = signal<Booking[]>([]);
  availableSchedules = signal<Schedule[]>([]);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string>('');
  successMessage = signal<string>('');
  modalError = signal<string>('');

  // Điều khiển Popup Modal
  isBookingModalOpen = signal<boolean>(false);
  isEditModalOpen = signal<boolean>(false);

  // 4 Chuyên khoa chuẩn đồng bộ 100% với Admin & Trang chủ
  specialties = [
    { id: 'dieu-tri-da', name: 'Điều trị da' },
    { id: 'cham-soc-da', name: 'Chăm sóc da' },
    { id: 'tre-hoa-nang-co', name: 'Trẻ hóa & Nâng cơ' },
    { id: 'triet-long', name: 'Triệt lông công nghệ' }
  ];

  // Form Model đặt lịch mới
  newBooking: Partial<Booking> = {
    serviceId: '',
    staffId: '',
    appointmentDate: '',
    appointmentTime: '',
    note: ''
  };

  // Form Model sửa lịch
  editBookingForm: Partial<Booking> = {};

  // Hiển thị tên chuyên khoa chuẩn dù serviceId là ObjectId đã populate hay mã chuyên khoa
  getServiceName(serviceIdOrObj: any): string {
    if (!serviceIdOrObj) return 'Điều trị da';

    if (typeof serviceIdOrObj === 'object') {
      const group = serviceIdOrObj.categoryGroup || '';
      const foundByGroup = this.specialties.find(s => s.id === group);
      if (foundByGroup) return foundByGroup.name;
      if (serviceIdOrObj.serviceName) return serviceIdOrObj.serviceName;
    }

    const foundById = this.specialties.find(s => s.id === String(serviceIdOrObj));
    return foundById ? foundById.name : 'Điều trị da';
  }

  // Lấy mã chuyên khoa (dieu-tri-da...) để binding vào select khi mở modal Sửa
  getSpecialtyId(serviceIdOrObj: any): string {
    if (!serviceIdOrObj) return this.specialties[0].id;
    if (typeof serviceIdOrObj === 'object') {
      const group = serviceIdOrObj.categoryGroup || '';
      const found = this.specialties.find(s => s.id === group);
      return found ? found.id : this.specialties[0].id;
    }
    const found = this.specialties.find(s => s.id === String(serviceIdOrObj));
    return found ? found.id : this.specialties[0].id;
  }

  constructor(
    private customerService: CustomerService,
    private confirmDialog: ConfirmDialogService
  ) {}

  ngOnInit(): void {
    this.loadMyBookings();
  }

  // 1. Tải danh sách lịch hẹn của tôi từ MongoDB
  loadMyBookings(): void {
    this.isLoading.set(true);
    this.customerService.getMyBookings().subscribe({
      next: (data) => {
        this.bookings.set(data || []);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err?.message || 'Không thể tải danh sách lịch hẹn.');
        this.isLoading.set(false);
      }
    });
  }

  // 2. Mở & Đóng Modal Đặt Lịch Mới
  openBookingModal(): void {
    this.modalError.set('');
    this.newBooking = {
      serviceId: '',
      staffId: '',
      appointmentDate: '',
      appointmentTime: '',
      note: ''
    };
    this.isBookingModalOpen.set(true);
  }

  closeBookingModal(): void {
    this.isBookingModalOpen.set(false);
  }

  // 3. Mở & Đóng Modal Sửa Lịch Hẹn
  openEditModal(item: Booking): void {
    this.modalError.set('');
    this.editBookingForm = {
      _id: item._id,
      bookingCode: item.bookingCode,
      serviceId: this.getSpecialtyId(item.serviceId),
      appointmentDate: item.appointmentDate,
      appointmentTime: item.appointmentTime,
      note: item.note || ''
    };
    this.isEditModalOpen.set(true);
  }

  closeEditModal(): void {
    this.isEditModalOpen.set(false);
    this.editBookingForm = {};
  }

  // 4. Tra cứu ca trực trống khi đổi ngày
  onDateChange(selectedDate: string): void {
    if (!selectedDate) return;
    this.customerService.getAvailableSchedules(selectedDate).subscribe({
      next: (schedules) => {
        const activeShifts = (schedules || []).filter(s => !s.isOff);
        this.availableSchedules.set(activeShifts);
      },
      error: () => {}
    });
  }

  // 5. Gửi đặt lịch mới xuống MongoDB
  onSubmitBooking(): void {
    this.modalError.set('');
    if (!this.newBooking.appointmentDate || !this.newBooking.appointmentTime || !this.newBooking.serviceId) {
      this.modalError.set('Vui lòng chọn đầy đủ Chuyên khoa / Dịch vụ, Ngày hẹn và Giờ hẹn!');
      return;
    }

    this.confirmDialog.confirm({
      title: 'Xác nhận đặt lịch hẹn',
      message: `Bạn xác nhận đặt lịch khám chuyên khoa "${this.getServiceName(this.newBooking.serviceId)}" vào lúc ${this.newBooking.appointmentTime} ngày ${this.newBooking.appointmentDate}?`,
      confirmText: 'Đặt lịch ngay',
      type: 'primary',
      action: () => {
        this.customerService.createBooking(this.newBooking).subscribe({
          next: () => {
            this.successMessage.set('Đặt lịch hẹn mới thành công! Yêu cầu đã được ghi nhận vào hệ thống.');
            this.closeBookingModal();
            this.loadMyBookings();
          },
          error: (err) => {
            this.modalError.set(err?.message || 'Không thể đặt lịch hẹn, vui lòng thử lại!');
          }
        });
      }
    });
  }

  // 6. Lưu cập nhật lịch hẹn sau khi sửa xuống MongoDB
  onSaveEditBooking(): void {
    this.modalError.set('');
    if (!this.editBookingForm.appointmentDate || !this.editBookingForm.appointmentTime || !this.editBookingForm.serviceId) {
      this.modalError.set('Vui lòng nhập đầy đủ Chuyên khoa / Dịch vụ, Ngày hẹn và Giờ hẹn mới!');
      return;
    }

    this.confirmDialog.confirm({
      title: 'Xác nhận thay đổi lịch hẹn',
      message: `Bạn có chắc muốn đổi lịch hẹn [${this.editBookingForm.bookingCode}] sang ${this.editBookingForm.appointmentTime} ngày ${this.editBookingForm.appointmentDate}?`,
      confirmText: 'Lưu thay đổi',
      type: 'primary',
      action: () => {
        const id = this.editBookingForm._id!;
        this.customerService.updateBooking(id, {
          serviceId: this.editBookingForm.serviceId,
          appointmentDate: this.editBookingForm.appointmentDate,
          appointmentTime: this.editBookingForm.appointmentTime,
          note: this.editBookingForm.note || ''
        }).subscribe({
          next: () => {
            this.successMessage.set(`Đã cập nhật thông tin lịch hẹn ${this.editBookingForm.bookingCode} thành công!`);
            this.closeEditModal();
            this.loadMyBookings();
          },
          error: (err) => {
            this.modalError.set(err?.message || 'Không thể cập nhật lịch hẹn, vui lòng thử lại!');
          }
        });
      }
    });
  }

  // 7. Hủy lịch hẹn
  onCancel(bookingId: string): void {
    this.confirmDialog.confirm({
      title: 'Xác nhận hủy lịch hẹn',
      message: 'Bạn có chắc chắn muốn hủy yêu cầu đặt lịch hẹn này không?',
      confirmText: 'Xác nhận hủy',
      type: 'danger',
      action: () => {
        this.customerService.cancelBooking(bookingId, 'Khách hàng yêu cầu hủy').subscribe({
          next: () => {
            this.successMessage.set('Đã hủy lịch hẹn thành công.');
            this.loadMyBookings();
          },
          error: (err) => {
            this.errorMessage.set(err?.message || 'Không thể hủy lịch hẹn!');
          }
        });
      }
    });
  }
}