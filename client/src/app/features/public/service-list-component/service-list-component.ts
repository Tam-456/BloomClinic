import { Component, OnInit, computed, signal, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PublicService } from '../../../shared/services/public.service';
import { CategoryGroup, IService } from '../../../shared/interfaces/service.interface';
import { formatVnd, serviceGroupLabel } from '../../../shared/utils/public-format';

@Component({
  selector: 'app-service-list-component',
  standalone: false,
  styleUrl: './service-list-component.scss',
  templateUrl: './service-list-component.html',
})
export class ServiceListComponent implements OnInit {
  private publicService = inject(PublicService);
  readonly formatVnd = formatVnd;
  readonly groupLabel = serviceGroupLabel;

  services = signal<IService[]>([]);
  loading = signal(true);
  error = signal('');
  selectedGroup = signal<CategoryGroup | ''>('');
  searchKeyword = signal('');

  readonly groups: { value: CategoryGroup | ''; label: string; icon: string }[] = [
    { value: '', label: 'Tất cả dịch vụ', icon: 'bi-grid-fill' },
    { value: 'dieu-tri-da', label: 'Điều trị da', icon: 'bi-bandaid-fill' },
    { value: 'cham-soc-da', label: 'Chăm sóc da', icon: 'bi-droplet-fill' },
    { value: 'tre-hoa-nang-co', label: 'Trẻ hóa & nâng cơ', icon: 'bi-sparkles' },
    { value: 'triet-long', label: 'Triệt lông', icon: 'bi-lightning-charge-fill' },
  ];

  filteredServices = computed(() => {
    const list = this.services();
    const q = this.searchKeyword().trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (s) =>
        s.serviceName.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        this.groupLabel(s.categoryGroup).toLowerCase().includes(q)
    );
  });

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const g = (params.get('group') as CategoryGroup) || '';
      if (this.groups.some((group) => group.value === g)) {
        this.selectedGroup.set(g);
      } else {
        this.selectedGroup.set('');
      }
      this.loadServices();
    });
  }

  selectGroup(group: CategoryGroup | ''): void {
    this.selectedGroup.set(group);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { group: group || null },
      queryParamsHandling: 'merge',
    });
    this.loadServices();
  }

  onSearch(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.searchKeyword.set(val);
  }

  clearSearch(): void {
    this.searchKeyword.set('');
  }

  private loadServices(): void {
    this.loading.set(true);
    this.error.set('');
    const group = this.selectedGroup() || undefined;
    this.publicService.getServices(group).subscribe({
      next: (response) => {
        this.services.set(response.data || []);
      },
      error: () => {
        this.error.set('Chưa tải được danh sách dịch vụ. Vui lòng thử lại sau.');
        this.loading.set(false);
      },
      complete: () => this.loading.set(false),
    });
  }
}
