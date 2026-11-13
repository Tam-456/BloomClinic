export interface Schedule {
  _id?: string;
  staffId: string;
  date: string; // Định dạng YYYY-MM-DD
  shift: 'sang' | 'chieu' | 'toi';
  isOff: boolean;
  maxCapacity: number;
}