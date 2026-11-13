const Service = require('../models/Service');
const Product = require('../models/Product');
const Staff = require('../models/Staff');
const CustomerTreatment = require('../models/CustomerTreatment');
const Treatment = require('../models/Treatments');

// --- 1. QUẢN LÝ DỊCH VỤ ---
exports.createService = async (req, res, next) => {
  try {
    const service = await Service.create(req.body);
    return res.status(201).json({ success: true, message: 'Tạo dịch vụ thành công!', data: service });
  } catch (error) { next(error); }
};

exports.updateService = async (req, res, next) => {
  try {
    const service = await Service.findOneAndUpdate(
      { _id: req.params.id, deletedAt: null },
      req.body,
      { new: true, runValidators: true }
    );
    if (!service) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy dịch vụ!', data: null });
    }
    return res.json({ success: true, message: 'Cập nhật dịch vụ thành công!', data: service });
  } catch (error) { next(error); }
};

exports.deleteService = async (req, res, next) => {
  try {
    const service = await Service.findOneAndUpdate(
      { _id: req.params.id, deletedAt: null },
      { $set: { status: 'inactive', deletedAt: new Date() } },
      { new: true }
    );
    if (!service) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy dịch vụ!', data: null });
    }
    return res.json({ success: true, message: 'Đã ẩn dịch vụ khỏi hệ thống!', data: null });
  } catch (error) { next(error); }
};

// --- 2. QUẢN LÝ SẢN PHẨM ---
// GET /api/admin/products
exports.getProducts = async (req, res, next) => {
  try {
    const { q } = req.query;
    const filter = { deletedAt: null };
    if (q) {
      filter.$or = [
        { productName: new RegExp(q, 'i') },
        { productCode: new RegExp(q, 'i') },
      ];
    }
    const data = await Product.find(filter).sort({ productCode: 1 });
    return res.json({ success: true, message: 'OK', data });
  } catch (error) {
    next(error);
  }
};

// POST /api/admin/products - Tự động sinh mã tịnh tiến theo phân loại nếu chưa nhập mã
exports.createProduct = async (req, res, next) => {
  try {
    const payload = { ...req.body };
    const cat = payload.category || 'cosmeceutical';

    // 1. Tự động sinh mã tịnh tiến theo phân loại
    if (!payload.productCode) {
      let prefix = 'CS-';
      if (cat === 'treatment') prefix = 'DT-';
      else if (cat === 'supplement') prefix = 'TP-';

      // Tìm sản phẩm cùng tiền tố có số thứ tự lớn nhất
      const lastProduct = await Product.findOne({
        productCode: new RegExp(`^${prefix}`),
      }).sort({ productCode: -1 });

      let nextIndex = 1;
      if (lastProduct && lastProduct.productCode) {
        const currentNum = parseInt(lastProduct.productCode.replace(/\D/g, ''), 10) || 0;
        nextIndex = currentNum + 1;
      }
      payload.productCode = `${prefix}${String(nextIndex).padStart(3, '0')}`;
    }

    const product = await Product.create(payload);
    return res.status(201).json({ success: true, message: 'Tạo sản phẩm thành công!', data: product });
  } catch (error) {
    next(error);
  }
};

// PUT /api/admin/products/:id
exports.updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, deletedAt: null },
      req.body,
      { new: true, runValidators: true }
    );
    if (!product) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm!' });
    }
    return res.json({ success: true, message: 'Cập nhật sản phẩm thành công!', data: product });
  } catch (error) {
    next(error);
  }
};

// --- 3. QUẢN LÝ NHÂN SỰ ---
exports.createStaff = async (req, res, next) => {
  try {
    const staff = await Staff.create(req.body);
    return res.status(201).json({ success: true, message: 'Thêm nhân viên thành công!', data: staff });
  } catch (error) { next(error); }
};

exports.updateStaff = async (req, res, next) => {
  try {
    const staff = await Staff.findOneAndUpdate(
      { _id: req.params.id, deletedAt: null },
      req.body,
      { new: true, runValidators: true }
    );
    if (!staff) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy nhân viên!', data: null });
    }
    return res.json({ success: true, message: 'Cập nhật thông tin nhân viên thành công!', data: staff });
  } catch (error) { next(error); }
};

// GET /api/admin/services
exports.getServices = async (req, res, next) => {
  try {
    const { status, categoryGroup, q } = req.query;
    const filter = { deletedAt: null };
    if (status) filter.status = status;
    if (categoryGroup) filter.categoryGroup = categoryGroup;
    if (q) {
      filter.$or = [
        { serviceName: new RegExp(q, 'i') },
        { customId: new RegExp(q, 'i') },
        { slug: new RegExp(q, 'i') }
      ];
    }
    const data = await Service.find(filter).sort({ createdAt: -1 });
    return res.json({ success: true, message: 'OK', data });
  } catch (error) {
    next(error);
  }
};

// --- 4. QUẢN LÝ DANH MỤC GÓI LIỆU TRÌNH (COLLECTION `treatments`) ---
// GET /api/admin/treatments
exports.getTreatments = async (req, res, next) => {
  try {
    const treatments = await Treatment.find({ deletedAt: null }).sort({ packageCode: 1 });
    return res.json({
      success: true,
      message: 'Lấy danh mục gói liệu trình thành công!',
      data: treatments
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/admin/treatments
exports.createTreatment = async (req, res, next) => {
  try {
    const { packageCode, treatmentName, totalSessions, price, durationMinutes, description, technology } = req.body;
    const count = await Treatment.countDocuments();
    const code = packageCode || `LT-${String(count + 1).padStart(3, '0')}`;

    const created = await Treatment.create({
      packageCode: code,
      treatmentName: String(treatmentName || '').trim(),
      totalSessions: Number(totalSessions) || 5,
      price: Number(price) || 0,
      durationMinutes: Number(durationMinutes) || 90,
      description: description || '',
      technology: technology || '',
      status: 'active'
    });

    return res.status(201).json({
      success: true,
      message: 'Tạo gói liệu trình thành công!',
      data: created
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/admin/treatments/:id
exports.updateTreatment = async (req, res, next) => {
  try {
    const { treatmentName, totalSessions, price, durationMinutes, description, technology, status } = req.body;
    const updated = await Treatment.findOneAndUpdate(
      { _id: req.params.id, deletedAt: null },
      {
        $set: {
          ...(treatmentName !== undefined && { treatmentName: String(treatmentName).trim() }),
          ...(totalSessions !== undefined && { totalSessions: Number(totalSessions) }),
          ...(price !== undefined && { price: Number(price) }),
          ...(durationMinutes !== undefined && { durationMinutes: Number(durationMinutes) }),
          ...(description !== undefined && { description }),
          ...(technology !== undefined && { technology }),
          ...(status !== undefined && { status })
        }
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy gói liệu trình!' });
    }

    return res.json({
      success: true,
      message: 'Cập nhật gói liệu trình thành công!',
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/admin/treatments/:id
exports.deleteTreatment = async (req, res, next) => {
  try {
    await Treatment.findByIdAndUpdate(req.params.id, { $set: { deletedAt: new Date() } });
    return res.json({ success: true, message: 'Đã xóa gói liệu trình!' });
  } catch (error) {
    next(error);
  }
};

// --- 5. QUẢN LÝ HỒ SƠ ĐIỀU TRỊ KHÁCH HÀNG (COLLECTION `customertreatments`) ---
// GET /api/admin/customer-treatments
exports.getCustomerTreatments = async (req, res, next) => {
  try {
    const list = await CustomerTreatment.find({})
      .populate('customerId', 'fullName phone customerCode customId membershipTier')
      .populate('history.staffId', 'staffName')
      .sort({ createdAt: -1 });

    return res.json({ success: true, data: list });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/admin/customer-treatments/:id/checkin
exports.checkinTreatmentSession = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { staffId, note } = req.body;

    const record = await CustomerTreatment.findById(id);
    if (!record) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy hồ sơ liệu trình!' });
    }

    if (record.remainingSessions <= 0) {
      return res.status(400).json({ success: false, message: 'Liệu trình này đã hoàn tất số buổi!' });
    }

    record.usedSessions += 1;
    record.remainingSessions = Math.max(0, record.totalSessions - record.usedSessions);
    if (record.remainingSessions === 0) {
      record.status = 'completed';
    }

    record.history.push({
      date: new Date(),
      staffId: staffId || null,
      note: note || 'Hoàn thành buổi trị liệu tại phòng khám.'
    });

    await record.save();

    return res.json({
      success: true,
      message: 'Đã ghi nhận buổi điều trị vào database thành công!',
      data: record
    });
  } catch (error) {
    next(error);
  }
};