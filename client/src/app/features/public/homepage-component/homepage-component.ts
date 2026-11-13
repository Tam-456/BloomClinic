import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  QueryList,
  ViewChild,
  ViewChildren,
  signal,
  inject,
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IArticle } from '../../../shared/interfaces/article.interface';
import { IService } from '../../../shared/interfaces/service.interface';
import { IStaff } from '../../../shared/interfaces/staff.interface';
import { PublicService } from '../../../shared/services/public.service';
import { formatVnd, serviceGroupLabel } from '../../../shared/utils/public-format';
import {
  IHomeStat,
  IWhyCard,
  IServiceGroupCard,
  IFeaturedPrice,
  IJourneyStep,
  ITestimonial,
  IFaqItem,
  MOCK_HOME_STATS,
  MOCK_WHY_CARDS,
  MOCK_SERVICE_GROUPS,
  MOCK_FEATURED_PRICES,
  MOCK_JOURNEY_STEPS,
  MOCK_DOCTORS,
  MOCK_TESTIMONIALS,
  MOCK_SERVICES,
  MOCK_FAQ,
} from '../../../shared/mock/home.mock';
import { MOCK_ARTICLES_LIST } from '../../../shared/mock/articles.mock';

@Component({
  selector: 'app-homepage-component',
  standalone: false,
  styleUrl: './homepage-component.scss',
  templateUrl: './homepage-component.html',
})
export class HomepageComponent implements OnInit, AfterViewInit, OnDestroy {
  private publicService = inject(PublicService);
  // ── Existing helpers ────────────────────────────────────────
  readonly formatVnd = formatVnd;
  readonly groupLabel = serviceGroupLabel;

  // ── Live data signals ───────────────────────────────────────
  services = signal<IService[]>([]);
  articles = signal<IArticle[]>([]);

  // ── Mock data – top half ────────────────────────────────────
  readonly stats: IHomeStat[]               = MOCK_HOME_STATS;
  readonly whyCards: IWhyCard[]             = MOCK_WHY_CARDS;
  readonly serviceGroups: IServiceGroupCard[] = MOCK_SERVICE_GROUPS;
  readonly featuredPrices: IFeaturedPrice[] = MOCK_FEATURED_PRICES;
  readonly journeySteps: IJourneyStep[]     = MOCK_JOURNEY_STEPS;

  // ── Mock data – bottom half ─────────────────────────────────
  readonly doctors: IStaff[]                = MOCK_DOCTORS;
  readonly testimonials: ITestimonial[]     = MOCK_TESTIMONIALS;
  readonly knowledgeArticles: IArticle[]    = MOCK_ARTICLES_LIST.slice(0, 3);
  readonly bookingServices: IService[]      = MOCK_SERVICES;
  readonly faqItems: IFaqItem[]             = MOCK_FAQ;

  // ── Animated counters ────────────────────────────────────────
  counterValues = signal<number[]>(this.stats.map(() => 0));

  // ── FAQ accordion ────────────────────────────────────────────
  openFaqIndex = signal<number | null>(null);

  toggleFaq(i: number): void {
    this.openFaqIndex.update((cur) => (cur === i ? null : i));
  }

  // ── Booking form ─────────────────────────────────────────────
  bookingForm!: FormGroup;
  bookingSubmitted = signal(false);
  toastVisible = signal(false);
  readonly today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD for min date
  private toastTimer?: ReturnType<typeof setTimeout>;

  // ── ViewChild refs ────────────────────────────────────────────
  @ViewChild('heroVideo', { static: false }) heroVideo?: ElementRef<HTMLVideoElement>;
  @ViewChildren('statCard') statCards!: QueryList<ElementRef<HTMLElement>>;
  @ViewChild('journeyTrack', { static: false }) journeyTrackEl?: ElementRef<HTMLElement>;

  private statObserver?: IntersectionObserver;
  private journeyObserver?: IntersectionObserver;
  private animationIds: number[] = [];

  constructor(
    private fb: FormBuilder,
  ) {}

  ngOnInit(): void {
    // Live data (falls back gracefully if API not available)
    this.publicService
      .getServices()
      .subscribe({ next: (r) => this.services.set(r.data.slice(0, 3)), error: () => this.services.set([]) });
    this.publicService
      .getArticles()
      .subscribe({ next: (r) => this.articles.set(r.data.slice(0, 3)), error: () => this.articles.set([]) });

    // Counter IntersectionObserver
    if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
      this.statObserver = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) {
            this.animateCounters();
            this.statObserver?.disconnect();
          }
        },
        { threshold: 0.3 }
      );
    }

    // Booking reactive form
    this.bookingForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(3)]],
      phone:    ['', [Validators.required, Validators.pattern(/^(0|\+84)[0-9]{9}$/)]],
      service:  ['', Validators.required],
      date:     ['', Validators.required],
      note:     [''],
    });
  }

  ngAfterViewInit(): void {
    // Strictly mute hero video across all browsers
    if (this.heroVideo?.nativeElement) {
      this.heroVideo.nativeElement.muted = true;
      this.heroVideo.nativeElement.volume = 0;
      this.heroVideo.nativeElement.defaultMuted = true;
    }

    const first = this.statCards.first?.nativeElement;
    if (first && this.statObserver) {
      this.statObserver.observe(first);
    } else {
      this.counterValues.set(this.stats.map((s) => s.value));
    }

    if ('IntersectionObserver' in window && this.journeyTrackEl?.nativeElement) {
      this.journeyObserver = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) {
            this.journeyTrackEl!.nativeElement.classList.add('line-drawn');
            this.journeyObserver?.disconnect();
          }
        },
        { threshold: 0.25 }
      );
      this.journeyObserver.observe(this.journeyTrackEl.nativeElement);
    }
  }

  // ── Counter animation ─────────────────────────────────────
  private animateCounters(): void {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.counterValues.set(this.stats.map((s) => s.value));
      return;
    }
    const duration = 1800;
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed  = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased    = 1 - Math.pow(1 - progress, 3);
      this.counterValues.set(this.stats.map((s) => Math.round(s.value * eased)));
      if (progress < 1) {
        const id = requestAnimationFrame(tick);
        this.animationIds.push(id);
      }
    };

    this.animationIds.push(requestAnimationFrame(tick));
  }

  // ── Star helpers ─────────────────────────────────────────────
  starsArray(rating: number): boolean[] {
    return Array.from({ length: 5 }, (_, i) => i < Math.round(rating));
  }

  // ── Booking submit ───────────────────────────────────────────
  get bf() { return this.bookingForm.controls; }

  onBookingSubmit(): void {
    this.bookingSubmitted.set(true);
    if (this.bookingForm.invalid) return;

    // TODO: replace with real API call when backend booking endpoint is ready
    // this.bookingService.submitBooking(this.bookingForm.value).subscribe(...)
    console.log('[BOOKING – MOCK] Form value:', this.bookingForm.value);

    this.showToast();
    this.bookingForm.reset();
    this.bookingSubmitted.set(false);
  }

  private showToast(): void {
    this.toastVisible.set(true);
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toastVisible.set(false), 4000);
  }

  dismissToast(): void {
    this.toastVisible.set(false);
    clearTimeout(this.toastTimer);
  }

  ngOnDestroy(): void {
    this.statObserver?.disconnect();
    this.journeyObserver?.disconnect();
    this.animationIds.forEach((id) => cancelAnimationFrame(id));
    clearTimeout(this.toastTimer);
  }
}
