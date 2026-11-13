import { Component, OnInit, signal, computed } from '@angular/core';
import { CustomerService } from '../../../shared/services/customer';

export interface UsedItem {
  _id: string;
  name: string;
  type: 'service' | 'product';
  usedDate: string; // ISO string hoặc YYYY-MM-DD HH:mm
  performedBy?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  status: 'completed' | 'in_use';
  rating?: number;
  reviewComment?: string;
}

@Component({
  selector: 'app-customer-used-history',
  standalone: false,
  templateUrl: './customer-used-history.html',
  styleUrl: './customer-used-history.scss',
})
export class CustomerUsedHistory implements OnInit {
  activeTab = signal<'service' | 'product'>('service');
  historyList = signal<UsedItem[]>([]);
  searchKeyword = signal<string>('');
  isLoading = signal<boolean>(false);

  // Quản lý Modal Đánh giá
  isReviewModalOpen = signal<boolean>(false);
  selectedItemForReview = signal<UsedItem | null>(null);
  reviewStars = signal<number>(5);
  reviewComment = signal<string>('');
  reviewMessage = signal<string>('');

  filteredHistory = computed(() => {
    const currentTab = this.activeTab();
    const keyword = this.searchKeyword().toLowerCase().trim();

    return this.historyList().filter(item => {
      const matchType = item.type === currentTab;
      const matchKeyword = !keyword || item.name.toLowerCase().includes(keyword);
      return matchType && matchKeyword;
    });
  });

  constructor(private customerService: CustomerService) {}

  ngOnInit(): void {
    this.loadHistory();
  }

  loadHistory(): void {
    this.isLoading.set(true);
    this.customerService.getUsedHistory().subscribe({
      next: (data) => {
        this.historyList.set(data || []);
        this.isLoading.set(false);
      },
      error: () => {
        this.historyList.set([]);
        this.isLoading.set(false);
      },
    });
  }

  // Kiểm tra thời hạn 48 giờ
  canReview(item: UsedItem): boolean {
    if (item.type !== 'service' || item.status !== 'completed' || item.rating) return false;
    const diffHours = (new Date().getTime() - new Date(item.usedDate).getTime()) / (1000 * 60 * 60);
    return diffHours <= 48;
  }

  openReviewModal(item: UsedItem): void {
    this.selectedItemForReview.set(item);
    this.reviewStars.set(item.rating || 5);
    this.reviewComment.set(item.reviewComment || '');
    this.reviewMessage.set('');
    this.isReviewModalOpen.set(true);
  }

  closeReviewModal(): void {
    this.isReviewModalOpen.set(false);
    this.selectedItemForReview.set(null);
  }

  setStars(star: number): void {
    this.reviewStars.set(star);
  }

  submitReview(): void {
    const item = this.selectedItemForReview();
    if (!item) return;

    this.historyList.update(list =>
      list.map(i => i._id === item._id ? {
        ...i,
        rating: this.reviewStars(),
        reviewComment: this.reviewComment()
      } : i)
    );

    this.closeReviewModal();
  }

  changeTab(tab: 'service' | 'product'): void {
    this.activeTab.set(tab);
  }
}