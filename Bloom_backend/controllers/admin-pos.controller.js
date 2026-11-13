const mongoose = require('mongoose');
const User = require('../models/User');
const Service = require('../models/Service');
const Product = require('../models/Product');
const Deposit = require('../models/Deposit');
const Invoice = require('../models/Invoice');
const Treatment = require('../models/Treatments');
const { dateParts, generateBusinessCode } = require('../utils/business-codes');
const CustomerTreatment = require('../models/CustomerTreatment');

const PAYMENT_METHODS = ['cash', 'banking', 'card', 'prepaid_wallet'];

function requestError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

// =========================
// XUẤT KHO THEO LÔ (FEFO)
// =========================

async function deductProductStock(productId, quantity, session) {
  const product = await Product.findOne({
    _id: productId,
    deletedAt: null
  }).session(session);

  if (!product) {
    throw requestError(404, 'Không tìm thấy sản phẩm trong kho!');
  }

  const currentStock = Number(product.stockQuantity) || 0;

  if (currentStock < quantity) {
    throw requestError(
      400,
      `Sản phẩm "${product.productName}" không đủ tồn kho! Hiện còn ${currentStock}.`
    );
  }

  if (!product.batches || product.batches.length === 0) {
    product.stockQuantity = currentStock - quantity;
    await product.save({ session });
    return;
  }

  const today = new Date().toISOString().slice(0, 10);

  const sortedBatches = product.batches
    .map((batch, index) => ({
      batch,
      index,
      remaining: Math.max(0, Number(batch.remainingQuantity) || 0),
      expiryDate: batch.expiryDate || ''
    }))
    .sort((a, b) => {
      if (!a.expiryDate) return 1;
      if (!b.expiryDate) return -1;
      return a.expiryDate.localeCompare(b.expiryDate);
    });

  const batchTotal = sortedBatches.reduce(
    (total, item) => total + item.remaining,
    0
  );

  if (batchTotal > currentStock) {
    let historicalDifference = batchTotal - currentStock;

    for (const item of sortedBatches) {
      if (historicalDifference <= 0) break;

      const deducted = Math.min(item.remaining, historicalDifference);

      product.batches[item.index].remainingQuantity =
        item.remaining - deducted;

      item.remaining -= deducted;
      historicalDifference -= deducted;
    }
  }

  if (batchTotal < currentStock) {
    throw requestError(
      409,
      `Dữ liệu tồn kho sản phẩm "${product.productName}" không đồng nhất. Tổng số lượng trong các lô thấp hơn tồn kho tổng. Vui lòng kiểm tra lại các lô hàng trước khi thanh toán.`
    );
  }

  const availableBatches = sortedBatches.filter(item =>
    item.remaining > 0 &&
    (!item.expiryDate || item.expiryDate >= today)
  );

  const availableQuantity = availableBatches.reduce(
    (total, item) => total + item.remaining,
    0
  );

  if (availableQuantity < quantity) {
    throw requestError(
      400,
      `Sản phẩm "${product.productName}" không đủ tồn kho còn hạn sử dụng! Hiện còn ${availableQuantity}.`
    );
  }

  let remainingToDeduct = quantity;

  for (const item of availableBatches) {
    if (remainingToDeduct <= 0) break;

    const deducted = Math.min(item.remaining, remainingToDeduct);

    product.batches[item.index].remainingQuantity =
      item.remaining - deducted;

    item.remaining -= deducted;
    remainingToDeduct -= deducted;
  }

  product.stockQuantity = product.batches.reduce(
    (total, batch) =>
      total + Math.max(0, Number(batch.remainingQuantity) || 0),
    0
  );

  await product.save({ session });
}

// =========================
// CHECKOUT POS
// =========================

// POST /api/admin/pos/checkout
exports.posCheckout = async (req, res, next) => {
  let session;

  try {
    const {
      customerId,
      items,
      discountAmount = 0,
      depositId,
      paidAmount,
      paymentMethod = 'cash',
      isDraft = false
    } = req.body;

    // 1. VALIDATE INPUT
    if (!mongoose.isValidObjectId(customerId)) {
      throw requestError(400, 'ID khách hàng không hợp lệ!');
    }

    if (!Array.isArray(items) || items.length === 0) {
      throw requestError(400, 'Hóa đơn phải có ít nhất một sản phẩm hoặc dịch vụ!');
    }

    if (!PAYMENT_METHODS.includes(paymentMethod)) {
      throw requestError(400, 'Phương thức thanh toán không hợp lệ!');
    }

    if (typeof isDraft !== 'boolean') {
      throw requestError(400, 'isDraft phải là giá trị boolean!');
    }

    if (!Number.isFinite(discountAmount) || discountAmount < 0) {
      throw requestError(400, 'Số tiền giảm giá không hợp lệ!');
    }

    if (paidAmount !== undefined && (!Number.isFinite(paidAmount) || paidAmount < 0)) {
      throw requestError(400, 'Số tiền đã thu không hợp lệ!');
    }

    if (depositId && !mongoose.isValidObjectId(depositId)) {
      throw requestError(400, 'ID tiền cọc không hợp lệ!');
    }

    if (Object.hasOwn(req.body, 'depositDeduction')) {
      throw requestError(400, 'Số tiền cấn cọc được xác định từ khoản cọc đang giữ; hãy gửi depositId.');
    }

    if (isDraft && (depositId || (paidAmount !== undefined && paidAmount !== 0))) {
      throw requestError(400, 'Hóa đơn nháp không thể nhận thanh toán hoặc cấn trừ tiền cọc!');
    }

    const normalizedItems = items.map(item => {
      if (
        !item ||
        !mongoose.isValidObjectId(item.itemId) ||
        !['service', 'product'].includes(item.type) ||
        !Number.isInteger(item.quantity) ||
        item.quantity <= 0
      ) {
        throw requestError(400, 'Mỗi dòng hóa đơn cần itemId, type và quantity hợp lệ!');
      }

      return {
        itemId: item.itemId,
        type: item.type,
        quantity: item.quantity
      };
    });

    // 2. TẠO MÃ HÓA ĐƠN
    const { year, month } = dateParts();
    const invoiceCode = await generateBusinessCode(
      Invoice,
      'invoiceCode',
      `invoice:${year}${month}`,
      sequence => `INV-${year}${month}-${String(sequence).padStart(3, '0')}`
    );

    session = await mongoose.startSession();
    let invoice;

    await session.withTransaction(async () => {
      // 3. KIỂM TRA KHÁCH HÀNG
      const customer = await User.findOne({
        _id: customerId,
        deletedAt: null
      }).session(session);

      if (!customer) {
        throw requestError(404, 'Không tìm thấy thông tin khách hàng!');
      }

      // 4. LẤY THÔNG TIN SẢN PHẨM, DỊCH VỤ LẺ VÀ GÓI LIỆU TRÌNH
      const invoiceItems = [];
      const purchasedPackages = [];
      const productQuantities = new Map();

      for (const item of normalizedItems) {
        if (item.type === 'product') {
          const catalogItem = await Product.findOne({
            _id: item.itemId,
            deletedAt: null
          }).session(session);

          if (!catalogItem) {
            throw requestError(404, 'Không tìm thấy sản phẩm trong danh mục!');
          }

          invoiceItems.push({
            itemId: catalogItem._id,
            name: catalogItem.productName,
            type: 'product',
            quantity: item.quantity,
            unitPrice: catalogItem.price,
            amount: item.quantity * catalogItem.price
          });

          const key = String(catalogItem._id);
          productQuantities.set(key, (productQuantities.get(key) || 0) + item.quantity);
        } else {
          // Tìm trong bảng Service (dịch vụ lẻ) trước, nếu không thấy thì tìm trong Treatment (gói liệu trình)
          let catalogItem = await Service.findOne({
            _id: item.itemId,
            status: 'active',
            deletedAt: null
          }).session(session);

          let treatmentPkg = null;
          if (!catalogItem) {
            treatmentPkg = await Treatment.findOne({
              _id: item.itemId,
              deletedAt: null
            }).session(session);
          }

          const resolvedItem = catalogItem || treatmentPkg;
          if (!resolvedItem) {
            throw requestError(404, 'Không tìm thấy dịch vụ hoặc gói liệu trình trong danh mục!');
          }

          const name = catalogItem ? catalogItem.serviceName : treatmentPkg.treatmentName;
          const price = Number(resolvedItem.price) || 0;

          invoiceItems.push({
            itemId: resolvedItem._id,
            name,
            type: 'service',
            quantity: item.quantity,
            unitPrice: price,
            amount: item.quantity * price
          });

          // Đánh dấu nếu là gói liệu trình để tạo hồ sơ CustomerTreatment
          if (treatmentPkg || /liệu trình|gói/i.test(name)) {
            const matchSessions = name.match(/\((\d+)\s*buổi\)/i);
            const totalSessions = treatmentPkg?.totalSessions || (matchSessions ? Number(matchSessions[1]) : 5);
            purchasedPackages.push({
              treatmentId: resolvedItem._id,
              treatmentName: name,
              totalSessions,
              quantity: item.quantity
            });
          }
        }
      }

      // 5. TÍNH TIỀN
      const totalAmount = invoiceItems.reduce((total, item) => total + item.amount, 0);

      if (discountAmount > totalAmount) {
        throw requestError(400, 'Số tiền giảm giá không được lớn hơn tổng hóa đơn!');
      }

      // 6. XỬ LÝ TIỀN CỌC
      let depositDeduction = 0;
      let deposit = null;

      if (depositId) {
        deposit = await Deposit.findOne({
          _id: depositId,
          customerId,
          depositStatus: 'held'
        }).session(session);

        if (!deposit) {
          throw requestError(404, 'Không tìm thấy khoản cọc đang được giữ cho khách hàng này!');
        }

        depositDeduction = deposit.amount;
        if (depositDeduction > totalAmount - discountAmount) {
          throw requestError(400, 'Khoản cọc vượt quá số tiền còn phải thanh toán!');
        }
      }

      // 7. XÁC ĐỊNH TRẠNG THÁI THANH TOÁN
      const finalAmount = Math.max(0, totalAmount - discountAmount - depositDeduction);
      const amountReceived = isDraft ? 0 : (paidAmount === undefined ? finalAmount : paidAmount);

      if (amountReceived > finalAmount) {
        throw requestError(400, 'Số tiền đã thu không được lớn hơn số tiền cuối cùng!');
      }

      const debtAmount = Math.max(0, finalAmount - amountReceived);
      const debtStatus = debtAmount === 0 ? 'paid' : amountReceived === 0 ? 'unpaid' : 'partially_paid';
      const status = isDraft ? 'draft' : debtStatus === 'paid' ? 'paid' : debtStatus === 'unpaid' ? 'issued' : 'partially_paid';

      // 8. XỬ LÝ GIAO DỊCH THANH TOÁN
      if (!isDraft) {
        for (const [productId, quantity] of productQuantities) {
          await deductProductStock(productId, quantity, session);
        }

        if (deposit) {
          const result = await Deposit.updateOne(
            { _id: deposit._id, depositStatus: 'held' },
            { $set: { depositStatus: 'settled' } },
            { session }
          );
          if (result.modifiedCount !== 1) {
            throw requestError(409, 'Khoản cọc đã được xử lý trong một giao dịch khác!');
          }
        }

        if (paymentMethod === 'prepaid_wallet' && amountReceived > 0) {
          const updatedCustomer = await User.findOneAndUpdate(
            { _id: customerId, deletedAt: null, prepaidBalance: { $gte: amountReceived } },
            { $inc: { prepaidBalance: -amountReceived, totalSpent: amountReceived } },
            { new: true, session }
          );
          if (!updatedCustomer) {
            throw requestError(400, `Số dư ví không đủ! (Hiện có: ${customer.prepaidBalance.toLocaleString()} VNĐ)`);
          }
        }
      }

      // 9. TẠO HÓA ĐƠN
      [invoice] = await Invoice.create(
        [{
          invoiceCode,
          customerId,
          items: invoiceItems,
          totalAmount,
          discountAmount,
          depositId: deposit ? deposit._id : null,
          depositDeduction,
          finalAmount,
          paidAmount: amountReceived,
          debtAmount,
          debtStatus,
          paymentMethod,
          status
        }],
        { session }
      );

      // 10. KHỞI TẠO HỒ SƠ LIỆU TRÌNH CHO KHÁCH NẾU CÓ MUA GÓI LIỆU TRÌNH (NẰM TRONG TRANSACTION)
      if (!isDraft && purchasedPackages.length > 0) {
        for (const pkg of purchasedPackages) {
          for (let q = 0; q < pkg.quantity; q++) {
            await CustomerTreatment.create(
              [{
                customerId,
                treatmentId: pkg.treatmentId,
                treatmentName: pkg.treatmentName,
                totalSessions: pkg.totalSessions,
                usedSessions: 0,
                remainingSessions: pkg.totalSessions,
                status: 'active',
                history: []
              }],
              { session }
            );
          }
        }
      }
    });

    return res.status(201).json({
      success: true,
      message: isDraft ? 'Lưu hóa đơn nháp thành công!' : 'Thanh toán thành công!',
      data: invoice
    });
  } catch (error) {
    next(error);
  } finally {
    if (session) {
      await session.endSession();
    }
  }
};

// =========================
// NẠP TIỀN VÍ TRẢ TRƯỚC
// =========================

exports.topupPrepaidWallet = async (req, res, next) => {
  try {
    const { customerId, topupAmount } = req.body;

    if (!mongoose.isValidObjectId(customerId) || !Number.isFinite(topupAmount) || topupAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Thông tin nạp tiền không hợp lệ!', data: null });
    }

    const customer = await User.findOne({ _id: customerId, deletedAt: null });
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy khách hàng!', data: null });
    }

    customer.prepaidBalance += Number(topupAmount);
    await customer.save();

    return res.json({
      success: true,
      message: `Nạp thành công ${topupAmount.toLocaleString()} VNĐ vào ví!`,
      data: { customerId: customer._id, prepaidBalance: customer.prepaidBalance }
    });
  } catch (error) {
    next(error);
  }
};

// =========================
// LẤY DANH MỤC POS (DỊCH VỤ LẺ + GÓI LIỆU TRÌNH TỪ COLLECTION TREATMENTS + SẢN PHẨM)
// =========================

exports.getCatalog = async (req, res, next) => {
  try {
    // Tự động khởi tạo dữ liệu mẫu vào collection `treatments` nếu chưa có
    const countTreatments = await Treatment.countDocuments({ deletedAt: null });

    const [services, products, treatments] = await Promise.all([
      Service.find({ deletedAt: null }).lean(),
      Product.find({ deletedAt: null }).lean(),
      Treatment.find({ deletedAt: null, status: 'active' }).sort({ packageCode: 1 }).lean()
    ]);

    const treatmentServices = treatments.map(t => ({
      _id: t._id,
      customId: t.packageCode,
      serviceName: t.treatmentName,
      price: Number(t.price) || 0,
      durationMinutes: t.durationMinutes || 90,
      itemType: 'package',
      isPackage: true,
      totalSessions: t.totalSessions || 5,
      description: t.description || `Liệu trình trọn gói ${t.totalSessions || 5} buổi`
    }));

    const singleServices = services.map(s => ({
      ...s,
      customId: s.customId || 'DV-' + String(s._id).slice(-4),
      itemType: s.itemType || (s.isPackage ? 'package' : 'single')
    }));

    return res.json({
      success: true,
      data: {
        services: [...singleServices, ...treatmentServices],
        products
      }
    });
  } catch (error) {
    next(error);
  }
};

// =========================
// LẤY DANH SÁCH HÓA ĐƠN & TIỀN CỌC
// =========================

exports.getInvoices = async (req, res, next) => {
  try {
    const { customerId, status } = req.query;
    const filter = {};
    if (customerId) filter.customerId = customerId;
    if (status) filter.status = status;

    const data = await Invoice.find(filter)
      .populate('customerId', 'fullName phone membershipTier')
      .sort({ createdAt: -1 })
      .limit(200);

    return res.json({ success: true, message: 'OK', data });
  } catch (error) {
    next(error);
  }
};

exports.getDeposits = async (req, res, next) => {
  try {
    const { customerId, depositStatus } = req.query;
    const filter = {};
    if (customerId) filter.customerId = customerId;
    if (depositStatus) filter.depositStatus = depositStatus;

    const data = await Deposit.find(filter)
      .populate('customerId', 'fullName phone')
      .sort({ createdAt: -1 })
      .limit(200);

    return res.json({ success: true, message: 'OK', data });
  } catch (error) {
    next(error);
  }
};