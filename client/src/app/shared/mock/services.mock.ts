// MOCK – Services data for Bloom Beauty & Wellness
// All data conforms to IService interface.

import { IService } from '../interfaces/service.interface';

export interface IServiceStep {
  step: number;
  title: string;
  desc: string;
}

export const MOCK_SERVICES_LIST: IService[] = [
  // 1. dieu-tri-da
  {
    _id: 'srv-01',
    serviceName: 'Điều trị mụn chuyên sâu chuẩn y khoa',
    slug: 'dieu-tri-mun-chuyen-sau-s1',
    categoryGroup: 'dieu-tri-da',
    price: 850000,
    durationMinutes: 75,
    description: 'Phác đồ kết hợp lấy nhân mụn chuẩn vô khuẩn, chiếu ánh sáng sinh học BlueLight và đắp mặt nạ làm dịu giảm viêm tức thì.',
    detail: `
      <p>Liệu trình Điều trị mụn chuyên sâu tại Bloom Beauty & Wellness được thiết kế riêng biệt cho làn da đang gặp tình trạng mụn viêm, mụn ẩn và bít tắc lỗ chân lông. Toàn bộ dụng cụ và quy trình đều tuân thủ nguyên tắc vô trùng nghiêm ngặt nhằm tránh lây nhiễm chéo.</p>
      <p>Bác sĩ trực tiếp soi da, đánh giá mức độ tổn thương và chỉ định hoạt chất phù hợp. Quá trình làm dịu với mặt nạ kháng khuẩn sinh học và chiếu ánh sáng đa tầng giúp giảm sưng đỏ nhanh chóng, hỗ trợ tái tạo màng bảo vệ tự nhiên của da.</p>
      <p class="text-muted fst-italic">* Lưu ý: Thông tin chỉ mang tính tham khảo, vui lòng thăm khám bác sĩ chuyên khoa da liễu để được chỉ định phác đồ phù hợp nhất.</p>
    `,
    image: 'assets/images/service-dieu-tri.jpg',
    status: 'active',
  },
  {
    _id: 'srv-02',
    serviceName: 'Peel da sinh học mờ nám & sáng da',
    slug: 'peel-da-sinh-hoc-tri-nam-s2',
    categoryGroup: 'dieu-tri-da',
    price: 1850000,
    durationMinutes: 60,
    description: 'Ứng dụng phức hợp acid hữu cơ nồng độ an toàn giúp bóc tách nhẹ nhàng lớp sừng xỉn màu, ức chế sắc tố melanin và cải thiện tone da.',
    detail: `
      <p>Liệu trình peel da sinh học sử dụng các hoạt chất hữu cơ chuẩn da liễu giúp loại bỏ lớp tế bào sừng già cỗi, kích thích tăng sinh biểu bì mới mà không gây bong tróc quá mức hay tổn thương sâu.</p>
      <p>Sau peel, làn da được điện di tinh chất phục hồi nồng độ cao kết hợp đắp mặt nạ hydrogel làm mát, giúp da nhanh chóng ổn định và đều màu rõ rệt sau từng buổi trị liệu.</p>
      <p class="text-muted fst-italic">* Lưu ý: Thông tin chỉ mang tính tham khảo, vui lòng thăm khám bác sĩ chuyên khoa da liễu để được chỉ định phác đồ phù hợp nhất.</p>
    `,
    image: 'assets/images/article-nam.jfif',
    status: 'active',
  },

  // 2. cham-soc-da
  {
    _id: 'srv-03',
    serviceName: 'Chăm sóc da chuyên sâu Hydrate & Glow',
    slug: 'cham-soc-da-chuyen-sau-s3',
    categoryGroup: 'cham-soc-da',
    price: 650000,
    durationMinutes: 60,
    description: 'Thanh lọc da đa tầng với công nghệ Hydro-facial, cung cấp độ ẩm sâu và dưỡng chất chống oxy hóa cho làn da căng bóng mịn màng.',
    detail: `
      <p>Liệu trình Hydrate & Glow mang lại trải nghiệm thư giãn tinh tế kết hợp chăm sóc da khoa học. Bắt đầu bằng bước làm sạch sâu bằng sóng siêu âm và hút bã nhờn dịu nhẹ, tiếp đến là bước cấp ẩm sâu bằng ion điện di HA phân tử nhỏ.</p>
      <p>Kết thúc bằng động tác massage nâng cơ kiểu Nhật và mặt nạ tảo xoắn thiên nhiên, giúp tăng cường tuần hoàn vi mạch và mang lại vẻ rạng rỡ tự nhiên cho làn da mệt mỏi.</p>
      <p class="text-muted fst-italic">* Lưu ý: Thông tin chỉ mang tính tham khảo, vui lòng thăm khám bác sĩ chuyên khoa da liễu để được chỉ định phác đồ phù hợp nhất.</p>
    `,
    image: 'assets/images/service-cham-soc-da.jpg',
    status: 'active',
  },
  {
    _id: 'srv-04',
    serviceName: 'Phục hồi da nhạy cảm & củng cố màng lipid',
    slug: 'phuc-hoi-da-nhay-cam-s4',
    categoryGroup: 'cham-soc-da',
    price: 790000,
    durationMinutes: 70,
    description: 'Giải pháp êm dịu cho làn da mỏng yếu, kích ứng hoặc sau điều trị xâm lấn với phức hợp Ceramide và B5 tinh khiết.',
    detail: `
      <p>Dành riêng cho những làn da mẫn cảm, dễ đỏ rát do thời tiết hoặc sử dụng mỹ phẩm không phù hợp. Liệu trình tập trung vào việc làm dịu phản ứng quá mẫn và khôi phục hàng rào bảo vệ tự nhiên.</p>
      <p>Với công nghệ làm lạnh Cryo điện di đưa tinh chất B5 và rau má đậm đặc vào sâu dưới da, da lập tức giảm nhiệt độ bề mặt, giảm đỏ và lấy lại độ mềm mại dễ chịu.</p>
      <p class="text-muted fst-italic">* Lưu ý: Thông tin chỉ mang tính tham khảo, vui lòng thăm khám bác sĩ chuyên khoa da liễu để được chỉ định phác đồ phù hợp nhất.</p>
    `,
    image: 'assets/images/spa.jpg',
    status: 'active',
  },

  // 3. tre-hoa-nang-co
  {
    _id: 'srv-05',
    serviceName: 'Nâng cơ trẻ hóa đa tầng Ultra-Lift',
    slug: 'nang-co-hifu-tre-hoa-s5',
    categoryGroup: 'tre-hoa-nang-co',
    price: 3200000,
    durationMinutes: 90,
    description: 'Ứng dụng sóng siêu âm hội tụ vi điểm kích thích sản sinh collagen và elastin tự thân, thon gọn viền hàm và mờ rãnh cười.',
    detail: `
      <p>Công nghệ nâng cơ không xâm lấn tác động chính xác đến lớp cân cơ nông SMAS – nơi nâng đỡ cấu trúc khuôn mặt. Năng lượng nhiệt vi điểm giúp siết chặt các sợi collagen chùng nhão, cải thiện tình trạng nọng cằm và da chảy xệ.</p>
      <p>Bác sĩ trực tiếp điều chỉnh mức năng lượng thích hợp cho từng vùng cơ mặt, đảm bảo hiệu quả tối ưu và cảm giác êm ái, khách hàng có thể sinh hoạt bình thường ngay sau liệu trình.</p>
      <p class="text-muted fst-italic">* Lưu ý: Thông tin chỉ mang tính tham khảo, vui lòng thăm khám bác sĩ chuyên khoa da liễu để được chỉ định phác đồ phù hợp nhất.</p>
    `,
    image: 'assets/images/service-tiem-noi-khoa.jpg',
    status: 'active',
  },
  {
    _id: 'srv-06',
    serviceName: 'Cấy Meso Shine cấp ẩm căng bóng tức thì',
    slug: 'cay-ha-cang-bong-mezo-s6',
    categoryGroup: 'tre-hoa-nang-co',
    price: 2990000,
    durationMinutes: 60,
    description: 'Đưa trực tiếp Hyaluronic Acid không liên kết chéo cùng phức hợp peptide vi lượng vào trung bì nông, nuôi dưỡng da ngậm nước vượt trội.',
    detail: `
      <p>Meso Shine là phương pháp trẻ hóa được ưa chuộng nhờ khả năng cấp ẩm tập trung và nhanh chóng. Kỹ thuật đưa dưỡng chất vi điểm giúp tế bào da tiếp nhận nguồn ẩm dồi dào, thu nhỏ lỗ chân lông và làm mịn bề mặt da khô ráp.</p>
      <p>Sản phẩm sử dụng nguồn gốc chính ngạch từ châu Âu, được bác sĩ thực hiện tỉ mỉ dưới điều kiện vô trùng tuyệt đối, giúp làn da căng mướt và đàn hồi rõ nét sau vài ngày.</p>
      <p class="text-muted fst-italic">* Lưu ý: Thông tin chỉ mang tính tham khảo, vui lòng thăm khám bác sĩ chuyên khoa da liễu để được chỉ định phác đồ phù hợp nhất.</p>
    `,
    image: 'assets/images/service-spa.jfif',
    status: 'active',
  },

  // 4. triet-long
  {
    _id: 'srv-07',
    serviceName: 'Triệt lông Diode Laser vùng nách & làm sáng',
    slug: 'triet-long-laser-diode-nach-s7',
    categoryGroup: 'triet-long',
    price: 350000,
    durationMinutes: 30,
    description: 'Công nghệ bước sóng bán dẫn 808nm triệt tiêu nang lông tận gốc không đau rát, hỗ trợ se khít lỗ chân lông và khử thâm vùng da dưới cánh tay.',
    detail: `
      <p>Diode Laser là tiêu chuẩn vàng trong công nghệ triệt lông hiện đại. Đầu đá Sapphire làm mát -5 độ C tạo cảm giác êm dịu, không gây châm chích hay bỏng rát ngay cả với vùng da nhạy cảm.</p>
      <p>Năng lượng laser tác động chọn lọc vào hắc tố nang lông, làm teo mầm nhú dần qua từng buổi. Vùng da điều trị trở nên sạch thoáng, mịn màng và hạn chế mùi hôi cơ thể hiệu quả.</p>
      <p class="text-muted fst-italic">* Lưu ý: Thông tin chỉ mang tính tham khảo, vui lòng thăm khám bác sĩ chuyên khoa da liễu để được chỉ định phác đồ phù hợp nhất.</p>
    `,
    image: 'assets/images/service-triet-long.jpg',
    status: 'active',
  },
  {
    _id: 'srv-08',
    serviceName: 'Triệt lông toàn thân Nano Ice Master',
    slug: 'triet-long-toan-than-s8',
    categoryGroup: 'triet-long',
    price: 1890000,
    durationMinutes: 90,
    description: 'Gói triệt lông trọn gói toàn thân với công nghệ lạnh kép, xử lý tận gốc nang lông tay, chân, mép, lưng và bikini an toàn tuyệt đối.',
    detail: `
      <p>Gói dịch vụ toàn diện giúp bạn tự tin trong mọi trang phục với làn da mịn màng, không còn tì vết nang lông thô cứng. Quy trình tiến hành nhẹ nhàng bởi chuyên viên được đào tạo chuyên môn cao.</p>
      <p>Sau mỗi buổi, da được bôi tinh chất làm dịu và bảo vệ, hỗ trợ ngăn ngừa tình trạng viêm nang lông và lông mọc ngược thường gặp khi cạo nhổ thông thường.</p>
      <p class="text-muted fst-italic">* Lưu ý: Thông tin chỉ mang tính tham khảo, vui lòng thăm khám bác sĩ chuyên khoa da liễu để được chỉ định phác đồ phù hợp nhất.</p>
    `,
    image: 'assets/images/service-triet-long.jpg',
    status: 'active',
  },
];

export const DEFAULT_SERVICE_STEPS: IServiceStep[] = [
  { step: 1, title: 'Thăm khám & Soi da', desc: 'Bác sĩ da liễu kiểm tra lâm sàng, soi da phân tích chỉ số độ ẩm, bã nhờn và sắc tố.' },
  { step: 2, title: 'Làm sạch & Chuẩn bị', desc: 'Tẩy trang, rửa mặt bằng sản phẩm dược mỹ phẩm dịu nhẹ, cân bằng độ pH da.' },
  { step: 3, title: 'Tiến hành liệu trình', desc: 'Ứng dụng công nghệ hoặc thao tác chuyên môn theo đúng phác đồ y khoa vô khuẩn.' },
  { step: 4, title: 'Điện di & Phục hồi', desc: 'Đắp mặt nạ làm dịu, điện di cấp ẩm sâu và thoa kem dưỡng khóa ẩm chống nắng.' },
  { step: 5, title: 'Hướng dẫn chăm sóc', desc: 'Bác sĩ tư vấn cách chăm sóc da tại nhà và hẹn lịch tái khám kiểm tra kết quả.' },
];

export const MOCK_SERVICE_STEPS: Record<string, IServiceStep[]> = {
  default: DEFAULT_SERVICE_STEPS,
};

export const MOCK_COMMITMENTS = [
  { icon: 'bi-shield-check', title: '100% Bác sĩ CKI Da liễu', desc: 'Trực tiếp thăm khám và theo sát toàn bộ quá trình điều trị.' },
  { icon: 'bi-patch-check', title: 'Thiết bị & Mỹ phẩm chuẩn y khoa', desc: 'Chính hãng, có chứng nhận kiểm định an toàn của Bộ Y tế.' },
  { icon: 'bi-receipt-cutoff', title: 'Chi phí minh bạch tuyệt đối', desc: 'Báo giá rõ ràng trước khi làm, không phát sinh chi phí ẩn.' },
  { icon: 'bi-heart-pulse', title: 'Theo dõi kết quả lâu dài', desc: 'Chế độ chăm sóc hậu mãi và tái khám định kỳ tận tâm.' },
];
