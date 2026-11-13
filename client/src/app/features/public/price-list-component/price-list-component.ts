import { Component, OnInit, computed, signal } from '@angular/core';
import { CategoryGroup } from '../../../shared/interfaces/service.interface';
import { serviceGroupLabel } from '../../../shared/utils/public-format';
import { MOCK_PRICE_TABLES, IPriceCategorySection } from '../../../shared/mock/price-list.mock';

@Component({
  selector: 'app-price-list-component',
  standalone: false,
  styleUrl: './price-list-component.scss',
  templateUrl: './price-list-component.html',
})
export class PriceListComponent implements OnInit {
  readonly groupLabel = serviceGroupLabel;

  selectedGroup = signal<CategoryGroup | ''>('');

  readonly groups: { value: CategoryGroup | ''; label: string; icon: string }[] = [
    { value: '', label: 'Tất cả bảng giá', icon: 'bi-grid-fill' },
    { value: 'dieu-tri-da', label: 'Điều trị da', icon: 'bi-bandaid-fill' },
    { value: 'cham-soc-da', label: 'Chăm sóc da', icon: 'bi-droplet-fill' },
    { value: 'tre-hoa-nang-co', label: 'Trẻ hóa & nâng cơ', icon: 'bi-sparkles' },
    { value: 'triet-long', label: 'Triệt lông', icon: 'bi-lightning-charge-fill' },
  ];

  readonly allTables: IPriceCategorySection[] = MOCK_PRICE_TABLES;

  visibleTables = computed(() => {
    const g = this.selectedGroup();
    if (!g) return this.allTables;
    return this.allTables.filter((t) => t.group === g);
  });

  ngOnInit(): void {}

  selectGroup(group: CategoryGroup | ''): void {
    this.selectedGroup.set(group);
  }
}
