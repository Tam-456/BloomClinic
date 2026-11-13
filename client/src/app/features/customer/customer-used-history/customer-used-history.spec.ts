import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CustomerUsedHistory } from './customer-used-history';

describe('CustomerUsedHistory', () => {
  let component: CustomerUsedHistory;
  let fixture: ComponentFixture<CustomerUsedHistory>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CustomerUsedHistory],
    }).compileComponents();

    fixture = TestBed.createComponent(CustomerUsedHistory);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
