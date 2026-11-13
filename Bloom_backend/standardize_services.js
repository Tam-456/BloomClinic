require('dotenv').config();
const mongoose = require('mongoose');
const Service = require('./models/Service');

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

// Định nghĩa tiền tố cho từng chuyên khoa
const PREFIX_MAP = {
  'dieu-tri-da': 'DT',
  'cham-soc-da': 'CS',
  'tre-hoa-nang-co': 'TH',
  'triet-long': 'TL'
};

async function standardizeServiceCodes() {
  try {
    console.log('🔄 Đang kết nối tới MongoDB Atlas...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Đã kết nối thành công bloom_cluster_db!\n');

    // Lấy toàn bộ dịch vụ sắp xếp theo thời gian tạo cũ nhất trước
    const services = await Service.find({}).sort({ createdAt: 1 });
    console.log(`📋 Tổng cộng có ${services.length} dịch vụ cần chuẩn hoá mã.\n`);

    // Bộ đếm tịnh tiến cho từng chuyên khoa
    const counters = {
      'dieu-tri-da': 1,
      'cham-soc-da': 1,
      'tre-hoa-nang-co': 1,
      'triet-long': 1,
      'other': 1
    };

    let updated = 0;
    for (const s of services) {
      const group = s.categoryGroup;
      const prefix = PREFIX_MAP[group] || 'DV';
      const counterKey = PREFIX_MAP[group] ? group : 'other';

      // Sinh mã tịnh tiến 3 chữ số: DT-001, CS-001, TH-001, TL-001...
      const newCustomId = `${prefix}-${String(counters[counterKey]).padStart(3, '0')}`;
      counters[counterKey]++;

      // Cập nhật lại trường customId và serviceCode
      await Service.updateOne(
        { _id: s._id },
        { 
          $set: { 
            customId: newCustomId,
            serviceCode: newCustomId 
          } 
        }
      );
      updated++;
    }

    console.log('==========================================');
    console.log(`🎉 ĐÃ CHUẨN HOÁ XONG ${updated} DỊCH VỤ!`);
    console.log(`- Điều trị da: ${counters['dieu-tri-da'] - 1} dịch vụ (DT-001 -> ...)`);
    console.log(`- Chăm sóc da: ${counters['cham-soc-da'] - 1} dịch vụ (CS-001 -> ...)`);
    console.log(`- Trẻ hóa & Nâng cơ: ${counters['tre-hoa-nang-co'] - 1} dịch vụ (TH-001 -> ...)`);
    console.log(`- Triệt lông: ${counters['triet-long'] - 1} dịch vụ (TL-001 -> ...)`);
    console.log('==========================================');

    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi:', error);
    process.exit(1);
  }
}

standardizeServiceCodes();