// MOCK – Educational articles data for Bloom Beauty & Wellness
// All data conforms to IArticle interface.

import { IArticle } from '../interfaces/article.interface';
import { IStaff } from '../interfaces/staff.interface';
import { MOCK_DOCTORS } from './home.mock';

export const MOCK_ARTICLES_LIST: IArticle[] = [
  {
    _id: 'art-01',
    title: 'Bí quyết chăm sóc da dầu mụn đúng cách trong mùa hanh khô',
    slug: 'bi-quyet-cham-soc-da-dau-mun-dung-cach-a1',
    category: 'dieu-tri-mun',
    authorStaffId: 'mock-staff-1',
    summary: 'Hiểu đúng về cơ chế tiết dầu và cách cân bằng độ ẩm cần thiết giúp kiểm soát mụn hiệu quả mà không làm suy yếu hàng rào bảo vệ tự nhiên.',
    thumbnail: 'assets/images/article-mun.jpg',
    createdAt: '2026-10-18T08:30:00.000Z',
    contentHtml: `
      <p>Khi thời tiết chuyển mùa, làn da dầu mụn thường phản ứng tiêu cực bằng cách tăng tiết bã nhờn quá mức do thiếu hụt độ ẩm bề mặt. Sai lầm phổ biến của nhiều người là sử dụng các sản phẩm làm sạch có tính tẩy rửa mạnh khiến lớp màng ẩm tự nhiên bị tổn thương, từ đó kích thích tuyến dầu hoạt động mạnh hơn và tạo điều kiện cho vi khuẩn mụn phát triển.</p>
      <p>Để chăm sóc da dầu mụn hiệu quả, nguyên tắc cốt lõi là làm sạch dịu nhẹ với sữa rửa mặt có độ pH chuẩn từ 5.0 đến 5.5. Sau đó, ưu tiên bổ sung các hoạt chất cấp ẩm gốc nước như Hyaluronic Acid, Glycerin kết hợp tinh chất làm dịu như Niacinamide hoặc chiết xuất rau má. Đừng quên thoa kem chống nắng mỏng nhẹ không gây bít tắc lỗ chân lông mỗi sáng.</p>
      <p>Việc duy trì thói quen sinh hoạt khoa học, uống đủ nước và ngủ đủ giấc cũng đóng vai trò then chốt trong việc kiểm soát dầu thừa từ bên trong cơ thể.</p>
      <h2>Quy trình chăm sóc đơn giản</h2>
      <p>Buổi sáng, rửa mặt dịu nhẹ, dưỡng ẩm mỏng và thoa kem chống nắng phù hợp. Buổi tối, làm sạch lớp chống nắng rồi dưỡng ẩm. Nếu muốn thử hoạt chất trị mụn, hãy bắt đầu từng sản phẩm một, dùng thưa ngày và theo dõi phản ứng của da.</p>
      <h2>Khi nào nên gặp bác sĩ?</h2>
      <p>Nên đặt lịch khám nếu mụn viêm đau, lan rộng, để lại sẹo hoặc không cải thiện sau một thời gian chăm sóc ổn định. Tránh tự nặn mụn và không tự phối hợp nhiều hoạt chất mạnh cùng lúc.</p>
      <p class="article-disclaimer text-muted fst-italic border-start border-3 ps-3 mt-4 border-danger">
        * Lưu ý: Thông tin chỉ mang tính tham khảo, vui lòng thăm khám bác sĩ chuyên khoa da liễu để được chẩn đoán chính xác tình trạng da và xây dựng phác đồ điều trị cá nhân hoá.
      </p>
    `,
  },
  {
    _id: 'art-02',
    title: 'Hướng dẫn phục hồi màng bảo vệ da sau kích ứng mỹ phẩm',
    slug: 'huong-dan-phuc-hoi-hang-rao-bao-ve-da-a2',
    category: 'cham-soc-da',
    authorStaffId: 'mock-staff-2',
    summary: 'Cách nhận biết dấu hiệu hàng rào bảo vệ da bị tổn thương và các bước tinh giản chu trình chăm sóc giúp da nhanh chóng lấy lại trạng thái cân bằng.',
    thumbnail: 'assets/images/article-cham-soc-da.jfif',
    createdAt: '2026-10-25T14:15:00.000Z',
    contentHtml: `
      <p>Hàng rào biểu bì đóng vai trò như lá chắn sinh học ngăn ngừa thoát hơi nước và bảo vệ da trước tác nhân gây hại từ môi trường. Khi lạm dụng các hoạt chất treatment mạnh hoặc sử dụng sản phẩm không rõ nguồn gốc, lớp màng này rất dễ bị suy yếu, biểu hiện bằng cảm giác châm chích, ửng đỏ và bề mặt da khô ráp bất thường.</p>
      <p>Khi nhận thấy các dấu hiệu trên, bước đầu tiên là tạm ngưng ngay mọi hoạt chất tẩy tế bào chết hóa học hay treatment có tính acid. Hãy tinh giản chu trình về ba bước cơ bản: làm sạch bằng nước tẩy trang dịu nhẹ, cấp ẩm phục hồi với Ceramide, Vitamin B5 (Panthenol) hoặc Madecassoside, và khóa ẩm bằng kem dưỡng chuyên biệt.</p>
      <p>Trong giai đoạn nhạy cảm này, hạn chế chạm tay lên mặt và tuyệt đối không tự ý nặn mụn hay sử dụng mẹo dân gian truyền miệng để tránh làm tổn thương lan rộng.</p>
      <h2>Chu trình phục hồi tối giản</h2>
      <p>Tạm ngưng sản phẩm mới và các hoạt chất dễ gây kích ứng như acid tẩy da chết hoặc retinoid. Dùng sữa rửa mặt dịu nhẹ, kem dưỡng không hương liệu và chống nắng; tránh chà xát, tẩy tế bào chết và thử mẹo dân gian lên vùng da đang kích ứng.</p>
      <h2>Theo dõi phản ứng của da</h2>
      <p>Ưu tiên sản phẩm có bảng thành phần đơn giản, thử trước trên vùng da nhỏ và chỉ thêm lại từng sản phẩm khi da đã ổn định. Nếu đỏ rát kéo dài, sưng, đau hoặc nổi mụn nước, hãy ngừng sản phẩm nghi ngờ và liên hệ bác sĩ da liễu.</p>
      <p class="article-disclaimer text-muted fst-italic border-start border-3 ps-3 mt-4 border-danger">
        * Lưu ý: Thông tin chỉ mang tính tham khảo, vui lòng thăm khám bác sĩ chuyên khoa da liễu để được chẩn đoán chính xác tình trạng da và xây dựng phác đồ điều trị cá nhân hoá.
      </p>
    `,
  },
  {
    _id: 'art-03',
    title: 'Những điều cần biết khi bắt đầu quy trình chống lão hóa sớm',
    slug: 'nhung-dieu-can-biet-khi-chong-lao-hoa-som-a3',
    category: 'chong-lao-hoa',
    authorStaffId: 'mock-staff-3',
    summary: 'Từ sau 25 tuổi, lượng collagen tự nhiên suy giảm dần. Chăm sóc đúng từ sớm sẽ giữ gìn độ đàn hồi và sự tươi trẻ lâu dài cho làn da.',
    thumbnail: 'assets/images/article-chong-lao-hoa.jpg',
    createdAt: '2026-11-02T09:00:00.000Z',
    contentHtml: `
      <p>Lão hóa da là tiến trình sinh học tự nhiên nhưng chịu ảnh hưởng rất lớn từ các yếu tố ngoại sinh như tia cực tím, ô nhiễm không khí và căng thẳng kéo dài. Ngay từ độ tuổi 25, lượng collagen và elastin trong hạ bì bắt đầu sụt giảm trung bình 1% mỗi năm, khiến da dần xuất hiện các nếp nhăn li ti và mất đi vẻ căng mướt vốn có.</p>
      <p>Chống lão hóa hiệu quả bắt đầu từ việc phòng ngừa hơn là sửa chữa. Thói quen sử dụng kem chống nắng quang phổ rộng hàng ngày là bước bảo vệ quan trọng nhất, ngăn chặn tới 80% tác hại từ tia tử ngoại. Bên cạnh đó, bổ sung các chất chống oxy hóa như Vitamin C vào buổi sáng và phái sinh Vitamin A (Retinoids) nồng độ thấp vào buổi tối sẽ hỗ trợ kích thích tái tạo tế bào mới.</p>
      <p>Hãy kết hợp các liệu trình chăm sóc chuyên sâu định kỳ tại cơ sở y tế uy tín để duy trì độ đàn hồi tối ưu cho cấu trúc nền của da.</p>
      <h2>Bắt đầu từ những thói quen nền tảng</h2>
      <p>Chống nắng phổ rộng mỗi ngày, dưỡng ẩm phù hợp và làm sạch nhẹ nhàng là những bước nền tảng có thể duy trì lâu dài. Khi dùng retinoid hoặc vitamin C, hãy chọn sản phẩm phù hợp với tình trạng da, bắt đầu từ từ và tránh thay đổi nhiều sản phẩm cùng lúc.</p>
      <h2>Kỳ vọng thực tế và an toàn</h2>
      <p>Không có một quy trình chống lão hóa phù hợp với tất cả mọi người. Hiệu quả phụ thuộc vào tình trạng da, cách sử dụng và mức độ bảo vệ trước ánh nắng. Người đang mang thai, cho con bú hoặc có bệnh lý da nên hỏi ý kiến nhân viên y tế trước khi dùng hoạt chất điều trị.</p>
      <p class="article-disclaimer text-muted fst-italic border-start border-3 ps-3 mt-4 border-danger">
        * Lưu ý: Thông tin chỉ mang tính tham khảo, vui lòng thăm khám bác sĩ chuyên khoa da liễu để được chẩn đoán chính xác tình trạng da và xây dựng phác đồ điều trị cá nhân hoá.
      </p>
    `,
  },
];

export function getArticleAuthor(authorStaffId: string): IStaff | undefined {
  return MOCK_DOCTORS.find((d) => d._id === authorStaffId) || MOCK_DOCTORS[0];
}
