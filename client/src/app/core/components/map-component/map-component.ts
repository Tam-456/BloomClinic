import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
} from '@angular/core';

@Component({
  selector: 'app-map-component',
  standalone: false,
  templateUrl: './map-component.html',
  styleUrl: './map-component.scss',
})
export class MapComponent implements AfterViewInit, OnDestroy {
  @ViewChild('mapWrap', { static: false }) mapWrap?: ElementRef<HTMLElement>;

  tooltipVisible = true;
  private observer?: IntersectionObserver;

  ngAfterViewInit(): void {
    if (!this.mapWrap?.nativeElement || !('IntersectionObserver' in window)) return;

    this.observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          this.mapWrap!.nativeElement.classList.add('map-drawn');
          this.observer?.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    this.observer.observe(this.mapWrap.nativeElement);
  }

  toggleTooltip(): void {
    this.tooltipVisible = !this.tooltipVisible;
  }

  showTooltip(): void {
    this.tooltipVisible = true;
  }

  hideTooltip(): void {
    // Keep visible on desktop by default so info is immediate, or can be toggled
    this.tooltipVisible = false;
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
