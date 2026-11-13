import { Component, OnInit, signal, inject } from '@angular/core';
import { IStaff } from '../../../shared/interfaces/staff.interface';
import { PublicService } from '../../../shared/services/public.service';

@Component({
  selector: 'app-professor-component',
  standalone: false,
  styleUrl: './professor-component.scss',
  templateUrl: './professor-component.html',
})
export class ProfessorComponent implements OnInit {
  private publicService = inject(PublicService);
  professors = signal<IStaff[]>([]);
  loading = signal(true);
  error = signal('');

  constructor() {}

  ngOnInit(): void {
    this.publicService.getProfessors().subscribe({
      next: (response) => {
        this.professors.set(response.data || []);
      },
      error: () => {
        this.error.set('Chưa tải được thông tin đội ngũ. Vui lòng thử lại sau.');
        this.loading.set(false);
      },
      complete: () => this.loading.set(false),
    });
  }

  starsArray(rating: number): boolean[] {
    const r = Math.round(rating || 5);
    return Array.from({ length: 5 }, (_, i) => i < r);
  }
}
