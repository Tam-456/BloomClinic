import { TestBed } from '@angular/core/testing';
import { AdminStaff } from './admin-staff';

describe('AdminStaff', () => {
  let service: AdminStaff;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AdminStaff);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
