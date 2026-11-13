const mongoose = require('mongoose');

const treatmentSchema = new mongoose.Schema(
  {
    packageCode: { type: String, required: true, unique: true, trim: true }, // LT-001, LT-002...
    treatmentName: { type: String, required: true, trim: true },
    totalSessions: { type: Number, required: true, default: 5 },
    price: { type: Number, required: true, default: 0 },
    durationMinutes: { type: Number, default: 90 },
    description: { type: String, default: '' },
    technology: { type: String, default: '' },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    deletedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Treatment', treatmentSchema);