import { TestBed } from '@angular/core/testing';
import { AdminPos } from './admin-pos';

describe('AdminPos', () => {
  let service: AdminPos;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AdminPos);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
