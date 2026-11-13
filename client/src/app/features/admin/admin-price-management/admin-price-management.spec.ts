import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminPriceManagement } from './admin-price-management';

describe('AdminPriceManagement', () => {
  let component: AdminPriceManagement;
  let fixture: ComponentFixture<AdminPriceManagement>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AdminPriceManagement],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminPriceManagement);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
