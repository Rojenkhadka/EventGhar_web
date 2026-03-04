// Jest globals (describe, it, expect, beforeEach) are injected automatically
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';

// ── Mock pg ───────────────────────────────────────────────────────────────────
// Use a holder object: const is hoisted but object properties are accessed lazily
const mockDb = { query: jest.fn() };

jest.mock('pg', () => ({
  __esModule: true,
  default: {
    Pool: jest.fn(function () { this.query = (...args) => mockDb.query(...args); }),
  },
}));

// ── Mock nodemailer ───────────────────────────────────────────────────────────
jest.mock('nodemailer', () => ({
  __esModule: true,
  default: {
    createTestAccount: jest.fn().mockResolvedValue({ user: 'test@ethereal.email', pass: 'pass' }),
    createTransport: jest.fn(() => ({
      sendMail: jest.fn().mockResolvedValue({ messageId: 'msg-123' }),
    })),
    getTestMessageUrl: jest.fn(() => 'https://ethereal.email/test'),
  },
}));

import authRouter from '../../../src/routes/auth.js';

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRouter);
  return app;
}

const JWT_SECRET = 'your-secret-key-change-in-production';
const userToken = jwt.sign({ userId: 1, email: 'user@test.com', role: 'USER' }, JWT_SECRET);

// ── POST /api/auth/register ───────────────────────────────────────────────────
describe('POST /api/auth/register', () => {
  let app;
  beforeEach(() => { app = createApp(); mockDb.query.mockReset(); });

  it('returns 400 when fullName is missing', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'test@test.com', password: 'pass123' });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('All fields are required');
  });

  it('returns 400 when email is missing', async () => {
    const res = await request(app).post('/api/auth/register').send({ fullName: 'Test User', password: 'pass123' });
    expect(res.status).toBe(400);
  });

  it('returns 400 when password is missing', async () => {
    const res = await request(app).post('/api/auth/register').send({ fullName: 'Test User', email: 'test@test.com' });
    expect(res.status).toBe(400);
  });

  it('returns 400 when email is already registered', async () => {
    mockDb.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });
    const res = await request(app).post('/api/auth/register')
      .send({ fullName: 'Test User', email: 'existing@test.com', password: 'pass123' });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Email already registered');
  });

  it('returns 201 with user data on successful registration', async () => {
    mockDb.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ id: 5, full_name: 'New User', email: 'new@test.com', role: 'USER' }] });
    const res = await request(app).post('/api/auth/register')
      .send({ fullName: 'New User', email: 'new@test.com', password: 'pass123' });
    expect(res.status).toBe(201);
    expect(res.body.user).toMatchObject({ email: 'new@test.com', fullName: 'New User' });
  });
});

// ── POST /api/auth/login ──────────────────────────────────────────────────────
describe('POST /api/auth/login', () => {
  let app;
  beforeEach(() => { app = createApp(); mockDb.query.mockReset(); });

  it('returns 400 when email is missing', async () => {
    const res = await request(app).post('/api/auth/login').send({ password: 'pass' });
    expect(res.status).toBe(400);
  });

  it('returns 400 when password is missing', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'a@test.com' });
    expect(res.status).toBe(400);
  });

  it('returns 401 when user does not exist', async () => {
    mockDb.query.mockResolvedValueOnce({ rows: [] });
    const res = await request(app).post('/api/auth/login').send({ email: 'nobody@test.com', password: 'pass123' });
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid credentials');
  });

  it('returns 401 when password is wrong', async () => {
    mockDb.query.mockResolvedValueOnce({
      rows: [{ id: 1, full_name: 'User', email: 'u@test.com', password_hash: 'correctpass', role: 'USER', is_blocked: false }],
    });
    const res = await request(app).post('/api/auth/login').send({ email: 'u@test.com', password: 'wrongpass' });
    expect(res.status).toBe(401);
  });

  it('returns 403 when user is blocked', async () => {
    mockDb.query.mockResolvedValueOnce({
      rows: [{ id: 1, full_name: 'Blocked', email: 'b@test.com', password_hash: 'pass', role: 'USER', is_blocked: true }],
    });
    const res = await request(app).post('/api/auth/login').send({ email: 'b@test.com', password: 'pass' });
    expect(res.status).toBe(403);
    expect(res.body.message).toContain('blocked');
  });

  it('returns 200 with JWT token on success', async () => {
    mockDb.query.mockResolvedValueOnce({
      rows: [{ id: 1, full_name: 'Valid User', email: 'v@test.com', password_hash: 'mypass', role: 'USER', is_blocked: false }],
    });
    const res = await request(app).post('/api/auth/login').send({ email: 'v@test.com', password: 'mypass' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user).toMatchObject({ email: 'v@test.com', role: 'USER' });
  });

  it('returns a verifiable JWT token', async () => {
    mockDb.query.mockResolvedValueOnce({
      rows: [{ id: 99, full_name: 'JWT Test', email: 'jwt@test.com', password_hash: 'mypass', role: 'ORGANIZER', is_blocked: false }],
    });
    const res = await request(app).post('/api/auth/login').send({ email: 'jwt@test.com', password: 'mypass' });
    expect(res.status).toBe(200);
    const decoded = jwt.verify(res.body.token, JWT_SECRET);
    expect(decoded.userId).toBe(99);
    expect(decoded.role).toBe('ORGANIZER');
  });
});

// ── POST /api/auth/forgot-password ────────────────────────────────────────────
describe('POST /api/auth/forgot-password', () => {
  let app;
  beforeEach(() => { app = createApp(); mockDb.query.mockReset(); });

  it('returns 400 when email is missing', async () => {
    const res = await request(app).post('/api/auth/forgot-password').send({});
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Email is required');
  });

  it('returns 200 with generic message when user does not exist (security)', async () => {
    mockDb.query.mockResolvedValueOnce({ rows: [] });
    const res = await request(app).post('/api/auth/forgot-password').send({ email: 'ghost@test.com' });
    expect(res.status).toBe(200);
    expect(res.body.message).toContain('OTP');
  });

  it('returns 200 and sends OTP when user exists', async () => {
    mockDb.query
      .mockResolvedValueOnce({ rows: [{ id: 1, full_name: 'Test User' }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });
    const res = await request(app).post('/api/auth/forgot-password').send({ email: 'test@test.com' });
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('OTP sent to your email.');
  });
});

// ── POST /api/auth/verify-otp ─────────────────────────────────────────────────
describe('POST /api/auth/verify-otp', () => {
  let app;
  beforeEach(() => { app = createApp(); mockDb.query.mockReset(); });

  it('returns 400 when email is missing', async () => {
    const res = await request(app).post('/api/auth/verify-otp').send({ otp: '123456' });
    expect(res.status).toBe(400);
  });

  it('returns 400 when otp is missing', async () => {
    const res = await request(app).post('/api/auth/verify-otp').send({ email: 'a@test.com' });
    expect(res.status).toBe(400);
  });

  it('returns 400 when user is not found', async () => {
    mockDb.query.mockResolvedValueOnce({ rows: [] });
    const res = await request(app).post('/api/auth/verify-otp').send({ email: 'ghost@test.com', otp: '123456' });
    expect(res.status).toBe(400);
    expect(res.body.message).toContain('Invalid OTP');
  });

  it('returns 400 when OTP is incorrect', async () => {
    mockDb.query.mockResolvedValueOnce({ rows: [{ id: 1 }] }).mockResolvedValueOnce({ rows: [] });
    const res = await request(app).post('/api/auth/verify-otp').send({ email: 'a@test.com', otp: '000000' });
    expect(res.status).toBe(400);
    expect(res.body.message).toContain('Incorrect OTP');
  });

  it('returns 400 when OTP is expired', async () => {
    const pastDate = new Date(Date.now() - 1000);
    mockDb.query
      .mockResolvedValueOnce({ rows: [{ id: 1 }] })
      .mockResolvedValueOnce({ rows: [{ id: 10, expires_at: pastDate.toISOString() }] })
      .mockResolvedValueOnce({ rows: [] });
    const res = await request(app).post('/api/auth/verify-otp').send({ email: 'a@test.com', otp: '123456' });
    expect(res.status).toBe(400);
    expect(res.body.message).toContain('expired');
  });

  it('returns 200 with resetToken on valid OTP', async () => {
    const futureDate = new Date(Date.now() + 10 * 60 * 1000);
    mockDb.query
      .mockResolvedValueOnce({ rows: [{ id: 1 }] })
      .mockResolvedValueOnce({ rows: [{ id: 10, expires_at: futureDate.toISOString() }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });
    const res = await request(app).post('/api/auth/verify-otp').send({ email: 'a@test.com', otp: '654321' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('resetToken');
    expect(res.body.message).toBe('OTP verified successfully.');
  });
});

// ── POST /api/auth/reset-password ─────────────────────────────────────────────
describe('POST /api/auth/reset-password', () => {
  let app;
  beforeEach(() => { app = createApp(); mockDb.query.mockReset(); });

  it('returns 400 when resetToken is missing', async () => {
    const res = await request(app).post('/api/auth/reset-password').send({ password: 'newpass123' });
    expect(res.status).toBe(400);
  });

  it('returns 400 when password is missing', async () => {
    const res = await request(app).post('/api/auth/reset-password').send({ resetToken: 'abc' });
    expect(res.status).toBe(400);
  });

  it('returns 400 when password is too short', async () => {
    const res = await request(app).post('/api/auth/reset-password').send({ resetToken: 'abc', password: '123' });
    expect(res.status).toBe(400);
    expect(res.body.message).toContain('6 characters');
  });

  it('returns 400 when reset token is invalid or used', async () => {
    mockDb.query.mockResolvedValueOnce({ rows: [] });
    const res = await request(app).post('/api/auth/reset-password').send({ resetToken: 'invalid-token', password: 'newpass123' });
    expect(res.status).toBe(400);
    expect(res.body.message).toContain('invalid');
  });

  it('returns 400 when reset token is expired', async () => {
    const pastDate = new Date(Date.now() - 1000);
    mockDb.query
      .mockResolvedValueOnce({ rows: [{ id: 5, user_id: 1, expires_at: pastDate.toISOString() }] })
      .mockResolvedValueOnce({ rows: [] });
    const res = await request(app).post('/api/auth/reset-password').send({ resetToken: 'expired-token', password: 'newpass123' });
    expect(res.status).toBe(400);
    expect(res.body.message).toContain('expired');
  });

  it('returns 200 on successful password reset', async () => {
    const futureDate = new Date(Date.now() + 15 * 60 * 1000);
    mockDb.query
      .mockResolvedValueOnce({ rows: [{ id: 5, user_id: 1, expires_at: futureDate.toISOString() }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });
    const res = await request(app).post('/api/auth/reset-password').send({ resetToken: 'valid-reset-token', password: 'newStrongPass' });
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Password reset successfully.');
  });
});

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
describe('GET /api/auth/me', () => {
  let app;
  beforeEach(() => { app = createApp(); mockDb.query.mockReset(); });

  it('returns 401 when no token is provided', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('returns 200 with user data for valid token', async () => {
    mockDb.query.mockResolvedValueOnce({
      rows: [{ id: 1, full_name: 'Test User', email: 'user@test.com', role: 'USER', profile_pic: null, phone: null, notif_event_alerts: true, notif_event_reminders: true }],
    });
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ email: 'user@test.com', role: 'USER' });
  });

  it('returns 404 when token is valid but user no longer exists', async () => {
    mockDb.query.mockResolvedValueOnce({ rows: [] });
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(404);
  });
});
