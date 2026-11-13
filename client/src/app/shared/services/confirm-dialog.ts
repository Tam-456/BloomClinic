import { Injectable, signal } from '@angular/core';

export interface ConfirmDialogConfig {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'primary' | 'warning';
  action?: () => void;
}

@Injectable({
  providedIn: 'root'
})
export class ConfirmDialogService {
  isOpen = signal<boolean>(false);
  config = signal<ConfirmDialogConfig>({
    title: 'Xác nhận thao tác',
    message: 'Bạn có chắc chắn muốn thực hiện hành động này?',
    confirmText: 'Xác nhận',
    cancelText: 'Hủy bỏ',
    type: 'primary'
  });

  // Gọi hàm này khi bấm bất kỳ nút nào cần xác nhận
  confirm(config: ConfirmDialogConfig): void {
    this.config.set({
      confirmText: 'Xác nhận',
      cancelText: 'Hủy bỏ',
      type: 'primary',
      ...config
    });
    this.isOpen.set(true);
  }

  onConfirm(): void {
    if (this.config().action) {
      this.config().action!();
    }
    this.close();
  }

  close(): void {
    this.isOpen.set(false);
  }
}