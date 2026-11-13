import {
  Directive,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  Renderer2,
} from '@angular/core';

/**
 * appReveal – Fade-up entrance animation via IntersectionObserver.
 *
 * Usage:
 *   <div appReveal></div>
 *   <div appReveal [revealDelay]="200"></div>
 *
 * The directive adds the CSS class "reveal" immediately so the element
 * starts invisible (opacity:0, translateY 28px), then adds "is-visible"
 * when the element enters the viewport.
 *
 * Respects prefers-reduced-motion via CSS (see global styles).
 */
@Directive({
  selector: '[appReveal]',
  standalone: false,
})
export class AppRevealDirective implements OnInit, OnDestroy {
  /** Optional delay in milliseconds before the reveal transition fires. */
  @Input() revealDelay: number = 0;

  private observer!: IntersectionObserver;

  constructor(private el: ElementRef<HTMLElement>, private renderer: Renderer2) {}

  ngOnInit(): void {
    // Add base reveal class so the element is hidden initially
    this.renderer.addClass(this.el.nativeElement, 'reveal');

    // Skip observer if browser doesn't support it
    if (!('IntersectionObserver' in window)) {
      this.renderer.addClass(this.el.nativeElement, 'is-visible');
      return;
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const delay = this.revealDelay;
            if (delay > 0) {
              setTimeout(() => this.show(), delay);
            } else {
              this.show();
            }
            // Only animate once
            this.observer.unobserve(this.el.nativeElement);
          }
        });
      },
      { threshold: 0.12 }
    );

    this.observer.observe(this.el.nativeElement);
  }

  private show(): void {
    this.renderer.addClass(this.el.nativeElement, 'is-visible');
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}

