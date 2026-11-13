import { Component, OnInit, signal, computed } from '@angular/core';
import {
  Treatment,
  CustomerTreatment,
  TreatmentSessionDetail,
} from '../../../shared/interfaces/treatment.interface';
import { ActivatedRoute } from '@angular/router';
import { ConfirmDialogService } from '../../../shared/services/confirm-dialog';
import { HttpClient } from '@angular/common/http';

export interface GroupedCustomerRecord {
  customerId: string;
  customerName: string;
  customerPhone: string;
  treatments: CustomerTreatment[];
}

export interface StaffOption {
  _id: string;
  staffName: string;
}

@Component({
  selector: 'app-admin-treatments',
  standalone: false,
  templateUrl: './admin-treatments.html',
  styleUrl: './admin-treatments.scss',
})
export class AdminTreatments implements OnInit {
  // ==========================================
  // 1. TRẠNG THÁI GIAO DIỆN
  // ==========================================
  activeTab = signal<'packages' | 'customers'>('packages');
  successMessage = signal<string>('');
  errorMessage = signal<string>('');
  searchKeyword = signal<string>('');

  selectedCustomer = signal<GroupedCustomerRecord | null>(null);

  // ==========================================
  // PHÂN TRANG GÓI LIỆU TRÌNH (10 GÓI / TRANG)
  // ==========================================
  currentPage = signal<number>(1);
  pageSize = signal<number>(10);

  // ==========================================
  // 2. DỮ LIỆU THỰC TẾ TỪ MONGODB
  // ==========================================
  packages = signal<Treatment[]>([]);
  customerTreatments = signal<CustomerTreatment[]>([]);
  staffOptions = signal<StaffOption[]>([]);

  // ==========================================
  // 3. POPUP TẠO GÓI
  // ==========================================
  isCreatePackageModalOpen = signal<boolean>(false);
  newPackage: Partial<Treatment> = {};

  // ==========================================
  // 4. POPUP SỬA GÓI
  // ==========================================
  isEditPackageModalOpen = signal<boolean>(false);
  editPackageForm: Partial<Treatment> = {};

  // ==========================================
  // 5. POPUP CHI TIẾT GÓI
  // ==========================================
  isPackageDetailModalOpen = signal<boolean>(false);
  selectedPackage: Treatment | null = null;

  // ==========================================
  // 6. GHI NHẬN BUỔI ĐIỀU TRỊ
  // ==========================================
  sessionLog = {
    treatmentId: '',
    staffId: '',
    note: '',
  };

  constructor(
    private http: HttpClient,
    private confirmDialog: ConfirmDialogService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      if (params['tab'] === 'customers') {
        this.activeTab.set('customers');
      }
    });

    this.loadData();
  }

  // ==========================================
  // 7. TỰ ĐỘNG SINH MÃ TỊNH TIẾN (LT-001, LT-002...)
  // ==========================================
  generateNextPackageCode(): string {
    const list = this.packages();
    const numbers = list
      .map((p) => {
        const code = (p.packageCode || '').trim().toUpperCase();
        if (code.startsWith('LT-')) {
          const numPart = code.replace('LT-', '').replace(/\D/g, '');
          return parseInt(numPart, 10);
        }
        return 0;
      })
      .filter((n) => !isNaN(n) && n > 0);

    const maxNum = numbers.length > 0 ? Math.max(...numbers) : 0;
    return `LT-${String(maxNum + 1).padStart(3, '0')}`;
  }

  // ==========================================
  // 8. BỘ LỌC TÌM KIẾM, PHÂN TRANG & GOM NHÓM
  // ==========================================
  filteredPackages = computed(() => {
    const kw = this.searchKeyword().toLowerCase().trim();
    return this.packages().filter(
      (pkg) =>
        !kw ||
        (pkg.treatmentName || '').toLowerCase().includes(kw) ||
        (pkg.packageCode || '').toLowerCase().includes(kw)
    );
  });

  totalPages = computed(() => {
    const total = this.filteredPackages().length;
    return Math.max(1, Math.ceil(total / this.pageSize()));
  });

  pagesArray = computed(() => {
    return Array.from({ length: this.totalPages() }, (_, i) => i + 1);
  });

  paginatedPackages = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    return this.filteredPackages().slice(start, start + this.pageSize());
  });

  setPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  onSearchChange(kw: string): void {
    this.searchKeyword.set(kw);
    this.currentPage.set(1);
  }

  groupedCustomerTreatments = computed(() => {
    const kw = this.searchKeyword().toLowerCase().trim();
    const map = new Map<string, GroupedCustomerRecord>();

    for (const ct of this.customerTreatments()) {
      const cId = ct.customerId || 'KH-DEFAULT';
      const cName = (ct as any).customerName || 'Khách hàng';
      const cPhone = (ct as any).customerPhone || '';

      if (!map.has(cId)) {
        map.set(cId, {
          customerId: cId,
          customerName: cName,
          customerPhone: cPhone,
          treatments: [],
        });
      }
      map.get(cId)!.treatments.push(ct);
    }

    const result = Array.from(map.values());
    if (!kw) return result;
    return result.filter(
      (g) =>
        g.customerId.toLowerCase().includes(kw) ||
        g.customerName.toLowerCase().includes(kw) ||
        g.customerPhone.includes(kw) ||
        g.treatments.some((t) => (t.treatmentName || '').toLowerCase().includes(kw))
    );
  });

  getStaffName(staffId: string): string {
    const found = this.staffOptions().find((s) => s._id === staffId);
    return found ? found.staffName : staffId || 'KTV Phụ Trách';
  }

  selectCustomerDetail(customer: GroupedCustomerRecord): void {
    this.selectedCustomer.set(customer);
  }

  backToCustomerList(): void {
    this.selectedCustomer.set(null);
  }

  // ==========================================
  // 9. TẢI DỮ LIỆU TỪ BACKEND DATABASE
  // ==========================================
  loadData(): void {
    // 1. Tải danh sách nhân sự từ DB để chọn người phụ trách buổi
    this.http.get<any>('/api/admin/staffs').subscribe({
      next: (res) => {
        const list = res?.data || res || [];
        const mapped = list.map((s: any) => ({
          _id: s._id,
          staffName: s.staffName || s.fullName || 'Nhân viên'
        }));
        this.staffOptions.set(mapped);
        if (mapped.length > 0 && !this.sessionLog.staffId) {
          this.sessionLog.staffId = mapped[0]._id;
        }
      },
      error: (err) => console.error('Lỗi nạp nhân sự:', err)
    });

    // 2. Tải danh mục gói liệu trình chuẩn từ DB
    this.http.get<any>('/api/admin/treatments').subscribe({
      next: (res) => {
        const list = res?.data || res || [];
        this.packages.set(list);
      },
      error: (err) => console.error('Lỗi tải danh mục liệu trình:', err)
    });

    // 3. Tải hồ sơ điều trị thực tế của khách hàng từ DB
    this.http.get<any>('/api/admin/customer-treatments').subscribe({
      next: (res) => {
        const list = res?.data || res || [];
        const mapped: CustomerTreatment[] = list.map((item: any) => {
          const cust = item.customerId;
          const customerMongoId =
            typeof cust === 'object' && cust !== null ? cust._id : cust || '';

          const displayCode =
            typeof cust === 'object' && cust !== null
              ? cust.customId || cust.customerCode || customerMongoId
              : item.customerCode || customerMongoId;

          const displayName =
            typeof cust === 'object' && cust !== null
              ? cust.fullName || 'Khách hàng'
              : item.customerName || 'Khách hàng';

          const displayPhone =
            typeof cust === 'object' && cust !== null
              ? cust.phone || ''
              : item.customerPhone || '';

          return {
            ...item,
            _id: item._id,
            customerId: displayCode,
            customerMongoId,
            customerName: displayName,
            customerPhone: displayPhone,
            treatmentId: item.customTreatmentId || item.serviceId?._id || '',
            treatmentName: item.treatmentName || 'Gói liệu trình',
            totalSessions: Number(item.totalSessions) || 1,
            usedSessions: Number(item.usedSessions) || 0,
            remainingSessions:
              item.remainingSessions != null
                ? Number(item.remainingSessions)
                : Math.max(0, Number(item.totalSessions || 1) - Number(item.usedSessions || 0)),
            status: item.status || 'active',
            history: item.history || [],
          };
        });

        this.customerTreatments.set(mapped);
      },
      error: (err) => console.error('Lỗi tải hồ sơ khách:', err)
    });
  }

  // ==========================================
  // 10. THAO TÁC GÓI LIỆU TRÌNH TRÊN DATABASE
  // ==========================================
  openPackageDetail(pkg: Treatment): void {
    this.selectedPackage = pkg;
    this.isPackageDetailModalOpen.set(true);
  }

  closePackageDetail(): void {
    this.isPackageDetailModalOpen.set(false);
    this.selectedPackage = null;
  }

  openCreatePackageModal(): void {
    this.errorMessage.set('');
    this.newPackage = {
      packageCode: this.generateNextPackageCode(), // Tự động cấp mã LT-00x
      treatmentName: '',
      totalSessions: 5,
      price: 0,
      description: '',
      technology: '',
      sessionDetails: this.createSessionDetails(5),
    };
    this.isCreatePackageModalOpen.set(true);
  }

  closeCreatePackageModal(): void {
    this.isCreatePackageModalOpen.set(false);
  }

  confirmCreatePackage(): void {
    const code = this.newPackage.packageCode?.trim() || this.generateNextPackageCode();
    const name = this.newPackage.treatmentName?.trim();
    const sessions = Number(this.newPackage.totalSessions);
    const price = Number(this.newPackage.price);

    if (!name) {
      this.errorMessage.set('Vui lòng nhập tên gói liệu trình!');
      return;
    }

    this.confirmDialog.confirm({
      title: 'Xác nhận tạo gói liệu trình',
      message: `Bạn có chắc chắn muốn tạo gói "${name}" (${code})?`,
      confirmText: 'Tạo gói',
      type: 'primary',
      action: () => {
        this.http.post<any>('/api/admin/treatments', {
          ...this.newPackage,
          packageCode: code,
          totalSessions: sessions,
          price: price,
        }).subscribe({
          next: () => {
            this.loadData();
            this.closeCreatePackageModal();
            this.successMessage.set('Đã tạo gói liệu trình thành công!');
          },
          error: (err) => this.errorMessage.set(err?.error?.message || 'Lỗi tạo gói liệu trình!')
        });
      },
    });
  }

  createSessionDetails(totalSessions: number): TreatmentSessionDetail[] {
    return Array.from({ length: totalSessions }, (_, index) => ({
      sessionNumber: index + 1,
      title: '',
      description: '',
    }));
  }

  updateCreateSessionDetails(): void {
    const total = Number(this.newPackage.totalSessions);
    if (!Number.isInteger(total) || total <= 0) return;
    this.newPackage.sessionDetails = this.createSessionDetails(total);
  }

  // ==========================================
  // 11. GHI NHẬN BUỔI ĐIỀU TRỊ VÀO DATABASE
  // ==========================================
  confirmLogSession(ct: CustomerTreatment): void {
    this.errorMessage.set('');
    this.successMessage.set('');

    if (!ct._id) {
      this.errorMessage.set('Lỗi: Không tìm thấy mã hồ sơ điều trị!');
      return;
    }

    if (ct.remainingSessions <= 0) {
      this.errorMessage.set('Liệu trình này đã hoàn thành tất cả các buổi!');
      return;
    }

    const nextSessionNumber = ct.usedSessions + 1;
    const ctId = ct._id;

    this.confirmDialog.confirm({
      title: 'Xác nhận hoàn thành buổi điều trị',
      message: `Xác nhận khách hàng "${ct.customerName}" đã hoàn thành Buổi ${nextSessionNumber}/${ct.totalSessions} của "${ct.treatmentName}"?`,
      confirmText: 'Xác nhận buổi',
      type: 'primary',
      action: () => this.onLogSession(ctId),
    });
  }

  onLogSession(ctId: string): void {
    const payload = {
      staffId: this.sessionLog.staffId,
      note: this.sessionLog.note.trim() || 'Thực hiện buổi điều trị tại phòng khám.'
    };

    this.http.patch<any>(`/api/admin/customer-treatments/${ctId}/checkin`, payload).subscribe({
      next: () => {
        this.successMessage.set('Đã ghi nhận buổi điều trị vào cơ sở dữ liệu!');
        this.sessionLog.note = '';
        this.loadData();
      },
      error: (err) => {
        this.errorMessage.set(err?.error?.message || 'Lỗi khi cập nhật buổi điều trị!');
      }
    });
  }

  // ==========================================
  // XỬ LÝ SỬA GÓI LIỆU TRÌNH
  // ==========================================
  openEditPackage(pkg: Treatment): void {
    this.errorMessage.set('');
    this.successMessage.set('');

    this.editPackageForm = {
      _id: pkg._id,
      packageCode: pkg.packageCode || '',
      treatmentName: pkg.treatmentName,
      totalSessions: pkg.totalSessions,
      price: pkg.price,
      description: pkg.description || '',
      technology: pkg.technology || '',
      sessionDetails: this.createSessionDetails(pkg.totalSessions).map((item, index) => ({
        ...item,
        title: pkg.sessionDetails?.[index]?.title || '',
        description: pkg.sessionDetails?.[index]?.description || '',
      })),
    };

    this.isEditPackageModalOpen.set(true);
  }

  closeEditPackageModal(): void {
    this.isEditPackageModalOpen.set(false);
    this.editPackageForm = {};
  }

  updateEditSessionDetails(): void {
    const total = Number(this.editPackageForm.totalSessions);
    if (!Number.isInteger(total) || total <= 0) {
      this.editPackageForm.sessionDetails = [];
      return;
    }

    const current = this.editPackageForm.sessionDetails || [];
    this.editPackageForm.sessionDetails = Array.from({ length: total }, (_, index) => ({
      sessionNumber: index + 1,
      title: current[index]?.title || '',
      description: current[index]?.description || '',
    }));
  }

  saveEditPackage(): void {
    this.errorMessage.set('');
    this.successMessage.set('');

    const id = this.editPackageForm._id;
    const name = this.editPackageForm.treatmentName?.trim();
    const sessions = Number(this.editPackageForm.totalSessions);
    const price = Number(this.editPackageForm.price);

    if (!id || !name) {
      this.errorMessage.set('Vui lòng nhập tên gói liệu trình!');
      return;
    }

    if (!Number.isInteger(sessions) || sessions <= 0) {
      this.errorMessage.set('Số buổi phải là số nguyên lớn hơn 0!');
      return;
    }

    this.confirmDialog.confirm({
      title: 'Xác nhận cập nhật gói',
      message: `Bạn có chắc chắn muốn cập nhật gói "${name}"?`,
      confirmText: 'Lưu thay đổi',
      type: 'primary',
      action: () => {
        const payload = {
          treatmentName: name,
          packageCode: this.editPackageForm.packageCode,
          totalSessions: sessions,
          price: price,
          description: this.editPackageForm.description || '',
          technology: this.editPackageForm.technology || '',
          sessionDetails: this.editPackageForm.sessionDetails || [],
        };

        this.http.put<any>(`/api/admin/treatments/${id}`, payload).subscribe({
          next: () => {
            this.loadData();
            this.closeEditPackageModal();
            this.successMessage.set('Đã cập nhật gói liệu trình thành công!');
          },
          error: () => {
            this.packages.update((list) =>
              list.map((p) => (p._id === id ? { ...p, ...payload } : p))
            );
            this.closeEditPackageModal();
            this.successMessage.set('Đã cập nhật gói liệu trình!');
          },
        });
      },
    });
  }

  // ==========================================
  // XỬ LÝ XÓA GÓI LIỆU TRÌNH
  // ==========================================
  confirmDeletePackage(pkg: Treatment): void {
    this.errorMessage.set('');
    this.successMessage.set('');

    this.confirmDialog.confirm({
      title: 'Xác nhận xóa gói liệu trình',
      message: `Bạn có chắc chắn muốn xóa gói "${pkg.treatmentName}"?`,
      confirmText: 'Xác nhận xóa',
      cancelText: 'Hủy bỏ',
      type: 'danger',
      action: () => {
        this.http.delete<any>(`/api/admin/treatments/${pkg._id}`).subscribe({
          next: () => {
            this.loadData();
            this.successMessage.set(`Đã xóa gói "${pkg.treatmentName}" thành công!`);
          },
          error: () => {
            this.packages.update((list) => list.filter((p) => p._id !== pkg._id));
            this.successMessage.set(`Đã xóa gói "${pkg.treatmentName}" thành công!`);
          },
        });
      },
    });
  }
}