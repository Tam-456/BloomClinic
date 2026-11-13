// MOCK – Compact price list data grouped by category for Bloom Beauty & Wellness

import { CategoryGroup } from '../interfaces/service.interface';

export interface IPriceRow {
  serviceName: string;
  durationMinutes: number;
  unit: string;
  price: number;
  note?: string;
  slug?: string;
}

export interface IPriceCategorySection {
  group: CategoryGroup;
  title: string;
  description: string;
  rows: IPriceRow[];
}

export const MOCK_PRICE_TABLES: IPriceCategorySection[] = [
  {
    group: 'dieu-tri-da',
    title: 'Điều trị da chuyên khoa',
    description: 'Phác đồ chuẩn y khoa được bác sĩ CKI Da liễu trực tiếp thăm khám và theo dõi.',
    rows: [
      {
        serviceName: 'Điều trị mụn chuyên sâu chuẩn y khoa',
        durationMinutes: 75,
        unit: 'Buổi',
        price: 850000,
        note: 'Bao gồm lấy nhân mụn vô khuẩn & chiếu ánh sáng sinh học',
        slug: 'dieu-tri-mun-chuyen-sau-s1',
      },
      {
        serviceName: 'Peel da sinh học mờ nám & sáng da',
        durationMinutes: 60,
        unit: 'Buổi',
        price: 1850000,
        note: 'Acid hữu cơ đa tầng kết hợp điện di dưỡng chất',
        slug: 'peel-da-sinh-hoc-tri-nam-s2',
      },
      {
        serviceName: 'Laser Fractional CO2 trị sẹo rỗ',
        durationMinutes: 90,
        unit: 'Buổi',
        price: 2500000,
        note: 'Bác sĩ trực tiếp thực hiện, tặng kèm tế bào gốc phục hồi',
      },
      {
        serviceName: 'Khám và soi da chuyên sâu',
        durationMinutes: 30,
        unit: 'Lượt',
        price: 200000,
        note: 'Miễn phí khi khách hàng sử dụng dịch vụ trong ngày',
      },
    ],
  },
  {
    group: 'cham-soc-da',
    title: 'Chăm sóc & Phục hồi da',
    description: 'Liệu pháp thư giãn, thanh lọc và nuôi dưỡng màng bảo vệ tự nhiên của làn da.',
    rows: [
      {
        serviceName: 'Chăm sóc da chuyên sâu Hydrate & Glow',
        durationMinutes: 60,
        unit: 'Buổi',
        price: 650000,
        note: 'Cấp ẩm sâu đa tầng kết hợp massage nâng cơ kiểu Nhật',
        slug: 'cham-soc-da-chuyen-sau-s3',
      },
      {
        serviceName: 'Phục hồi da nhạy cảm & củng cố màng lipid',
        durationMinutes: 70,
        unit: 'Buổi',
        price: 790000,
        note: 'Điện di lạnh Cryo tinh chất Ceramide + B5 tinh khiết',
        slug: 'phuc-hoi-da-nhay-cam-s4',
      },
      {
        serviceName: 'Chăm sóc da cơ bản thanh lọc bụi mịn',
        durationMinutes: 45,
        unit: 'Buổi',
        price: 390000,
        note: 'Làm sạch sâu bã nhờn, hút dầu và đắp mặt nạ thảo mộc',
      },
      {
        serviceName: 'Proto Relax Facial & Cổ vai gáy',
        durationMinutes: 60,
        unit: 'Buổi',
        price: 490000,
        note: 'Liệu trình thư giãn giảm căng thẳng thần kinh hiệu quả',
      },
    ],
  },
  {
    group: 'tre-hoa-nang-co',
    title: 'Trẻ hóa & Nâng cơ công nghệ cao',
    description: 'Các giải pháp thẩm mỹ nội khoa không phẫu thuật với hiệu quả lâu dài.',
    rows: [
      {
        serviceName: 'Cấy Meso Shine cấp ẩm căng bóng tức thì',
        durationMinutes: 60,
        unit: 'Buổi',
        price: 2990000,
        note: 'Tinh chất HA Thụy Sĩ kết hợp vi chất tái sinh da',
        slug: 'cay-ha-cang-bong-mezo-s6',
      },
      {
        serviceName: 'Nâng cơ trẻ hóa đa tầng Ultra-Lift (HIFU)',
        durationMinutes: 90,
        unit: 'Buổi',
        price: 3200000,
        note: 'Tác động sâu lớp SMAS, định hình đường viền khuôn mặt',
        slug: 'nang-co-hifu-tre-hoa-s5',
      },
      {
        serviceName: 'Tiêm xóa nhăn vùng trán / đuôi mắt (Botox Allergan)',
        durationMinutes: 45,
        unit: 'Vùng',
        price: 3500000,
        note: 'Chính hãng Allergan Hoa Kỳ, bác sĩ CKI thực hiện',
      },
      {
        serviceName: 'Tạo hình cằm V-line tự nhiên (Filler Juvederm)',
        durationMinutes: 45,
        unit: '1cc',
        price: 5500000,
        note: 'Cam kết mở hộp kiểm tra mã vạch trước khi tiêm',
      },
    ],
  },
  {
    group: 'triet-long',
    title: 'Triệt lông công nghệ Laser Diode',
    description: 'Triệt tiêu nang lông tận gốc, không bỏng rát, làm sáng và mịn màng vùng da trị liệu.',
    rows: [
      {
        serviceName: 'Triệt lông Diode Laser vùng nách & làm sáng',
        durationMinutes: 30,
        unit: 'Buổi',
        price: 350000,
        note: 'Đầu làm mát Sapphire -5°C êm ái, khử thâm hiệu quả',
        slug: 'triet-long-laser-diode-nach-s7',
      },
      {
        serviceName: 'Triệt lông mép / cằm / trán',
        durationMinutes: 20,
        unit: 'Buổi',
        price: 170000,
        note: 'Nhẹ nhàng cho vùng da mặt mỏng manh nhạy cảm',
      },
      {
        serviceName: 'Triệt lông 1/2 tay hoặc 1/2 chân',
        durationMinutes: 45,
        unit: 'Buổi',
        price: 690000,
        note: 'Hỗ trợ cải thiện tình trạng viêm lỗ chân lông',
      },
      {
        serviceName: 'Triệt lông toàn thân Nano Ice Master',
        durationMinutes: 90,
        unit: 'Buổi',
        price: 1890000,
        note: 'Trọn gói toàn thân, bảo hành chu đáo',
        slug: 'triet-long-toan-than-s8',
      },
    ],
  },
];

