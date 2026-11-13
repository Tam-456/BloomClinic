import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminPos } from './admin-pos';

describe('AdminPos', () => {
  let component: AdminPos;
  let fixture: ComponentFixture<AdminPos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AdminPos],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminPos);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
