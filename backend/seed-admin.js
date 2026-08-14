require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@chocodelight.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'AdminChoco2026!';
const ADMIN_NAME = 'NS Choco Delight Admin';

async function seedAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/choco-delight');
    console.log('✅ Connected to MongoDB');

    let admin = await User.findOne({ email: ADMIN_EMAIL.toLowerCase() }).select('+password');

    if (admin) {
      console.log(`ℹ️  Admin user ${ADMIN_EMAIL} already exists. Updating credentials...`);
      admin.name = ADMIN_NAME;
      admin.password = ADMIN_PASSWORD; // Pre-save hook will hash password
      admin.role = 'admin';
      await admin.save();
    } else {
      admin = await User.create({
        name: ADMIN_NAME,
        email: ADMIN_EMAIL.toLowerCase(),
        password: ADMIN_PASSWORD,
        phone: '9999999999',
        role: 'admin',
      });
    }

    console.log('\n🎉 ADMIN ACCOUNT CREATED / UPDATED SUCCESSFULLY!');
    console.log('─────────────────────────────────────────');
    console.log(`📧 Email    : ${admin.email}`);
    console.log(`🔑 Password : ${ADMIN_PASSWORD}`);
    console.log(`👑 Role     : ${admin.role}`);
    console.log('─────────────────────────────────────────\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Admin seed error:', error.message);
    process.exit(1);
  }
}

seedAdmin();
