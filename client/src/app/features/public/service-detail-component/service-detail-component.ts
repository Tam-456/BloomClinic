import { Component, OnInit, signal, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IService } from '../../../shared/interfaces/service.interface';
import { PublicService } from '../../../shared/services/public.service';
import { formatVnd, serviceGroupLabel } from '../../../shared/utils/public-format';
import { MOCK_COMMITMENTS, DEFAULT_SERVICE_STEPS, IServiceStep } from '../../../shared/mock/services.mock';

@Component({
  selector: 'app-service-detail-component',
  standalone: false,
  styleUrl: './service-detail-component.scss',
  templateUrl: './service-detail-component.html',
})
export class ServiceDetailComponent implements OnInit {
  private publicService = inject(PublicService);
  readonly formatVnd = formatVnd;
  readonly groupLabel = serviceGroupLabel;

  service = signal<IService | null>(null);
  relatedServices = signal<IService[]>([]);
  loading = signal(true);
  error = signal('');

  readonly steps: IServiceStep[] = DEFAULT_SERVICE_STEPS;
  readonly commitments = MOCK_COMMITMENTS;

  constructor(
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const slug = params.get('slug');
      if (!slug) {
        this.error.set('Không tìm thấy dịch vụ.');
        this.service.set(null);
        this.loading.set(false);
        return;
      }

      this.loading.set(true);
      this.error.set('');

      this.publicService.getServiceBySlug(slug).subscribe({
        next: (response) => {
          if (!response || !response.success || !response.data) {
            this.error.set('Không tìm thấy liệu trình theo yêu cầu.');
            this.service.set(null);
            this.loading.set(false);
            return;
          }
          const s = response.data;
          this.service.set(s);
          this.loadRelated(s.categoryGroup, s.slug);
        },
        error: () => {
          this.error.set('Không tìm thấy dịch vụ hoặc dịch vụ hiện không khả dụng.');
          this.service.set(null);
          this.loading.set(false);
        },
        complete: () => this.loading.set(false),
      });
    });
  }

  private loadRelated(group: IService['categoryGroup'], currentSlug: string): void {
  this.publicService.getServices(group as any).subscribe({
    next: (res) => {
      const others = (res.data || []).filter((s) => s.slug !== currentSlug).slice(0, 3);
      this.relatedServices.set(others);
    },
  });
}
}
