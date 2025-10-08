const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const cron = require('node-cron');

// Counter for sequences (e.g., invoice numbers)
const counterSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  seq: { type: Number, default: 0 }
});
const Counter = mongoose.model('Counter', counterSchema);

async function getNextSequence(key) {
  const doc = await Counter.findOneAndUpdate(
    { key },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return doc.seq;
}

const app = express();
const PORT = process.env.PORT || 5000;
const EMAIL_VERIFICATION_ENABLED = process.env.EMAIL_VERIFICATION_ENABLED !== 'false';

// Middleware
app.use(cors());
app.use(express.json());
// Static serve uploads
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const safeName = file.originalname.toLowerCase().replace(/[^a-z0-9.\-_]/g, '-');
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + '-' + safeName);
  }
});
const upload = multer({ storage });

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://uptime_User97_Masteradmin:SrD6z6JD2I198Ubv@uptimecluster.oghidga.mongodb.net/?retryWrites=true&w=majority&appName=UptimeCluster';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// User Schema
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

// User Profile Schema (issuer/client metadata)
const userProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true, required: true },
  companyName: { type: String, default: '' },
  fullName: { type: String, default: '' },
  addressLine: { type: String, default: '' },
  city: { type: String, default: '' },
  state: { type: String, default: '' },
  postalCode: { type: String, default: '' },
  country: { type: String, default: '' },
  phone: { type: String, default: '' },
  logoUrl: { type: String, default: '' },
  signatureUrl: { type: String, default: '' },
  swiftCode: { type: String, default: '' },
  iban: { type: String, default: '' },
  cardNumber: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

userProfileSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const UserProfile = mongoose.model('UserProfile', userProfileSchema);

// Invoice Schema
const invoiceItemSchema = new mongoose.Schema({
  description: { type: String, required: true },
  quantity: { type: Number, required: true, min: 0 },
  unitPrice: { type: Number, required: true, min: 0 }
}, { _id: false });

const invoiceSchema = new mongoose.Schema({
  // Issuer (from profile or explicit)
  issuerName: { type: String, required: true },
  issuerCompany: { type: String, default: '' },
  issuerAddress: { type: String, default: '' },
  issuerCountry: { type: String, default: '' },
  issuerPhone: { type: String, default: '' },
  issuerLogoUrl: { type: String, default: '' },
  issuerSignatureUrl: { type: String, default: '' },
  issuerSwiftCode: { type: String, default: '' },
  issuerIban: { type: String, default: '' },
  issuerCardNumber: { type: String, default: '' },

  // Client
  clientName: { type: String, required: true },
  clientEmail: { type: String, required: true },
  clientCompany: { type: String, default: '' },
  clientAddress: { type: String, default: '' },
  clientCountry: { type: String, default: '' },
  clientPhone: { type: String, default: '' },

  // Items and totals
  items: { type: [invoiceItemSchema], default: [] },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
  notes: { type: String, default: '' },
  description: { type: String, default: '' },
  dueDate: { type: Date, required: true },
  isPaid: { type: Boolean, default: false },
  paidAt: { type: Date, default: null },

  // Identification
  invoiceNumber: { type: Number, index: true, unique: true, sparse: true },
  invoiceNumberStr: { type: String, index: true, unique: true, sparse: true },

  // Reminders
  reminderEnabled: { type: Boolean, default: false },
  reminderIntervalDays: { type: Number, default: 7 },
  reminderHour: { type: Number, default: null }, // 0-23 local server time
  reminderMinute: { type: Number, default: null }, // 0-59
  lastReminderAt: { type: Date, default: null },

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
});

const Invoice = mongoose.model('Invoice', invoiceSchema);

// Mailer setup
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587,
  secure: !!process.env.SMTP_SECURE && process.env.SMTP_SECURE !== 'false',
  auth: process.env.SMTP_USER && process.env.SMTP_PASS ? {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  } : undefined,
  logger: true,
  debug: true,
  tls: {
    rejectUnauthorized: false
  }
});

function baseEmailTemplate({ title, intro, actionUrl, actionLabel, footer, logoUrl, signatureUrl }) {
  const safeLogo = logoUrl ? `<img src="${logoUrl}" alt="logo" style="height:40px;margin-bottom:12px"/>` : '';
  const signature = signatureUrl ? `<div style="margin-top:16px"><img src="${signatureUrl}" alt="signature" style="height:48px"/></div>` : '';
  return `
  <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.6;background:#f5f7fb;padding:24px">
    <div style="max-width:640px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden">
      <div style="padding:24px">
        ${safeLogo}
        <h2 style="margin:0 0 8px 0;color:#111827">${title}</h2>
        <p style="margin:0 0 16px 0;color:#374151">${intro}</p>
        ${actionUrl ? `<p style="margin:16px 0"><a href="${actionUrl}" style="display:inline-block;padding:10px 16px;background:#2563eb;color:#fff;border-radius:6px;text-decoration:none">${actionLabel || 'Open'}</a></p>` : ''}
        ${footer ? `<p style="margin-top:16px;color:#6b7280;font-size:12px">${footer}</p>` : ''}
        ${signature}
      </div>
    </div>
  </div>`;
}

async function sendVerificationEmail(toEmail, token) {
  const backendBase = (process.env.BACKEND_BASE_URL || '').replace(/\/$/, '') || `https://payments.uptimio.com`;
  const verifyUrl = `${backendBase}/api/verify?token=${encodeURIComponent(token)}`;

  const html = baseEmailTemplate({
    title: 'Verify your email address',
    intro: 'Please confirm your email address to activate your account.',
    actionUrl: verifyUrl,
    actionLabel: 'Verify email',
    footer: 'If you did not request this, you can ignore this message.',
    logoUrl: process.env.MAIL_LOGO_URL || '',
    signatureUrl: process.env.MAIL_SIGNATURE_URL || ''
  });

  try {
    if (!process.env.SMTP_HOST) {
      console.log('[DEV] Verification link:', verifyUrl);
      return { devLink: verifyUrl };
    }
    const info = await transporter.sendMail({
      from: process.env.MAIL_FROM || 'no-reply@uptiomio.local',
      to: toEmail,
      subject: 'Verify your email',
      html,
    });
    console.log('Verification email sent:', {
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected,
      response: info.response,
      to: toEmail,
    });
    return { messageId: info.messageId };
  } catch (err) {
    console.error('Email send error (non-fatal):', err);
    return { error: err.message || 'send_failed', to: toEmail };
  }
}


async function sendWelcomeEmail(toEmail, userName, customPassword = null) {
  try {
    const basePreference = (process.env.FRONTEND_BASE_URL || process.env.BACKEND_BASE_URL || 'https://payments.uptimio.com').replace(/\/$/, '');
    const loginUrl = basePreference;
    
    const html = baseEmailTemplate({
      title: 'Welcome to Uptimio Payment System',
      intro: `Hello ${userName},<br><br>Welcome to Uptimio Payment System! Your account has been successfully created.<br><br><strong>Your temporary password is: ${customPassword || "Please contact administrator"}</strong><br><br><strong>IMPORTANT:</strong> To complete your account setup and verify your email, please follow these steps:<br><br>1. Click the "Access System" button below to log in<br>2. Use your email and the temporary password above<br>3. Go to your Profile settings and change your password<br>4. Once you change your password, your account will be verified<br><br>You can now access the system and start managing your invoices. As a system administrator who deals with networks, help desk, server maintenance, and web development, I am excited to have you as part of our platform.<br><br>Uptimio - Your reliable partner for IT solutions`,
      actionUrl: loginUrl,
      actionLabel: 'Access System',
      footer: 'Thank you for joining Uptimio Payment System.',
      logoUrl: process.env.MAIL_LOGO_URL || '/uploads/uptimioInvoice.jpg',
      signatureUrl: process.env.MAIL_SIGNATURE_URL || ''
    });

    if (!process.env.SMTP_HOST) {
      console.log('[DEV] Welcome email link:', loginUrl);
      return { devLink: loginUrl };
    }
    
    const info = await transporter.sendMail({
      from: process.env.MAIL_FROM || 'no-reply@uptiomio.local',
      to: toEmail,
      subject: 'Uptimio Payment Services - Welcome',
      html,
    });
    console.log('Welcome email sent:', { messageId: info.messageId, to: toEmail, userName });
    return { messageId: info.messageId };
  } catch (err) {
    console.error('Welcome email error (non-fatal):', err);
    return { error: err.message || 'send_failed' };
  }
}


async function sendPasswordResetEmail(toEmail, userName, newPassword) {
  try {
    const basePreference = (process.env.FRONTEND_BASE_URL || process.env.BACKEND_BASE_URL || 'https://payments.uptimio.com').replace(/\/$/, '');
    const loginUrl = basePreference;
    
    const html = baseEmailTemplate({
      title: 'Password Reset - Uptimio Payment System',
      intro: `Hello ${userName},<br><br>Your password has been reset by an administrator.<br><br><strong>Your new temporary password is: ${newPassword}</strong><br><br>Please log in with this password and change it to something secure of your choice.<br><br>As a system administrator who deals with networks, help desk, server maintenance, and web development, I recommend using a strong password for security.<br><br>Uptimio - Your reliable partner for IT solutions`,
      actionUrl: loginUrl,
      actionLabel: 'Login to System',
      footer: 'Please change your password after logging in for security.',
      logoUrl: process.env.MAIL_LOGO_URL || '/uploads/uptimioInvoice.jpg',
      signatureUrl: process.env.MAIL_SIGNATURE_URL || ''
    });

    if (!process.env.SMTP_HOST) {
      console.log('[DEV] Password reset email link:', loginUrl);
      return { devLink: loginUrl };
    }
    
    const info = await transporter.sendMail({
      from: process.env.MAIL_FROM || 'no-reply@uptiomio.local',
      to: toEmail,
      subject: 'Password Reset - Uptimio Payment System',
      html,
    });
    console.log('Password reset email sent:', { messageId: info.messageId, to: toEmail, userName });
    return { messageId: info.messageId };
  } catch (err) {
    console.error('Password reset email error (non-fatal):', err);
    return { error: err.message || 'send_failed' };
  }
}

async function sendInvoiceCreatedEmail(toEmail, invoiceId, clientName, logoUrl, signatureUrl) {
  try {
    const basePreference = (process.env.FRONTEND_BASE_URL || process.env.BACKEND_BASE_URL || 'https://payments.uptimio.com').replace(/\/$/, '');
    const viewUrl = `${basePreference}/?invoiceId=${encodeURIComponent(String(invoiceId))}`;
    const html = baseEmailTemplate({
      title: 'New Invoice Available - Uptimio',
      intro: `Hello${clientName ? ' ' + clientName : ''},<br><br>Please find your new invoice from Uptimio agency. You can view or download it using the link below:<br><br>Thank you for working with Uptimio agency. As a system administrator who deals with networks, help desk, server maintenance, and web development, I appreciate your trust in our services.<br><br>Uptimio - Your reliable partner for IT solutions`,
      actionUrl: viewUrl,
      actionLabel: 'View Invoice',
      footer: 'Thank you for your cooperation with Uptimio agency.',
      logoUrl: logoUrl || process.env.MAIL_LOGO_URL || '/uploads/uptimioInvoice.jpg',
      signatureUrl: signatureUrl || process.env.MAIL_SIGNATURE_URL || ''
    });

    if (!process.env.SMTP_HOST) {
      console.log('[DEV] Invoice link:', viewUrl);
      return { devLink: viewUrl };
    }
    const info = await transporter.sendMail({
      from: process.env.MAIL_FROM || 'no-reply@uptiomio.local',
      to: toEmail,
      subject: 'Uptimio Payment Services - New Invoice',
      html,
    });
    console.log('Invoice email sent:', { messageId: info.messageId, to: toEmail, invoiceId });
    return { messageId: info.messageId };
  } catch (err) {
    console.error('Invoice email error (non-fatal):', err);
    return { error: err.message || 'send_failed' };
  }
}

async function sendInvoiceReminderEmail(toEmail, invoiceId, clientName, logoUrl, signatureUrl) {
  try {
    const basePreference = (process.env.FRONTEND_BASE_URL || process.env.BACKEND_BASE_URL || 'https://payments.uptimio.com').replace(/\/$/, '');
    const viewUrl = `${basePreference}/?invoiceId=${encodeURIComponent(String(invoiceId))}`;
    const html = baseEmailTemplate({
      title: 'Payment reminder',
      intro: `Hello${clientName ? ' ' + clientName : ''}, this is a friendly reminder that your invoice is awaiting payment. You can view or download it here:`,
      actionUrl: viewUrl,
      actionLabel: 'View invoice',
      footer: 'If you have already paid, please ignore this message.',
      logoUrl: logoUrl || process.env.MAIL_LOGO_URL || '',
      signatureUrl: signatureUrl || process.env.MAIL_SIGNATURE_URL || ''
    });
    if (!process.env.SMTP_HOST) {
      console.log('[DEV] Reminder link:', viewUrl);
      return { devLink: viewUrl };
    }
    const info = await transporter.sendMail({
      from: process.env.MAIL_FROM || 'no-reply@uptiomio.local',
      to: toEmail,
      subject: 'Uptimio Payment Services - Payment Reminder',
      html,
    });
    console.log('Reminder email sent:', { messageId: info.messageId, to: toEmail, invoiceId });
    return { messageId: info.messageId };
  } catch (err) {
    console.error('Reminder email error (non-fatal):', err);
    return { error: err.message || 'send_failed' };
  }
}

// Daily reminder for users with 2+ overdue invoices
async function sendDailyOverdueReminderEmail(toEmail, clientName, overdueInvoices, logoUrl, signatureUrl) {
  try {
    const invoiceCount = overdueInvoices.length;
    const totalAmount = overdueInvoices.reduce((sum, inv) => sum + inv.amount, 0);
    const oldestInvoice = overdueInvoices.reduce((oldest, inv) => 
      new Date(inv.createdAt) < new Date(oldest.createdAt) ? inv : oldest
    );
    
    const basePreference = (process.env.FRONTEND_BASE_URL || process.env.BACKEND_BASE_URL || 'https://payments.uptimio.com').replace(/\/$/, '');
    const dashboardUrl = basePreference;
    
    const html = baseEmailTemplate({
      title: 'Urgent: Multiple Unpaid Invoices',
      intro: `Hello${clientName ? ' ' + clientName : ''},<br><br>We noticed that you currently have <strong>${invoiceCount} unpaid invoices</strong> totaling <strong>$${totalAmount.toFixed(2)}</strong>.<br><br>Your oldest unpaid invoice is from ${new Date(oldestInvoice.createdAt).toLocaleDateString()}.<br><br>To avoid any service interruptions and late fees, please settle your outstanding invoices as soon as possible.<br><br>You can view all your invoices and make payments through our secure portal:`,
      actionUrl: dashboardUrl,
      actionLabel: 'View All Invoices',
      footer: `This is an automated reminder. You will receive daily reminders until all invoices are paid. If you have any questions or need assistance with payment, please contact us immediately.`,
      logoUrl: logoUrl || process.env.MAIL_LOGO_URL || '',
      signatureUrl: signatureUrl || process.env.MAIL_SIGNATURE_URL || ''
    });

    if (!process.env.SMTP_HOST) {
      console.log('[DEV] Daily overdue reminder link:', dashboardUrl);
      return { devLink: dashboardUrl };
    }

    const info = await transporter.sendMail({
      from: process.env.MAIL_FROM || 'no-reply@uptiomio.local',
      to: toEmail,
      subject: `Uptimio Payment Services - ${invoiceCount} Unpaid Invoices Require Immediate Attention`,
      html
    });

    console.log('Daily overdue reminder sent:', { 
      messageId: info.messageId, 
      to: toEmail, 
      invoiceCount, 
      totalAmount: totalAmount.toFixed(2) 
    });
    return { messageId: info.messageId };
  } catch (err) {
    console.error('Daily overdue reminder email error (non-fatal):', err);
    return { error: err.message || 'send_failed' };
  }
}

// Admin notification functions
async function sendAdminPasswordResetNotification(adminEmail, userEmail, userName, adminName) {
  try {
    const html = baseEmailTemplate({
      title: 'Password Reset Notification - Uptimio Admin',
      intro: `Hello ${adminName},<br><br>You have successfully reset the password for user:<br><br><strong>User Details:</strong><br>• Name: ${userName}<br>• Email: ${userEmail}<br>• Reset Date: ${new Date().toLocaleString()}<br><br>The user has been notified via email about their new password. This action has been logged for your records.<br><br>If this action was not performed by you, please contact system administrator immediately.`,
      actionUrl: `${process.env.FRONTEND_BASE_URL || process.env.BACKEND_BASE_URL || 'https://payments.uptimio.com'}/admin`,
      actionLabel: 'Access Admin Panel',
      footer: 'This is an automated notification from Uptimio Admin System.',
      logoUrl: process.env.MAIL_LOGO_URL || '',
      signatureUrl: process.env.MAIL_SIGNATURE_URL || ''
    });

    if (!process.env.SMTP_HOST) {
      console.log('[DEV] Admin password reset notification would be sent to:', adminEmail);
      return { devLink: 'Admin notification' };
    }

    const info = await transporter.sendMail({
      from: process.env.MAIL_FROM || 'no-reply@uptiomio.local',
      to: adminEmail,
      subject: 'Password Reset Notification - Uptimio Admin',
      html: html
    });

    console.log('Admin password reset notification sent:', { 
      messageId: info.messageId, 
      to: adminEmail, 
      userEmail,
      userName 
    });
    return { messageId: info.messageId };
  } catch (err) {
    console.error('Admin password reset notification error (non-fatal):', err);
    return { error: err.message || 'send_failed' };
  }
}

async function sendAdminReminderNotification(adminEmail, userEmail, userName, invoiceId, adminName) {
  try {
    const html = baseEmailTemplate({
      title: 'Payment Reminder Sent - Uptimio Admin',
      intro: `Hello ${adminName},<br><br>A payment reminder has been sent to the following user:<br><br><strong>User Details:</strong><br>• Name: ${userName}<br>• Email: ${userEmail}<br>• Invoice ID: ${invoiceId}<br>• Reminder Date: ${new Date().toLocaleString()}<br><br>The user has been notified via email about their overdue payment. This action has been logged for your records.`,
      actionUrl: `${process.env.FRONTEND_BASE_URL || process.env.BACKEND_BASE_URL || 'https://payments.uptimio.com'}/admin`,
      actionLabel: 'View Invoice Details',
      footer: 'This is an automated notification from Uptimio Admin System.',
      logoUrl: process.env.MAIL_LOGO_URL || '',
      signatureUrl: process.env.MAIL_SIGNATURE_URL || ''
    });

    if (!process.env.SMTP_HOST) {
      console.log('[DEV] Admin reminder notification would be sent to:', adminEmail);
      return { devLink: 'Admin reminder notification' };
    }

    const info = await transporter.sendMail({
      from: process.env.MAIL_FROM || 'no-reply@uptiomio.local',
      to: adminEmail,
      subject: 'Payment Reminder Sent - Uptimio Admin',
      html: html
    });

    console.log('Admin reminder notification sent:', { 
      messageId: info.messageId, 
      to: adminEmail, 
      userEmail,
      userName,
      invoiceId 
    });
    return { messageId: info.messageId };
  } catch (err) {
    console.error('Admin reminder notification error (non-fatal):', err);
    return { error: err.message || 'send_failed' };
  }
}

async function sendAdminDailyReminderNotification(adminEmail, userEmail, userName, invoiceCount, totalAmount, adminName) {
  try {
    const html = baseEmailTemplate({
      title: 'Daily Overdue Reminder Sent - Uptimio Admin',
      intro: `Hello ${adminName},<br><br>A daily overdue reminder has been sent to the following user:<br><br><strong>User Details:</strong><br>• Name: ${userName}<br>• Email: ${userEmail}<br>• Overdue Invoices: ${invoiceCount}<br>• Total Amount: $${totalAmount.toFixed(2)}<br>• Reminder Date: ${new Date().toLocaleString()}<br><br>The user has been notified via email about their multiple overdue invoices. This action has been logged for your records.`,
      actionUrl: `${process.env.FRONTEND_BASE_URL || process.env.BACKEND_BASE_URL || 'https://payments.uptimio.com'}/admin`,
      actionLabel: 'Access Admin Panel',
      footer: 'This is an automated notification from Uptimio Admin System.',
      logoUrl: process.env.MAIL_LOGO_URL || '',
      signatureUrl: process.env.MAIL_SIGNATURE_URL || ''
    });

    if (!process.env.SMTP_HOST) {
      console.log('[DEV] Admin daily reminder notification would be sent to:', adminEmail);
      return { devLink: 'Admin daily reminder notification' };
    }

    const info = await transporter.sendMail({
      from: process.env.MAIL_FROM || 'no-reply@uptiomio.local',
      to: adminEmail,
      subject: 'Daily Overdue Reminder Sent - Uptimio Admin',
      html: html
    });

    console.log('Admin daily reminder notification sent:', { 
      messageId: info.messageId, 
      to: adminEmail, 
      userEmail,
      userName,
      invoiceCount,
      totalAmount: totalAmount.toFixed(2)
    });
    return { messageId: info.messageId };
  } catch (err) {
    console.error('Admin daily reminder notification error (non-fatal):', err);
    return { error: err.message || 'send_failed' };
  }
}

// Middleware for JWT authentication
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

// Profile: GET (create if missing) and PUT
app.get('/api/profile', authenticateToken, async (req, res) => {
  try {
    let profile = await UserProfile.findOne({ userId: req.user.userId });
    if (!profile) {
      profile = await UserProfile.create({
        userId: req.user.userId,
        companyName: 'Uptimio',
        fullName: 'Nikola Jeremic',
        addressLine: 'Mose Pijade 6, Veliki Radinci',
        city: 'Veliki Radinci',
        state: 'Vojvodina',
        postalCode: '22211',
        country: 'Serbia',
        phone: '',
        logoUrl: '',
        signatureUrl: ''
      });
    }
    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.put('/api/profile', authenticateToken, async (req, res) => {
  try {
    const update = req.body || {};
    const profile = await UserProfile.findOneAndUpdate(
      { userId: req.user.userId },
      { $set: { ...update, updatedAt: new Date() } },
      { new: true, upsert: true }
    );
    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


// Change user password
app.post('/api/profile/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }
    
    // Find user
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    
    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    
    // Update password
    await User.findByIdAndUpdate(req.user.userId, { password: hashedNewPassword });
    // Mark user as verified when they change their password
    await User.findByIdAndUpdate(req.user.userId, { isVerified: true });
    
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Upload logo
app.post('/api/profile/logo', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'File is required' });
    const base = (process.env.BACKEND_BASE_URL || 'https://payments.uptimio.com').replace(/\/$/, '');
    const url = `${base}/uploads/${req.file.filename}`;
    const profile = await UserProfile.findOneAndUpdate(
      { userId: req.user.userId },
      { $set: { logoUrl: url, updatedAt: new Date() } },
      { new: true, upsert: true }
    );
    res.json({ url, profile });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Upload signature
app.post('/api/profile/signature', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'File is required' });
    const base = (process.env.BACKEND_BASE_URL || 'https://payments.uptimio.com').replace(/\/$/, '');
    const url = `${base}/uploads/${req.file.filename}`;
    const profile = await UserProfile.findOneAndUpdate(
      { userId: req.user.userId },
      { $set: { signatureUrl: url, updatedAt: new Date() } },
      { new: true, upsert: true }
    );
    res.json({ url, profile });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Admin: upload logo for specific user
app.post('/api/users/:id/profile/logo', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    if (!req.file) return res.status(400).json({ message: 'File is required' });
    const { id } = req.params;
    const base = (process.env.BACKEND_BASE_URL || 'https://payments.uptimio.com').replace(/\/$/, '');
    const url = `${base}/uploads/${req.file.filename}`;
    const profile = await UserProfile.findOneAndUpdate(
      { userId: id },
      { $set: { logoUrl: url, updatedAt: new Date() } },
      { new: true, upsert: true }
    );
    res.json({ url, profile });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Register
app.post('/api/register', async (req, res) => {
  try {
    const { email, password, name, role } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = new User({
      email,
      password: hashedPassword,
      name,
      role: role || 'user',
      isVerified: EMAIL_VERIFICATION_ENABLED ? false : true,
      verificationToken: EMAIL_VERIFICATION_ENABLED ? crypto.randomBytes(32).toString('hex') : null
    });

    await user.save();

    // Send verification email (non-blocking)
    if (EMAIL_VERIFICATION_ENABLED && user.verificationToken) {
      sendVerificationEmail(user.email, user.verificationToken);
    } else {
      // Send welcome email when verification is disabled
      sendWelcomeEmail(user.email, user.name);
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: EMAIL_VERIFICATION_ENABLED ? 'User created successfully. Please verify your email.' : 'User created successfully.',
      token,
      user: { id: user._id, email: user.email, name: user.name, role: user.role, isVerified: user.isVerified }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    if (EMAIL_VERIFICATION_ENABLED && !user.isVerified) {
      return res.status(403).json({ message: 'Email address not verified. Please check your inbox.' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: { id: user._id, email: user.email, name: user.name, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all invoices (admin only)
app.get('/api/invoices', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { search } = req.query || {};
    const q = {};
    if (search && typeof search === 'string' && search.trim()) {
      const s = search.trim();
      const or = [
        { invoiceNumberStr: { $regex: s, $options: 'i' } },
        { clientName: { $regex: s, $options: 'i' } },
        { clientEmail: { $regex: s, $options: 'i' } },
      ];
      // Try ObjectId
      if (mongoose.Types.ObjectId.isValid(s)) {
        or.push({ _id: s });
      }
      q.$or = or;
    }

    const invoices = await Invoice.find(q).sort({ createdAt: -1 }).populate('createdBy', 'name email');
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get invoice by id
app.get('/api/invoices/:id', authenticateToken, async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

    // Allow creator or admin or invoice client (by email)
    const isCreator = String(invoice.createdBy) === req.user.userId;
    if (!isCreator && req.user.role !== 'admin' && invoice.clientEmail !== req.user.email) {
      return res.status(403).json({ message: 'Access denied' });
    }
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user's invoices
app.get('/api/my-invoices', authenticateToken, async (req, res) => {
  try {
    const { search } = req.query || {};
    const base = { clientEmail: req.user.email };
    if (search && typeof search === 'string' && search.trim()) {
      const s = search.trim();
      base.$or = [
        { invoiceNumberStr: { $regex: s, $options: 'i' } },
        { clientName: { $regex: s, $options: 'i' } },
      ];
    }
    const invoices = await Invoice.find(base).sort({ createdAt: -1 });
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create invoice (admin only)
app.post('/api/invoices', authenticateToken, async (req, res) => {
  try {
    const {
      issuerName, issuerCompany, issuerAddress, issuerCountry, issuerPhone,
      issuerLogoUrl, issuerSignatureUrl, issuerSwiftCode, issuerIban, issuerCardNumber,
      clientName, clientEmail, clientCompany, clientAddress, clientCountry, clientPhone,
      items, amount, currency, notes, description, dueDate,
      reminderEnabled, reminderHour, reminderMinute
    } = req.body;

    // Generate invoice number
    const lastInvoice = await Invoice.findOne({}, {}, { sort: { invoiceNumber: -1 } });
    const invoiceNumber = lastInvoice ? lastInvoice.invoiceNumber + 1 : 1;
    const invoiceNumberStr = `INV-${invoiceNumber.toString().padStart(6, '0')}`;

    const invoice = new Invoice({
      issuerName, issuerCompany, issuerAddress, issuerCountry, issuerPhone,
      issuerLogoUrl, issuerSignatureUrl, issuerSwiftCode, issuerIban, issuerCardNumber,
      clientName, clientEmail, clientCompany, clientAddress, clientCountry, clientPhone,
      items, amount, currency, notes, description, dueDate,
      reminderEnabled, reminderHour, reminderMinute,
      invoiceNumber, invoiceNumberStr,
      createdBy: req.user.userId
    });

    await invoice.save();

    // Send email to client with view link
    sendInvoiceCreatedEmail(clientEmail, invoice._id, clientName, issuerLogoUrl, issuerSignatureUrl);
    res.status(201).json(invoice);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Mark invoice as paid
app.patch('/api/invoices/:id/pay', authenticateToken, async (req, res) => {
  try {
    const { paymentMethod } = req.body || {};
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    // Check if user is the client or admin
    if (invoice.clientEmail !== req.user.email && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (invoice.isPaid) {
      return res.json(invoice);
    }

    // Sanitize payment method (optional)
    const allowed = ['Payoneer', 'Western Union', 'Zelle', 'Credit Card', 'Authorize.net', 'Paypal'];
    const safeMethod = allowed.includes(paymentMethod) ? paymentMethod : null;

    invoice.isPaid = true;
    invoice.paymentMethod = safeMethod;
    invoice.paidAt = new Date();

    await invoice.save();

    // Send email to client with view link
    sendInvoiceCreatedEmail(clientEmail, invoice._id, clientName, issuerLogoUrl, issuerSignatureUrl);
    res.json(invoice);
  } catch (error) {
    if (error?.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid invoice id' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update invoice reminder settings (admin only)
app.patch('/api/invoices/:id/reminder', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    const { enabled, intervalDays, hour, minute } = req.body || {};

    const update = { };
    if (enabled !== undefined) update.reminderEnabled = !!enabled;
    if (intervalDays !== undefined) update.reminderIntervalDays = Number(intervalDays || 1);
    if (hour !== undefined) update.reminderHour = (hour === null ? null : Math.max(0, Math.min(23, Number(hour))));
    if (minute !== undefined) update.reminderMinute = (minute === null ? null : Math.max(0, Math.min(59, Number(minute))));

    const invoice = await Invoice.findByIdAndUpdate(
      req.params.id,
      { $set: update },
      { new: true }
    );
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Scheduler: periodic check for reminders
cron.schedule('*/5 * * * *', async () => {
  try {
    const now = new Date();
    const invoices = await Invoice.find({ isPaid: false, reminderEnabled: true });
    for (const inv of invoices) {
      const hasDailyTime = (typeof inv.reminderHour === 'number' && typeof inv.reminderMinute === 'number');

      let shouldSend = false;
      if (hasDailyTime && (inv.reminderIntervalDays || 1) === 1) {
        // Build today's target time in server local time
        const target = new Date(now);
        target.setHours(inv.reminderHour, inv.reminderMinute, 0, 0);

        const startOfToday = new Date(now);
        startOfToday.setHours(0,0,0,0);

        const last = inv.lastReminderAt ? new Date(inv.lastReminderAt) : null;
        const sentToday = last && last >= startOfToday;
        // Send once per day after target time
        shouldSend = !sentToday && now.getTime() >= target.getTime();
      } else {
        // Fallback: interval-based (legacy)
      const last = inv.lastReminderAt ? new Date(inv.lastReminderAt) : null;
      const intervalMs = (inv.reminderIntervalDays || 7) * 24 * 60 * 60 * 1000;
        shouldSend = !last || (now.getTime() - last.getTime()) >= intervalMs;
      }

      if (shouldSend) {
        await sendInvoiceReminderEmail(
          inv.clientEmail,
          inv._id,
          inv.clientName,
          inv.issuerLogoUrl,
          inv.issuerSignatureUrl
        );
        inv.lastReminderAt = now;
        await inv.save();
      }
    }
  } catch (err) {
    console.error('Reminder scheduler error:', err);
  }
});

// Get all users (admin only)
app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const users = await User.find({}, { password: 0 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Admin: create user
app.post('/api/users', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { name, email, password, role, profile, customPassword } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    // Use custom password if provided, otherwise use regular password
    const finalPassword = customPassword || password;
    const hashedPassword = await bcrypt.hash(finalPassword, 10);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      isVerified: false,
      verificationToken: EMAIL_VERIFICATION_ENABLED ? crypto.randomBytes(32).toString('hex') : null
    });

    await newUser.save();

    // Create optional profile
    if (profile && typeof profile === 'object') {
      const p = {
        userId: newUser._id,
        companyName: profile.companyName || '',
        fullName: profile.fullName || name,
        addressLine: profile.addressLine || '',
        city: profile.city || '',
        state: profile.state || '',
        postalCode: profile.postalCode || '',
        country: profile.country || '',
        phone: profile.phone || '',
        logoUrl: profile.logoUrl || '',
        signatureUrl: profile.signatureUrl || ''
      };
      await UserProfile.findOneAndUpdate({ userId: newUser._id }, { $set: p }, { upsert: true });
    }

    if (EMAIL_VERIFICATION_ENABLED && newUser.verificationToken) {
      sendVerificationEmail(newUser.email, newUser.verificationToken);
    } else {
      // Send welcome email when verification is disabled
      sendWelcomeEmail(newUser.email, newUser.name, finalPassword);
    }

    const { password: _, ...safeUser } = newUser.toObject();
    res.status(201).json(safeUser);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Admin: delete user (and related profile). Does not delete invoices by default.
app.delete('/api/users/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    const { id } = req.params;
    const user = await User.findByIdAndDelete(id);
    await UserProfile.findOneAndDelete({ userId: id });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


// Admin: reset user password
app.post('/api/users/:id/reset-password', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    const { id } = req.params;
    const { customPassword } = req.body;
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Generate or use custom password
    const tempPassword = customPassword || Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);
    
    // Update user password
    await User.findByIdAndUpdate(id, { password: hashedPassword });
    
    // Send password reset email to user
    await sendPasswordResetEmail(user.email, user.name, tempPassword);
    
    // Send admin notification
    const adminEmail = process.env.ADMIN_EMAIL || req.user.email; // Use environment variable or current admin email
    const adminName = req.user.name || 'Administrator';
    await sendAdminPasswordResetNotification(adminEmail, user.email, user.name, adminName);
    
    res.json({ 
      message: 'Password reset successfully. New password sent to user email and admin notification sent.',
      tempPassword: tempPassword // Only for admin to see
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


// Admin: send manual reminder for invoice
app.post('/api/invoices/:id/send-reminder', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    const { id } = req.params;
    const invoice = await Invoice.findById(id).populate('createdBy', 'name email');
    
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    
    if (invoice.isPaid) {
      return res.status(400).json({ message: 'Invoice is already paid' });
    }
    
    // Get issuer profile for logo and signature
    const issuerProfile = await UserProfile.findOne({ userId: invoice.createdBy._id });
    
    // Send reminder email
    const result = await sendInvoiceReminderEmail(
      invoice.clientEmail,
      invoice._id,
      invoice.clientName,
      issuerProfile?.logoUrl,
      issuerProfile?.signatureUrl
    );
    
    // Send admin notification
    const adminEmail = process.env.ADMIN_EMAIL || req.user.email;
    const adminName = req.user.name || 'Administrator';
    await sendAdminReminderNotification(
      adminEmail, 
      invoice.clientEmail, 
      invoice.clientName, 
      invoice._id, 
      adminName
    );
    
    // Update last reminder timestamp
    await Invoice.findByIdAndUpdate(id, { lastReminderAt: new Date() });
    
    res.json({ 
      message: 'Reminder sent successfully to user and admin notification sent',
      result: result
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Admin: delete invoice by id
app.delete('/api/invoices/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    const inv = await Invoice.findByIdAndDelete(req.params.id);
    if (!inv) return res.status(404).json({ message: 'Invoice not found' });
    res.json({ message: 'Invoice deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Admin or self: get user profile by user id
app.get('/api/users/:id/profile', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    if (req.user.role !== 'admin' && req.user.userId !== id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    const profile = await UserProfile.findOne({ userId: id });
    if (!profile) return res.status(404).json({ message: 'Profile not found' });
    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Admin or self: update user profile by user id
app.put('/api/users/:id/profile', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    if (req.user.role !== 'admin' && req.user.userId !== id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    const update = req.body || {};
    const profile = await UserProfile.findOneAndUpdate(
      { userId: id },
      { $set: { ...update, updatedAt: new Date() } },
      { upsert: true, new: true }
    );
    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Verify email
app.get('/api/verify', async (req, res) => {
  try {
    const { token } = req.query;
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ message: 'Invalid verification token' });
    }

    const user = await User.findOne({ verificationToken: token });
    if (!user) {
      return res.status(400).json({ message: 'Verification token not found or already used' });
    }

    user.isVerified = true;
    user.verificationToken = null;
    await user.save();

    res.json({ message: 'Email successfully verified. You can now log in.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Admin: test email endpoint
app.post('/api/test-email', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    const { to } = req.body;
    if (!to) return res.status(400).json({ message: 'Missing "to" address' });

    const info = await transporter.sendMail({
      from: process.env.MAIL_FROM || 'no-reply@uptiomio.local',
      to,
      subject: 'Uptiomio test email',
      text: 'Ovo je test poruka iz Uptiomio sistema.',
    });
    console.log('Test email sent:', { messageId: info.messageId, accepted: info.accepted, rejected: info.rejected, response: info.response, to });
    res.json({ message: 'Test email sent', messageId: info.messageId, accepted: info.accepted, rejected: info.rejected });
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({ message: 'Email send failed', error: error.message });
  }
});

// Admin: manually trigger overdue reminder check
app.post('/api/admin/trigger-overdue-reminders', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }

  try {
    console.log('Manually triggering overdue reminder check...');
    await checkAndSendOverdueReminders();
    res.json({ message: 'Overdue reminder check completed successfully' });
  } catch (error) {
    console.error('Manual overdue reminder check error:', error);
    res.status(500).json({ message: 'Overdue reminder check failed', error: error.message });
  }
});

// Function to check and send daily overdue reminders
async function checkAndSendOverdueReminders() {
  try {
    console.log('Checking for users with 2+ overdue invoices...');
    
    // Get all unpaid invoices created in the last 15 days
    const fifteenDaysAgo = new Date();
    fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);
    
    const unpaidInvoices = await Invoice.find({
      isPaid: false,
      createdAt: { $gte: fifteenDaysAgo }
    }).populate('createdBy', 'name email');
    
    // Group invoices by client email
    const invoicesByClient = {};
    unpaidInvoices.forEach(invoice => {
      if (!invoicesByClient[invoice.clientEmail]) {
        invoicesByClient[invoice.clientEmail] = [];
      }
      invoicesByClient[invoice.clientEmail].push(invoice);
    });
    
    // Find clients with 2+ unpaid invoices
    const clientsWithMultipleInvoices = Object.entries(invoicesByClient)
      .filter(([email, invoices]) => invoices.length >= 2);
    
    console.log(`Found ${clientsWithMultipleInvoices.length} clients with 2+ unpaid invoices`);
    
    // Send reminders to each client
    for (const [clientEmail, invoices] of clientsWithMultipleInvoices) {
      try {
        const clientName = invoices[0].clientName;
        const issuerProfile = await UserProfile.findOne({ 
          userId: invoices[0].createdBy._id 
        });
        
        const logoUrl = issuerProfile?.logoUrl || '';
        const signatureUrl = issuerProfile?.signatureUrl || '';
        
        await sendDailyOverdueReminderEmail(
          clientEmail,
          clientName,
          invoices,
          logoUrl,
          signatureUrl
        );
        
        // Send admin notification
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@uptimio.com';
        const adminName = 'Administrator';
        const totalAmount = invoices.reduce((sum, inv) => sum + inv.amount, 0);
        await sendAdminDailyReminderNotification(
          adminEmail,
          clientEmail,
          clientName,
          invoices.length,
          totalAmount,
          adminName
        );
        
        console.log(`Daily overdue reminder sent to ${clientEmail} for ${invoices.length} invoices and admin notification sent`);
      } catch (err) {
        console.error(`Failed to send overdue reminder to ${clientEmail}:`, err);
      }
    }
    
    console.log('Daily overdue reminder check completed');
  } catch (err) {
    console.error('Daily overdue reminder check error:', err);
  }
}

// Daily scheduler for overdue reminders (runs at 9 AM every day)
cron.schedule('0 9 * * *', async () => {
  console.log('Running daily overdue reminder check...');
  await checkAndSendOverdueReminders();
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
