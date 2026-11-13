// MOCK – home page data for HomepageComponent
// Replace individual observables with HttpClient calls when API is ready.

import { IService } from '../interfaces/service.interface';
import { IStaff } from '../interfaces/staff.interface';
import { IArticle } from '../interfaces/article.interface';

// ── Stats strip ───────────────────────────────────────────────
export interface IHomeStat {
  value: number;      // target counter value
  suffix: string;     // e.g. '+', '%', 'K+'
  label: string;
}

export const MOCK_HOME_STATS: IHomeStat[] = [
  { value: 12,  suffix: 'K+', label: 'Khách hàng đồng hành' },
  { value: 38,  suffix: 'K+', label: 'Liệu trình thực hiện thành công' },
  { value: 8,   suffix: '+',  label: 'Bác sĩ Chuyên khoa Da liễu' },
  { value: 98,  suffix: '%',  label: 'Khách hàng hài lòng & gắn bó' },
];

// ── Why-choose cards ──────────────────────────────────────────
export interface IWhyCard {
  icon: string;   // Bootstrap Icon class
  title: string;
  body: string;
}

export const MOCK_WHY_CARDS: IWhyCard[] = [
  {
    icon: 'bi-person-badge-fill',
    title: 'Bác sĩ CKI Da liễu trực tiếp thăm khám',
    body: '100% bác sĩ trực tiếp soi da, chẩn đoán và theo sát từng buổi trị liệu. Giàu kinh nghiệm lâm sàng tại các bệnh viện da liễu lớn.',
  },
  {
    icon: 'bi-clipboard2-pulse-fill',
    title: 'Phác đồ chuyên biệt cho từng làn da',
    body: 'Không rập khuôn hay sao chép liệu trình. Mỗi khách hàng được thiết kế phác đồ riêng biệt dựa trên tình trạng da và cơ địa thực tế.',
  },
  {
    icon: 'bi-receipt',
    title: 'Minh bạch chi phí & Không chèo kéo',
    body: 'Tư vấn đúng tình trạng, chỉ định đúng dịch vụ cần thiết. Báo giá trọn gói ngay từ đầu, tuyệt đối không phát sinh chi phí ẩn.',
  },
  {
    icon: 'bi-stars',
    title: 'Công nghệ tân tiến & Dược mỹ phẩm chính hãng',
    body: 'Hệ thống máy móc đạt chuẩn y khoa quốc tế (FDA, CE), kết hợp các dòng dược mỹ phẩm cao cấp nhập khẩu chính ngạch từ Pháp, Mỹ.',
  },
];

// ── Service group showcase cards ──────────────────────────────
export interface IServiceGroupCard {
  slug: string;         // ?group= param value
  label: string;
  image: string;        // path relative to src/assets
  tagline: string;
}

export const MOCK_SERVICE_GROUPS: IServiceGroupCard[] = [
  {
    slug: 'triet-long',
    label: 'Triệt lông Diode Laser',
    image: 'assets/images/service-triet-long.jpg',
    tagline: 'Công nghệ làm lạnh sâu êm ái, sạch nang lông và se khít lỗ chân lông',
  },
  {
    slug: 'cham-soc-da',
    label: 'Chăm sóc & Phục hồi da',
    image: 'assets/images/service-cham-soc-da.jpg',
    tagline: 'Thanh lọc đa tầng, cân bằng độ ẩm và nuôi dưỡng màng bảo vệ tự nhiên',
  },
  {
    slug: 'dieu-tri-da',
    label: 'Điều trị Da liễu chuyên sâu',
    image: 'assets/images/service-dieu-tri.jpg',
    tagline: 'Giải quyết triệt để mụn, nám, tàn nhang và sẹo rỗ theo chuẩn y khoa',
  },
  {
    slug: 'tiem-noi-khoa',
    label: 'Thẩm mỹ Da liễu nội khoa',
    image: 'assets/images/service-tiem-noi-khoa.jpg',
    tagline: 'Trẻ hóa, căng bóng và thon gọn tự nhiên với Botox, Filler, Meso chuẩn hãng',
  },
];

// ── Featured price highlights ─────────────────────────────────
export interface IFeaturedPrice {
  name: string;
  price: number;       // VND
  badge?: string;      // e.g. 'Nổi bật', 'Mới'
}

export const MOCK_FEATURED_PRICES: IFeaturedPrice[] = [
  { name: 'Chăm sóc da thư giãn Proto Relax (60 phút)', price: 490000,   badge: 'Được yêu thích' },
  { name: 'Triệt lông Diode Laser (vùng mép / cằm / trán)', price: 170000,   badge: 'Ưu đãi trải nghiệm' },
  { name: 'Peel phục hồi & Tái tạo cấu trúc da',       price: 1990000 },
  { name: 'Meso Căng bóng & Phục hồi chuyên sâu',     price: 2990000,  badge: 'Công nghệ mới' },
];

// ── Journey steps ─────────────────────────────────────────────
export interface IJourneyStep {
  step: number;
  icon: string;   // Bootstrap Icon class
  title: string;
  body: string;
}

export const MOCK_JOURNEY_STEPS: IJourneyStep[] = [
  {
    step: 1,
    icon: 'bi-clipboard2-check-fill',
    title: 'Soi da & Thăm khám',
    body: 'Bác sĩ kiểm tra cấu trúc da bằng máy soi đa quang phổ 3D, phân tích tầng sâu và lắng nghe mong muốn của bạn.',
  },
  {
    step: 2,
    icon: 'bi-journal-medical',
    title: 'Thiết kế phác đồ',
    body: 'Xây dựng kế hoạch điều trị khoa học, xác định rõ lộ trình hồi phục, thời gian và chi phí trọn gói rõ ràng.',
  },
  {
    step: 3,
    icon: 'bi-bandaid-fill',
    title: 'Trị liệu vô khuẩn',
    body: 'Thực hiện liệu trình chuẩn y khoa trong phòng điều trị riêng biệt, dụng cụ tiệt trùng nghiêm ngặt cho từng khách.',
  },
  {
    step: 4,
    icon: 'bi-graph-up-arrow',
    title: 'Đồng hành & Tái khám',
    body: 'Bác sĩ theo dõi tiến triển của da, hướng dẫn chu trình dưỡng tại nhà và tái khám định kỳ hoàn toàn miễn phí.',
  },
];

// ── MOCK – Team / Doctors ─────────────────────────────────────
export const MOCK_DOCTORS: IStaff[] = [
  {
    _id: 'mock-staff-1',
    staffName: 'ThS.BS Nguyễn Thị Lan',
    title: 'Bác sĩ CKI Da liễu',
    specialty: 'Chẩn đoán mụn phức tạp, điều trị nám & phục hồi da corticoid',
    rating: 4.9,
    avatar: 'assets/images/doctor-1.jfif',
    status: 'working',
  },
  {
    _id: 'mock-staff-2',
    staffName: 'BS.CKI Trần Minh Khoa',
    title: 'Bác sĩ Chuyên khoa Da liễu',
    specialty: 'Laser thẩm mỹ y khoa, điều trị sẹo rỗ & trẻ hóa đa tầng',
    rating: 4.8,
    avatar: 'assets/images/doctor-2.png',
    status: 'working',
  },
  {
    _id: 'mock-staff-3',
    staffName: 'ThS.BS Phạm Thu Hương',
    title: 'Bác sĩ Da liễu – Thẩm mỹ nội khoa',
    specialty: 'Căng bóng Meso, định hình thon gọn tự nhiên với Botox & Filler',
    rating: 4.9,
    avatar: 'assets/images/doctor-3.png',
    status: 'working',
  },
];

// ── MOCK – Testimonials ───────────────────────────────────────
export interface ITestimonial {
  name: string;
  avatar: string;    // initials fallback
  rating: number;    // 1-5
  date: string;
  text: string;
  service: string;
}

export const MOCK_TESTIMONIALS: ITestimonial[] = [
  {
    name: 'Nguyễn Hà My',
    avatar: 'H',
    rating: 5,
    date: 'Tháng 10, 2026',
    service: 'Điều trị mụn chuyên sâu',
    text: 'Điều mình ưng ý nhất ở Bloom là sự nhẹ nhàng, tỉ mỉ của Bác sĩ Lan. Bác sĩ phân tích rất kỹ nguyên nhân vì sao da mình bị bùng mụn sau thời gian dùng mỹ phẩm sai cách, không hề ép mua gói liệu trình đắt tiền. Sau hơn 2 tháng kiên trì theo phác đồ, da mình giờ đã hết sạch mụn viêm, nền da khỏe khoắn và mịn màng hơn hẳn.',
  },
  {
    name: 'Trần Thị Bích Ngọc',
    avatar: 'B',
    rating: 5,
    date: 'Tháng 10, 2026',
    service: 'Triệt lông Diode Laser',
    text: 'Trước đây mình rất ngại đi spa vì sợ bị đau và chèo kéo, nhưng trải nghiệm triệt lông ở Bloom thực sự thoải mái. Đầu máy lạnh băng nên làm rất êm, các bạn kỹ thuật viên thao tác nhẹ nhàng và cực kỳ chu đáo. Phòng ốc riêng tư, thơm mùi thảo mộc dễ chịu. Giá cả báo rõ từ đầu, đúng chuẩn không phát sinh.',
  },
  {
    name: 'Lê Thị Thu Thảo',
    avatar: 'T',
    rating: 5,
    date: 'Tháng 9, 2026',
    service: 'Meso Căng bóng & Peel da',
    text: 'Mình làm liệu trình Meso căng bóng chuẩn bị cho ngày cưới. Bác sĩ Hương làm cực kỳ mát tay, dặn dò chi tiết từng bước chăm sóc da tại nhà sau khi làm. Đến ngày cưới ai cũng khen da cô dâu căng bóng tự nhiên, lớp trang điểm tiệp vào da cả ngày không hề mốc. Rất cảm ơn đội ngũ Bloom!',
  },
];

// ── MOCK – Articles (Knowledge section) ──────────────────────
export const MOCK_ARTICLES: IArticle[] = [
  {
    _id: 'mock-article-1',
    title: 'Mụn trứng cá ở tuổi trưởng thành: Căn nguyên từ gốc và giải pháp điều trị khoa học',
    slug: 'mun-trung-ca-nguyen-nhan-phan-loai',
    category: 'dieu-tri-mun',
    authorStaffId: 'mock-staff-1',
    summary: 'Mụn không chỉ là vấn đề ngoài da mà còn phản ánh sự mất cân bằng bên trong cơ thể. Bác sĩ Da liễu phân tích căn nguyên và lộ trình phục hồi an toàn, hạn chế tái phát.',
    contentHtml: '',
    thumbnail: 'assets/images/article-mun.jpg',
    createdAt: '2026-10-15T08:00:00.000Z',
  },
  {
    _id: 'mock-article-2',
    title: 'Hiểu đúng về sắc tố nám: Phân biệt các loại nám và phương pháp can thiệp chuẩn y khoa',
    slug: 'nam-da-khi-nao-can-gap-bac-si',
    category: 'dieu-tri-nam',
    authorStaffId: 'mock-staff-1',
    summary: 'Nám mảng, nám chân sâu hay nám hỗn hợp đòi hỏi những hướng tiếp cận hoàn toàn khác nhau. Cùng tìm hiểu các giải pháp can thiệp an toàn, tránh làm tổn thương màng đáy.',
    contentHtml: '',
    thumbnail: 'assets/images/article-nam.jfif',
    createdAt: '2026-10-20T08:00:00.000Z',
  },
  {
    _id: 'mock-article-3',
    title: 'Chu trình phục hồi hàng rào bảo vệ da sau kích ứng mỹ phẩm hoặc treatment quá đà',
    slug: 'cham-soc-da-dung-cach-theo-loai-da',
    category: 'cham-soc-da',
    authorStaffId: 'mock-staff-2',
    summary: 'Khi làn da lên tiếng vì quá tải hoạt chất, điều quan trọng nhất là biết cách lắng nghe và đưa da về trạng thái cân bằng tự nhiên với những bước tinh giản chuẩn y khoa.',
    contentHtml: '',
    thumbnail: 'assets/images/article-cham-soc-da.jfif',
    createdAt: '2026-11-01T08:00:00.000Z',
  },
];

// ── MOCK – Services (for booking form select) ─────────────────
export const MOCK_SERVICES: IService[] = [
  { _id: 'svc-1', serviceName: 'Proto Relax – Phục hồi da thư giãn', slug: 'proto-relax', categoryGroup: 'cham-soc-da', price: 490000, durationMinutes: 60, description: '', status: 'active' },
  { _id: 'svc-2', serviceName: 'Triệt lông Diode Laser mép / cằm / trán', slug: 'triet-long-mep-cam-tran', categoryGroup: 'triet-long', price: 170000, durationMinutes: 30, description: '', status: 'active' },
  { _id: 'svc-3', serviceName: 'Peel phục hồi tái tạo cấu trúc da', slug: 'peel-mat-chuyen-sau', categoryGroup: 'dieu-tri-da', price: 1990000, durationMinutes: 75, description: '', status: 'active' },
  { _id: 'svc-4', serviceName: 'Meso Căng bóng & Trẻ hóa vi điểm', slug: 'mezo-shine', categoryGroup: 'tre-hoa-nang-co', price: 2990000, durationMinutes: 60, description: '', status: 'active' },
  { _id: 'svc-5', serviceName: 'Điều trị mụn chuyên sâu chuẩn y khoa', slug: 'dieu-tri-mun-chuyen-sau', categoryGroup: 'dieu-tri-da', price: 850000, durationMinutes: 60, description: '', status: 'active' },
  { _id: 'svc-6', serviceName: 'Thăm khám & Tư vấn da liễu 1:1', slug: 'tu-van-da-lieu', categoryGroup: 'cham-soc-da', price: 0, durationMinutes: 30, description: '', status: 'active' },
];

// ── MOCK – FAQ ────────────────────────────────────────────────
export interface IFaqItem {
  question: string;
  answer: string;
}

export const MOCK_FAQ: IFaqItem[] = [
  {
    question: 'Tôi có cần đặt lịch hẹn trước khi đến phòng khám không?',
    answer: 'Dạ có, Bloom rất khuyến khích bạn đặt lịch hẹn trước. Việc này giúp phòng khám chuẩn bị phòng ốc vô khuẩn chu đáo, đồng thời đảm bảo Bác sĩ có trọn vẹn thời gian thăm khám 1:1 kỹ lưỡng nhất mà bạn không cần phải chờ đợi lâu.',
  },
  {
    question: 'Chi phí điều trị có bị phát sinh thêm trong quá trình làm không?',
    answer: 'Tuyệt đối không ạ. Tại Bloom, nguyên tắc cốt lõi là sự trung thực và minh bạch. Bác sĩ chỉ thăm khám và tư vấn chi phí trọn gói rõ ràng ngay từ đầu. Bạn chỉ tiến hành điều trị khi đã hoàn toàn yên tâm và đồng thuận với phác đồ.',
  },
  {
    question: 'Liệu trình điều trị mụn hoặc sắc tố da thường mất bao lâu để thấy hiệu quả?',
    answer: 'Tùy theo tình trạng nền da, thông thường bạn sẽ nhận thấy sự cải thiện tích cực ngay sau 2 - 3 buổi điều trị đầu tiên. Với mụn viêm hoặc nám chân sâu, phác đồ chuẩn y khoa thường kéo dài từ 6 - 12 tuần. Bác sĩ sẽ đồng hành điều chỉnh hoạt chất qua từng buổi hẹn để đạt hiệu quả tối ưu nhất.',
  },
  {
    question: 'Tôi có thể gửi hình ảnh tình trạng da qua Zalo để Bác sĩ tư vấn trước không?',
    answer: 'Dạ hoàn toàn được ạ. Bạn có thể gửi ảnh chụp da cận cảnh qua Zalo phòng khám hoặc Hotline 1900 6789. Đội ngũ trợ lý y khoa cùng Bác sĩ sẽ xem xét sơ bộ và đưa ra lời khuyên chăm sóc ban đầu trước khi bạn đến thăm khám trực tiếp.',
  },
  {
    question: 'Tôi có thể đi cùng bạn bè hoặc người thân khi đến làm đẹp không?',
    answer: 'Rất hoan nghênh bạn và người thân cùng ghé Bloom! Chúng tôi có sảnh chờ đón tiếp ấm cúng, phục vụ trà hoa thảo mộc, nước hạt dinh dưỡng và wifi tốc độ cao để người đi cùng luôn cảm thấy thư giãn và thoải mái như ở nhà.',
  },
];
