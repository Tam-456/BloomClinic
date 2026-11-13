const mongoose = require('mongoose');
const { dateParts, generateBusinessCode } = require('../utils/business-codes');
const invoiceSchema = new mongoose.Schema(
  {
    invoiceCode: { type: String, required: true, unique: true },
    
    // 1. CHO PHÉP NULL KHI LÀ KHÁCH VÃNG LAI (Bỏ required: true)
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false, // Bỏ bắt buộc để khách vãng lai lưu được
      default: null,
    },
    
    customerName: { type: String, default: 'Khách vãng lai' },
    customerPhone: { type: String, default: '' },
    customerTier: { type: String, default: 'walkin' },
    cashierName: { type: String, default: 'Thu Ngân - Quầy POS' },

    items: [
      {
        itemId: { type: mongoose.Schema.Types.ObjectId, refPath: 'items.type' },
        name: { type: String, required: true },
        type: { type: String, enum: ['service', 'product'], required: true },
        quantity: { type: Number, required: true, default: 1 },
        unitPrice: { type: Number, required: true, default: 0 },
        amount: { type: Number, required: true, default: 0 },
      },
    ],

    totalAmount: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    depositDeduction: { type: Number, default: 0 },
    finalAmount: { type: Number, default: 0 },
    paidAmount: { type: Number, default: 0 },
    debtAmount: { type: Number, default: 0 },

    paymentHistory: [
      {
        paidAt: { type: Date, default: Date.now },
        amount: { type: Number, required: true },
        paymentMethod: { type: String, default: 'banking' },
        channel: { type: String, default: 'Thanh toán trực tuyến' },
        note: { type: String, default: '' }
      }
    ],

    paymentMethod: {
      type: String,
      enum: ['cash', 'banking', 'card', 'prepaid_wallet'],
      default: 'cash',
    },

    dueDate: { type: Date, default: null },

    // 2. BỔ SUNG 'normal' VÀ 'exported' VÀO ENUM STATUS
    status: {
      type: String,
      enum: [
        'normal',         // Chờ xuất hóa đơn (chưa ghi nhận doanh thu)
        'exported',       // Đã xuất (chốt doanh thu & tích lũy chi tiêu)
        'edited',         // Đã sửa
        'deleted',        // Đã xóa/hủy
        'draft',
        'issued',
        'partially_paid',
        'paid',
        'voided'
      ],
      default: 'normal',
    },

    exportedAt: { type: Date, default: null },
    retentionExpiresAt: { type: String, default: null },

    managerOverride: {
      approvedBy: { type: String },
      reason: { type: String },
      approvedAt: { type: String },
    },

    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);


module.exports = mongoose.model('Invoice', invoiceSchema);