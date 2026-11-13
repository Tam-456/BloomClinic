import { TestBed } from '@angular/core/testing';
import { AdminOperations } from './admin-operations';

describe('AdminOperations', () => {
  let service: AdminOperations;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AdminOperations);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
