import { Component } from '@angular/core';

@Component({
  selector: 'app-footer-component',
  standalone: false,
  styleUrl: './footer-component.scss',
  templateUrl: './footer-component.html',
})
export class FooterComponent {
  readonly year = new Date().getFullYear();
}
