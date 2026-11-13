const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const adminBookingController = require('../controllers/admin-booking.controller');
const adminCatalogController = require('../controllers/admin-catalog.controller');
const adminCustomerController = require('../controllers/admin-customer.controller');
const adminDashboardController = require('../controllers/admin-dashboard.controller');
const adminPosController = require('../controllers/admin-pos.controller');
const adminStaffController = require('../controllers/admin-staff.controller');

// MODELS
const Deposit = require('../models/Deposit');
const Invoice = require('../models/Invoice');
const User = require('../models/User');
const Product = require('../models/Product');
const CustomerTreatment = require('../models/CustomerTreatment');

// ==========================================
// HELPER: TẠO HTTP ERROR
// ==========================================
function createRequestError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

// ==========================================
// HELPER: TRỪ KHO SẢN PHẨM
// - Trừ tồn kho tổng
// - Trừ tồn kho từng lô theo FEFO
// - Tăng soldCount
// - Chạy trong MongoDB transaction
// ==========================================
async function deductProductStock(productId, quantity, session) {
  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw createRequestError(400, 'Số lượng sản phẩm cần trừ không hợp lệ!');
  }

  const product = await Product.findOne({
    _id: productId,
    deletedAt: null
  }).session(session);

  if (!product) {
    throw createRequestError(404, 'Không tìm thấy sản phẩm trong kho!');
  }

  const currentStock = Math.max(
    0,
    Number(product.stockQuantity) || 0
  );

  if (currentStock < quantity) {
    throw createRequestError(
      400,
      `Sản phẩm "${product.productName}" không đủ tồn kho. Hiện còn ${currentStock}.`
    );
  }

  // Tăng số lượng đã bán.
  // Đặt trước hai nhánh để áp dụng cho cả sản phẩm có và không có lô.
  product.soldCount =
    (Number(product.soldCount) || 0) + quantity;

  // ------------------------------------------
  // TRƯỜNG HỢP 1: SẢN PHẨM CŨ CHƯA QUẢN LÝ LÔ
  // ------------------------------------------
  if (!Array.isArray(product.batches) || product.batches.length === 0) {
    product.stockQuantity = currentStock - quantity;

    await product.save({ session });

    console.log(
      `📦 Đã trừ kho ${quantity} sản phẩm "${product.productName}". Tồn mới: ${product.stockQuantity}`
    );

    return product;
  }

  // ------------------------------------------
  // TRƯỜNG HỢP 2: SẢN PHẨM CÓ QUẢN LÝ THEO LÔ
  // ------------------------------------------
  const today = new Date().toISOString().slice(0, 10);

  // Sắp xếp FEFO:
  // Lô có hạn sử dụng gần nhất được xuất trước.
  // Lô không có hạn sử dụng được xếp cuối.
  const sortedBatches = product.batches
    .map((batch, index) => ({
      index,
      remaining: Math.max(
        0,
        Number(batch.remainingQuantity) || 0
      ),
      expiryDate: String(batch.expiryDate || '').slice(0, 10)
    }))
    .sort((a, b) => {
      if (!a.expiryDate && !b.expiryDate) return 0;
      if (!a.expiryDate) return 1;
      if (!b.expiryDate) return -1;

      return a.expiryDate.localeCompare(b.expiryDate);
    });

  let batchTotal = sortedBatches.reduce(
    (sum, batch) => sum + batch.remaining,
    0
  );

  // ------------------------------------------
  // ĐỒNG BỘ DỮ LIỆU KHO LỊCH SỬ
  // ------------------------------------------
  // Nếu tổng số lượng các lô lớn hơn tồn kho tổng,
  // giảm phần chênh lệch khỏi các lô theo thứ tự FEFO.
  if (batchTotal > currentStock) {
    let difference = batchTotal - currentStock;

    for (const batch of sortedBatches) {
      if (difference <= 0) break;

      const deducted = Math.min(
        batch.remaining,
        difference
      );

      product.batches[batch.index].remainingQuantity =
        batch.remaining - deducted;

      batch.remaining -= deducted;
      difference -= deducted;
    }

    batchTotal = sortedBatches.reduce(
      (sum, batch) => sum + batch.remaining,
      0
    );
  }

  // Nếu tổng các lô nhỏ hơn tồn kho tổng thì dữ liệu không đồng nhất.
  // Không tự ý tăng số lượng lô vì có thể làm sai tồn kho thực tế.
  if (batchTotal < currentStock) {
    throw createRequestError(
      409,
      `Dữ liệu kho của "${product.productName}" không đồng nhất. Tồn kho tổng: ${currentStock}, tổng tồn các lô: ${batchTotal}. Vui lòng kiểm tra lại.`
    );
  }

  // ------------------------------------------
  // CHỈ LẤY CÁC LÔ CÒN HÀNG VÀ CHƯA HẾT HẠN
  // ------------------------------------------
  const availableBatches = sortedBatches.filter(batch => {
    const isAvailable = batch.remaining > 0;
    const isNotExpired =
      !batch.expiryDate || batch.expiryDate >= today;

    return isAvailable && isNotExpired;
  });

  const availableQuantity = availableBatches.reduce(
    (sum, batch) => sum + batch.remaining,
    0
  );

  if (availableQuantity < quantity) {
    throw createRequestError(
      400,
      `Sản phẩm "${product.productName}" không đủ hàng còn hạn sử dụng. Hiện còn ${availableQuantity}.`
    );
  }

  // ------------------------------------------
  // TRỪ DẦN SỐ LƯỢNG TỪNG LÔ THEO FEFO
  // ------------------------------------------
  let remainingToDeduct = quantity;

  for (const batch of availableBatches) {
    if (remainingToDeduct <= 0) break;

    const deducted = Math.min(
      batch.remaining,
      remainingToDeduct
    );

    product.batches[batch.index].remainingQuantity =
      batch.remaining - deducted;

    batch.remaining -= deducted;
    remainingToDeduct -= deducted;
  }

  // ------------------------------------------
  // ĐỒNG BỘ LẠI TỔNG TỒN KHO
  // ------------------------------------------
  product.stockQuantity = product.batches.reduce(
    (sum, batch) => {
      return sum + Math.max(
        0,
        Number(batch.remainingQuantity) || 0
      );
    },
    0
  );

  await product.save({ session });

  console.log(
    `📦 Đã trừ kho ${quantity} sản phẩm "${product.productName}". Tồn mới: ${product.stockQuantity}. Đã bán: ${product.soldCount}`
  );

  return product;
}


// ==========================================
// 1. DASHBOARD & STATS
// ==========================================
router.get(
  '/dashboard/stats',
  adminDashboardController.getDashboardStats
);


// ==========================================
// 2. BOOKINGS (LỊCH HẸN)
// ==========================================
router.get(
  '/bookings',
  adminBookingController.getAllBookings
);

router.post('/bookings', adminBookingController.createBooking);
router.put('/bookings/:id', adminBookingController.updateBooking);

router.patch(
  '/bookings/:id/status',
  adminBookingController.updateBookingStatus
);


// ==========================================
// 3. NHÂN SỰ & CA TRỰC
// ==========================================
router.get(
  '/staffs',
  adminStaffController.getStaffs
);

router.post(
  '/staffs',
  adminCatalogController.createStaff
);

router.put(
  '/staffs/:id',
  adminCatalogController.updateStaff
);

router.get(
  '/schedules',
  adminStaffController.getSchedules
);

router.post(
  '/schedules',
  adminStaffController.createSchedule
);


// ==========================================
// 4. POS & TIỀN CỌC
// ==========================================
router.get(
  '/pos/catalog',
  adminPosController.getCatalog
);

router.post(
  '/pos/checkout',
  adminPosController.posCheckout
);

router.post(
  '/pos/prepaid-wallet',
  adminPosController.topupPrepaidWallet
);

router.get(
  '/deposits',
  adminPosController.getDeposits
);


// ==========================================
// 5. KHÁCH HÀNG
// ==========================================
router.get(
  '/customers',
  adminCustomerController.getCustomers
);

router.get(
  '/customers/:id',
  adminCustomerController.getCustomerById
);

router.post(
  '/customers',
  adminCustomerController.createCustomer
);


// ==========================================
// 6. DANH MỤC DỊCH VỤ, LIỆU TRÌNH & SẢN PHẨM
// ==========================================

// Danh sách liệu trình (CRUD trên collection `treatments`)
router.get('/treatments', adminCatalogController.getTreatments);
router.post('/treatments', adminCatalogController.createTreatment);
router.put('/treatments/:id', adminCatalogController.updateTreatment);
router.delete('/treatments/:id', adminCatalogController.deleteTreatment);

// Danh sách hồ sơ điều trị khách hàng (đọc từ collection `customertreatments`)
router.get('/customer-treatments', async (req, res, next) => {
  try {
    // Tự động đồng bộ các gói liệu trình đã mua trong hóa đơn (kể cả hóa đơn seed) sang CustomerTreatment nếu chưa có
    const invoicesWithPackages = await Invoice.find({
      customerId: { $ne: null },
      deletedAt: null,
      status: { $nin: ['draft', 'voided', 'deleted'] }
    }).lean();

    for (const inv of invoicesWithPackages) {
      for (const item of inv.items || []) {
        const name = String(item.name || '');
        const isPackage = item.type === 'service' && /liệu trình|gói/i.test(name);
        if (!isPackage) continue;

        const exists = await CustomerTreatment.findOne({
          customerId: inv.customerId,
          treatmentName: name
        }).lean();

        if (!exists) {
          const matchSessions = name.match(/\((\d+)\s*buổi\)/i);
          const totalSessions = matchSessions ? Number(matchSessions[1]) : 5;
          const randNum = Math.floor(100 + Math.random() * 900);

          await CustomerTreatment.create({
            customerId: inv.customerId,
            packageCode: `LT-${Date.now().toString().slice(-4)}-${randNum}`,
            treatmentId: item.itemId,
            treatmentName: name,
            totalSessions,
            usedSessions: 0,
            remainingSessions: totalSessions,
            price: Number(item.unitPrice) || Number(item.amount) || 0,
            status: 'active',
            history: [{
              date: inv.createdAt || new Date(),
              note: `Khởi tạo hồ sơ từ hóa đơn [${inv.invoiceCode}].`
            }]
          });
        }
      }
    }

    const list = await CustomerTreatment.find({})
      .populate(
        'customerId',
        'fullName phone customerCode customId membershipTier'
      )
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      message: 'Lấy danh sách hồ sơ điều trị thành công!',
      data: list
    });
  } catch (error) {
    next(error);
  }
});

// Check-in buổi điều trị
router.patch(
  '/customer-treatments/:id/checkin',
  adminCatalogController.checkinTreatmentSession
);

// Dịch vụ
router.get(
  '/services',
  adminCatalogController.getServices
);

router.post(
  '/services',
  adminCatalogController.createService
);

router.put(
  '/services/:id',
  adminCatalogController.updateService
);

router.delete(
  '/services/:id',
  adminCatalogController.deleteService
);

// Sản phẩm
router.get(
  '/products',
  adminCatalogController.getProducts
);

router.post(
  '/products',
  adminCatalogController.createProduct
);

router.put(
  '/products/:id',
  adminCatalogController.updateProduct
);


// ==========================================
// 7. QUẢN LÝ HÓA ĐƠN POS
// ==========================================

// ------------------------------------------
// GET: LẤY DANH SÁCH HÓA ĐƠN
// ------------------------------------------
router.get('/invoices', async (req, res, next) => {
  try {
    const invoices = await Invoice.find({
      deletedAt: null
    }).sort({
      createdAt: -1
    });

    return res.json({
      success: true,
      data: invoices
    });
  } catch (error) {
    next(error);
  }
});


// ------------------------------------------
// POST: TẠO HÓA ĐƠN
// LƯU MONGODB NHƯNG CHƯA TRỪ KHO
// ------------------------------------------
router.post('/invoices', async (req, res, next) => {
  try {
    const data = req.body || {};

    console.log(
      '--> [POS Backend] Nhận hóa đơn mới:',
      data.invoiceCode
    );

    let validCustomerId = null;

    if (
      data.customerId &&
      data.customerId !== 'walkin' &&
      mongoose.Types.ObjectId.isValid(data.customerId)
    ) {
      validCustomerId = data.customerId;
    }

    const sanitizedItems = (data.items || []).map(item => {
      const isItemObjectId =
        mongoose.Types.ObjectId.isValid(item.itemId);

      return {
        itemId: isItemObjectId
          ? item.itemId
          : new mongoose.Types.ObjectId(),

        name: item.name || 'Dịch vụ / Sản phẩm',

        type: item.type === 'product'
          ? 'product'
          : 'service',

        quantity: Number(item.quantity) || 1,

        unitPrice: Number(item.unitPrice) || 0,

        amount:
          Number(item.amount) ||
          (
            (Number(item.quantity) || 1) *
            (Number(item.unitPrice) || 0)
          )
      };
    });

    const newInvoice = new Invoice({
      invoiceCode:
        data.invoiceCode || `INV-${Date.now()}`,

      customerId: validCustomerId,

      customerName:
        data.customerName || 'Khách vãng lai',

      customerPhone:
        data.customerPhone || '',

      customerTier:
        data.customerTier || 'walkin',

      cashierName:
        data.cashierName || 'Thu Ngân - Quầy POS',

      items: sanitizedItems,

      totalAmount:
        Number(data.totalAmount) || 0,

      discountAmount:
        Number(data.discountAmount) || 0,

      depositDeduction:
        Number(data.depositDeduction) || 0,

      finalAmount:
        Number(data.finalAmount) || 0,

      paidAmount:
        Number(data.paidAmount) || 0,

      debtAmount:
        Number(data.debtAmount) || 0,

      paymentMethod:
        data.paymentMethod || 'cash',

      dueDate: data.dueDate
        ? new Date(data.dueDate)
        : null,

      // Hóa đơn mới chưa xuất.
      // Chưa thực hiện trừ kho tại đây.
      status: 'normal',

      createdAt: data.createdAt
        ? new Date(data.createdAt)
        : new Date()
    });

    const saved = await newInvoice.save();

    console.log(
      '✅ Đã lưu hóa đơn vào MongoDB:',
      saved.invoiceCode,
      'ID:',
      saved._id
    );

    return res.status(201).json({
      success: true,
      message: 'Lưu hóa đơn thành công!',
      data: saved
    });

  } catch (error) {
    next(error);
  }
});


// ==========================================
// 8. XUẤT HÓA ĐƠN
// - Trừ kho tổng
// - Trừ kho theo lô FEFO
// - Tăng soldCount
// - Tạo hồ sơ liệu trình
// - Cập nhật chi tiêu và hạng thành viên
// ==========================================
router.put('/invoices/:id/export', async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw createRequestError(
        400,
        'ID hóa đơn không hợp lệ!'
      );
    }

    let resultInvoice = null;
    let alreadyExported = false;

    await session.withTransaction(async () => {
      // ------------------------------------------
      // 1. TÌM HÓA ĐƠN
      // ------------------------------------------
      const invoice = await Invoice.findById(id)
        .session(session);

      if (!invoice) {
        throw createRequestError(
          404,
          'Không tìm thấy hóa đơn cần xuất!'
        );
      }

      // ------------------------------------------
      // 2. CHẶN XUẤT HÓA ĐƠN LẦN HAI
      // ------------------------------------------
      if (invoice.status === 'exported') {
        resultInvoice = invoice;
        alreadyExported = true;
        return;
      }

      if (
        invoice.status === 'deleted' ||
        invoice.deletedAt
      ) {
        throw createRequestError(
          400,
          'Hóa đơn đã bị hủy, không thể xuất!'
        );
      }

      // ------------------------------------------
      // 3. GOM SỐ LƯỢNG SẢN PHẨM THEO ID
      // ------------------------------------------
      const productQuantities = new Map();

      for (const item of invoice.items || []) {
        if (item.type !== 'product') {
          continue;
        }

        if (
          !item.itemId ||
          !mongoose.Types.ObjectId.isValid(
            String(item.itemId)
          )
        ) {
          throw createRequestError(
            400,
            `Sản phẩm "${item.name}" không có ID hợp lệ!`
          );
        }

        const productId = String(item.itemId);
        const quantity = Number(item.quantity);

        if (
          !Number.isInteger(quantity) ||
          quantity <= 0
        ) {
          throw createRequestError(
            400,
            `Số lượng sản phẩm "${item.name}" không hợp lệ!`
          );
        }

        productQuantities.set(
          productId,
          (productQuantities.get(productId) || 0) + quantity
        );
      }

      // ------------------------------------------
      // 4. TRỪ KHO TỪNG SẢN PHẨM
      // ------------------------------------------
      for (const [productId, quantity] of productQuantities) {
        await deductProductStock(
          productId,
          quantity,
          session
        );
      }

      // ------------------------------------------
      // 5. CẬP NHẬT TRẠNG THÁI HÓA ĐƠN
      // ------------------------------------------
      invoice.status = 'exported';

      invoice.exportedAt = req.body?.exportedAt
        ? new Date(req.body.exportedAt)
        : new Date();

      if (req.body?.retentionExpiresAt) {
        invoice.retentionExpiresAt =
          req.body.retentionExpiresAt;
      }

      await invoice.save({ session });

      // ------------------------------------------
      // 6. TẠO HỒ SƠ LIỆU TRÌNH
      // ------------------------------------------
      // Chỉ tạo khi hóa đơn ban đầu được xuất.
      // Hóa đơn đã xuất sẽ bị chặn ở bước 2,
      // vì vậy không tạo lại hồ sơ khi gọi xuất lần nữa.
      if (invoice.customerId) {
        for (const item of invoice.items || []) {
          const itemName = String(
            item.name || ''
          ).toLowerCase();

          const isPackage =
            itemName.includes('gói') ||
            itemName.includes('liệu trình') ||
            (
              item.type === 'service' &&
              Number(item.quantity) > 1
            );

          if (!isPackage) {
            continue;
          }

          const randNum = Math.floor(
            100 + Math.random() * 900
          );

          const packageCode =
            `LT-${Date.now().toString().slice(-4)}-${randNum}`;

          const matchSessions = String(item.name || '').match(/\((\d+)\s*buổi\)/i);
          const totalSessions = matchSessions ? Number(matchSessions[1]) : 5;

          const record = new CustomerTreatment({
            customerId: invoice.customerId,

            packageCode,

            treatmentName: item.name,

            totalSessions,

            usedSessions: 0,

            remainingSessions: totalSessions,

            price:
              Number(item.unitPrice) ||
              Number(item.amount) ||
              0,

            status: 'active',

            history: [{
              date: new Date(),
              note:
                `Khởi tạo hồ sơ sau khi xuất hóa đơn [${invoice.invoiceCode}].`
            }]
          });

          await record.save({ session });

          console.log(
            `✅ Đã tạo hồ sơ liệu trình "${item.name}" cho khách hàng.`
          );
        }

        // ------------------------------------------
        // 7. ĐỒNG BỘ TỔNG CHI TIÊU VÀ HẠNG THÀNH VIÊN
        // ------------------------------------------
        const exportedInvoices = await Invoice.find({
          customerId: invoice.customerId,
          status: 'exported',
          deletedAt: null
        }).session(session);

        const actualTotalSpent = exportedInvoices.reduce(
          (sum, inv) => {
            return sum + (
              Number(inv.paidAmount) || 0
            );
          },
          0
        );

        let updatedTier = 'Standard';

        if (actualTotalSpent >= 30000000) {
          updatedTier = 'Diamond';
        } else if (actualTotalSpent >= 15000000) {
          updatedTier = 'Gold';
        } else if (actualTotalSpent >= 5000000) {
          updatedTier = 'Silver';
        }

        await User.findByIdAndUpdate(
          invoice.customerId,
          {
            $set: {
              totalSpent: actualTotalSpent,
              membershipTier: updatedTier
            }
          },
          {
            session,
            new: true
          }
        );
      }

      resultInvoice = invoice;
    });

    // ------------------------------------------
    // 8. TRẢ KẾT QUẢ
    // ------------------------------------------
    return res.json({
      success: true,

      message: alreadyExported
        ? 'Hóa đơn đã được xuất trước đó. Không trừ kho lần nữa.'
        : 'Xuất hóa đơn thành công! Đã cập nhật tồn kho, số lượng đã bán và hồ sơ liệu trình.',

      data: resultInvoice
    });

  } catch (error) {
    next(error);

  } finally {
    await session.endSession();
  }
});


// ==========================================
// 9. REVENUE REPORT
// ==========================================
router.get('/revenue-report', async (req, res, next) => {
  try {
    const { startDate, endDate, category } = req.query;

    const query = {
      status: 'exported',
      deletedAt: null
    };

    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(`${startDate}T00:00:00.000Z`),
        $lte: new Date(`${endDate}T23:59:59.999Z`)
      };
    }

    const invoices = await Invoice.find(query)
      .sort({ createdAt: 1 });

    const dailyMap = new Map();

    invoices.forEach(inv => {
      const dateStr = new Date(inv.createdAt)
        .toISOString()
        .substring(0, 10);

      if (!dailyMap.has(dateStr)) {
        dailyMap.set(dateStr, {
          date: dateStr,
          branch: 'thuduc',
          serviceRevenue: 0,
          productRevenue: 0,
          successOrders: 0,
          discount: 0,
          revenue: 0,
          cost: 0,
          profit: 0
        });
      }

      const dayData = dailyMap.get(dateStr);

      dayData.successOrders += 1;

      dayData.discount +=
        Number(inv.discountAmount) || 0;

      let serviceRevenue = 0;
      let productRevenue = 0;

      (inv.items || []).forEach(item => {
        const itemAmount =
          Number(item.amount) ||
          (
            (Number(item.quantity) || 1) *
            (Number(item.unitPrice) || 0)
          );

        if (item.type === 'product') {
          productRevenue += itemAmount;
        } else {
          serviceRevenue += itemAmount;
        }
      });

      const invoiceTotal =
        Number(inv.totalAmount) ||
        (serviceRevenue + productRevenue) ||
        1;

      const actualPaid =
        Number(inv.paidAmount) ||
        (
          invoiceTotal -
          (Number(inv.discountAmount) || 0)
        );

      const netService = Math.round(
        serviceRevenue * (actualPaid / invoiceTotal)
      );

      const netProduct = Math.round(
        productRevenue * (actualPaid / invoiceTotal)
      );

      dayData.serviceRevenue += netService;
      dayData.productRevenue += netProduct;
      dayData.revenue += actualPaid;

      const estimatedCost = Math.round(
        netService * 0.35 +
        netProduct * 0.5
      );

      dayData.cost += estimatedCost;
      dayData.profit += actualPaid - estimatedCost;
    });

    return res.json({
      success: true,
      data: Array.from(dailyMap.values())
    });

  } catch (error) {
    next(error);
  }
});


// ==========================================
// 10. CỌC & CÔNG NỢ
// ==========================================
router.get('/deposits-debt', async (req, res, next) => {
  try {
    const deposits = await Deposit.find()
      .sort({ createdAt: -1 });

    const debts = await Invoice.find({
      debtAmount: { $gt: 0 },
      deletedAt: null
    }).sort({
      createdAt: -1
    });

    return res.json({
      success: true,
      data: {
        deposits,
        debts
      }
    });

  } catch (error) {
    next(error);
  }
});


module.exports = router;