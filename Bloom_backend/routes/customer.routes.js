const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customer.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const passwordChangeMiddleware = require('../middlewares/password-change.middleware');

const Invoice = require('../models/Invoice');
const User = require('../models/User');

const mongoose = require('mongoose');

router.use(authMiddleware, passwordChangeMiddleware);

router.get('/overview', customerController.getOverview);
router.get('/available-schedules', customerController.getAvailableSchedules);

router.get('/bookings', customerController.getMyBookings);
router.post('/bookings', customerController.createBooking);
router.put('/bookings/:id', customerController.updateBooking);
router.put('/bookings/:id/cancel', customerController.cancelBooking);

router.get('/treatments', customerController.getMyTreatments);
router.post('/treatments/:id/reviews', customerController.reviewTreatmentSession);
router.get('/used-history', customerController.getUsedHistory);

router.get('/invoices', customerController.getMyInvoices);
router.put('/profile', customerController.updateProfile);


// POST /api/customer/invoices/:id/pay-debt
router.post('/invoices/:id/pay-debt', async (req, res, next) => {
  try {
    const customerId = req.session?.user?._id;
    if (!customerId) {
      return res.status(401).json({ success: false, message: 'Phiên đăng nhập đã hết hạn!' });
    }

    const invoice = await Invoice.findOne({
      _id: req.params.id,
      customerId,
      deletedAt: null
    }).lean();

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy hóa đơn trong hệ thống!' });
    }

    const currentDebt = Number(invoice.debtAmount) || 0;
    const requestedAmount = Number(req.body?.amount) || currentDebt;
    const payAmount = currentDebt > 0
      ? Math.min(requestedAmount > 0 ? requestedAmount : currentDebt, currentDebt)
      : 0;

    if (payAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Hóa đơn này hiện không còn công nợ!' });
    }

    const newPaidAmount = (Number(invoice.paidAmount) || 0) + payAmount;
    const newDebtAmount = Math.max(0, currentDebt - payAmount);
    const newStatus = (newDebtAmount === 0 && invoice.status !== 'exported') ? 'paid' : invoice.status;

    await Invoice.collection.updateOne(
      { _id: new mongoose.Types.ObjectId(invoice._id) },
      {
        $set: {
          paidAmount: newPaidAmount,
          debtAmount: newDebtAmount,
          paymentMethod: 'banking',
          status: newStatus,
          updatedAt: new Date()
        },
        $push: {
          paymentHistory: {
            paidAt: new Date(),
            amount: payAmount,
            paymentMethod: 'banking',
            channel: 'Thanh toán trực tuyến (Customer Portal)',
            note: `Khách hàng tất toán công nợ hóa đơn ${invoice.invoiceCode}`
          }
        }
      }
    );

    // Đồng bộ lại tổng chi tiêu & hạng thành viên của khách hàng
    const validInvoices = await Invoice.find({ customerId, deletedAt: null }).lean();
    const actualTotalSpent = validInvoices.reduce(
      (sum, inv) => sum + (Number(inv.paidAmount) || 0),
      0
    );

    let updatedTier = 'Standard';
    if (actualTotalSpent >= 30000000) updatedTier = 'Diamond';
    else if (actualTotalSpent >= 15000000) updatedTier = 'Gold';
    else if (actualTotalSpent >= 5000000) updatedTier = 'Silver';

    await User.updateOne(
      { _id: new mongoose.Types.ObjectId(customerId) },
      { $set: { totalSpent: actualTotalSpent, membershipTier: updatedTier } }
    );

    const updatedInvoice = await Invoice.findById(invoice._id).lean();
    console.log('✅ [pay-debt] Đã lưu MongoDB thành công:', updatedInvoice.invoiceCode);

    return res.json({
      success: true,
      message: 'Thanh toán công nợ thành công!',
      data: updatedInvoice
    });
  } catch (error) {
    console.error('❌ [pay-debt] Lỗi:', error);
    next(error);
  }
});

module.exports = router;