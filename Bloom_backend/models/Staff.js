const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  customId: { type: String, default: '' },
  staffCode: { type: String, unique: true, sparse: true },
  staffName: { type: String, required: true },
  phone: { type: String, default: '' },
  roleType: { type: String, enum: ['doctor', 'ktv', 'admin'], default: 'ktv' },
  title: { type: String, default: 'Kỹ thuật viên' },
  specialty: { type: String, default: 'Chăm sóc da' },
  experienceYears: { type: Number, default: 2 },
  rating: { type: Number, default: 5.0 },
  avatar: { type: String, default: '' },
  status: { type: String, enum: ['working', 'leave', 'inactive'], default: 'working' },
  deletedAt: { type: Date, default: null }
}, { timestamps: true });

// Tự động sinh mã tịnh tiến riêng biệt theo roleType & đảm bảo tiền tố tên
staffSchema.pre('save', async function () {
  if (this.isNew && !this.staffCode) {
    let prefix = 'KTV-';
    if (this.roleType === 'doctor') prefix = 'BS-';
    else if (this.roleType === 'admin') prefix = 'AD-';

    const lastStaff = await this.constructor.findOne({
      roleType: this.roleType,
      staffCode: new RegExp(`^${prefix}`)
    }).sort({ staffCode: -1 });

    let nextNumber = 1;
    if (lastStaff && lastStaff.staffCode) {
      const match = lastStaff.staffCode.match(/\d+/);
      if (match) nextNumber = parseInt(match[0], 10) + 1;
    }
    this.staffCode = `${prefix}${String(nextNumber).padStart(3, '0')}`;
  }

  // Tự động thêm tiền tố BS. hoặc KTV. nếu chưa có
  if (this.staffName) {
    const cleanName = this.staffName.trim();
    if (this.roleType === 'doctor' && !cleanName.startsWith('BS.')) {
      this.staffName = `BS. ${cleanName.replace(/^(Bác sĩ|BS|BS\.)\s*/i, '')}`;
    } else if (this.roleType === 'ktv' && !cleanName.startsWith('KTV.')) {
      this.staffName = `KTV. ${cleanName.replace(/^(Kỹ thuật viên|KTV|KTV\.)\s*/i, '')}`;
    }
  }
});

module.exports = mongoose.model('Staff', staffSchema);