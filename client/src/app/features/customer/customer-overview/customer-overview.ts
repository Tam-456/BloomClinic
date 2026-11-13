import { Component, OnInit, signal, computed } from '@angular/core';
import { CustomerService } from '../../../shared/services/customer';
import { Booking } from '../../../shared/interfaces/booking.interface';
import { CustomerTreatment } from '../../../shared/interfaces/treatment.interface';
import { Invoice } from '../../../shared/interfaces/invoice.interface';
import { User } from '../../../shared/interfaces/user.interface';

@Component({
  selector: 'app-customer-overview',
  standalone: false,
  templateUrl: './customer-overview.html',
  styleUrl: './customer-overview.scss',
})
export class CustomerOverview implements OnInit {
  currentUser = signal<User | null>(null);
  upcomingBooking = signal<Booking | null>(null);
  activeTreatments = signal<CustomerTreatment[]>([]);
  invoices = signal<Invoice[]>([]);
  totalSpent = signal<number>(0);
  isLoading = signal<boolean>(false);

  todayStr = new Date().toISOString().slice(0, 10);
  debtInvoices = computed(() =>
    this.invoices().filter((inv) => (Number(inv.debtAmount) || 0) > 0)
  );

  constructor(private customerService: CustomerService) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.isLoading.set(true);

    this.customerService.getOverview().subscribe({
      next: (res) => {
        const data = res?.data ? res.data : res;
        this.currentUser.set(data?.user || null);
        this.upcomingBooking.set(data?.upcomingBooking || data?.upcomingBookings || null);
        this.activeTreatments.set(data?.activeTreatments || []);
        this.totalSpent.set(data?.totalSpent || (data?.user as any)?.totalSpent || 0);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });

    this.customerService.getMyInvoices().subscribe({
      next: (list) => this.invoices.set(list || []),
      error: () => {},
    });
  }

  isDueOrOverdue(inv: any): boolean {
    if (!inv?.dueDate) return false;
    const dueStr = new Date(inv.dueDate).toISOString().slice(0, 10);
    return dueStr <= this.todayStr;
  }
}