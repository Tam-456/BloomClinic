import { Component, inject } from '@angular/core';
import { ConfirmDialogService } from '../../services/confirm-dialog';

@Component({
  selector: 'app-confirm-dialog',
  standalone: false,
  templateUrl: './confirm-dialog.html',
  styleUrl: './confirm-dialog.scss',
})
export class ConfirmDialog {
  public confirmService = inject(ConfirmDialogService);
}