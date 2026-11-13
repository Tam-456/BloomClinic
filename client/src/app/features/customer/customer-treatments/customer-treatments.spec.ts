import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CustomerTreatments } from './customer-treatments';

describe('CustomerTreatments', () => {
  let component: CustomerTreatments;
  let fixture: ComponentFixture<CustomerTreatments>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CustomerTreatments],
    }).compileComponents();

    fixture = TestBed.createComponent(CustomerTreatments);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
