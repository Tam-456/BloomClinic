import { Component, OnInit, signal, computed } from '@angular/core';
import { Product } from '../../../shared/interfaces/product.interface';
import { Service } from '../../../shared/interfaces/service.interface';
import { InvoiceItem } from '../../../shared/interfaces/invoice.interface';
import { ConfirmDialogService } from '../../../shared/services/confirm-dialog';
import { AdminPosService } from '../../../shared/services/admin-pos';
import { HttpClient } from '@angular/common/http';

export interface PosProduct extends Product {
  soldCount?: number;
}

export interface PosServiceItem extends Service {
  soldCount?: number;
  serviceType?: 'single' | 'package';
  customId?: string;
}

export interface DraftOrder {
  id: string;
  customerName: string;
  customerPhone?: string;
  items: InvoiceItem[];
  totalAmount: number;
  discountAmount: number;
  depositDeduction: number;
  finalAmount: number;
  paymentMethod: string;
  createdAt: string;
}

export interface AuditLog {
  actionBy: string;
  actionAt: string;
  reason: string;
  detail?: string;
}

export interface DebtRepayment {
  repayId: string;
  amount: number;
  paymentMethod: 'cash' | 'banking';
  paidAt: string;
  collectorName: string;
  note?: string;
}

export interface DepositReceipt {
  depositId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  amount: number;
  paymentMethod: 'cash' | 'banking';
  collectorName: string;
  createdAt: string;
  note: string;
}

export interface PosInvoice {
  id: string;
  _id?: string;
  customerId: string;
  customerName: string;
  customerPhone?: string;
  customerTier: 'Standard' | 'Silver' | 'Gold' | 'Diamond' | 'walkin';
  cashierName: string;
  items: InvoiceItem[];
  totalAmount: number;
  discountAmount: number;
  depositDeduction: number;
  finalAmount: number;
  paidAmount: number;
  debtAmount: number;
  payment_status: 'unpaid' | 'partial' | 'paid';
  due_status: 'in_term' | 'due_today' | 'overdue';
  debtStatus: 'paid' | 'partial';
  dueDate?: string;
  debtRepayments?: DebtRepayment[];
  paymentMethod: 'cash' | 'banking' | 'card' | 'prepaid_wallet';
  createdAt: string;
  shift: 'morning' | 'afternoon';
  status: 'normal' | 'edited' | 'deleted' | 'exported';
  exportedAt?: string;
  retentionExpiresAt?: string;
  editAudit?: AuditLog;
  deleteAudit?: AuditLog;
  managerOverride?: {
    approvedBy: string;
    reason: string;
    approvedAt: string;
  };
}

@Component({
  selector: 'app-admin-pos',
  standalone: false,
  templateUrl: './admin-pos.html',
  styleUrl: './admin-pos.scss',
})
export class AdminPos implements OnInit {
  currentView = signal<'main' | 'drafts' | 'invoices'>('main');

  products = signal<PosProduct[]>([]);
  services = signal<PosServiceItem[]>([]);
  cartItems = signal<InvoiceItem[]>([]);

  // Hạn mức và thời hạn thanh toán theo từng hạng hội viên
  tierPolicies: Record<string, { debtLimit: number; dueDays: number }> = {
    walkin: { debtLimit: 0, dueDays: 0 },
    Standard: { debtLimit: 0, dueDays: 0 },
    Silver: { debtLimit: 5000000, dueDays: 7 },
    Gold: { debtLimit: 15000000, dueDays: 14 },
    Diamond: { debtLimit: 30000000, dueDays: 30 },
  };

  staffDirectory = signal<string[]>([
    'Thu Ngân - Quầy POS',
    'Quản Lý Điều Hành',
    'BS. Lê Thị Mai',
    'Kỹ thuật viên phụ trách'
  ]);

  serviceSearch = signal<string>('');
  serviceTypeFilter = signal<'all' | 'single' | 'package'>('all');
  productSearch = signal<string>('');

  // =========================
  // PHÂN TRANG (PAGINATION)
  // =========================
  servicePage = signal<number>(1);
  productPage = signal<number>(1);
  readonly pageSize = 24;

  customerType = signal<'registered' | 'walkin'>('registered');

  selectedCustomerId = signal<string>('');
  selectedCustomerName = signal<string>('Chưa chọn khách hàng');
  selectedCustomerPhone = signal<string>('');
  selectedCustomerTier = signal<'Standard' | 'Silver' | 'Gold' | 'Diamond' | 'walkin'>('Standard');
  customerWallet = signal<number>(0);
  customerDeposit = signal<number>(0);

  customerDirectory = signal<any[]>([]);
  customerSearchKeyword = signal<string>('');

  draftOrders = signal<DraftOrder[]>([]);

  // Thanh toán & Tiền cọc
  discountAmount = signal<number>(0);
  depositDeduction = signal<number>(0);
  paidAmount = signal<number>(0);
  paymentMethod = signal<'cash' | 'banking' | 'card' | 'prepaid_wallet'>('cash');
  currentCashier = signal<string>('Thu Ngân - Quầy POS');
  message = signal<string>('');

  // =========================
  // XÁC THỰC NGOẠI LỆ QUẢN LÝ (MANAGER OVERRIDE)
  // =========================
  isManagerOverrideOpen = signal<boolean>(false);
  overrideData = {
    managerName: 'Quản Lý Điều Hành',
    pin: '',
    reason: 'Khách hàng VIP bảo lãnh ghi nợ vượt hạn mức',
    pendingDebt: 0
  };

  // Thu cọc mới
  isCreateDepositModalOpen = signal<boolean>(false);
  createDepositForm = {
    amount: 500000,
    paymentMethod: 'banking' as 'cash' | 'banking',
    collectorName: 'Thu Ngân - Quầy POS',
    note: '',
  };
  depositReceipts = signal<DepositReceipt[]>([]);

  // Quản lý hóa đơn
  invoices = signal<PosInvoice[]>([]);
  invoiceFilterDate = signal<string>(new Date().toISOString().substring(0, 10));
  invoiceFilterShift = signal<'all' | 'morning' | 'afternoon'>('all');
  invoiceFilterCashier = signal<string>('all');
  invoiceFilterPayment = signal<string>('all');
  invoiceFilterStatus = signal<'all' | 'exported' | 'edited' | 'deleted'>('all');
  invoiceFilterDebt = signal<'all' | 'debt_only' | 'overdue_only' | 'paid_only'>('all');

  isEditInvoiceModalOpen = signal<boolean>(false);
  editingInvoice = signal<PosInvoice | null>(null);
  editForm = {
    modifierName: 'Thu Ngân - Quầy POS',
    reasonPreset: 'Tính sai chiết khấu',
    customReason: '',
    discountAmount: 0,
    paymentMethod: 'cash' as 'cash' | 'banking' | 'card' | 'prepaid_wallet',
  };

  isDeleteInvoiceModalOpen = signal<boolean>(false);
  deletingInvoice = signal<PosInvoice | null>(null);
  deleteForm = {
    modifierName: 'Thu Ngân - Quầy POS',
    reasonPreset: 'Khách hàng hoàn trả hàng và hủy giao dịch',
    customReason: '',
  };

  isCollectDebtModalOpen = signal<boolean>(false);
  collectingInvoice = signal<PosInvoice | null>(null);
  collectDebtForm = {
    repayAmount: 0,
    paymentMethod: 'cash' as 'cash' | 'banking',
    collectorName: 'Thu Ngân - Quầy POS',
    note: '',
  };

  // =========================
  // LỌC, TÌM KIẾM VÀ PHÂN TRANG DỊCH VỤ
  // =========================
  filteredServices = computed(() => {
    const kw = this.serviceSearch().toLowerCase().trim();
    const type = this.serviceTypeFilter();

    return this.services().filter((s: any) => {
      const matchKeyword =
        !kw ||
        (s.serviceName || '').toLowerCase().includes(kw) ||
        (s.customId || '').toLowerCase().includes(kw);

      let matchType = true;

      if (type === 'single') {
        matchType =
          s.serviceType === 'single' ||
          s.itemType === 'single' ||
          !s.isPackage;
      } else if (type === 'package') {
        matchType =
          s.serviceType === 'package' ||
          s.itemType === 'package' ||
          s.isPackage;
      }

      return matchKeyword && matchType;
    });
  });

  pagedServices = computed(() => {
    const startIndex = (this.servicePage() - 1) * this.pageSize;
    return this.filteredServices().slice(
      startIndex,
      startIndex + this.pageSize
    );
  });

  totalServicePages = computed(() => {
    return Math.ceil(this.filteredServices().length / this.pageSize) || 1;
  });

  // =========================
  // LỌC, TÌM KIẾM VÀ PHÂN TRANG SẢN PHẨM
  // =========================
  filteredProducts = computed(() => {
    const kw = this.productSearch().toLowerCase().trim();

    return this.products().filter((p: any) => {
      return (
        !kw ||
        (p.productName || '').toLowerCase().includes(kw) ||
        (p.productCode || '').toLowerCase().includes(kw)
      );
    });
  });

  pagedProducts = computed(() => {
    const startIndex = (this.productPage() - 1) * this.pageSize;
    return this.filteredProducts().slice(
      startIndex,
      startIndex + this.pageSize
    );
  });

  totalProductPages = computed(() => {
    return Math.ceil(this.filteredProducts().length / this.pageSize) || 1;
  });

  setServicePage(page: number): void {
    if (page >= 1 && page <= this.totalServicePages()) {
      this.servicePage.set(page);
    }
  }

  setProductPage(page: number): void {
    if (page >= 1 && page <= this.totalProductPages()) {
      this.productPage.set(page);
    }
  }

  bestSellerServices = computed(() => {
    return [...this.services()]
      .sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0))
      .slice(0, 3);
  });

  bestSellerProducts = computed(() => {
    return [...this.products()]
      .sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0))
      .slice(0, 3);
  });

  searchedCustomers = computed(() => {
    const kw = this.customerSearchKeyword().toLowerCase().trim();
    if (!kw) {
      return [];
    }

    return this.customerDirectory().filter((c) => {
      const matchName = (c.name || '').toLowerCase().includes(kw);
      const matchPhone = (c.phone || '').includes(kw);
      const matchCode = (c.customId || '').toLowerCase().includes(kw);
      return matchName || matchPhone || matchCode;
    });
  });

  totalAmount = computed(() =>
    this.cartItems().reduce((sum, item) => sum + item.amount, 0)
  );

  finalAmount = computed(() =>
    Math.max(0, this.totalAmount() - this.discountAmount() - this.depositDeduction())
  );

  debtAmount = computed(() =>
    Math.max(0, this.finalAmount() - this.paidAmount())
  );

  // Tính toán trạng thái dư nợ khả dụng của khách hàng
  customerCreditInfo = computed(() => {
    const isWalkin = this.customerType() === 'walkin';
    const tier = isWalkin ? 'walkin' : this.selectedCustomerTier();
    const policy = this.tierPolicies[tier] || { debtLimit: 0, dueDays: 0 };
    const custId = isWalkin ? 'walkin' : this.selectedCustomerId();

    const activeInvoices = this.invoices().filter(
      (inv) => inv.customerId === custId && inv.status !== 'deleted' && inv.debtAmount > 0
    );

    const currentTotalDebt = activeInvoices.reduce(
      (sum, inv) => sum + inv.debtAmount,
      0
    );

    const availableCredit = Math.max(0, policy.debtLimit - currentTotalDebt);
    const todayStr = new Date().toISOString().substring(0, 10);

    const hasOverdueDebt = activeInvoices.some(
      (inv) => inv.dueDate && inv.dueDate < todayStr
    );

    return {
      tier,
      debtLimit: policy.debtLimit,
      dueDays: policy.dueDays,
      currentTotalDebt,
      availableCredit,
      hasOverdueDebt,
    };
  });

  filteredInvoices = computed(() => {
    const filterDate = this.invoiceFilterDate();
    const shift = this.invoiceFilterShift();
    const cashier = this.invoiceFilterCashier();
    const payment = this.invoiceFilterPayment();
    const status = this.invoiceFilterStatus();
    const debtFilter = this.invoiceFilterDebt();
    const todayStr = new Date().toISOString().substring(0, 10);

    const filtered = this.invoices().filter((inv) => {
      // 1. So khớp ngày linh hoạt (hỗ trợ cả ISO '2026-11-10T...' và format '2026-11-10 14:30:00')
      let matchDate = true;
      if (filterDate) {
        const invDateStr = (inv.createdAt || '').substring(0, 10);
        matchDate = invDateStr === filterDate;
      }

      // 2. So khớp ca trực
      const matchShift = shift === 'all' || inv.shift === shift;

      // 3. So khớp thu ngân
      const matchCashier =
        cashier === 'all' || (inv.cashierName || '').includes(cashier);

      // 4. So khớp phương thức thanh toán
      const matchPayment = payment === 'all' || inv.paymentMethod === payment;

      // 5. So khớp trạng thái hóa đơn
      let matchStatus = true;
      if (status !== 'all') {
        matchStatus = inv.status === status;
      }

      // 6. So khớp công nợ
      let matchDebt = true;
      if (debtFilter === 'debt_only') {
        matchDebt = Number(inv.debtAmount) > 0;
      } else if (debtFilter === 'overdue_only') {
        matchDebt =
          Number(inv.debtAmount) > 0 &&
          !!inv.dueDate &&
          inv.dueDate < todayStr;
      } else if (debtFilter === 'paid_only') {
        matchDebt = Number(inv.debtAmount) === 0;
      }

      return (
        matchDate &&
        matchShift &&
        matchCashier &&
        matchPayment &&
        matchStatus &&
        matchDebt
      );
    });

    // Sắp xếp đưa hóa đơn mới tạo lên đầu tiên
    return [...filtered].sort((a, b) => {
      if (a.status === 'deleted' && b.status !== 'deleted') return 1;
      if (a.status !== 'deleted' && b.status === 'deleted') return -1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  });

  // Doanh thu chỉ được ghi nhận từ các hóa đơn ĐÃ XUẤT (status === 'exported')
  // Chỉ cộng tiền thực trả của những đơn CÓ STATUS LÀ 'exported'
  recognizedRevenue = computed(() => {
    return this.invoices()
      .filter((inv) => inv.status === 'exported')
      .reduce((sum, inv) => sum + (Number(inv.paidAmount) || 0), 0);
  });

  // Đếm số lượng hóa đơn được lập trong ngày hôm nay
todayInvoicesCount = computed(() => {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  
  const todayIso = `${yyyy}-${mm}-${dd}`;       // Dạng YYYY-MM-DD
  const todayVn = `${dd}/${mm}/${yyyy}`;        // Dạng DD/MM/YYYY

  return this.invoices().filter((inv) => {
    if (!inv.createdAt) return false;
    // Kiểm tra khớp cả 2 định dạng ngày phổ biến (YYYY-MM-DD hoặc DD/MM/YYYY)
    return inv.createdAt.includes(todayIso) || inv.createdAt.includes(todayVn);
  }).length;
});

  constructor(
    private posService: AdminPosService,
    private confirmDialog: ConfirmDialogService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.loadCatalog();
    this.loadInvoices();
    this.loadCustomers();

    const initDepositStr = sessionStorage.getItem('pos_init_deposit_order');
    if (initDepositStr) {
      try {
        const orderData = JSON.parse(initDepositStr);
        sessionStorage.removeItem('pos_init_deposit_order');

        if (orderData.customerId && orderData.customerName && orderData.item) {
          this.customerType.set('registered');
          this.selectedCustomerId.set(orderData.customerId);
          this.selectedCustomerName.set(orderData.customerName);
          this.selectedCustomerPhone.set(orderData.customerPhone || '');
          this.selectedCustomerTier.set(orderData.customerTier || 'Standard');

          const depositAmount = Math.max(
            0,
            Number(orderData.depositAmount) || 0
          );

          this.customerDeposit.set(depositAmount);
          this.cartItems.set([orderData.item]);

          const itemAmount = Number(orderData.item.amount) || 0;
          const maxDeduction = Math.min(depositAmount, itemAmount);

          this.depositDeduction.set(maxDeduction);
          this.paidAmount.set(this.finalAmount());
          this.paymentMethod.set('cash');

          this.message.set(
            `Đã nạp thông tin cọc [${orderData.depositId}] của khách ${orderData.customerName} vào quầy.`
          );
        }
      } catch (error) {
        console.error('Lỗi khi nạp thông tin đặt cọc:', error);
      }
    }

    const urlParams = new URLSearchParams(window.location.search);
    const targetView = urlParams.get('view');
    const targetFilter = urlParams.get('filter');

    if (targetView === 'invoices') {
      this.switchView('invoices');

      if (targetFilter === 'debt_only') {
        this.invoiceFilterDebt.set('debt_only');
      } else if (targetFilter === 'overdue_only') {
        this.invoiceFilterDebt.set('overdue_only');
      } else if (targetFilter === 'paid_only') {
        this.invoiceFilterDebt.set('paid_only');
      }
    }
  }

  loadCatalog(): void {
    this.posService.getCatalogForPos().subscribe({
      next: (res: any) => {
        const data = res?.data || res;
        if (data) {
          this.services.set(data.services || []);
          this.products.set(data.products || []);
        }
      },
      error: (err) => console.error('Lỗi tải Catalog POS:', err)
    });
  }

  loadInvoices(): void {
    this.http.get<any>('/api/admin/invoices').subscribe({
      next: (res) => {
        const list = res?.data || res || [];
        const formatted: PosInvoice[] = list.map((inv: any) => {
          const debt = Number(inv.debtAmount) || Math.max(0, (Number(inv.finalAmount) || Number(inv.totalAmount) || 0) - (Number(inv.paidAmount) || 0));
          const paid = Number(inv.paidAmount) || 0;
          const finalAmt = Number(inv.finalAmount) || Number(inv.totalAmount) || 0;

          return {
            id: inv.invoiceCode || inv.id || inv._id,
            _id: inv._id,
            customerId: inv.customerId?._id || inv.customerId || 'walkin',
            customerName: inv.customerName || inv.customerId?.fullName || 'Khách vãng lai',
            customerPhone: inv.customerPhone || inv.customerId?.phone || '',
            customerTier: inv.customerTier || inv.customerId?.membershipTier || 'walkin',
            cashierName: inv.cashierName || 'Thu Ngân - Quầy POS',
            items: inv.items || [],
            totalAmount: Number(inv.totalAmount) || finalAmt,
            discountAmount: Number(inv.discountAmount) || 0,
            depositDeduction: Number(inv.depositDeduction) || 0,
            finalAmount: finalAmt,
            paidAmount: paid,
            debtAmount: debt,
            payment_status: paid === 0 ? 'unpaid' : debt > 0 ? 'partial' : 'paid',
            due_status: inv.due_status || 'in_term',
            debtStatus: debt > 0 ? 'partial' : 'paid',
            dueDate: inv.dueDate ? String(inv.dueDate).substring(0, 10) : undefined,
            paymentMethod: inv.paymentMethod || 'cash',
            createdAt: inv.createdAt ? new Date(inv.createdAt).toISOString().replace('T', ' ').substring(0, 19) : this.getCurrentFormattedTime(),
            shift: inv.shift || this.getCurrentShift(),
            status: inv.status || 'normal', // 'normal' | 'exported' | 'edited' | 'deleted'
            exportedAt: inv.exportedAt,
            retentionExpiresAt: inv.retentionExpiresAt,
            editAudit: inv.editAudit,
            deleteAudit: inv.deleteAudit,
            managerOverride: inv.managerOverride,
            debtRepayments: inv.debtRepayments || []
          };
        });

        this.invoices.set(formatted);
      },
      error: (err) => {
        console.error('Lỗi tải danh sách hóa đơn POS:', err);
      }
    });
  }

  loadCustomers(): void {
    this.http.get<any>('/api/admin/customers').subscribe({
      next: (res) => {
        const list = res?.data || res || [];
        const formatted = list.map((c: any, index: number) => ({
          id: c._id,
          _id: c._id,
          customId: c.customId || c.customerCode || `C${String(index + 1).padStart(3, '0')}`,
          name: c.fullName,
          phone: c.phone || '',
          tier: c.membershipTier || 'Standard',
          wallet: Number(c.prepaidBalance) || 0,
          deposit: Number(c.depositAmount) || 0
        }));
        this.customerDirectory.set(formatted);
      },
      error: (err) => {
        console.error('Lỗi tải danh sách khách hàng cho POS:', err);
      }
    });
  }

  switchView(view: 'main' | 'drafts' | 'invoices'): void {
    this.currentView.set(view);
  }

  selectCustomer(cust: any): void {
    this.selectedCustomerId.set(cust.id || cust._id);
    this.selectedCustomerName.set(cust.name || cust.fullName);
    this.selectedCustomerPhone.set(cust.phone || '');
    this.selectedCustomerTier.set(cust.tier || cust.membershipTier || 'Standard');
    this.customerWallet.set(cust.wallet ?? cust.prepaidBalance ?? 0);
    this.customerDeposit.set(cust.deposit || 0);
    this.depositDeduction.set(0);
    this.customerSearchKeyword.set('');
    this.paidAmount.set(this.finalAmount());
  }

  onCustomerTypeChange(type: 'registered' | 'walkin'): void {
    this.customerType.set(type);

    if (type === 'walkin') {
      this.selectedCustomerId.set('walkin');
      this.selectedCustomerName.set('Khách vãng lai');
      this.selectedCustomerPhone.set('');
      this.selectedCustomerTier.set('walkin');
      this.customerWallet.set(0);
      this.customerDeposit.set(0);
      this.depositDeduction.set(0);

      if (this.paymentMethod() === 'prepaid_wallet') {
        this.paymentMethod.set('cash');
      }
    } else {
      const list = this.customerDirectory();
      if (list && list.length > 0) {
        this.selectCustomer(list[0]);
      } else {
        this.selectedCustomerId.set('');
        this.selectedCustomerName.set('Chưa chọn khách hàng');
        this.selectedCustomerPhone.set('');
        this.selectedCustomerTier.set('Standard');
        this.customerWallet.set(0);
        this.customerDeposit.set(0);
        this.depositDeduction.set(0);
      }
    }

    this.paidAmount.set(this.finalAmount());
  }

  onDepositDeductionChange(amount: number): void {
    const maxApplicable = Math.min(
      this.customerDeposit(),
      Math.max(0, this.totalAmount() - this.discountAmount())
    );

    const validAmount = Math.max(0, Math.min(amount, maxApplicable));
    this.depositDeduction.set(validAmount);
    this.paidAmount.set(this.finalAmount());
  }

  addItemToCart(item: any, type: 'product' | 'service'): void {
    const current = this.cartItems();
    const itemId = item._id as string;
    const name = type === 'product' ? item.productName : item.serviceName;
    const price = item.price as number;

    const existingIndex = current.findIndex(
      (i) => i.itemId === itemId && i.type === type
    );

    if (existingIndex > -1) {
      const updated = [...current];
      updated[existingIndex].quantity += 1;
      updated[existingIndex].amount =
        updated[existingIndex].quantity * updated[existingIndex].unitPrice;
      this.cartItems.set(updated);
    } else {
      this.cartItems.set([
        ...current,
        { itemId, name, type, quantity: 1, unitPrice: price, amount: price },
      ]);
    }

    this.paidAmount.set(this.finalAmount());
  }

  changeQuantity(index: number, delta: number): void {
    const updated = [...this.cartItems()];
    updated[index].quantity += delta;

    if (updated[index].quantity <= 0) {
      updated.splice(index, 1);
    } else {
      updated[index].amount =
        updated[index].quantity * updated[index].unitPrice;
    }

    this.cartItems.set(updated);
    this.paidAmount.set(this.finalAmount());
  }

  clearAll(): void {
    this.confirmDialog.confirm({
      title: 'Xóa trắng toàn bộ đơn',
      message:
        'Bạn có chắc chắn muốn xóa toàn bộ giỏ hàng, thông tin khách và số tiền đã nhập để bắt đầu đơn mới?',
      confirmText: 'Xóa trắng',
      type: 'warning',
      action: () => {
        this.cartItems.set([]);
        this.discountAmount.set(0);
        this.depositDeduction.set(0);
        this.paidAmount.set(0);
        this.onCustomerTypeChange('registered');
        this.message.set('Đã làm mới quầy thu ngân!');
      },
    });
  }

  saveDraft(): void {
    if (this.cartItems().length === 0) {
      alert('Giỏ hàng trống!');
      return;
    }

    const draft: DraftOrder = {
      id: 'DRAFT-' + Date.now().toString().slice(-4),
      customerName: this.selectedCustomerName(),
      customerPhone: this.selectedCustomerPhone(),
      items: [...this.cartItems()],
      totalAmount: this.totalAmount(),
      discountAmount: this.discountAmount(),
      depositDeduction: this.depositDeduction(),
      finalAmount: this.finalAmount(),
      paymentMethod: this.paymentMethod(),
      createdAt: new Date().toLocaleTimeString(),
    };

    this.draftOrders.update((d) => [draft, ...d]);
    this.message.set(`Đã lưu đơn nháp [${draft.id}] thành công!`);

    this.cartItems.set([]);
    this.discountAmount.set(0);
    this.depositDeduction.set(0);
    this.paidAmount.set(0);
  }

  loadDraft(draft: DraftOrder): void {
    this.cartItems.set([...draft.items]);
    this.selectedCustomerName.set(draft.customerName);
    this.discountAmount.set(draft.discountAmount);
    this.depositDeduction.set(draft.depositDeduction || 0);
    this.paidAmount.set(draft.finalAmount);

    this.draftOrders.update((d) =>
      d.filter((item) => item.id !== draft.id)
    );

    this.switchView('main');
    this.message.set(`Đã nạp đơn nháp [${draft.id}] vào quầy xử lý.`);
  }

  deleteDraft(draftId: string): void {
    this.confirmDialog.confirm({
      title: 'Xóa đơn nháp',
      message: `Bạn muốn xóa đơn nháp [${draftId}]?`,
      confirmText: 'Xóa',
      type: 'danger',
      action: () => {
        this.draftOrders.update((d) =>
          d.filter((item) => item.id !== draftId)
        );
      },
    });
  }

  private getCurrentFormattedTime(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  
  const year = now.getFullYear();
  const month = pad(now.getMonth() + 1);
  const day = pad(now.getDate());
  const hours = pad(now.getHours());
  const minutes = pad(now.getMinutes());
  const seconds = pad(now.getSeconds());

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

  private getCurrentShift(): 'morning' | 'afternoon' {
    const hours = new Date().getHours();
    return hours >= 7 && hours < 13 ? 'morning' : 'afternoon';
  }

  private calculateDueDate(days: number): string {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().substring(0, 10);
  }

  // ================= TẠO PHIẾU THU CỌC =================
  openCreateDepositModal(): void {
    if (this.customerType() === 'walkin' || !this.selectedCustomerId()) {
      alert('Vui lòng chọn khách hàng đã đăng ký để lập phiếu thu tiền cọc!');
      return;
    }

    this.createDepositForm = {
      amount: 500000,
      paymentMethod: 'banking',
      collectorName: this.staffDirectory()[0],
      note: 'Khách đặt cọc giữ chỗ liệu trình',
    };

    this.isCreateDepositModalOpen.set(true);
  }

  closeCreateDepositModal(): void {
    this.isCreateDepositModalOpen.set(false);
  }

  submitCreateDeposit(): void {
    const amount = Number(this.createDepositForm.amount);
    if (isNaN(amount) || amount <= 0) {
      alert('Số tiền đặt cọc phải lớn hơn 0!');
      return;
    }

    const nowFormatted = this.getCurrentFormattedTime();
    const depositCode = 'COC-' + Date.now().toString().slice(-6);

    const receipt: DepositReceipt = {
      depositId: depositCode,
      customerId: this.selectedCustomerId(),
      customerName: this.selectedCustomerName(),
      customerPhone: this.selectedCustomerPhone(),
      amount: amount,
      paymentMethod: this.createDepositForm.paymentMethod,
      collectorName: this.createDepositForm.collectorName,
      createdAt: nowFormatted,
      note: this.createDepositForm.note,
    };

    this.customerDeposit.update((d) => d + amount);
    this.depositReceipts.update((list) => [receipt, ...list]);

    this.closeCreateDepositModal();
    this.message.set(`Lập phiếu thu cọc [${depositCode}] thành công!`);
    this.printDepositReceipt(receipt);
  }

  printDepositReceipt(rcp: DepositReceipt): void {
    const printWindow = window.open('', '_blank', 'width=420,height=550');
    if (!printWindow) return;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Phiếu Thu Tiền Cọc - ${rcp.depositId}</title>
        <style>
          @page { size: 80mm auto; margin: 0; }
          * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
          body { margin: 0; padding: 10px; width: 80mm; font-size: 11px; }
          .text-center { text-align: center; }
          .d-flex { display: flex; justify-content: space-between; margin-bottom: 4px; }
          .border-top { border-top: 1px dashed #94a3b8; padding-top: 6px; margin-top: 6px; }
        </style>
      </head>
      <body>
        <div class="text-center">
          <h3 style="margin: 0; font-size: 14px; color: #832746;">BLOOM BEAUTY & CLINIC</h3>
          <div style="color: #64748b;">Phòng Khám Chuyên Khoa Da Liễu</div>
          <h4 style="margin: 8px 0; font-size: 13px;">PHIẾU THU TIỀN ĐẶT CỌC</h4>
          <div>Mã: <strong>${rcp.depositId}</strong></div>
          <div style="color: #64748b;">Thời gian: ${rcp.createdAt}</div>
        </div>
        <hr style="border: 0; border-top: 1px dashed #cbd5e1; margin: 6px 0;">
        <div>Khách hàng: <strong>${rcp.customerName}</strong> (${rcp.customerPhone || 'N/A'})</div>
        <div>Người thu: ${rcp.collectorName}</div>
        <div>Phương thức: ${rcp.paymentMethod === 'cash' ? 'Tiền mặt' : 'Chuyển khoản'}</div>
        <div class="border-top d-flex" style="font-size: 13px; font-weight: bold; color: #832746;">
          <span>SỐ TIỀN CỌC:</span>
          <span>${rcp.amount.toLocaleString('vi-VN')} đ</span>
        </div>
        <div style="margin-top: 4px; color: #475569;">Ghi chú: ${rcp.note || 'Không có'}</div>
        <script>setTimeout(() => { window.print(); }, 200);</script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  }

  // ========================================================
  // XỬ LÝ THANH TOÁN (CHECKOUT) TÍCH HỢP ĐẦY ĐỦ QUY TẮC NỢ
  // ========================================================
  checkout(): void {
    if (this.cartItems().length === 0) {
      alert('Vui lòng chọn ít nhất 1 dịch vụ hoặc sản phẩm!');
      return;
    }

    const customerMustPay = this.finalAmount();
    const customerActualPaid = Number(this.paidAmount());
    const usedDeposit = Number(this.depositDeduction());

    if (isNaN(customerActualPaid) || customerActualPaid < 0) {
      alert('Số tiền khách trả không hợp lệ!');
      return;
    }

    const creditInfo = this.customerCreditInfo();
    const newDebt = Math.max(0, customerMustPay - customerActualPaid);

    // QUY TẮC 1: Không cho khách Standard / Walk-in ghi nợ
    if (newDebt > 0 && (creditInfo.tier === 'walkin' || creditInfo.tier === 'Standard')) {
      alert(
        `QUY TẮC TÀI CHÍNH: Khách hạng [${creditInfo.tier === 'walkin' ? 'Khách vãng lai' : 'Standard'}] bắt buộc phải thanh toán 100% trước khi rời quầy! Không được phép phát sinh công nợ.`
      );
      return;
    }

    // QUY TẮC 2: Không cho khách đang có nợ quá hạn tiếp tục ghi nợ
    if (newDebt > 0 && creditInfo.hasOverdueDebt) {
      alert(
        `KHÓA QUYỀN GHI NỢ: Khách hàng "${this.selectedCustomerName()}" đang có ít nhất một khoản nợ QUÁ HẠN chưa tất toán! Yêu cầu thanh toán dứt điểm nợ cũ trước khi mở giao dịch trả chậm mới.`
      );
      return;
    }

    // QUY TẮC 3: Nếu nợ mới vượt hạn mức khả dụng -> Yêu cầu Quản lý duyệt ngoại lệ PIN
    if (newDebt > creditInfo.availableCredit) {
      const excess = newDebt - creditInfo.availableCredit;
      const confirmOverride = confirm(
        `CẢNH BÁO HẠN MỨC TÍN DỤNG:\n` +
        `- Khoản nợ mới: ${newDebt.toLocaleString('vi-VN')} đ\n` +
        `- Hạn mức khả dụng còn lại: ${creditInfo.availableCredit.toLocaleString('vi-VN')} đ\n` +
        `- Vượt hạn mức: ${excess.toLocaleString('vi-VN')} đ\n\n` +
        `Bạn có muốn mở xác thực Quản lý (Manager Override PIN) để bảo lãnh duyệt ngoại lệ không?`
      );

      if (confirmOverride) {
        this.overrideData.pendingDebt = newDebt;
        this.overrideData.pin = '';
        this.isManagerOverrideOpen.set(true);
      }
      return;
    }

    if (this.paymentMethod() === 'prepaid_wallet' && customerActualPaid > this.customerWallet()) {
      alert('Số dư ví trả trước không đủ để thanh toán!');
      return;
    }

    // Xác nhận và thực hiện tạo hóa đơn thông thường
    let confirmMsg =
      `Xác nhận tạo đơn cho "${this.selectedCustomerName()}":\n` +
      `- Tổng tiền: ${this.totalAmount().toLocaleString('vi-VN')} đ\n` +
      `- Chiết khấu: ${this.discountAmount().toLocaleString('vi-VN')} đ\n`;

    if (usedDeposit > 0) {
      confirmMsg += `- Cấn trừ cọc: ${usedDeposit.toLocaleString('vi-VN')} đ\n`;
    }

    confirmMsg += `- Khách thực trả: ${customerActualPaid.toLocaleString('vi-VN')} đ\n`;

    if (newDebt > 0) {
      confirmMsg += `GHI NẬN CÔNG NỢ: ${newDebt.toLocaleString('vi-VN')} đ\n`;
    }

    this.confirmDialog.confirm({
      title: newDebt > 0 ? 'Xác nhận tạo đơn ghi nợ' : 'Xác nhận thanh toán',
      message: confirmMsg,
      confirmText: 'Xác nhận',
      type: newDebt > 0 ? 'warning' : 'primary',
      action: () => {
        this.executeCreateInvoice(newDebt);
      },
    });
  }

  // Phê duyệt ngoại lệ Quản lý bằng mã PIN
  confirmManagerOverride(): void {
    if (this.overrideData.pin !== 'BloomClinic@2026!') {
      alert('Mã PIN quản lý không chính xác! Không thể duyệt ngoại lệ.');
      return;
    }

    const overrideLog = {
      approvedBy: this.overrideData.managerName,
      reason: this.overrideData.reason || 'Bảo lãnh hạn mức nợ',
      approvedAt: this.getCurrentFormattedTime(),
    };

    this.isManagerOverrideOpen.set(false);
    this.overrideData.pin = '';

    // Sau khi duyệt thành công mới tiến hành tạo hóa đơn
    this.executeCreateInvoice(this.overrideData.pendingDebt, overrideLog);
  }

  // Hàm tạo hóa đơn và luân chuyển sang Tab Quản lý hóa đơn (Chưa tính doanh thu)
  private executeCreateInvoice(newDebt: number, overrideLog?: any): void {
    const customerMustPay = this.finalAmount();
    const customerActualPaid = Number(this.paidAmount());
    const usedDeposit = Number(this.depositDeduction());
    const creditInfo = this.customerCreditInfo();

    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const todayDateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    const nowFormatted = `${todayDateStr} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    const invoiceCode = `INV-${now.getFullYear()}${pad(now.getMonth() + 1)}-${String(Date.now()).slice(-4)}`;

    const dueDateStr = newDebt > 0
      ? this.calculateDueDate(creditInfo.dueDays)
      : undefined;

    // Chuẩn bị payload sạch để gửi lên Backend
    const payload = {
      invoiceCode: invoiceCode,
      customerId: this.customerType() === 'walkin' || this.selectedCustomerId() === 'walkin' ? null : this.selectedCustomerId(),
      customerName: this.selectedCustomerName(),
      customerPhone: this.selectedCustomerPhone(),
      customerTier: this.customerType() === 'walkin' ? 'walkin' : this.selectedCustomerTier(),
      cashierName: this.currentCashier(),
      items: this.cartItems().map(item => ({
        itemId: item.itemId,
        name: item.name,
        type: item.type,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        amount: item.amount
      })),
      totalAmount: this.totalAmount(),
      discountAmount: this.discountAmount(),
      depositDeduction: usedDeposit,
      finalAmount: customerMustPay,
      paidAmount: customerActualPaid,
      debtAmount: newDebt,
      paymentMethod: this.paymentMethod(),
      dueDate: dueDateStr,
      status: 'normal',
      managerOverride: overrideLog
    };

    // GỬI LƯU TRỰC TIẾP VÀO DATABASE
    this.http.post<any>('/api/admin/invoices', payload).subscribe({
      next: (res) => {
        console.log('✅ Đã lưu hóa đơn vào database thành công:', res);

        // Trừ ví và trừ cọc của khách hàng
        if (this.paymentMethod() === 'prepaid_wallet') {
          this.customerWallet.update((w) => Math.max(0, w - customerActualPaid));
        }
        if (usedDeposit > 0) {
          this.customerDeposit.update((d) => Math.max(0, d - usedDeposit));
        }

        // Tải lại toàn bộ hóa đơn từ Database để nhận đơn số 34 vĩnh viễn
        this.loadInvoices();

        // Xóa trắng giỏ hàng
        this.cartItems.set([]);
        this.discountAmount.set(0);
        this.depositDeduction.set(0);
        this.paidAmount.set(0);
        this.onCustomerTypeChange('registered');

        // Bỏ lọc ngày để luôn thấy ngay đơn mới
        this.invoiceFilterDate.set('');
        this.invoiceFilterStatus.set('all');
        this.invoiceFilterDebt.set('all');

        // Chuyển sang tab Hóa đơn
        this.switchView('invoices');
        this.message.set(`Đã lưu hóa đơn [${invoiceCode}] vào Database (Trạng thái: Chờ xuất)!`);
      },
      error: (err) => {
        console.error('Lỗi không thể lưu hóa đơn vào MongoDB:', err);
        alert(`Lỗi lưu database: ${err?.error?.message || 'Không thể kết nối máy chủ'}`);
      }
    });
  }

  // ========================================================
  // XUẤT HÓA ĐƠN K80 -> CHÍNH THỨC CHỐT VÀ GHI NHẬN DOANH THU
  // ========================================================
  printInvoice(inv: PosInvoice): void {
    if (inv.status === 'exported') {
      alert('Hóa đơn này đã được xuất và chốt doanh thu, không thể xuất lại!');
      return;
    }

    const printWindow = window.open('', '_blank', 'width=420,height=650');
    if (!printWindow) {
      alert('Trình duyệt đã chặn cửa sổ bật lên. Vui lòng cấp quyền mở popup để in hóa đơn!');
      return;
    }

    const itemsHtml = (inv.items || [])
      .map(
        (item: any) => `
        <tr>
          <td style="padding: 5px 2px; border-bottom: 1px dashed #cbd5e1;">${item.name}</td>
          <td style="padding: 5px 2px; text-align: center; border-bottom: 1px dashed #cbd5e1;">${item.quantity}</td>
          <td style="padding: 5px 2px; text-align: right; border-bottom: 1px dashed #cbd5e1;">${Number(item.unitPrice).toLocaleString('vi-VN')}</td>
          <td style="padding: 5px 2px; text-align: right; font-weight: bold; border-bottom: 1px dashed #cbd5e1;">${Number(item.amount).toLocaleString('vi-VN')}</td>
        </tr>`
      )
      .join('');

    const depositDeductionHtml = inv.depositDeduction > 0
      ? `<div class="d-flex" style="color: #0284c7;">
          <span>Cấn trừ tiền cọc:</span>
          <span>-${Number(inv.depositDeduction).toLocaleString('vi-VN')} đ</span>
        </div>`
      : '';

    const debtHtml = inv.debtAmount > 0
      ? `<div class="d-flex" style="color: #dc2626; font-weight: bold; margin-top: 2px;">
          <span>CÒN NỢ CÔNG NỢ:</span>
          <span>${Number(inv.debtAmount).toLocaleString('vi-VN')} đ</span>
        </div>
        <div class="d-flex" style="color: #ea580c; font-size: 10px;">
          <span>Hạn thanh toán nợ:</span>
          <span>${inv.dueDate || 'Thanh toán ngay'}</span>
        </div>`
      : '';

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="vi">
      <head>
        <meta charset="utf-8">
        <title>Hóa Đơn - ${inv.id}</title>
        <style>
          @page { size: 80mm auto; margin: 0; }
          * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
          body { margin: 0; padding: 8px 10px; width: 80mm; background: #ffffff; color: #0f172a; font-size: 11px; }
          .text-center { text-align: center; }
          .d-flex { display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px; }
          table { width: 100%; border-collapse: collapse; font-size: 11px; margin: 8px 0; }
          th { padding: 4px 2px; border-top: 1px solid #0f172a; border-bottom: 1px solid #0f172a; }
        </style>
      </head>
      <body>
        <div class="text-center">
          <h3 style="margin: 0; font-size: 15px; color: #832746;">BLOOM BEAUTY & CLINIC</h3>
          <h4 style="margin: 6px 0;">HÓA ĐƠN BÁN HÀNG</h4>
          <div>Mã HĐ: <strong>${inv.id}</strong></div>
          <div>Ngày: ${inv.createdAt}</div>
        </div>
        <hr style="border: 0; border-top: 1px dashed #94a3b8; margin: 6px 0;">
        <div>Khách hàng: <strong>${inv.customerName}</strong></div>
        <table>
          <thead>
            <tr><th style="text-align: left;">Mục</th><th style="text-align: center;">SL</th><th style="text-align: right;">Đơn giá</th><th style="text-align: right;">Tiền</th></tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
        </table>
        <div class="d-flex border-top" style="font-size: 13px; font-weight: bold; color: #832746; padding-top: 4px;">
          <span>THANH TOÁN:</span>
          <span>${Number(inv.finalAmount).toLocaleString('vi-VN')} đ</span>
        </div>
        <div class="d-flex">
          <span>Khách đã trả:</span>
          <strong>${Number(inv.paidAmount).toLocaleString('vi-VN')} đ</strong>
        </div>
        ${depositDeductionHtml}
        ${debtHtml}
        <script>setTimeout(function() { window.print(); }, 250);</script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();

    const nowTime = this.getCurrentFormattedTime();
    const expDate = new Date();
    expDate.setFullYear(expDate.getFullYear() + 5);
    const retention5Years = `${expDate.getFullYear()}-${String(expDate.getMonth() + 1).padStart(2, '0')}-${String(expDate.getDate()).padStart(2, '0')} ${String(expDate.getHours()).padStart(2, '0')}:${String(expDate.getMinutes()).padStart(2, '0')}:${String(expDate.getSeconds()).padStart(2, '0')}`;

    
const targetKey = inv._id || inv.id;

this.http.put<any>(
  `/api/admin/invoices/${targetKey}/export`,
  {
    exportedAt: new Date().toISOString(),
    retentionExpiresAt: retention5Years
  }
).subscribe({
  next: (res) => {
    // Chỉ cập nhật giao diện sau khi backend xác nhận thành công
    this.invoices.update((list) =>
      list.map((item) =>
        item.id === inv.id
          ? {
              ...item,
              status: 'exported',
              exportedAt: nowTime,
              retentionExpiresAt: retention5Years
            }
          : item
      )
    );

    // Tải lại hóa đơn và danh mục để cập nhật tồn kho mới
    this.loadInvoices();
    this.loadCatalog();

    this.message.set(
      res?.message || `Hóa đơn [${inv.id}] đã xuất thành công!`
    );
  },
  error: (err) => {
    console.error('Lỗi xuất hóa đơn:', err);

    // Không đánh dấu hóa đơn đã xuất nếu backend thất bại
    this.loadInvoices();

    alert(
      err?.error?.message ||
      'Không thể xuất hóa đơn. Vui lòng kiểm tra lại tồn kho!'
    );
  }
});
  }

  // ================= SỬA / XÓA HÓA ĐƠN =================
  openEditInvoiceModal(inv: PosInvoice): void {
    if (inv.status === 'exported') {
      alert('Hóa đơn đã xuất và ghi nhận doanh thu, không thể chỉnh sửa!');
      return;
    }

    this.editingInvoice.set(inv);

    this.editForm = {
      modifierName: this.staffDirectory()[0],
      reasonPreset: 'Tính sai chiết khấu',
      customReason: '',
      discountAmount: inv.discountAmount,
      paymentMethod: inv.paymentMethod,
    };

    this.isEditInvoiceModalOpen.set(true);
  }

  closeEditInvoiceModal(): void {
    this.isEditInvoiceModalOpen.set(false);
    this.editingInvoice.set(null);
  }

  submitEditInvoice(): void {
    const inv = this.editingInvoice();
    if (!inv) return;

    const finalReason =
      this.editForm.reasonPreset === 'Khác'
        ? this.editForm.customReason.trim()
        : this.editForm.reasonPreset;

    if (!finalReason) {
      alert('Vui lòng cung cấp lý do sửa đổi!');
      return;
    }

    const updatedFinal = Math.max(
      0,
      inv.totalAmount -
        Number(this.editForm.discountAmount) -
        inv.depositDeduction
    );

    const newDebt = Math.max(0, updatedFinal - inv.paidAmount);

    this.invoices.update((list) =>
      list.map((item) =>
        item.id === inv.id
          ? {
              ...item,
              discountAmount: Number(this.editForm.discountAmount),
              finalAmount: updatedFinal,
              debtAmount: newDebt,
              debtStatus: newDebt === 0 ? 'paid' : 'partial',
              paymentMethod: this.editForm.paymentMethod,
              status: 'edited',
              editAudit: {
                actionBy: this.editForm.modifierName,
                actionAt: this.getCurrentFormattedTime(),
                reason: finalReason
              }
            }
          : item
      )
    );

    this.closeEditInvoiceModal();
  }

  openDeleteInvoiceModal(inv: PosInvoice): void {
    if (inv.status === 'exported') {
      alert('Hóa đơn đã xuất và ghi nhận doanh thu, không thể xóa!');
      return;
    }

    this.deletingInvoice.set(inv);

    this.deleteForm = {
      modifierName: this.staffDirectory()[0],
      reasonPreset: 'Khách hàng hoàn trả hàng và hủy giao dịch',
      customReason: '',
    };

    this.isDeleteInvoiceModalOpen.set(true);
  }

  closeDeleteInvoiceModal(): void {
    this.isDeleteInvoiceModalOpen.set(false);
    this.deletingInvoice.set(null);
  }

  submitDeleteInvoice(): void {
    const inv = this.deletingInvoice();
    if (!inv) return;

    const finalReason =
      this.deleteForm.reasonPreset === 'Khác'
        ? this.deleteForm.customReason.trim()
        : this.deleteForm.reasonPreset;

    if (!finalReason) {
      alert('Vui lòng cung cấp lý do hủy hóa đơn!');
      return;
    }

    if (inv.depositDeduction > 0) {
      this.customerDeposit.update((d) => d + inv.depositDeduction);
      this.customerDirectory.update((list) =>
        list.map((c) =>
          c.id === inv.customerId ? { ...c, deposit: (c.deposit || 0) + inv.depositDeduction } : c
        )
      );
    }

    this.invoices.update((list) =>
      list.map((item) =>
        item.id === inv.id
          ? {
              ...item,
              status: 'deleted',
              deleteAudit: {
                actionBy: this.deleteForm.modifierName,
                actionAt: this.getCurrentFormattedTime(),
                reason: finalReason
              }
            }
          : item
      )
    );

    this.closeDeleteInvoiceModal();
  }

  // ================= THU HỒI CÔNG NỢ =================
  openCollectDebtModal(inv: PosInvoice): void {
    this.collectingInvoice.set(inv);

    this.collectDebtForm = {
      repayAmount: inv.debtAmount,
      paymentMethod: 'cash',
      collectorName: this.staffDirectory()[0],
      note: 'Thu nợ tiền liệu trình đợt tiếp theo',
    };

    this.isCollectDebtModalOpen.set(true);
  }

  closeCollectDebtModal(): void {
    this.isCollectDebtModalOpen.set(false);
    this.collectingInvoice.set(null);
  }

  submitCollectDebt(): void {
    const inv = this.collectingInvoice();
    if (!inv) return;

    const amount = Number(this.collectDebtForm.repayAmount);

    if (isNaN(amount) || amount <= 0 || amount > inv.debtAmount) {
      alert(`Số tiền thu nợ không hợp lệ!`);
      return;
    }

    const newDebt = inv.debtAmount - amount;
    const newPaid = inv.paidAmount + amount;

    const newRepayment: DebtRepayment = {
      repayId: 'REPAY-' + Date.now().toString().slice(-4),
      amount: amount,
      paymentMethod: this.collectDebtForm.paymentMethod,
      paidAt: this.getCurrentFormattedTime(),
      collectorName: this.collectDebtForm.collectorName,
      note: this.collectDebtForm.note,
    };

    this.invoices.update((list) =>
      list.map((item) =>
        item.id === inv.id
          ? {
              ...item,
              paidAmount: newPaid,
              debtAmount: newDebt,
              debtStatus: newDebt === 0 ? 'paid' : 'partial',
              payment_status: newDebt === 0 ? 'paid' : 'partial',
              debtRepayments: [
                ...(item.debtRepayments || []),
                newRepayment
              ]
            }
          : item
      )
    );

    this.closeCollectDebtModal();
  }
}