import {
  Component,
  OnInit,
  signal,
  ViewChild,
  computed,
  ElementRef,
} from '@angular/core';

import { Router } from '@angular/router';
import { ChartConfiguration, Chart, registerables } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';

import { ConfirmDialogService } from '../../../shared/services/confirm-dialog';
import { AdminOperationsService } from '../../../shared/services/admin-operations';
import { HttpClient } from '@angular/common/http';

Chart.register(...registerables);

// ================= MODEL KHÁCH HÀNG =================
export interface CustomerAccountItem {
  _id: string;
  customId?: string;
  customerCode?: string;
  fullName: string;
  email: string;
  phone: string;
  membershipTier?: 'Standard' | 'Silver' | 'Gold' | 'Diamond';
  createdAt?: string;
  status?: 'active' | 'locked' | string;
  isActive?: boolean;
}

// ================= MODEL TIỀN CỌC =================
export interface DepositRowItem {
  _id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerTier: 'Standard' | 'Silver' | 'Gold' | 'Diamond';
  serviceId: string;
  serviceName: string;
  servicePrice: number;
  amount: number;
  depositStatus: 'held' | 'refunded' | 'settled';
  createdAt: string;
  settledAt?: string;
  collectorName: string;
  note?: string;
}

// ================= MODEL CÔNG NỢ =================
export interface DebtRowItem {
  _id: string;
  customerName: string;
  totalAmount: number;
  paidAmount: number;
  debtAmount: number;
  dueDate: string;
  status: 'paid' | 'partial' | 'unpaid';
}

interface ClinicKpis {
  todayRevenue: number;
  pendingBookingsCount: number;
  inTreatmentCount: number;
  lowStockCount: number;
}

interface RevenueData {
  date: string;
  branch: 'thuduc' | 'quan1';
  serviceRevenue: number;
  productRevenue: number;
  successOrders: number;
  discount: number;
  revenue: number;
  cost: number;
  profit: number;
}

interface RevenueFilter {
  startDate: string;
  endDate: string;
  branch: 'all' | 'thuduc' | 'quan1';
  category: 'all' | 'service' | 'product';
}

interface RevenueTotals {
  orders: number;
  discount: number;
  revenue: number;
  cost: number;
  profit: number;
}

@Component({
  selector: 'app-admin-operations',
  standalone: false,
  templateUrl: './admin-operations.html',
  styleUrl: './admin-operations.scss',
})
export class AdminOperations implements OnInit {
  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;

  @ViewChild('revenueSection')
  revenueSection?: ElementRef<HTMLElement>;

  todayStr = '2026-11-03';

  // ================= ĐIỀU KHIỂN CHUYỂN TAB TRONG TRANG =================
  currentTab = signal<'overview' | 'customers'>('overview');

  switchTab(tab: 'overview' | 'customers'): void {
    this.currentTab.set(tab);
    // Tự động tải lại dữ liệu mới nhất từ database để số liệu chi tiêu/doanh thu cập nhật ngay
    this.loadCustomersAndInvoices();
    this.loadOperationsData();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ================= KPI =================
  kpis = signal<ClinicKpis>({
    todayRevenue: 0,
    pendingBookingsCount: 0,
    inTreatmentCount: 0,
    lowStockCount: 0,
  });

  // ================= HỒ SƠ KHÁCH HÀNG =================
  customers = signal<CustomerAccountItem[]>([]);
  allInvoices = signal<any[]>([]); // Toàn bộ hóa đơn để đối soát và tính tổng tiền chi tiêu
  customerSearchKeyword = signal<string>('');

  // Popup xem chi tiết chi tiêu
  isSpendingDetailModalOpen = signal<boolean>(false);
  selectedCustomer = signal<CustomerAccountItem | null>(null);

  // Popup bảo mật trước khi sửa
  isPasswordPromptOpen = signal<boolean>(false);
  securityPasswordInput = '';
  passwordError = signal<string>('');
  customerTargetForEdit: CustomerAccountItem | null = null;

  // Popup chỉnh sửa thông tin khách hàng
  isEditCustomerModalOpen = signal<boolean>(false);
  editCustomerForm = {
    _id: '',
    fullName: '',
    phone: '',
    email: '',
    status: 'active',
  };

  filteredCustomers = computed(() => {
    const kw = this.customerSearchKeyword().toLowerCase().trim();
    if (!kw) return this.customers();

    return this.customers().filter(
      (c) =>
        (c.fullName || '').toLowerCase().includes(kw) ||
        (c.phone || '').includes(kw) ||
        (c.email || '').toLowerCase().includes(kw) ||
        (c.customerCode || '').toLowerCase().includes(kw)
    );
  });

  // ================= TIỀN CỌC =================
  deposits = signal<DepositRowItem[]>([]);
  selectedDepositDetail = signal<DepositRowItem | null>(null);
  isDepositDetailModalOpen = signal<boolean>(false);

  filteredDeposits = computed(() => {
    const list = this.deposits().filter((d) => {
      if (d.depositStatus === 'held') return true;
      return d.settledAt && d.settledAt.startsWith(this.todayStr);
    });

    return [...list].sort((a, b) => {
      if (a.depositStatus === 'held' && b.depositStatus === 'settled') return -1;
      if (a.depositStatus === 'settled' && b.depositStatus === 'held') return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  });

  // ================= CÔNG NỢ =================
  debts = signal<DebtRowItem[]>([]);
  debtFilter = signal<'all' | 'due' | 'overdue'>('all');

  filteredUrgentDebts = computed(() => {
    return this.debts().filter((inv) => {
      if (inv.debtAmount <= 0) return false;

      const isOverdue = inv.dueDate < this.todayStr;
      const isDueToday = inv.dueDate === this.todayStr;

      if (this.debtFilter() === 'overdue') return isOverdue;
      if (this.debtFilter() === 'due') return isDueToday;
      return isOverdue || isDueToday;
    });
  });

  isLoading = signal<boolean>(false);
  successMessage = signal<string>('');

  // ================= BÁO CÁO DOANH THU =================
  showRevenueDetails = signal<boolean>(false);
  revenueFilterError = signal<string>('');

  private readonly today = new Date();
  private readonly thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  revenueFilter: RevenueFilter = {
  startDate: this.formatDateISO(this.thirtyDaysAgo), // Tự động lùi về đúng 30 ngày trước
  endDate: this.formatDateISO(this.today),          // Luôn là ngày hiện tại
  branch: 'all',
  category: 'all',
};

  revenueData = signal<RevenueData[]>([]);
  filteredRevenueData = signal<RevenueData[]>([]);

  revenueTotals = signal<RevenueTotals>({
    orders: 0,
    discount: 0,
    revenue: 0,
    cost: 0,
    profit: 0,
  });

  // ================= BIỂU ĐỒ =================
  revenueChartData: ChartConfiguration<'bar'>['data'] = {
    labels: [],
    datasets: [],
  };

  revenueChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          boxWidth: 8,
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = Number(context.parsed.y ?? 0);
            return `${context.dataset.label}: ${this.formatCurrency(value)} đ`;
          },
        },
      },
    },
    scales: {
      x: {
        stacked: true,
        ticks: { autoSkip: false, maxRotation: 0, minRotation: 0 },
        grid: { display: false },
      },
      y: {
        stacked: false,
        beginAtZero: true,
        ticks: { callback: (value) => this.formatChartAxis(Number(value)) },
        title: { display: true, text: 'VNĐ' },
      },
    },
  };

  constructor(
    private opsService: AdminOperationsService,
    private confirmDialog: ConfirmDialogService,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.loadOperationsData();
    this.loadCustomersAndInvoices();
    this.loadRealRevenue();
    this.filterRevenue();
  }

  // =====================================================
  // TẢI KHÁCH HÀNG & HÓA ĐƠN ĐỂ TÍNH TIỀN THỰC TRẢ
  // =====================================================
  loadCustomersAndInvoices(): void {
    // 1. Tải danh sách khách hàng từ User collection
    this.http.get<any>('/api/admin/customers').subscribe({
      next: (res) => {
        const list = res?.data || res || [];
        this.customers.set(
  list.map((c: any) => ({
    ...c,
    customId: c.customId || '',
    customerCode: c.customId || c.customerCode || c._id,
    membershipTier: c.membershipTier || 'Standard',
    status: c.status || (c.isActive === false ? 'locked' : 'active'),
  }))
);
      },
      error: () => {
        // Mock data nếu backend chưa kết nối
        this.customers.set([
          {
            _id: '665a00000000000000000001',
            customerCode: 'KH-001',
            fullName: 'Nguyễn Ngọc Tâm',
            email: 'ngoctam@gmail.com',
            phone: '0912345678',
            membershipTier: 'Gold',
            createdAt: '2026-08-10',
            status: 'active',
          },
          {
            _id: '665a00000000000000000002',
            customerCode: 'KH-002',
            fullName: 'Lê Hoàng Long',
            email: 'hoanglong@gmail.com',
            phone: '0988776655',
            membershipTier: 'Silver',
            createdAt: '2026-09-01',
            status: 'active',
          },
          {
            _id: '665a00000000000000000003',
            customerCode: 'KH-003',
            fullName: 'Trần Thị Mỹ Duyên',
            email: 'myduyen@gmail.com',
            phone: '0903112233',
            membershipTier: 'Diamond',
            createdAt: '2026-07-15',
            status: 'active',
          },
        ]);
      },
    });

    // 2. Tải toàn bộ hóa đơn để đối soát và tính chi tiêu thực trả
    this.http.get<any>('/api/admin/invoices').subscribe({
      next: (res) => {
        const invList = res?.data || res || [];
        this.allInvoices.set(invList);
      },
      error: () => {
        this.allInvoices.set([
          {
            _id: 'INV-001',
            customerId: '665a00000000000000000001',
            invoiceCode: 'INV-001',
            createdAt: '2026-10-10 09:30',
            items: [{ name: 'Gói Laser Pico Trẻ Hóa & Xóa Nám', quantity: 1 }],
            totalAmount: 4500000,
            finalAmount: 4500000,
            paidAmount: 4500000,
            debtAmount: 0,
            status: 'paid',
          },
          {
            _id: 'INV-002',
            customerId: '665a00000000000000000001',
            invoiceCode: 'INV-002',
            createdAt: '2026-10-25 14:15',
            items: [{ name: 'Kem Chống Nắng MartiDerm', quantity: 2 }],
            totalAmount: 2000000,
            finalAmount: 2000000,
            paidAmount: 1000000,
            debtAmount: 1000000,
            status: 'partially_paid',
          },
        ]);
      },
    });
  }

  // =====================================================
  // TÍNH TỔNG TIỀN CHI TIÊU THỰC TRẢ (CHUẨN LOGIC DOANH THU)
  // =====================================================
  getCustomerTotalSpent(customerId: string): number {
    const customerInvoices = this.allInvoices().filter(
      (inv) => (inv.customerId === customerId || inv.customerId?._id === customerId) && inv.status !== 'deleted'
    );

    // Chỉ cộng tiền thực trả (paidAmount), không cộng công nợ
    return customerInvoices.reduce((total, inv) => {
      const actualPaid = Number(inv.paidAmount) || 0;
      return total + actualPaid;
    }, 0);
  }

  getCustomerInvoices(customerId: string): any[] {
    return this.allInvoices().filter(
      (inv) => (inv.customerId === customerId || inv.customerId?._id === customerId) && inv.status !== 'deleted'
    );
  }

  // =====================================================
  // POPUP XEM CHI TIẾT CHI TIÊU (CLICK DÒNG)
  // =====================================================
  openCustomerSpendingDetail(c: CustomerAccountItem): void {
    this.selectedCustomer.set(c);
    this.isSpendingDetailModalOpen.set(true);
  }

  closeCustomerSpendingDetail(): void {
    this.isSpendingDetailModalOpen.set(false);
    this.selectedCustomer.set(null);
  }

  // =====================================================
  // POPUP BẢO MẬT & SỬA THÔNG TIN KHÁCH HÀNG
  // =====================================================
  promptSecurityPasswordForEdit(c: CustomerAccountItem): void {
    this.customerTargetForEdit = c;
    this.securityPasswordInput = '';
    this.passwordError.set('');
    this.isPasswordPromptOpen.set(true);
  }

  closePasswordPrompt(): void {
    this.isPasswordPromptOpen.set(false);
    this.securityPasswordInput = '';
    this.passwordError.set('');
  }

  verifySecurityPassword(): void {
    if (this.securityPasswordInput === 'BloomClinic@2026!') {
      this.isPasswordPromptOpen.set(false);
      this.openEditCustomerModal(this.customerTargetForEdit!);
    } else {
      this.passwordError.set('Mật khẩu quản trị không chính xác! Vui lòng thử lại.');
    }
  }

  openEditCustomerModal(c: CustomerAccountItem): void {
    this.editCustomerForm = {
      _id: c._id,
      fullName: c.fullName,
      phone: c.phone || '',
      email: c.email || '',
      status: c.status || 'active',
    };
    this.isEditCustomerModalOpen.set(true);
  }

  closeEditCustomerModal(): void {
    this.isEditCustomerModalOpen.set(false);
  }

  submitEditCustomer(): void {
    if (!this.editCustomerForm.fullName?.trim() || !this.editCustomerForm.phone?.trim()) {
      alert('Vui lòng nhập đầy đủ họ tên và số điện thoại!');
      return;
    }

    const payload = {
      fullName: this.editCustomerForm.fullName.trim(),
      phone: this.editCustomerForm.phone.trim(),
      email: this.editCustomerForm.email.trim(),
      status: this.editCustomerForm.status,
      isActive: this.editCustomerForm.status === 'active',
    };

    this.http.put(`/api/admin/customers/${this.editCustomerForm._id}`, payload).subscribe({
      next: () => {
        this.customers.update((list) =>
          list.map((c) =>
            c._id === this.editCustomerForm._id ? { ...c, ...payload } : c
          )
        );
        this.successMessage.set(`Đã cập nhật hồ sơ khách hàng "${payload.fullName}" thành công!`);
        this.closeEditCustomerModal();
      },
      error: () => {
        this.customers.update((list) =>
          list.map((c) =>
            c._id === this.editCustomerForm._id ? { ...c, ...payload } : c
          )
        );
        this.successMessage.set(`Đã cập nhật hồ sơ khách hàng "${payload.fullName}" thành công!`);
        this.closeEditCustomerModal();
      },
    });
  }

  // =====================================================
  // CUỘN ĐẾN BIỂU ĐỒ DOANH THU
  // =====================================================
  scrollToRevenue(): void {
    this.revenueSection?.nativeElement.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }

  toggleRevenueDetails(): void {
    this.showRevenueDetails.update((value) => !value);
  }

  loadOperationsData(): void {
    // CHỈ GỌI MỘT NGUỒN DUY NHẤT: API thật từ backend
    this.http.get<any>('/api/admin/dashboard/stats').subscribe({
      next: (res) => {
        const data = res?.data || res;
        console.log('✅ Dashboard Stats nhận từ DB:', data);
        if (data) {
          this.kpis.set({
            todayRevenue: Number(data.todayRevenue || 0),
            pendingBookingsCount: Number(data.pendingBookingsCount || 0),
            inTreatmentCount: Number(data.inTreatmentCount || 0),
            lowStockCount: Number(data.lowStockCount || 0),
          });
        }
      },
      error: (err) => {
        console.error('Lỗi nạp Dashboard Stats:', err);
      }
    });

    // Tải Cọc & Công nợ
    this.opsService.getDepositsAndDebts().subscribe({
      next: (res: any) => {
        const data = res?.data || res;
        this.deposits.set(data?.deposits || []);
        this.debts.set(data?.debts || []);
      },
      error: () => {
        this.deposits.set([]);
        this.debts.set([]);
      },
    });
  }

  openDepositDetail(dep: DepositRowItem, event?: Event): void {
    if (event) event.stopPropagation();
    this.selectedDepositDetail.set(dep);
    this.isDepositDetailModalOpen.set(true);
  }

  closeDepositDetailModal(): void {
    this.isDepositDetailModalOpen.set(false);
    this.selectedDepositDetail.set(null);
  }

  processDepositToPos(dep: DepositRowItem, event?: Event): void {
    if (event) event.stopPropagation();

    sessionStorage.setItem(
      'pos_init_deposit_order',
      JSON.stringify({
        depositId: dep._id,
        customerId: dep.customerId,
        customerName: dep.customerName,
        customerPhone: dep.customerPhone,
        customerTier: dep.customerTier,
        item: {
          itemId: dep.serviceId,
          name: dep.serviceName,
          type: 'service',
          quantity: 1,
          unitPrice: dep.servicePrice,
          amount: dep.servicePrice,
        },
        depositAmount: dep.amount,
      })
    );

    this.router.navigate(['/admin/pos']);
  }

  navigateToPosInvoices(): void {
    this.router.navigate(['/admin/pos'], {
      queryParams: {
        view: 'invoices',
        filter: 'debt_only',
      },
    });
  }

  loadRealRevenue(): void {
    const { startDate, endDate, branch, category } = this.revenueFilter;
    const params = `?startDate=${startDate}&endDate=${endDate}&branch=${branch}&category=${category}`;

    this.http.get<any>(`/api/admin/revenue-report${params}`).subscribe({
      next: (res) => {
        const data: RevenueData[] = res?.data || res || [];
        this.revenueData.set(data);
        this.filteredRevenueData.set(data);
        this.calculateRevenueTotals(data);
        this.updateRevenueChart(data);
      },
      error: (err) => {
        console.warn('Chưa có dữ liệu thống kê từ server:', err);
        this.revenueData.set([]);
        this.filteredRevenueData.set([]);
        this.calculateRevenueTotals([]);
        this.updateRevenueChart([]);
      }
    });
  }

  filterRevenue(): void {
    this.revenueFilterError.set('');

    if (!this.revenueFilter.startDate || !this.revenueFilter.endDate) {
      this.revenueFilterError.set('Vui lòng chọn đầy đủ ngày bắt đầu và kết thúc.');
      return;
    }

    if (this.revenueFilter.startDate > this.revenueFilter.endDate) {
      this.revenueFilterError.set('Ngày bắt đầu không được lớn hơn ngày kết thúc.');
      return;
    }

    // Gọi tải dữ liệu thật theo khoảng ngày vừa chọn
    this.loadRealRevenue();
  }

  calculateRevenueTotals(data: RevenueData[]): void {
    const category = this.revenueFilter.category;

    const totals = data.reduce(
      (result, item) => {
        let revenue = item.revenue;
        let cost = item.cost;
        let profit = item.profit;

        if (category === 'service') {
          revenue = item.serviceRevenue;
          cost = Math.round(item.serviceRevenue * 0.45);
          profit = revenue - cost;
        }

        if (category === 'product') {
          revenue = item.productRevenue;
          cost = Math.round(item.productRevenue * 0.65);
          profit = revenue - cost;
        }

        result.orders += item.successOrders;
        result.discount += item.discount;
        result.revenue += revenue;
        result.cost += cost;
        result.profit += profit;

        return result;
      },
      {
        orders: 0,
        discount: 0,
        revenue: 0,
        cost: 0,
        profit: 0,
      } as RevenueTotals
    );

    this.revenueTotals.set(totals);
  }

  updateRevenueChart(data: RevenueData[]): void {
    const category = this.revenueFilter.category;

    const labels = data.map((item) => this.formatDateLabel(item.date));
    const serviceData = data.map((item) => item.serviceRevenue);
    const productData = data.map((item) => item.productRevenue);
    const profitData = data.map((item) => item.profit);

    const datasets: any[] = [];

    if (category === 'all' || category === 'service') {
      datasets.push({
        type: 'bar',
        label: 'Doanh thu dịch vụ',
        data: serviceData,
        backgroundColor: '#7CA4EC',
        borderRadius: 2,
        stack: 'combined_revenue',
      });
    }

    if (category === 'all' || category === 'product') {
      datasets.push({
        type: 'bar',
        label: 'Doanh thu sản phẩm',
        data: productData,
        backgroundColor: '#6BC8A0',
        borderRadius: 2,
        stack: 'combined_revenue',
      });
    }

    datasets.push({
      type: 'line',
      label: 'Lợi nhuận',
      data: profitData,
      borderColor: '#F6C065',
      backgroundColor: '#F59E0B',
      pointBackgroundColor: '#F59E0B',
      pointRadius: 3,
      pointHoverRadius: 5,
      borderWidth: 2,
      tension: 0.2,
      fill: false,
    });

    this.revenueChartData = {
      labels: [...labels],
      datasets: [...datasets],
    };

    setTimeout(() => {
      this.chart?.update();
    });
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('vi-VN').format(value);
  }

  formatChartAxis(value: number): string {
    if (value >= 1000000) return `${(value / 1000000).toFixed(0)}tr`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
    return value.toString();
  }

  formatDateISO(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  formatDateLabel(date: string): string {
    const [, month, day] = date.split('-');
    return `${day}/${month}`;
  }

  randomNumber(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}