import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CustomerBookingHistory } from './customer-booking-history';

describe('CustomerBookingHistory', () => {
  let component: CustomerBookingHistory;
  let fixture: ComponentFixture<CustomerBookingHistory>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CustomerBookingHistory],
    }).compileComponents();

    fixture = TestBed.createComponent(CustomerBookingHistory);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
