const Booking = require('../models/Booking');
const Service = require('../models/Service');
const Staff = require('../models/Staff');
const User = require('../models/User');
const mongoose = require('mongoose');

// GET /api/admin/bookings
exports.getAllBookings = async (req, res, next) => {
  try {
    const { date, status, staffId } = req.query;
    const filter = {};
    if (date) filter.appointmentDate = date;
    if (status && status !== 'all') filter.status = status;
    if (staffId) filter.staffId = staffId;

    const bookings = await Booking.find(filter)
      .populate('customerId', 'fullName phone email membershipTier customerCode customId')
      .populate('serviceId', 'serviceName categoryGroup price durationMinutes')
      .populate('staffId', 'staffName title roleType')
      .sort({ appointmentDate: -1, appointmentTime: -1 });

    return res.json({
      success: true,
      message: 'Lấy danh sách lịch hẹn thành công!',
      data: bookings
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/admin/bookings
exports.createBooking = async (req, res, next) => {
  try {
    const data = req.body;
    const appointmentDate = data.appointmentDate || new Date().toISOString().slice(0, 10);
    const dateStr = appointmentDate.replace(/-/g, '');

    const countToday = await Booking.countDocuments({ appointmentDate });
    const sequenceNumber = String(countToday + 1).padStart(3, '0');
    const autoBookingCode = `BK-${dateStr}-${sequenceNumber}`;

    let validServiceId = null;
    let serviceName = 'Khám & Điều trị da';
    if (data.serviceId && mongoose.Types.ObjectId.isValid(data.serviceId)) {
      validServiceId = data.serviceId;
    } else {
      const matchedService = await Service.findOne({
        $or: [{ categoryGroup: data.serviceId }, { slug: data.serviceId }],
        deletedAt: null
      });
      if (matchedService) {
        validServiceId = matchedService._id;
        serviceName = matchedService.serviceName;
      }
    }

    let validCustomerId = null;
    if (data.customerId && mongoose.Types.ObjectId.isValid(data.customerId)) {
      validCustomerId = data.customerId;
    } else if (data.customerPhone) {
      const existingUser = await User.findOne({ phone: data.customerPhone.trim() });
      if (existingUser) validCustomerId = existingUser._id;
    }

    let validStaffId = null;
    if (data.staffId && mongoose.Types.ObjectId.isValid(data.staffId)) {
      validStaffId = data.staffId;
    }

    const newBooking = new Booking({
      bookingCode: autoBookingCode,
      customerId: validCustomerId,
      customerName: data.customerName?.trim(),
      customerPhone: data.customerPhone?.trim(),
      serviceId: validServiceId,
      serviceName: serviceName,
      staffId: validStaffId,
      appointmentDate: appointmentDate,
      appointmentTime: data.appointmentTime,
      depositAmount: Number(data.depositAmount) || 0,
      note: data.note || '',
      status: 'pending'
    });

    await newBooking.save();

    // Populate đầy đủ thông tin nhân sự trước khi phản hồi về Frontend
    const populated = await Booking.findById(newBooking._id)
      .populate('customerId', 'fullName phone email membershipTier customerCode customId')
      .populate('serviceId', 'serviceName categoryGroup price durationMinutes')
      .populate('staffId', 'staffName title roleType');

    return res.status(201).json({
      success: true,
      message: 'Tạo lịch hẹn thành công!',
      data: populated
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/admin/bookings/:id (Cập nhật thông tin lịch hẹn an toàn)
exports.updateBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const updatePayload = {
      customerName: data.customerName?.trim(),
      customerPhone: data.customerPhone?.trim(),
      appointmentDate: data.appointmentDate,
      appointmentTime: data.appointmentTime,
      depositAmount: Number(data.depositAmount) || 0,
      note: data.note || ''
    };

    // 1. Chuẩn hóa serviceId (Xử lý nếu gửi slug như 'dieu-tri-da')
    if (data.serviceId) {
      if (mongoose.Types.ObjectId.isValid(data.serviceId)) {
        updatePayload.serviceId = data.serviceId;
      } else {
        // Tìm dịch vụ tương ứng với slug/chuyên khoa
        const matchedService = await Service.findOne({
          $or: [{ categoryGroup: data.serviceId }, { slug: data.serviceId }],
          deletedAt: null
        });
        if (matchedService) {
          updatePayload.serviceId = matchedService._id;
          updatePayload.serviceName = matchedService.serviceName;
        }
      }
    }

    // 2. Chuẩn hóa staffId
    if (data.staffId !== undefined) {
      updatePayload.staffId = (data.staffId && mongoose.Types.ObjectId.isValid(data.staffId))
        ? data.staffId
        : null;
    }

    const updated = await Booking.findByIdAndUpdate(
      id,
      { $set: updatePayload },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lịch hẹn cần sửa!'
      });
    }

    return res.json({
      success: true,
      message: 'Cập nhật lịch hẹn thành công!',
      data: updated
    });
  } catch (error) {
    console.error('❌ Lỗi updateBooking:', error);
    next(error);
  }
};

// PATCH /api/admin/bookings/:id/status
exports.updateBookingStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, staffId } = req.body;

    const updateFields = {};
    if (status) updateFields.status = status;
    if (staffId !== undefined) updateFields.staffId = staffId || null;

    const booking = await Booking.findByIdAndUpdate(id, updateFields, { new: true });
    return res.json({
      success: true,
      message: 'Cập nhật trạng thái thành công!',
      data: booking
    });
  } catch (error) {
    next(error);
  }
};