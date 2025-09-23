const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const MONGODB_URI = 'mongodb+srv://uptime_User97_Masteradmin:SrD6z6JD2I198Ubv@uptimecluster.oghidga.mongodb.net/?retryWrites=true&w=majority&appName=UptimeCluster';

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  name: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);

    const users = [
      {
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'Test12345!',
        role: 'admin'
      },
      {
        name: 'Regular User',
        email: 'user@example.com',
        password: 'Test12345!',
        role: 'user'
      }
    ];

    for (const u of users) {
      const existing = await User.findOne({ email: u.email });
      if (existing) {
        console.log(`User already exists: ${u.email}`);
        continue;
      }
      const hashedPassword = await bcrypt.hash(u.password, 10);
      await User.create({
        name: u.name,
        email: u.email,
        password: hashedPassword,
        role: u.role
      });
      console.log(`Created user: ${u.email} (${u.role})`);
    }

    console.log('Seeding finished.');
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
}

seed(); 