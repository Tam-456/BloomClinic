import { TestBed } from '@angular/core/testing';
import { AdminCatalog } from './admin-catalog';

describe('AdminCatalog', () => {
  let service: AdminCatalog;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AdminCatalog);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
