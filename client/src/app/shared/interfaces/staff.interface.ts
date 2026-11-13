export interface Staff {
  _id?: string;
  userId?: string;
  staffCode?: string;
  staffName: string;
  title: string;
  department?: string;
  specialty?: string;
  rating?: number;
  avatar?: string;
  status: 'working' | 'leave' | 'inactive';
  phone?: string;
  experienceYears?: number;
  roleType?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export type IStaff = Staff;
