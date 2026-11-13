import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-bloom-modal',
  standalone: false,
  templateUrl: './bloom-modal.html',
  styleUrl: './bloom-modal.scss',
})
export class BloomModal {
  @Input() isOpen = false;
  @Input() title = '';
  @Input() icon = '';
  @Input() maxWidth = '620px';

  @Output() close = new EventEmitter<void>();

  onClose(): void {
    this.close.emit();
  }
}