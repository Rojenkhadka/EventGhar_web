import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pg from 'pg';
import multer from 'multer';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
// Multer setup for profile picture uploads
const upload = multer({
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

const router = express.Router();
const { Pool } = pg;

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost/eventghar',
});

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Create email transporter (uses Ethereal test account in dev if no SMTP configured)
async function createTransporter() {
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  // Dev fallback: auto-create Ethereal test account
  const testAccount = await nodemailer.createTestAccount();
  console.log('📧 Ethereal test account created:', testAccount.user);
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: { user: testAccount.user, pass: testAccount.pass },
  });
}

// Register endpoint
router.post('/register', async (req, res) => {
  try {
    const { fullName, email, password, role = 'USER' } = req.body;

    // Validate input
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Insert user with plain text password (not secure)
    const result = await pool.query(
      'INSERT INTO users (full_name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, full_name, email, role',
      [fullName, email, password, role]
    );

    const user = result.rows[0];

    res.status(201).json({
      message: 'Registration successful',
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Registration failed' });
  }
});

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user
    const result = await pool.query(
      'SELECT id, full_name, email, password_hash, role, COALESCE(is_blocked, false) AS is_blocked FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // Support both bcrypt-hashed and plain-text passwords
    let passwordMatch = false;
    const isBcrypt = user.password_hash && user.password_hash.startsWith('$2');
    if (isBcrypt) {
      passwordMatch = await bcrypt.compare(password, user.password_hash);
    } else {
      passwordMatch = (password === user.password_hash);
    }

    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if account is blocked
    console.log('User is_blocked status:', user.is_blocked); // Debug log
    if (user.is_blocked) {
      console.log('Blocking login for user:', user.email); // Debug log
      return res.status(403).json({ message: 'Your account has been blocked by an administrator. Please contact support.' });
    }

    // Generate token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed' });
  }
});

// Get current user
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    const result = await pool.query(
      'SELECT id, full_name, email, role, profile_pic, phone, notif_event_alerts, notif_event_reminders FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = result.rows[0];

    res.json({
      id: user.id,
      fullName: user.full_name,
      email: user.email,
      role: user.role,
      profilePic: user.profile_pic || null,
      phone: user.phone || null,
      notifEventAlerts: user.notif_event_alerts !== false,
      notifEventReminders: user.notif_event_reminders !== false,
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(401).json({ message: 'Invalid token' });
  }
});

// Update current user profile
router.put('/me', upload.single('profilePic'), async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    let { name, email, phone, notifEventAlerts, notifEventReminders, currentPassword, password } = req.body;
    let profilePic = req.body.profilePic;
    // If profilePic is uploaded as a file, convert to base64
    if (req.file) {
      profilePic = req.file.buffer.toString('base64');
    }

    console.log('📝 Update user request:', { name, email, phone, notifEventAlerts, notifEventReminders, currentPassword: !!currentPassword, password: !!password });

    // Handle password change if requested
    if ((currentPassword || password) && !(currentPassword && password)) {
      return res.status(400).json({ message: 'Both currentPassword and password are required to change password' });
    }

    if (currentPassword && password) {
      // Verify current password
      const pwRes = await pool.query('SELECT password_hash FROM users WHERE id = $1', [decoded.userId]);
      if (pwRes.rows.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }
      const stored = pwRes.rows[0].password_hash || '';
      const isBcrypt = stored && stored.startsWith('$2');
      let match = false;
      if (isBcrypt) {
        match = await bcrypt.compare(currentPassword, stored);
      } else {
        match = currentPassword === stored;
      }
      if (!match) {
        return res.status(401).json({ message: 'Current password is incorrect' });
      }

      // Hash new password and persist
      const newHash = await bcrypt.hash(password, 10);
      await pool.query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [newHash, decoded.userId]);
    }

    if (!name && !email && !profilePic && !phone && notifEventAlerts === undefined && notifEventReminders === undefined) {
      return res.status(400).json({ message: 'At least one field is required' });
    }

    // Build dynamic update query
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name) {
      updates.push(`full_name = $${paramCount}`);
      values.push(name);
      paramCount++;
    }

    if (email) {
      updates.push(`email = $${paramCount}`);
      values.push(email);
      paramCount++;
    }

    if (profilePic) {
      updates.push(`profile_pic = $${paramCount}`);
      values.push(profilePic);
      paramCount++;
    }

    if (phone !== undefined) {
      updates.push(`phone = $${paramCount}`);
      values.push(phone);
      paramCount++;
    }

    if (notifEventAlerts !== undefined) {
      updates.push(`notif_event_alerts = $${paramCount}`);
      values.push(notifEventAlerts);
      paramCount++;
    }

    if (notifEventReminders !== undefined) {
      updates.push(`notif_event_reminders = $${paramCount}`);
      values.push(notifEventReminders);
      paramCount++;
    }

    values.push(decoded.userId);

    console.log('📋 SQL updates:', updates.join(', '));
    console.log('📦 SQL values:', values);

    const result = await pool.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING id, full_name, email, role, phone, profile_pic, notif_event_alerts, notif_event_reminders`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = result.rows[0];

    console.log('✅ User updated successfully:', { id: user.id, email: user.email, notif_event_alerts: user.notif_event_alerts, notif_event_reminders: user.notif_event_reminders });

    res.json({
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        role: user.role,
        phone: user.phone || null,
        profilePic: user.profile_pic || null,
        notifEventAlerts: user.notif_event_alerts !== false,
        notifEventReminders: user.notif_event_reminders !== false,
      },
    });
  } catch (error) {
    console.error('❌ Update user error:', error);
    console.error('Error details:', error.message, error.stack);
    res.status(500).json({ message: 'Failed to update profile' });
  }
});

// ── Forgot Password — Send OTP ───────────────────────────────────────────────
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const result = await pool.query('SELECT id, full_name FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      // Don't reveal whether email exists
      return res.json({ message: 'If that email is registered, an OTP has been sent.' });
    }

    const user = result.rows[0];

    // Invalidate any existing unused tokens for this user
    await pool.query('UPDATE password_reset_tokens SET used = TRUE WHERE user_id = $1 AND used = FALSE', [user.id]);

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await pool.query(
      'INSERT INTO password_reset_tokens (user_id, token, expires_at, token_type) VALUES ($1, $2, $3, $4)',
      [user.id, otp, expiresAt, 'otp']
    );

    // Send OTP email
    try {
      const transporter = await createTransporter();
      const info = await transporter.sendMail({
        from: `"EventGhar" <${process.env.SMTP_FROM || 'noreply@eventghar.com'}>`,
        to: email,
        subject: `${otp} is your EventGhar verification code`,
        html: `
          <div style="font-family:Inter,sans-serif;max-width:480px;margin:0 auto;padding:40px 32px;background:#fff;border-radius:16px;border:1px solid #e5e7eb">
            <div style="margin-bottom:24px">
              <span style="font-size:24px;font-weight:800;color:#1a1d23">Event</span><span style="font-size:24px;font-weight:800;color:#f87060">Ghar</span>
            </div>
            <h2 style="margin:0 0 8px;color:#1a1d23;font-size:20px;font-weight:700">Your password reset code</h2>
            <p style="color:#6b7280;margin:0 0 28px;font-size:14px">Hi <strong>${user.full_name}</strong>, use the code below to reset your password. Do not share this code with anyone.</p>
            <div style="background:#fff5f3;border:1.5px solid #ffd4cc;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px">
              <span style="font-size:40px;font-weight:800;letter-spacing:10px;color:#f87060;display:block">${otp}</span>
            </div>
            <p style="color:#9ca3af;font-size:13px;margin:0">This code expires in <strong>10 minutes</strong>. If you didn't request this, you can safely ignore this email.</p>
          </div>
        `,
      });
      if (!process.env.SMTP_HOST) {
        console.log('📬 OTP email preview:', nodemailer.getTestMessageUrl(info));
        console.log(`🔑 OTP for ${email}: ${otp}`);
      }
    } catch (emailErr) {
      console.error('Email send failed:', emailErr.message);
      console.log(`🔑 OTP fallback for ${email}: ${otp}`);
    }

    res.json({ message: 'OTP sent to your email.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
});

// ── Verify OTP ────────────────────────────────────────────────────────────────
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ message: 'Email and OTP are required' });

    const userResult = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid OTP. Please try again.' });
    }

    const user = userResult.rows[0];

    const tokenResult = await pool.query(
      'SELECT id, expires_at FROM password_reset_tokens WHERE user_id = $1 AND token = $2 AND used = FALSE AND token_type = $3',
      [user.id, otp.trim(), 'otp']
    );

    if (tokenResult.rows.length === 0) {
      return res.status(400).json({ message: 'Incorrect OTP. Please check your email and try again.' });
    }

    const tokenRow = tokenResult.rows[0];

    if (new Date() > new Date(tokenRow.expires_at)) {
      await pool.query('UPDATE password_reset_tokens SET used = TRUE WHERE id = $1', [tokenRow.id]);
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    // Mark OTP as used
    await pool.query('UPDATE password_reset_tokens SET used = TRUE WHERE id = $1', [tokenRow.id]);

    // Issue a short-lived reset token (15 min)
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpiry = new Date(Date.now() + 15 * 60 * 1000);
    await pool.query(
      'INSERT INTO password_reset_tokens (user_id, token, expires_at, token_type) VALUES ($1, $2, $3, $4)',
      [user.id, resetToken, resetExpiry, 'reset_token']
    );

    res.json({ resetToken, message: 'OTP verified successfully.' });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
});

// ── Reset Password ────────────────────────────────────────────────────────────
router.post('/reset-password', async (req, res) => {
  try {
    const { resetToken, password } = req.body;
    if (!resetToken || !password) return res.status(400).json({ message: 'Reset token and password are required' });
    if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });

    const result = await pool.query(
      'SELECT id, user_id, expires_at FROM password_reset_tokens WHERE token = $1 AND used = FALSE AND token_type = $2',
      [resetToken, 'reset_token']
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ message: 'Session invalid or expired. Please start over.' });
    }

    const tokenRow = result.rows[0];

    if (new Date() > new Date(tokenRow.expires_at)) {
      await pool.query('UPDATE password_reset_tokens SET used = TRUE WHERE id = $1', [tokenRow.id]);
      return res.status(400).json({ message: 'Session expired. Please start over.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [hashedPassword, tokenRow.user_id]);
    await pool.query('UPDATE password_reset_tokens SET used = TRUE WHERE id = $1', [tokenRow.id]);

    res.json({ message: 'Password reset successfully.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
});

export default router;
