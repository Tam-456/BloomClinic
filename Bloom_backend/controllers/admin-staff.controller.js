const Staff = require('../models/Staff');
const Schedule = require('../models/Schedule');

// GET /api/admin/staffs
exports.getStaffs = async (req, res, next) => {
  try {
    const staffs = await Staff.find({ deletedAt: null }).sort({ roleType: 1, staffCode: 1 });
    return res.json({
      success: true,
      message: 'Lấy danh sách nhân viên thành công!',
      data: staffs
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/admin/staffs
exports.createStaff = async (req, res, next) => {
  try {
    const staff = await Staff.create(req.body);
    return res.status(201).json({
      success: true,
      message: 'Tạo nhân sự thành công!',
      data: staff
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/admin/staffs/:id
exports.updateStaff = async (req, res, next) => {
  try {
    const staff = await Staff.findByIdAndUpdate(req.params.id, req.body, { new: true });
    return res.json({
      success: true,
      message: 'Cập nhật nhân sự thành công!',
      data: staff
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/admin/staffs/:id
exports.deleteStaff = async (req, res, next) => {
  try {
    await Staff.findByIdAndUpdate(req.params.id, { deletedAt: new Date() });
    await Schedule.deleteMany({ staffId: req.params.id });
    return res.json({ success: true, message: 'Đã xóa nhân sự!' });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/schedules?from=YYYY-MM-DD&to=YYYY-MM-DD
exports.getSchedules = async (req, res, next) => {
  try {
    const { date, staffId, from, to } = req.query;
    const filter = {};
    if (date) filter.date = date;
    if (staffId) filter.staffId = staffId;
    if (from && to) filter.date = { $gte: from, $lte: to };

    const data = await Schedule.find(filter)
      .populate('staffId', 'staffName title roleType status staffCode')
      .sort({ date: 1, shift: 1 });
    return res.json({ success: true, message: 'OK', data });
  } catch (error) {
    next(error);
  }
};

// POST /api/admin/schedules (Lưu ca trực - Tự động cập nhật nếu đã tồn tại)
exports.createSchedule = async (req, res, next) => {
  try {
    const { staffId, date, shift, isOff, maxCapacity } = req.body;

    const schedule = await Schedule.findOneAndUpdate(
      { staffId, date, shift },
      {
        $set: {
          isOff: Boolean(isOff),
          maxCapacity: isOff ? 0 : (Number(maxCapacity) || 5)
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.status(201).json({
      success: true,
      message: 'Lưu ca trực thành công!',
      data: schedule
    });
  } catch (error) {
    next(error);
  }
};