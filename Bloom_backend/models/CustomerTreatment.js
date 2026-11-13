const mongoose = require('mongoose');
const { generateBusinessCode } = require('../utils/business-codes');

const customerTreatmentSchema = new mongoose.Schema(
  {
    packageCode: { type: String, default: '' },
    treatmentCode: { type: String, unique: true, sparse: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service' },
    customTreatmentId: { type: String, default: '' },
    treatmentName: { type: String, required: true },
    totalSessions: { type: Number, required: true, default: 1 },
    usedSessions: { type: Number, default: 0 },
    remainingSessions: { type: Number, default: 1 },
    price: { type: Number, default: 0 },
    technology: { type: String, default: '' },
    description: { type: String, default: '' },
    sessionDetails: [
      {
        sessionNumber: { type: Number },
        title: { type: String, default: '' },
        description: { type: String, default: '' },
      },
    ],
    history: [
      {
        date: { type: Date, default: Date.now },
        staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
        note: { type: String, default: '' },
      },
    ],
    status: { type: String, enum: ['active', 'completed'], default: 'active' },
  },
  { timestamps: true }
);

customerTreatmentSchema.pre('save', async function () {
  if (this.isNew && !this.treatmentCode) {
    if (typeof generateBusinessCode === 'function') {
      this.treatmentCode = await generateBusinessCode(
        this.constructor,
        'treatmentCode',
        'treatment',
        (sequence) => `TL${String(sequence).padStart(3, '0')}`
      );
    }
  }
  if (!this.packageCode) {
    this.packageCode = this.treatmentCode || this.customTreatmentId || '';
  }
});

module.exports = mongoose.model('CustomerTreatment', customerTreatmentSchema);