const mongoose = require('mongoose');

const productBatchSchema = new mongoose.Schema({
  id: { type: String, default: '' },
  receivedDate: { type: String, default: '' },
  manufactureDate: { type: String, default: '' },
  expiryDate: { type: String, default: '' },
  quantityReceived: { type: Number, default: 0 },
  remainingQuantity: { type: Number, default: 0 },
  note: { type: String, default: '' },
});

const productSchema = new mongoose.Schema(
  {
    productCode: { type: String, required: true, trim: true },
    productName: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ['treatment', 'supplement', 'cosmeceutical'],
      default: 'cosmeceutical',
    },
    price: { type: Number, required: true, default: 0 },
    costPrice: { type: Number, default: 0 },
    stockQuantity: { type: Number, default: 0 },
    unit: { type: String, default: 'Tuýp' },

    // Các trường chi tiết sản phẩm
    brand: { type: String, default: '' },
    manufacturer: { type: String, default: '' },
    ingredients: { type: String, default: '' },
    uses: { type: String, default: '' },
    volume: { type: String, default: '' },
    cautions: { type: String, default: '' },

    // Danh sách lô hàng
    batches: [productBatchSchema],

    image: { type: String, default: '' },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: 'products' }
);

module.exports = mongoose.model('Product', productSchema);