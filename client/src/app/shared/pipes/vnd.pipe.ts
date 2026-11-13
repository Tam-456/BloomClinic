import { Pipe, PipeTransform } from '@angular/core';

/**
 * VndPipe – formats a number as Vietnamese Đồng currency.
 * Usage: {{ 490000 | vnd }}  →  "490.000 ₫"
 */
@Pipe({
  name: 'vnd',
  standalone: false,
  pure: true,
})
export class VndPipe implements PipeTransform {
  private static readonly fmt = new Intl.NumberFormat('vi-VN', {
    maximumFractionDigits: 0,
  });

  transform(value?: number | null): string {
  const val = value ?? 0;
  return `${new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(val)} ₫`;
}
}

