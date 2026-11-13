import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-policy-component',
  standalone: false,
  styleUrl: './policy-component.scss',
  templateUrl: './policy-component.html',
})
export class PolicyComponent {
  activeSection = signal('dat-lich');

  readonly sections = [
    { id: 'dat-lich', title: 'Quy định đặt hẹn & Hủy lịch', icon: 'bi-calendar-check' },
    { id: 'bao-mat', title: 'Chính sách bảo mật y khoa', icon: 'bi-shield-lock' },
    { id: 'hoan-phi', title: 'Chính sách hoàn phí & Đổi liệu trình', icon: 'bi-arrow-left-right' },
    { id: 'bao-hanh', title: 'Cam kết chất lượng & Bảo hành', icon: 'bi-award' },
    { id: 'khieu-nai', title: 'Quy trình tiếp nhận khiếu nại', icon: 'bi-headset' },
  ];

  scrollTo(sectionId: string): void {
    this.activeSection.set(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}
