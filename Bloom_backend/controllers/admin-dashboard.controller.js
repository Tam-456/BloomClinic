const Invoice = require('../models/Invoice');
const Booking = require('../models/Booking');
const User = require('../models/User');
const Product = require('../models/Product');
const CustomerTreatment = require('../models/CustomerTreatment');

exports.getDashboardStats = async (req, res, next) => {
  try {
    // 1. Lấy mốc ngày hôm nay theo chuẩn ISO YYYY-MM-DD
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

    const startOfDay = new Date(`${todayStr}T00:00:00.000Z`);
    const endOfDay = new Date(`${todayStr}T23:59:59.999Z`);

    // 2. DÙNG CHUNG CÔNG THỨC VỚI REVENUE REPORT:
    // Chỉ tính hóa đơn ĐÃ XUẤT (exported) trong ngày hôm nay
    const todayInvoices = await Invoice.find({
      status: 'exported',
      deletedAt: null,
      createdAt: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    });

    // 3. Tính tổng số tiền thực thu (paidAmount)
    const todayRevenue = todayInvoices.reduce((sum, inv) => {
      const invTotal = Number(inv.totalAmount) || 0;
      const discount = Number(inv.discountAmount) || 0;
      const actualPaid = Number(inv.paidAmount) !== undefined && Number(inv.paidAmount) !== null
        ? Number(inv.paidAmount)
        : (invTotal - discount);
      return sum + actualPaid;
    }, 0);

    // 4. Lịch hẹn chờ duyệt
    const pendingBookingsCount = await Booking.countDocuments({ status: 'pending' }).catch(() => 0);

    // 5. ĐỒNG BỘ ĐANG ĐIỀU TRỊ:
    // Đếm số lượng KHÁCH HÀNG duy nhất có liệu trình chưa hoàn thành (còn buổi > 0 và trạng thái active)
    const activeCustomerIds = await CustomerTreatment.distinct('customerId', {
      status: 'active',
      remainingSessions: { $gt: 0 }
    }).catch(() => []);
    const inTreatmentCount = activeCustomerIds.length;

    // 6. Cảnh báo sản phẩm sắp hết hàng (tồn <= 5)
    const lowStockCount = await Product.countDocuments({ stockQuantity: { $lte: 5 }, deletedAt: null }).catch(() => 0);

    // 7. Tổng số khách hàng
    const totalCustomers = await User.countDocuments({ role: 'customer' }).catch(() => 0);

    return res.json({
      success: true,
      data: {
        todayRevenue,
        pendingBookingsCount,
        inTreatmentCount,
        lowStockCount,
        totalCustomers
      }
    });
  } catch (error) {
    console.error('Lỗi tính dashboard stats:', error);
    next(error);
  }
};