import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminOperations } from './admin-operations';

describe('AdminOperations', () => {
  let component: AdminOperations;
  let fixture: ComponentFixture<AdminOperations>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AdminOperations],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminOperations);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
