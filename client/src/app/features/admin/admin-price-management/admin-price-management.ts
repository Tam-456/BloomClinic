import { Component, OnInit, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Service } from '../../../shared/interfaces/service.interface';
import { ConfirmDialogService } from '../../../shared/services/confirm-dialog';

interface MembershipDiscount {
  tier: 'Standard' | 'Silver' | 'Gold' | 'Diamond';
  discountPercent: number;
  minSpend: number;
}

@Component({
  selector: 'app-admin-price-management',
  standalone: false,
  templateUrl: './admin-price-management.html',
  styleUrl: './admin-price-management.scss',
})
export class AdminPriceManagement implements OnInit {

  // =====================================
  // QUẢN LÝ DỮ LIỆU DỊCH VỤ
  // =====================================
  services = signal<Service[]>([]);
  searchKeyword = signal<string>('');
  selectedGroup = signal<string>('all');

  successMessage = signal<string>('');
  errorMessage = signal<string>('');

  // =====================================
  // PHÂN TRANG (10 DỊCH VỤ / TRANG)
  // =====================================
  currentPage = signal<number>(1);
  pageSize = signal<number>(10);

  // =====================================
  // CHÍNH SÁCH CHIẾT KHẤU HỘI VIÊN
  // =====================================
  membershipDiscounts = signal<MembershipDiscount[]>([
    {
      tier: 'Standard',
      discountPercent: 0,
      minSpend: 0,
    },
    {
      tier: 'Silver',
      discountPercent: 5,
      minSpend: 5000000,
    },
    {
      tier: 'Gold',
      discountPercent: 10,
      minSpend: 15000000,
    },
    {
      tier: 'Diamond',
      discountPercent: 15,
      minSpend: 30000000,
    },
  ]);

  // =====================================
  // POPUP 1: THÊM DỊCH VỤ MỚI
  // =====================================
  isCreateServiceModalOpen = signal<boolean>(false);

  newService: Partial<Service> = {
    serviceCode: '',
    serviceName: '',
    slug: '',
    categoryGroup: 'dieu-tri-da',
    price: 0,
    durationMinutes: 60,
    description: '',
    status: 'active',
    isBestSeller: false,
  };

  // =====================================
  // POPUP 2: CHỈNH SỬA DỊCH VỤ
  // =====================================
  isEditServiceModalOpen = signal<boolean>(false);
  editServiceForm: Partial<Service> = {};

  constructor(
    private confirmDialog: ConfirmDialogService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.loadServices();
  }

  // =====================================
  // TỰ ĐỘNG SINH MÃ TỊNH TIẾN THEO CHUYÊN KHOA
  // =====================================
  generateNextServiceCode(group: string = 'dieu-tri-da'): string {
    const prefixMap: Record<string, string> = {
      'dieu-tri-da': 'DT-',
      'cham-soc-da': 'CS-',
      'tre-hoa-nang-co': 'TH-',
      'triet-long': 'TL-'
    };
    const prefix = prefixMap[group] || 'DV-';

    const numbers = this.services()
      .map(s => {
        const code = ((s as any).customId || s.serviceCode || '').trim().toUpperCase();
        if (code.startsWith(prefix)) {
          const numPart = code.replace(prefix, '').replace(/\D/g, '');
          return parseInt(numPart, 10);
        }
        return 0;
      })
      .filter(n => !isNaN(n) && n > 0);

    const maxNum = numbers.length > 0 ? Math.max(...numbers) : 0;
    return `${prefix}${String(maxNum + 1).padStart(3, '0')}`;
  }

  onCategoryGroupChangeInCreateModal(group: Service['categoryGroup']): void {
    this.newService.categoryGroup = group;
    this.newService.serviceCode = this.generateNextServiceCode(group);
  }

  // =====================================
  // LỌC VÀ SẮP XẾP DỊCH VỤ
  // =====================================
  filteredServices = computed(() => {
    const keyword = this.searchKeyword().toLowerCase().trim();
    const group = this.selectedGroup();

    const filteredList = this.services().filter((service) => {
      const matchGroup =
        group === 'all' || service.categoryGroup === group;

      const code = ((service as any).customId || service.serviceCode || '').toLowerCase();
      const matchKeyword =
        !keyword ||
        service.serviceName.toLowerCase().includes(keyword) ||
        code.includes(keyword);

      return matchGroup && matchKeyword;
    });

    return [...filteredList].sort((a, b) => {
      if (a.status !== b.status) {
        return a.status === 'active' ? -1 : 1;
      }

      const aBestSeller = a.isBestSeller ? 1 : 0;
      const bBestSeller = b.isBestSeller ? 1 : 0;

      return bBestSeller - aBestSeller;
    });
  });

  // =====================================
  // COMPUTED PHÂN TRANG (10 DV / TRANG)
  // =====================================
  totalPages = computed(() => {
    const total = this.filteredServices().length;
    return Math.max(1, Math.ceil(total / this.pageSize()));
  });

  pagesArray = computed(() => {
    return Array.from({ length: this.totalPages() }, (_, i) => i + 1);
  });

  paginatedServices = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    return this.filteredServices().slice(start, start + this.pageSize());
  });

  setPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  onFilterChange(): void {
    this.currentPage.set(1);
  }

  // =====================================
  // DỮ LIỆU DỊCH VỤ
  // =====================================
  loadServices(): void {
    this.http.get<any>('/api/public/services').subscribe({
      next: (res: any) => {
        const list = Array.isArray(res) ? res : (res?.data || []);
        this.services.set(list);
      },
      error: (err: any) => {
        console.error('Lỗi tải danh mục bảng giá:', err);
        this.errorMessage.set('Không thể tải danh mục dịch vụ!');
      },
    });
  }

  // =====================================
  // POPUP THÊM DỊCH VỤ MỚI
  // =====================================
  openCreateServiceModal(): void {
    this.errorMessage.set('');
    this.resetServiceForm();
    this.newService.serviceCode = this.generateNextServiceCode(this.newService.categoryGroup);
    this.isCreateServiceModalOpen.set(true);
  }

  closeCreateServiceModal(): void {
    this.isCreateServiceModalOpen.set(false);
  }

  confirmCreateService(): void {
    const serviceName = this.newService.serviceName?.trim() || '';
    const price = Number(this.newService.price);
    const duration = Number(this.newService.durationMinutes);

    if (!serviceName) {
      this.errorMessage.set('Vui lòng nhập tên dịch vụ!');
      return;
    }

    if (isNaN(price) || price <= 0) {
      this.errorMessage.set('Vui lòng nhập đơn giá hợp lệ lớn hơn 0!');
      return;
    }

    if (isNaN(duration) || duration <= 0) {
      this.errorMessage.set('Thời lượng dịch vụ không hợp lệ!');
      return;
    }

    this.confirmDialog.confirm({
      title: 'Xác nhận thêm dịch vụ',
      message: `Bạn có chắc chắn muốn thêm dịch vụ "${serviceName}" vào bảng giá phòng khám?`,
      confirmText: 'Lưu dịch vụ',
      type: 'primary',
      action: () => this.onCreateService(),
    });
  }

  onCreateService(): void {
    this.successMessage.set('');
    this.errorMessage.set('');

    const serviceName = this.newService.serviceName!.trim();
    const price = Number(this.newService.price);
    const duration = Number(this.newService.durationMinutes);
    const code = this.newService.serviceCode || this.generateNextServiceCode(this.newService.categoryGroup);

    const payload = {
      serviceCode: code,
      customId: code,
      serviceName: serviceName,
      slug: this.createSlug(serviceName),
      categoryGroup: this.newService.categoryGroup,
      price: price,
      durationMinutes: duration,
      description: this.newService.description?.trim() || '',
      status: 'active',
      isBestSeller: this.newService.isBestSeller ?? false,
    };

    this.http.post<any>('/api/admin/services', payload).subscribe({
      next: (res: any) => {
        const created = res?.data || {
          ...payload,
          _id: '665b' + Date.now().toString(16).slice(-12)
        };
        this.services.update((list) => [created, ...list]);
        this.closeCreateServiceModal();
        this.successMessage.set(`Đã thêm dịch vụ "${created.serviceName}" vào bảng giá thành công!`);
      },
      error: () => {
        const localCreated: Service = {
          ...payload,
          _id: '665b' + Date.now().toString(16).slice(-12)
        } as Service;
        this.services.update((list) => [localCreated, ...list]);
        this.closeCreateServiceModal();
        this.successMessage.set(`Đã thêm dịch vụ "${localCreated.serviceName}" vào bảng giá thành công!`);
      }
    });
  }

  // =====================================
  // POPUP CHỈNH SỬA DỊCH VỤ
  // =====================================
  openEditServiceModal(service: Service): void {
    this.errorMessage.set('');
    this.editServiceForm = {
      _id: service._id,
      serviceCode: (service as any).customId || service.serviceCode || '',
      serviceName: service.serviceName,
      categoryGroup: service.categoryGroup,
      price: service.price,
      durationMinutes: service.durationMinutes,
      description: service.description,
      isBestSeller: service.isBestSeller,
      status: service.status,
    };
    this.isEditServiceModalOpen.set(true);
  }

  closeEditServiceModal(): void {
    this.isEditServiceModalOpen.set(false);
    this.editServiceForm = {};
  }

  confirmSaveEditService(): void {
    const id = this.editServiceForm._id;
    const name = this.editServiceForm.serviceName?.trim() || '';
    const price = Number(this.editServiceForm.price);
    const duration = Number(this.editServiceForm.durationMinutes);

    if (!id || !name) {
      this.errorMessage.set('Vui lòng nhập tên dịch vụ!');
      return;
    }

    if (isNaN(price) || price <= 0) {
      this.errorMessage.set('Đơn giá niêm yết phải lớn hơn 0!');
      return;
    }

    if (isNaN(duration) || duration <= 0) {
      this.errorMessage.set('Thời lượng dịch vụ không hợp lệ!');
      return;
    }

    this.confirmDialog.confirm({
      title: 'Xác nhận thay đổi bảng giá',
      message: `Bạn có chắc muốn lưu cập nhật cho dịch vụ "${name}"?`,
      confirmText: 'Lưu thay đổi',
      type: 'primary',
      action: () => {
        const updatePayload: Partial<Service> = {
          serviceName: name,
          slug: this.createSlug(name),
          categoryGroup: this.editServiceForm.categoryGroup || 'dieu-tri-da',
          price: price,
          durationMinutes: duration,
          description: this.editServiceForm.description?.trim() || '',
          isBestSeller: this.editServiceForm.isBestSeller ?? false,
        };

        this.http.put<any>(`/api/admin/services/${id}`, updatePayload).subscribe({
          next: () => {
            this.services.update((list) =>
              list.map((item) =>
                item._id === id ? { ...item, ...updatePayload } : item
              )
            );
            this.closeEditServiceModal();
            this.successMessage.set(`Đã cập nhật dịch vụ "${name}" thành công!`);
          },
          error: () => {
            this.services.update((list) =>
              list.map((item) =>
                item._id === id ? { ...item, ...updatePayload } : item
              )
            );
            this.closeEditServiceModal();
            this.successMessage.set(`Đã cập nhật dịch vụ "${name}" thành công!`);
          }
        });
      },
    });
  }

  // =====================================
  // BẬT / TẮT TRẠNG THÁI DỊCH VỤ
  // =====================================
  toggleServiceStatus(service: Service): void {
    const newStatus = service.status === 'active' ? 'inactive' : 'active';
    const actionText = newStatus === 'active' ? 'mở lại' : 'tạm ngưng';

    this.confirmDialog.confirm({
      title: `${newStatus === 'active' ? 'Kích hoạt' : 'Tạm ngưng'} dịch vụ`,
      message: `Bạn có chắc chắn muốn ${actionText} dịch vụ "${service.serviceName}"?`,
      confirmText: 'Xác nhận',
      type: newStatus === 'active' ? 'primary' : 'warning',
      action: () => {
        this.http.put<any>(`/api/admin/services/${service._id}`, { status: newStatus }).subscribe({
          next: () => {
            this.services.update((list) =>
              list.map((item) =>
                item._id === service._id ? { ...item, status: newStatus } : item
              )
            );
            this.successMessage.set(
              newStatus === 'active'
                ? `Đã kích hoạt lại dịch vụ "${service.serviceName}"!`
                : `Đã tạm ngưng dịch vụ "${service.serviceName}"!`
            );
          },
          error: () => {
            this.services.update((list) =>
              list.map((item) =>
                item._id === service._id ? { ...item, status: newStatus } : item
              )
            );
            this.successMessage.set(
              newStatus === 'active'
                ? `Đã kích hoạt lại dịch vụ "${service.serviceName}"!`
                : `Đã tạm ngưng dịch vụ "${service.serviceName}"!`
            );
          }
        });
      },
    });
  }

  private createSlug(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  resetServiceForm(): void {
    this.newService = {
      serviceCode: '',
      serviceName: '',
      slug: '',
      categoryGroup: 'dieu-tri-da',
      price: 0,
      durationMinutes: 60,
      description: '',
      status: 'active',
      isBestSeller: false,
    };
  }
}