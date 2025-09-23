const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = 'mongodb+srv://uptime_User97_Masteradmin:SrD6z6JD2I198Ubv@uptimecluster.oghidga.mongodb.net/?retryWrites=true&w=majority&appName=UptimeCluster';

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  name: { type: String, required: true },
  isVerified: { type: Boolean, default: false },
  verificationToken: { type: String, default: null },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

async function main() {
  const email = process.argv[2];
  const role = process.argv[3]; // optional: 'admin' or 'user'

  if (!email) {
    console.error('Usage: node verifyUser.js <email> [role]');
    process.exit(1);
  }

  await mongoose.connect(MONGODB_URI);

  const update = { isVerified: true, verificationToken: null };
  if (role === 'admin' || role === 'user') {
    update.role = role;
  }

  const user = await User.findOneAndUpdate({ email }, update, { new: true });
  if (!user) {
    console.log('User not found:', email);
  } else {
    console.log('Updated user:', { email: user.email, isVerified: user.isVerified, role: user.role });
  }

  await mongoose.disconnect();
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); }); 