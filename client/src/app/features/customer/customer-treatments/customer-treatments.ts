import { Component, OnInit, signal } from '@angular/core';
import { CustomerService } from '../../../shared/services/customer';
import { CustomerTreatment, TreatmentHistoryItem } from '../../../shared/interfaces/treatment.interface';

/** Bổ sung rating và ratingComment vào session history */
export interface TreatmentHistoryItemWithReview extends TreatmentHistoryItem {
  rating?: number;
  ratingComment?: string;
  ratedAt?: string;
}

export interface CustomerTreatmentWithReview extends CustomerTreatment {
  history: TreatmentHistoryItemWithReview[];
}

@Component({
  selector: 'app-customer-treatments',
  standalone: false,
  templateUrl: './customer-treatments.html',
  styleUrl: './customer-treatments.scss',
})
export class CustomerTreatments implements OnInit {
  /** Map staffId → tên hiển thị (UI only) */
  private staffNameById: Record<string, string> = {
    '665d00000000000000000001': 'GS.TS. Trần Duy Thanh',
    '665d00000000000000000002': 'BS. Lê Thị Mai',
    '665d00000000000000000003': 'KTV. Nguyễn Văn Hùng',
    '665d00000000000000000004': 'KTV. Phạm Thu Hà',
  };

  getStaffName(staffId: string): string {
    return this.staffNameById[staffId] || staffId || 'Chưa phân công';
  }

  // Điều khiển chế độ xem: 'list' (Bảng full page) hoặc 'detail' (Xem nhật ký từng buổi)
  viewMode = signal<'list' | 'detail'>('list');

  treatments = signal<CustomerTreatmentWithReview[]>([]);
  selectedTreatment = signal<CustomerTreatmentWithReview | null>(null);
  isLoading = signal<boolean>(false);
  successMessage = signal<string>('');

  // Quản lý Modal Đánh Giá
  isReviewModalOpen = signal<boolean>(false);
  selectedSessionForReview = signal<TreatmentHistoryItemWithReview | null>(null);
  selectedSessionIndex = signal<number>(1);
  reviewStars = signal<number>(5);
  reviewComment = '';
  reviewError = signal<string>('');

  constructor(private customerService: CustomerService) {}

  ngOnInit(): void {
    this.loadTreatments();
  }

  loadTreatments(): void {
    this.isLoading.set(true);
    this.customerService.getMyTreatments().subscribe({
      next: (data) => {
        const enriched = (data || []).map((t) => ({
          ...t,
          history: (t.history || []).map((h) => ({
            ...h,
            rating: (h as any).rating,
            ratingComment: (h as any).ratingComment,
          })),
        }));
        this.treatments.set(enriched);
        this.isLoading.set(false);
      },
      error: () => {
        // Dữ liệu mock hoàn chỉnh để test ngay lập tức trên UI
        const mockTreatments: CustomerTreatmentWithReview[] = [
          {
            _id: '665e20000000000000000001',
            customerId: '665a00000000000000000001',
            treatmentId: '665e10000000000000000001',
            treatmentName: 'Gói Laser Pico Trẻ Hóa & Xóa Nám',
            totalSessions: 6,
            usedSessions: 3,
            remainingSessions: 3,
            status: 'active',
            history: [
              {
                date: '2026-10-10',
                staffId: '665d00000000000000000001',
                note: 'Buổi 1: Thăm khám và bắn laser mức năng lượng thấp để thích ứng da.',
                rating: 5,
                ratingComment: 'Bác sĩ Thanh bắn laser rất nhẹ nhàng, tư vấn cẩn thận!',
              },
              {
                date: '2026-10-20',
                staffId: '665d00000000000000000002',
                note: 'Buổi 2: Tăng nhẹ mức năng lượng, da cải thiện sắc tố vùng gò má.',
                rating: 5,
                ratingComment: 'Da mờ thâm rõ sau buổi 2, bác sĩ Mai rất nhiệt tình.',
              },
              {
                date: '2026-10-30',
                staffId: '665d00000000000000000001',
                note: 'Buổi 3: Kết hợp điện di phục hồi B5, mờ nám rõ rệt.',
                // Buổi 3 chưa đánh giá để test nút đánh giá
              },
            ],
          },
          {
            _id: '665e20000000000000000002',
            customerId: '665a00000000000000000001',
            treatmentId: '665e10000000000000000002',
            treatmentName: 'Gói Chăm Sóc Da & Trị Mụn Chuẩn Y Khoa',
            totalSessions: 4,
            usedSessions: 4,
            remainingSessions: 0,
            status: 'completed',
            history: [
              {
                date: '2026-09-01',
                staffId: '665d00000000000000000003',
                note: 'Lấy nhân mụn vô khuẩn, đắp mặt nạ kháng viêm.',
                rating: 5,
                ratingComment: 'KTV Hùng lấy mụn không đau, vệ sinh rất kỹ.',
              },
              {
                date: '2026-09-08',
                staffId: '665d00000000000000000004',
                note: 'Điện di tinh chất kiềm dầu.',
                rating: 4,
                ratingComment: 'Cấp ẩm tốt, da bớt tiết dầu.',
              },
              {
                date: '2026-09-15',
                staffId: '665d00000000000000000004',
                note: 'Lấy nhân mụn cám, chiếu đèn sinh học Bio-Light.',
                rating: 5,
                ratingComment: 'Đèn sinh học làm dịu da nhanh chóng.',
              },
              {
                date: '2026-09-22',
                staffId: '665d00000000000000000002',
                note: 'Tái khám cuối liệu trình, da hồi phục hoàn toàn.',
                rating: 5,
                ratingComment: 'Kết quả vượt mong đợi, da sạch mụn hoàn toàn.',
              },
            ],
          },
        ];
        this.treatments.set(mockTreatments);
        this.isLoading.set(false);
      },
    });
  }

  // Click vào dòng của gói để chuyển trang sang Chi Tiết Nhật Ký
  viewDetails(item: CustomerTreatmentWithReview): void {
    this.selectedTreatment.set(item);
    this.viewMode.set('detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Quay lại Bảng Danh sách gói Full Page
  backToList(): void {
    this.viewMode.set('list');
    this.selectedTreatment.set(null);
  }

  // --- QUẢN LÝ MODAL ĐÁNH GIÁ BUỔI ---
  openReviewModal(session: TreatmentHistoryItemWithReview, sessionNumber: number): void {
    this.selectedSessionForReview.set(session);
    this.selectedSessionIndex.set(sessionNumber);
    this.reviewStars.set(5);
    this.reviewComment = '';
    this.reviewError.set('');
    this.isReviewModalOpen.set(true);
  }

  closeReviewModal(): void {
    this.isReviewModalOpen.set(false);
    this.selectedSessionForReview.set(null);
  }

  setStars(stars: number): void {
    this.reviewStars.set(stars);
  }

  submitReview(): void {
    if (!this.reviewComment.trim()) {
      this.reviewError.set('Vui lòng nhập lời nhận xét hoặc cảm nhận của bạn về buổi điều trị!');
      return;
    }

    const session = this.selectedSessionForReview();
    if (!session) return;

    // Cập nhật rating và comment ngay trên đối tượng session hiện tại
    session.rating = this.reviewStars();
    session.ratingComment = this.reviewComment.trim();
    session.ratedAt = new Date().toISOString();

    // Cập nhật lại trong treatments signal
    this.treatments.update((list) => [...list]);

    this.successMessage.set(`Đã gửi đánh giá (${this.reviewStars()} sao) cho Buổi ${this.selectedSessionIndex()} thành công!`);
    this.closeReviewModal();
  }
}