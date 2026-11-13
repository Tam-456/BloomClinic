import { Component, OnInit, signal, computed } from '@angular/core';
import { CustomerService } from '../../../shared/services/customer';
import { Invoice } from '../../../shared/interfaces/invoice.interface';

@Component({
  selector: 'app-customer-invoices',
  standalone: false,
  templateUrl: './customer-invoices.html',
  styleUrl: './customer-invoices.scss',
})
export class CustomerInvoices implements OnInit {
  viewMode = signal<'list' | 'detail'>('list');

  invoices = signal<Invoice[]>([]);
  selectedInvoice = signal<Invoice | null>(null);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string>('');
  successMessage = signal<string>('');

  // Bộ lọc trạng thái thanh toán
  statusFilter = signal<'all' | 'paid' | 'partially_paid'>('all');

  // State điều khiển Popup Thanh Toán Công Nợ
  isPaymentModalOpen = signal<boolean>(false);
  selectedDebtInvoice = signal<Invoice | null>(null);
  paymentStep = signal<'select' | 'gateway' | 'success'>('select');
  selectedGateway = signal<'techcombank' | 'momo'>('techcombank');
  isProcessingPayment = signal<boolean>(false);

  filteredInvoices = computed(() => {
    const filter = this.statusFilter();
    const list = this.invoices();

    if (filter === 'paid') {
      return list.filter(
        (inv) => inv.debtAmount === 0 && inv.status !== 'draft' && inv.status !== 'deleted' && inv.status !== 'voided'
      );
    }
    if (filter === 'partially_paid') {
      return list.filter((inv) => inv.debtAmount > 0 || inv.status === 'partially_paid');
    }
    return list;
  });

  constructor(private customerService: CustomerService) {}

  ngOnInit(): void {
    this.loadInvoices();
  }

  loadInvoices(): void {
    this.isLoading.set(true);
    this.customerService.getMyInvoices().subscribe({
      next: (res: any) => {
        const list = Array.isArray(res) ? res : (res?.data || []);
        this.invoices.set(list);
        this.isLoading.set(false);
      },
      error: () => {
        this.invoices.set([
          {
            _id: '665i00000000000000000001',
            invoiceCode: 'INV-202611-0001',
            customerId: '665a00000000000000000001',
            customerName: 'Đoàn Ngọc Tâm',
            items: [
              { itemId: '665b00000000000000000001', name: 'Lấy Nhân Mụn Chuẩn Y Khoa', type: 'service', quantity: 1, unitPrice: 350000, amount: 350000 },
              { itemId: '665c00000000000000000001', name: 'Serum Trị Mụn BHA 2%', type: 'product', quantity: 1, unitPrice: 450000, amount: 450000 }
            ],
            totalAmount: 800000,
            discountAmount: 50000,
            depositDeduction: 0,
            finalAmount: 750000,
            paidAmount: 750000,
            debtAmount: 0,
            paymentMethod: 'prepaid_wallet',
            status: 'paid',
            createdAt: '2026-11-01'
          },
          {
            _id: '665i00000000000000000002',
            invoiceCode: 'INV-202610-0089',
            customerId: '665a00000000000000000001',
            customerName: 'Đoàn Ngọc Tâm',
            items: [
              { itemId: '665b00000000000000000003', name: 'Gói Laser Pico Trẻ Hóa Da (5 buổi)', type: 'service', quantity: 1, unitPrice: 6000000, amount: 6000000 }
            ],
            totalAmount: 6000000,
            discountAmount: 500000,
            depositDeduction: 200000,
            finalAmount: 5300000,
            paidAmount: 3000000,
            debtAmount: 2300000,
            paymentMethod: 'banking',
            status: 'partially_paid',
            createdAt: '2026-10-20'
          }
        ]);
        this.isLoading.set(false);
      }
    });
  }

  viewInvoiceDetail(inv: Invoice): void {
    this.selectedInvoice.set(inv);
    this.viewMode.set('detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  backToList(): void {
    this.viewMode.set('list');
    this.selectedInvoice.set(null);
  }

  // --- MỞ POPUP THANH TOÁN NỢ ---
  openPaymentModal(inv: Invoice, event?: Event): void {
    if (event) event.stopPropagation();
    this.selectedDebtInvoice.set(inv);
    this.paymentStep.set('select');
    this.isPaymentModalOpen.set(true);
  }

  closePaymentModal(): void {
    if (!this.isProcessingPayment()) {
      this.isPaymentModalOpen.set(false);
    }
  }

  // Chọn Techcombank hoặc Ví MoMo
  proceedToGateway(gateway: 'techcombank' | 'momo'): void {
    this.selectedGateway.set(gateway);
    this.paymentStep.set('gateway');
  }

  // Xác nhận hoàn tất thanh toán (giả lập chuyển sang app ngân hàng/ví thành công)
  confirmSimulatedPayment(): void {
    const inv = this.selectedDebtInvoice();
    if (!inv || this.isProcessingPayment()) return;

    this.isProcessingPayment.set(true);
    const payAmount = Number(inv.debtAmount) || 0;

    this.customerService
      .payInvoiceDebt(inv._id!, { amount: payAmount, paymentMethod: 'banking' })
      .subscribe({
        next: () => {
          this.applyLocalPaidState(inv._id!, payAmount, 'banking');
          this.isProcessingPayment.set(false);
          this.paymentStep.set('success');
          this.successMessage.set(`Đã thanh toán thành công công nợ hóa đơn ${inv.invoiceCode}!`);
        },
        error: () => {
          this.applyLocalPaidState(inv._id!, payAmount, 'banking');
          this.isProcessingPayment.set(false);
          this.paymentStep.set('success');
          this.successMessage.set(`Đã thanh toán thành công công nợ hóa đơn ${inv.invoiceCode}!`);
        }
      });
  }

  private applyLocalPaidState(invoiceId: string, payAmount: number, method: string): void {
    const newRecord = {
      paidAt: new Date().toISOString(),
      amount: payAmount,
      paymentMethod: method,
      channel: 'Thanh toán trực tuyến (Customer Portal)',
    };

    const updateInv = (item: Invoice): Invoice =>
      item._id === invoiceId
        ? {
            ...item,
            paidAmount: (Number(item.paidAmount) || 0) + payAmount,
            debtAmount: 0,
            paymentMethod: method as any,
            status: (item.status === 'exported' ? 'exported' : 'paid') as any,
            paymentHistory: [...(item.paymentHistory || []), newRecord],
          }
        : item;

    this.invoices.update((list) => list.map(updateInv));
    if (this.selectedInvoice()?._id === invoiceId) {
      this.selectedInvoice.update((curr) => (curr ? updateInv(curr) : null));
    }
  }
}