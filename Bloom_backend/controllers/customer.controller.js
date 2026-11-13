const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const User = require('../models/User');
const Service = require('../models/Service');
const Staff = require('../models/Staff');
const CustomerTreatment = require('../models/CustomerTreatment');
const Schedule = require('../models/Schedule');
const Invoice = require('../models/Invoice');

const ACTIVE_BOOKING_STATUSES = ['pending', 'confirmed', 'in_treatment'];

function getVietnamDateTime() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));

  return {
    date: `${values.year}-${values.month}-${values.day}`,
    time: `${values.hour}:${values.minute}`
  };
}

function sanitizeUser(user) {
  if (!user) return null;
  const obj = typeof user.toObject === 'function' ? user.toObject() : { ...user };
  delete obj.password;
  delete obj.passwordHash;
  return obj;
}

// Hàm phụ trợ: Tự động đồng bộ các gói liệu trình từ Invoice sang CustomerTreatment nếu chưa tồn tại
async function syncTreatmentsFromInvoices(customerIdFilter = {}) {
  const query = { deletedAt: null, status: { $nin: ['draft', 'voided', 'deleted'] }, ...customerIdFilter };
  const invoices = await Invoice.find(query).lean();

  for (const inv of invoices) {
    if (!Array.isArray(inv.items)) continue;
    for (const item of inv.items) {
      const name = String(item.name || '');
      const isPackage = item.type === 'service' && /liệu trình|gói/i.test(name);
      if (!isPackage) continue;

      const existing = await CustomerTreatment.findOne({
        customerId: inv.customerId,
        treatmentName: name
      }).lean();

      if (!existing) {
        const matchSessions = name.match(/\((\d+)\s*buổi\)/i);
        const totalSessions = matchSessions ? Number(matchSessions[1]) : 5;

        await CustomerTreatment.create({
          customerId: inv.customerId,
          treatmentId: item.itemId,
          treatmentName: name,
          totalSessions,
          usedSessions: 0,
          remainingSessions: totalSessions,
          status: 'active',
          history: []
        });
      }
    }
  }
}

// Chuyển đổi mã chuyên khoa ('dieu-tri-da', 'cham-soc-da', 'tre-hoa-nang-co', 'triet-long') sang ObjectId thực tế trong collection services
async function resolveServiceObjectId(serviceIdOrGroup) {
  if (!serviceIdOrGroup) return null;
  if (mongoose.isValidObjectId(serviceIdOrGroup)) {
    const found = await Service.findById(serviceIdOrGroup).lean();
    if (found) return found._id;
  }

  const byGroup = await Service.findOne({
    categoryGroup: String(serviceIdOrGroup).trim(),
    deletedAt: null
  }).lean();
  if (byGroup) return byGroup._id;

  const firstActive = await Service.findOne({ deletedAt: null }).lean();
  return firstActive ? firstActive._id : null;
}

// GET /api/customer/used-history
exports.getUsedHistory = async (req, res, next) => {
  try {
    const customerId = req.session.user._id;

    const invoices = await Invoice.find({
      customerId,
      deletedAt: null,
      status: { $nin: ['draft', 'voided', 'deleted'] }
    })
      .sort({ createdAt: -1 })
      .lean();

    const items = [];
    for (const inv of invoices) {
      const usedDate = inv.createdAt || new Date();
      for (let i = 0; i < (inv.items || []).length; i++) {
        const it = inv.items[i];
        items.push({
          _id: `${inv._id}_${i}`,
          invoiceId: inv._id,
          invoiceCode: inv.invoiceCode,
          name: it.name,
          type: it.type === 'product' ? 'product' : 'service',
          usedDate,
          performedBy: it.type === 'service' ? 'Bác sĩ / KTV Bloom Clinic' : '',
          quantity: Number(it.quantity) || 1,
          unitPrice: Number(it.unitPrice) || 0,
          totalPrice: Number(it.amount) || (Number(it.unitPrice) || 0) * (Number(it.quantity) || 1),
          status: it.type === 'product' ? 'in_use' : 'completed'
        });
      }
    }

    return res.json({
      success: true,
      message: 'Lấy nhật ký sử dụng dịch vụ & sản phẩm thành công!',
      data: items
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/customer/overview
exports.getOverview = async (req, res, next) => {
  try {
    const customerId = req.session.user._id;

    const user = await User.findOne({ _id: customerId, deletedAt: null }).select(
      'username fullName phone email customId gender dateOfBirth dob membershipTier prepaidBalance totalSpent avatar'
    );

    const upcomingBookings = await Booking.find({
      customerId,
      status: { $in: ['pending', 'confirmed'] }
    })
      .populate('serviceId', 'serviceName categoryGroup price image')
      .sort({ appointmentDate: 1, appointmentTime: 1 });

    const activeTreatments = await CustomerTreatment.find({
      customerId,
      status: 'active'
    }).sort({ createdAt: -1 });

    let totalSpent = user?.totalSpent || 0;
    if (!totalSpent) {
      const paidInvoices = await Invoice.find({
        customerId,
        status: { $in: ['paid', 'partially_paid'] }
      }).select('paidAmount');
      totalSpent = paidInvoices.reduce((sum, inv) => sum + (inv.paidAmount || 0), 0);
    }

    return res.json({
      success: true,
      message: 'Lấy thông tin tổng quan thành công!',
      data: {
        user: sanitizeUser(user),
        upcomingBookings: upcomingBookings[0] || null,
        activeTreatments,
        totalSpent
      }
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/customer/available-schedules?date=YYYY-MM-DD&staffId=
exports.getAvailableSchedules = async (req, res, next) => {
  try {
    const { date, staffId } = req.query;

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp ngày hợp lệ (YYYY-MM-DD)!',
        data: null
      });
    }

    const query = { date, isOff: false };
    if (staffId) {
      if (!mongoose.isObjectIdOrHexString(staffId)) {
        return res.status(400).json({
          success: false,
          message: 'staffId không hợp lệ!',
          data: null
        });
      }
      query.staffId = staffId;
    }

    const schedules = await Schedule.find(query)
      .populate('staffId', 'staffName title specialty rating avatar status')
      .sort({ shift: 1 });

    return res.json({
      success: true,
      message: 'Lấy danh sách ca trực khả dụng thành công!',
      data: schedules
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/customer/bookings
exports.createBooking = async (req, res, next) => {
  try {
    const { serviceId, staffId, appointmentDate, appointmentTime, note } = req.body;
    const customerId = req.session.user._id;

    if (!serviceId || !appointmentDate || !appointmentTime) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn đầy đủ dịch vụ, ngày và giờ hẹn!',
        data: null
      });
    }

    const resolvedServiceId = await resolveServiceObjectId(serviceId);

    if (
      !resolvedServiceId ||
      (staffId && !mongoose.isObjectIdOrHexString(staffId))
    ) {
      return res.status(400).json({
        success: false,
        message: 'ID dịch vụ hoặc nhân viên không hợp lệ!',
        data: null
      });
    }

    const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(appointmentDate);
    const timeMatch = /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(appointmentTime);
    const parsedDate = dateMatch
      ? new Date(Date.UTC(Number(dateMatch[1]), Number(dateMatch[2]) - 1, Number(dateMatch[3])))
      : null;
    if (
      !dateMatch ||
      !parsedDate ||
      parsedDate.toISOString().slice(0, 10) !== appointmentDate ||
      !timeMatch
    ) {
      return res.status(400).json({
        success: false,
        message: 'Ngày phải theo định dạng YYYY-MM-DD hợp lệ và giờ theo định dạng HH:mm!',
        data: null
      });
    }

    const { date: today, time: currentTime } = getVietnamDateTime();
    if (appointmentDate < today || (appointmentDate === today && appointmentTime <= currentTime)) {
      return res.status(400).json({
        success: false,
        message: 'Không thể đặt lịch vào thời gian đã qua!',
        data: null
      });
    }

    const timeInMinutes =
      Number(appointmentTime.slice(0, 2)) * 60 + Number(appointmentTime.slice(3));
    const shift =
      timeInMinutes >= 540 && timeInMinutes < 720
        ? { name: 'sang', start: '09:00', end: '12:00' }
        : timeInMinutes >= 720 && timeInMinutes < 1020
          ? { name: 'chieu', start: '12:00', end: '17:00' }
          : timeInMinutes >= 1020 && timeInMinutes < 1320
            ? { name: 'toi', start: '17:00', end: '22:00' }
            : null;

    if (!shift) {
      return res.status(400).json({
        success: false,
        message: 'Giờ đặt lịch phải nằm trong khung hoạt động từ 09:00 đến trước 22:00!',
        data: null
      });
    }

    const user = await User.findOne({ _id: customerId, deletedAt: null });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin người dùng!',
        data: null
      });
    }

    const service = await Service.findOne({ _id: resolvedServiceId, status: 'active', deletedAt: null });
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy dịch vụ đang hoạt động!',
        data: null
      });
    }
    if (!Number.isFinite(service.durationMinutes) || service.durationMinutes <= 0) {
      return res.status(409).json({
        success: false,
        message: 'Dịch vụ chưa được cấu hình thời lượng hợp lệ!',
        data: null
      });
    }

    const requestedStart = timeInMinutes;
    const requestedEnd = requestedStart + service.durationMinutes;
    if (requestedEnd > Number(shift.end.slice(0, 2)) * 60 + Number(shift.end.slice(3))) {
      return res.status(400).json({
        success: false,
        message: 'Thời lượng dịch vụ vượt quá giờ kết thúc ca làm việc!',
        data: null
      });
    }

    if (staffId) {
      const staff = await Staff.findOne({ _id: staffId, deletedAt: null });
      if (!staff) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy nhân viên!',
          data: null
        });
      }
      if (staff.status !== 'working') {
        return res.status(400).json({
          success: false,
          message: 'Nhân viên bạn chọn hiện không làm việc!',
          data: null
        });
      }

      const schedule = await Schedule.findOne({
        staffId,
        date: appointmentDate,
        shift: shift.name
      });
      if (!schedule) {
        return res.status(400).json({
          success: false,
          message: 'Nhân viên chưa được xếp lịch làm việc cho ca đã chọn!',
          data: null
        });
      }
      if (schedule.isOff) {
        return res.status(400).json({
          success: false,
          message: 'Nhân viên bạn chọn được xếp nghỉ trong ca này!',
          data: null
        });
      }

      const activeBookings = await Booking.find({
        staffId,
        appointmentDate,
        status: { $in: ACTIVE_BOOKING_STATUSES }
      }).populate('serviceId', 'durationMinutes');

      const uncheckableBooking = activeBookings.find(
        (booking) =>
          !booking.serviceId ||
          !Number.isFinite(booking.serviceId.durationMinutes) ||
          booking.serviceId.durationMinutes <= 0 ||
          typeof booking.appointmentTime !== 'string' ||
          !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(booking.appointmentTime)
      );
      if (uncheckableBooking) {
        return res.status(409).json({
          success: false,
          message:
            'Không thể xác nhận lịch do một lịch hẹn hiện có thiếu thông tin dịch vụ hoặc giờ hẹn hợp lệ!',
          data: null
        });
      }

      if (!Number.isInteger(schedule.maxCapacity) || schedule.maxCapacity < 0) {
        return res.status(409).json({
          success: false,
          message: 'Lịch làm việc chưa được cấu hình capacity hợp lệ!',
          data: null
        });
      }

      const bookingsInShift = activeBookings.filter(
        (booking) =>
          booking.appointmentTime >= shift.start && booking.appointmentTime < shift.end
      );

      if (bookingsInShift.length >= schedule.maxCapacity) {
        return res.status(400).json({
          success: false,
          message: 'Ca làm việc này đã đạt số lượng lịch hẹn tối đa!',
          data: null
        });
      }

      const overlapsBooking = activeBookings.some((booking) => {
        const [hour, minute] = booking.appointmentTime.split(':').map(Number);
        const existingStart = hour * 60 + minute;
        const existingDuration = booking.serviceId.durationMinutes;
        return (
          requestedStart < existingStart + existingDuration && existingStart < requestedEnd
        );
      });
      if (overlapsBooking) {
        return res.status(400).json({
          success: false,
          message: 'Khung giờ này của nhân viên đã có lịch hẹn. Vui lòng chọn khung giờ khác!',
          data: null
        });
      }
    }

    const bookingCode = `BK-${appointmentDate.replace(/-/g, '')}-${Date.now().toString().slice(-4)}`;

    const newBooking = await Booking.create({
      bookingCode,
      customerId,
      customerName: user.fullName || user.username,
      customerPhone: user.phone || '',
      serviceId: resolvedServiceId,
      serviceName: service.serviceName,
      staffId: staffId || null,
      appointmentDate,
      appointmentTime,
      note: note || '',
      status: 'pending',
      depositAmount: 0
    });

    return res.status(201).json({
      success: true,
      message: 'Đặt lịch hẹn thành công!',
      data: newBooking
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/customer/bookings?status=upcoming|history
exports.getMyBookings = async (req, res, next) => {
  try {
    const customerId = req.session.user._id;
    const { status } = req.query;

    const filter = { customerId };
    if (status === 'upcoming') {
      filter.status = { $in: ['pending', 'confirmed', 'in_treatment'] };
    } else if (status === 'history') {
      filter.status = { $in: ['completed', 'cancelled'] };
    }

    const bookings = await Booking.find(filter)
      .populate('serviceId', 'serviceName categoryGroup price durationMinutes image')
      .populate('staffId', 'staffName title avatar')
      .sort({ appointmentDate: -1, createdAt: -1 });

    return res.json({
      success: true,
      message: 'Lấy danh sách lịch hẹn thành công!',
      data: bookings
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/customer/bookings/:id
exports.updateBooking = async (req, res, next) => {
  try {
    const customerId = req.session.user._id;
    const { id } = req.params;
    const { serviceId, staffId, appointmentDate, appointmentTime, note } = req.body;

    if (!mongoose.isObjectIdOrHexString(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID lịch hẹn không hợp lệ!',
        data: null
      });
    }

    const booking = await Booking.findOne({ _id: id, customerId });
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lịch hẹn!',
        data: null
      });
    }

    if (['completed', 'cancelled', 'in_treatment'].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: 'Không thể chỉnh sửa lịch hẹn ở trạng thái hiện tại!',
        data: null
      });
    }

    if (serviceId) {
      const resolvedServiceId = await resolveServiceObjectId(serviceId);
      if (!resolvedServiceId) {
        return res.status(400).json({
          success: false,
          message: 'Dịch vụ hoặc chuyên khoa không hợp lệ!',
          data: null
        });
      }
      const service = await Service.findOne({ _id: resolvedServiceId, status: 'active', deletedAt: null });
      if (!service) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy dịch vụ đang hoạt động!',
          data: null
        });
      }
      booking.serviceId = resolvedServiceId;
      booking.serviceName = service.serviceName;
    }

    if (staffId !== undefined) {
      if (staffId === null || staffId === '') {
        booking.staffId = null;
      } else if (!mongoose.isObjectIdOrHexString(staffId)) {
        return res.status(400).json({
          success: false,
          message: 'staffId không hợp lệ!',
          data: null
        });
      } else {
        const staff = await Staff.findOne({ _id: staffId, status: 'working', deletedAt: null });
        if (!staff) {
          return res.status(404).json({
            success: false,
            message: 'Không tìm thấy nhân viên đang làm việc!',
            data: null
          });
        }
        booking.staffId = staffId;
      }
    }

    if (appointmentDate) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(appointmentDate)) {
        return res.status(400).json({
          success: false,
          message: 'Ngày hẹn không hợp lệ (YYYY-MM-DD)!',
          data: null
        });
      }
      const { date: today } = getVietnamDateTime();
      if (appointmentDate < today) {
        return res.status(400).json({
          success: false,
          message: 'Không thể đổi sang ngày đã qua!',
          data: null
        });
      }
      booking.appointmentDate = appointmentDate;
    }

    if (appointmentTime) {
      if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(appointmentTime)) {
        return res.status(400).json({
          success: false,
          message: 'Giờ hẹn không hợp lệ (HH:mm)!',
          data: null
        });
      }
      booking.appointmentTime = appointmentTime;
    }

    if (note !== undefined) {
      booking.note = note;
    }

    await booking.save();

    return res.json({
      success: true,
      message: 'Cập nhật lịch hẹn thành công!',
      data: booking
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/customer/bookings/:id/cancel
exports.cancelBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason, cancelReason } = req.body;
    const customerId = req.session.user._id;

    if (!mongoose.isObjectIdOrHexString(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID lịch hẹn không hợp lệ!',
        data: null
      });
    }

    const booking = await Booking.findOne({ _id: id, customerId });
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lịch hẹn!',
        data: null
      });
    }

    if (booking.status === 'completed' || booking.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Lịch hẹn này đã kết thúc hoặc đã hủy trước đó!',
        data: null
      });
    }

    const reasonText = cancelReason || reason || '';
    booking.status = 'cancelled';
    if (reasonText) {
      booking.cancelReason = reasonText;
      booking.note = `${booking.note || ''} | Lý do hủy: ${reasonText}`.trim();
    }
    booking.cancelledAt = new Date();
    await booking.save();

    return res.json({
      success: true,
      message: 'Hủy lịch hẹn thành công!',
      data: booking
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/customer/treatments
exports.getMyTreatments = async (req, res, next) => {
  try {
    const customerId = req.session.user._id;
    await syncTreatmentsFromInvoices({ customerId });

    const treatments = await CustomerTreatment.find({ customerId })
      .populate('treatmentId', 'treatmentName totalSessions description technology')
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      message: 'Lấy danh sách liệu trình thành công!',
      data: treatments
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/customer/treatments/:id/reviews
// body: { sessionIndex: 1-based, rating, ratingComment }
exports.reviewTreatmentSession = async (req, res, next) => {
  try {
    const customerId = req.session.user._id;
    const { id } = req.params;
    const { sessionIndex, rating, ratingComment } = req.body;

    if (!mongoose.isObjectIdOrHexString(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID liệu trình không hợp lệ!',
        data: null
      });
    }

    const idx = Number(sessionIndex) - 1;
    if (!Number.isInteger(idx) || idx < 0) {
      return res.status(400).json({
        success: false,
        message: 'sessionIndex phải là số nguyên bắt đầu từ 1!',
        data: null
      });
    }

    const ratingNum = Number(rating);
    if (!Number.isFinite(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({
        success: false,
        message: 'rating phải từ 1 đến 5!',
        data: null
      });
    }

    const ct = await CustomerTreatment.findOne({ _id: id, customerId });
    if (!ct) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy hồ sơ liệu trình!',
        data: null
      });
    }

    if (!Array.isArray(ct.history) || !ct.history[idx]) {
      return res.status(400).json({
        success: false,
        message: 'Không tìm thấy buổi điều trị tương ứng trong nhật ký!',
        data: null
      });
    }

    ct.history[idx].rating = ratingNum;
    ct.history[idx].ratingComment = ratingComment || '';
    ct.history[idx].ratedAt = new Date();
    await ct.save();

    return res.json({
      success: true,
      message: 'Gửi đánh giá buổi điều trị thành công!',
      data: ct
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/customer/invoices
exports.getMyInvoices = async (req, res, next) => {
  try {
    const customerId = req.session.user._id;
    const invoices = await Invoice.find({
      customerId,
      deletedAt: null
    }).sort({ createdAt: -1 });

    return res.json({
      success: true,
      message: 'Lấy lịch sử hóa đơn thành công!',
      data: invoices
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/customer/profile
exports.updateProfile = async (req, res, next) => {
  try {
    const customerId = req.session.user._id;
    const { fullName, gender, dateOfBirth, phone, email } = req.body;

    const user = await User.findOne({ _id: customerId, deletedAt: null });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tài khoản!',
        data: null
      });
    }

    if (fullName !== undefined) user.fullName = String(fullName).trim();
    if (gender !== undefined) user.gender = gender;
    if (dateOfBirth !== undefined) user.dateOfBirth = dateOfBirth;
    if (phone !== undefined) user.phone = String(phone).trim();
    if (email !== undefined) user.email = String(email).trim().toLowerCase();

    await user.save();

    if (req.session.user) {
      req.session.user.fullName = user.fullName;
      req.session.user.phone = user.phone;
      req.session.user.email = user.email;
    }

    return res.json({
      success: true,
      message: 'Cập nhật thông tin hồ sơ thành công!',
      data: sanitizeUser(user)
    });
  } catch (error) {
    next(error);
  }
};

exports.getCustomerTreatments = async (req, res, next) => {
  try {
    await syncTreatmentsFromInvoices();

    const records = await CustomerTreatment.find()
      .populate('customerId', 'fullName phone customId customerCode')
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      message: 'Lấy danh sách khách hàng có liệu trình thành công!',
      data: records
    });
  } catch (error) {
    console.error('Lỗi lấy danh sách khách hàng có liệu trình:', error);
    next(error);
  }
};