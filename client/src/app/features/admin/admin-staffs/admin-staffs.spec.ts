import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminStaffs } from './admin-staffs';

describe('AdminStaffs', () => {
  let component: AdminStaffs;
  let fixture: ComponentFixture<AdminStaffs>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AdminStaffs],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminStaffs);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
