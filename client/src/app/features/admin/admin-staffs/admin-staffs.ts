import { Component, OnInit, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Schedule } from '../../../shared/interfaces/schedule.interface';
import { ConfirmDialogService } from '../../../shared/services/confirm-dialog';
import { AdminStaffService } from '../../../shared/services/admin-staff';

export interface DetailedStaff {
  _id: string;
  staffCode: string;
  staffName: string;
  phone: string;
  roleType: 'doctor' | 'ktv' | 'admin';
  title: string;
  experienceYears: number;
  rating: number;
  status: 'working' | 'leave';
}

interface TimelineDay {
  date: string;
  label: string;
  dayNumber: number;
  isWeekend: boolean;
}

@Component({
  selector: 'app-admin-staffs',
  standalone: false,
  templateUrl: './admin-staffs.html',
  styleUrl: './admin-staffs.scss',
})
export class AdminStaffs implements OnInit {
  activeMainTab = signal<'schedules' | 'staffs'>('schedules');

  staffList = signal<DetailedStaff[]>([]);
  searchStaffKeyword = signal<string>('');
  staffRoleFilter = signal<'all' | 'doctor' | 'ktv' | 'admin'>('all');

  // Tìm kiếm nhân sự khi phân ca
  scheduleStaffSearch = signal<string>('');
  isStaffSelectDropdownOpen = signal<boolean>(false);

  isStaffModalOpen = signal<boolean>(false);
  isEditMode = signal<boolean>(false);
  staffForm: Partial<DetailedStaff> = {
    staffCode: '',
    staffName: '',
    phone: '',
    roleType: 'doctor',
    title: 'Bác sĩ Da liễu',
    experienceYears: 3,
    rating: 5,
    status: 'working'
  };

  scheduleList = signal<Schedule[]>([]);
  timelineDate = signal<string>(this.getLocalDateString(new Date()));
  selectedStaffWeekly = signal<{ staffName: string; schedules: Schedule[] } | null>(null);

  newSchedule: Partial<Schedule> = {
    staffId: '',
    date: this.getLocalDateString(new Date()),
    shift: 'sang',
    isOff: false,
    maxCapacity: 5
  };

  // Danh sách gợi ý nhân sự khi tìm kiếm ở form phân ca
  searchedScheduleStaffs = computed(() => {
    const kw = this.scheduleStaffSearch().toLowerCase().trim();
    if (!kw) return this.staffList();
    return this.staffList().filter(s =>
      s.staffName.toLowerCase().includes(kw) ||
      s.staffCode.toLowerCase().includes(kw)
    );
  });

  sortedAndFilteredStaffs = computed(() => {
    const keyword = this.searchStaffKeyword().toLowerCase().trim();
    const filter = this.staffRoleFilter();

    const list = this.staffList().filter(staff => {
      const matchFilter = filter === 'all' || staff.roleType === filter;
      const matchKeyword =
        !keyword ||
        staff.staffName.toLowerCase().includes(keyword) ||
        staff.phone.includes(keyword) ||
        staff.staffCode.toLowerCase().includes(keyword);
      return matchFilter && matchKeyword;
    });

    return [...list].sort((a, b) => {
      if (a.roleType === 'doctor' && b.roleType !== 'doctor') return -1;
      if (a.roleType !== 'doctor' && b.roleType === 'doctor') return 1;
      return (a.staffCode || '').localeCompare(b.staffCode || '');
    });
  });

  weekStart = computed(() => {
    const selectedDate = new Date(this.timelineDate() + 'T00:00:00');
    const day = selectedDate.getDay();
    const distanceFromMonday = day === 0 ? 6 : day - 1;
    selectedDate.setDate(selectedDate.getDate() - distanceFromMonday);
    return this.getLocalDateString(selectedDate);
  });

  weekDays = computed<TimelineDay[]>(() => {
    const startDate = new Date(this.weekStart() + 'T00:00:00');
    const days: TimelineDay[] = [];
    const dayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      days.push({
        date: this.getLocalDateString(currentDate),
        label: dayNames[currentDate.getDay()],
        dayNumber: currentDate.getDate(),
        isWeekend: currentDate.getDay() === 0 || currentDate.getDay() === 6
      });
    }
    return days;
  });

  timelineWeekLabel = computed(() => {
    const days = this.weekDays();
    if (days.length === 0) return '';
    return `${days[0].dayNumber}/${days[0].date.substring(5, 7)} - ${days[6].dayNumber}/${days[6].date.substring(5, 7)}/${days[6].date.substring(0, 4)}`;
  });

  constructor(
    private staffService: AdminStaffService,
    private confirmDialog: ConfirmDialogService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  private getLocalDateString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  loadData(): void {
    // 1. Nạp danh sách nhân sự (Bao gồm Bác sĩ, KTV và Admin)
    this.staffService.getStaffs().subscribe({
      next: (res: any) => {
        const rawList = Array.isArray(res) ? res : (res?.data || []);
        const mapped: DetailedStaff[] = rawList.map((item: any) => {
          let name = item.staffName || 'Chưa đặt tên';
          const code = (item.staffCode || item.customId || '').toUpperCase();
          const titleLower = (item.title || '').toLowerCase();

          // Nhận diện Admin: dựa trên roleType, mã AD- hoặc chức danh
          const isAdmin =
            item.roleType === 'admin' ||
            item.role === 'admin' ||
            code.startsWith('AD-') ||
            titleLower.includes('quản trị') ||
            titleLower.includes('admin');

          const role: 'doctor' | 'ktv' | 'admin' = isAdmin
            ? 'admin'
            : (item.roleType === 'doctor' || titleLower.includes('bác sĩ') ? 'doctor' : 'ktv');

          // Thêm tiền tố phù hợp theo vai trò
          if (role === 'doctor' && !name.startsWith('BS.')) {
            name = `BS. ${name.replace(/^(Bác sĩ|BS|BS\.)\s*/i, '')}`;
          } else if (role === 'ktv' && !name.startsWith('KTV.')) {
            name = `KTV. ${name.replace(/^(Kỹ thuật viên|KTV|KTV\.)\s*/i, '')}`;
          }

          return {
            _id: item._id,
            staffCode: item.staffCode || item.customId || (isAdmin ? 'AD-001' : 'NV-00'),
            staffName: name,
            phone: item.phone || '',
            roleType: role,
            title: isAdmin
              ? 'Quản trị viên hệ thống'
              : (item.title || (role === 'doctor' ? 'Bác sĩ Da liễu' : 'Kỹ thuật viên')),
            experienceYears: Number(item.experienceYears) || (isAdmin ? 5 : 2),
            rating: Number(item.rating) || 5,
            status: item.status === 'leave' ? 'leave' : 'working'
          };
        });

        this.staffList.set(mapped);
      },
      error: (err) => console.error('Lỗi tải nhân sự:', err)
    });

    // 2. Nạp lịch trực của tuần
    const from = this.weekStart();
    const to = this.weekDays()[6]?.date || from;
    this.http.get<any>(`/api/admin/schedules?from=${from}&to=${to}`).subscribe({
      next: (res) => {
        const list = Array.isArray(res) ? res : (res?.data || []);
        this.scheduleList.set(list);
      },
      error: () => this.scheduleList.set([])
    });
  }

  selectStaffForSchedule(staff: DetailedStaff): void {
    this.newSchedule.staffId = staff._id;
    this.scheduleStaffSearch.set(`${staff.staffName} (${staff.staffCode})`);
    this.isStaffSelectDropdownOpen.set(false);
  }

  getStaffName(staffId: string): string {
    return this.staffList().find(s => s._id === staffId)?.staffName || 'Chưa gán';
  }

  getSchedulesForCell(staffId: string, date: string): Schedule[] {
    return this.scheduleList()
      .filter(s => (s.staffId === staffId || (s.staffId as any)?._id === staffId) && s.date === date)
      .sort((a, b) => {
        const shiftOrder: Record<string, number> = { sang: 1, chieu: 2, toi: 3 };
        return shiftOrder[a.shift] - shiftOrder[b.shift];
      });
  }

  getShiftLabel(shift: string): string {
    const labels: Record<string, string> = { sang: 'Sáng', chieu: 'Chiều', toi: 'Tối' };
    return labels[shift] || shift;
  }

  changeWeek(offset: number): void {
    const date = new Date(this.timelineDate() + 'T00:00:00');
    date.setDate(date.getDate() + offset * 7);
    this.timelineDate.set(this.getLocalDateString(date));
    this.loadData();
  }

  goToCurrentWeek(): void {
    this.timelineDate.set(this.getLocalDateString(new Date()));
    this.loadData();
  }

  generateNextStaffCode(roleType: 'doctor' | 'ktv' | 'admin' = 'ktv'): string {
    const list = this.staffList().filter(s => s.roleType === roleType);
    let prefix = 'KTV-';
    if (roleType === 'doctor') prefix = 'BS-';
    else if (roleType === 'admin') prefix = 'AD-';

    const numbers = list.map(s => {
      const match = (s.staffCode || '').match(/\d+/);
      return match ? parseInt(match[0], 10) : 0;
    });

    const max = numbers.length > 0 ? Math.max(...numbers) : 0;
    return `${prefix}${String(max + 1).padStart(3, '0')}`;
  }

  openAddStaff(): void {
    this.isEditMode.set(false);
    const defaultRole: 'doctor' | 'ktv' = 'doctor';
    this.staffForm = {
      staffCode: this.generateNextStaffCode(defaultRole),
      staffName: 'BS. ',
      phone: '',
      roleType: defaultRole,
      title: 'Bác sĩ Chuyên khoa Da liễu',
      experienceYears: 5,
      rating: 5,
      status: 'working'
    };
    this.isStaffModalOpen.set(true);
  }

  onRoleTypeFormChange(newRole: 'doctor' | 'ktv' | 'admin'): void {
    this.staffForm.roleType = newRole;
    if (!this.isEditMode()) {
      this.staffForm.staffCode = this.generateNextStaffCode(newRole);
      if (newRole === 'doctor') {
        this.staffForm.staffName = 'BS. ';
        this.staffForm.title = 'Bác sĩ Da liễu';
      } else if (newRole === 'ktv') {
        this.staffForm.staffName = 'KTV. ';
        this.staffForm.title = 'Kỹ thuật viên';
      } else {
        this.staffForm.staffName = '';
        this.staffForm.title = 'Quản trị viên';
      }
    }
  }

  openEditStaff(staff: DetailedStaff): void {
    this.isEditMode.set(true);
    this.staffForm = { ...staff };
    this.isStaffModalOpen.set(true);
  }

  saveStaff(): void {
    let name = this.staffForm.staffName?.trim() || '';
    const phone = this.staffForm.phone?.trim() || '';

    if (!name || !phone) {
      alert('Vui lòng nhập họ tên và số điện thoại!');
      return;
    }

    if (this.staffForm.roleType === 'doctor' && !name.startsWith('BS.')) {
      name = `BS. ${name.replace(/^(Bác sĩ|BS|BS\.)\s*/i, '')}`;
    } else if (this.staffForm.roleType === 'ktv' && !name.startsWith('KTV.')) {
      name = `KTV. ${name.replace(/^(Kỹ thuật viên|KTV|KTV\.)\s*/i, '')}`;
    }
    this.staffForm.staffName = name;

    if (this.isEditMode() && this.staffForm._id) {
      this.http.put(`/api/admin/staffs/${this.staffForm._id}`, this.staffForm).subscribe({
        next: () => {
          this.loadData();
          this.isStaffModalOpen.set(false);
        },
        error: (err) => alert('Lỗi khi sửa nhân sự!')
      });
    } else {
      this.http.post('/api/admin/staffs', this.staffForm).subscribe({
        next: () => {
          this.loadData();
          this.isStaffModalOpen.set(false);
        },
        error: (err) => alert('Lỗi khi tạo nhân sự mới!')
      });
    }
  }

  onStatusChange(staff: DetailedStaff, newStatus: 'working' | 'leave'): void {
    this.http.put(`/api/admin/staffs/${staff._id}`, { status: newStatus }).subscribe({
      next: () => this.loadData()
    });
  }

  deleteStaff(staff: DetailedStaff): void {
    this.confirmDialog.confirm({
      title: 'Xóa nhân sự',
      message: `Xác nhận xóa hoàn toàn nhân sự "${staff.staffName}" (${staff.staffCode})?`,
      confirmText: 'Xóa ngay',
      type: 'danger',
      action: () => {
        this.http.delete(`/api/admin/staffs/${staff._id}`).subscribe({
          next: () => this.loadData()
        });
      }
    });
  }

  saveSchedule(): void {
    if (!this.newSchedule.staffId || !this.newSchedule.date) {
      alert('Vui lòng chọn nhân viên và ngày làm việc!');
      return;
    }

    this.http.post('/api/admin/schedules', this.newSchedule).subscribe({
      next: () => {
        this.loadData();
        alert('Đã lưu ca trực thành công vào cơ sở dữ liệu!');
      },
      error: (err) => {
        console.error('Lỗi lưu ca trực:', err);
        alert('Không thể lưu ca trực. Vui lòng thử lại!');
      }
    });
  }

  viewWeeklySchedule(staffId: string): void {
    const staffName = this.getStaffName(staffId);
    const weekDates = this.weekDays().map(day => day.date);
    const weeklySchedules = this.scheduleList().filter(
      s => (s.staffId === staffId || (s.staffId as any)?._id === staffId) && weekDates.includes(s.date)
    );
    this.selectedStaffWeekly.set({ staffName, schedules: weeklySchedules });
  }

  getStaffWeeklyStatus(staffId: string): boolean {
    const weekDates = this.weekDays().map(day => day.date);
    const schedules = this.scheduleList().filter(
      s => (s.staffId === staffId || (s.staffId as any)?._id === staffId) && weekDates.includes(s.date)
    );
    return schedules.length > 0 && schedules.every(schedule => schedule.isOff);
  }
}