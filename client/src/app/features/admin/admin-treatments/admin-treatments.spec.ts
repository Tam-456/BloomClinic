import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminTreatments } from './admin-treatments';

describe('AdminTreatments', () => {
  let component: AdminTreatments;
  let fixture: ComponentFixture<AdminTreatments>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AdminTreatments],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminTreatments);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
