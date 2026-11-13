import { TestBed } from '@angular/core/testing';
import { AdminBooking } from './admin-booking';

describe('AdminBooking', () => {
  let service: AdminBooking;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AdminBooking);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
