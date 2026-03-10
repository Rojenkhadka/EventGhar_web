// Jest globals (describe, it, expect, beforeEach) are injected automatically
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';

// ── Mock pg ───────────────────────────────────────────────────────────────────
const mockDb = { query: jest.fn() };

jest.mock('pg', () => ({
  __esModule: true,
  default: {
    Pool: jest.fn(function () { this.query = (...args) => mockDb.query(...args); }),
  },
}));

import adminRouter from '../../../src/routes/admin.js';

const JWT_SECRET = 'your-secret-key-change-in-production';
const adminToken = jwt.sign({ userId: 1, email: 'admin@test.com', role: 'ADMIN' }, JWT_SECRET);
const userToken  = jwt.sign({ userId: 2, email: 'user@test.com',  role: 'USER'  }, JWT_SECRET);

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/admin', adminRouter);
  return app;
}

// ── Auth guards ───────────────────────────────────────────────────────────────
describe('Admin routes – auth guards', () => {
  let app;
  beforeEach(() => { app = createApp(); mockDb.query.mockReset(); });

  it('returns 401 when no token is provided', async () => {
    const res = await request(app).get('/api/admin/users');
    expect(res.status).toBe(401);
  });

  it('returns 403 when a non-admin user token is provided', async () => {
    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(403);
  });
});

// ── GET /api/admin/users ──────────────────────────────────────────────────────
describe('GET /api/admin/users', () => {
  let app;
  beforeEach(() => { app = createApp(); mockDb.query.mockReset(); });

  it('returns 200 with users array for admin', async () => {
    mockDb.query.mockResolvedValueOnce({
      rows: [
        { id: 1, full_name: 'Alice', email: 'alice@test.com', role: 'USER', created_at: new Date(), is_blocked: false, profile_pic: null },
        { id: 2, full_name: 'Bob',   email: 'bob@test.com',   role: 'ORGANIZER', created_at: new Date(), is_blocked: false, profile_pic: null },
      ],
    });
    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('users');
    expect(res.body.users).toHaveLength(2);
    expect(res.body.users[0]).toMatchObject({ fullName: 'Alice', email: 'alice@test.com' });
  });

  it('returns 500 on database error', async () => {
    mockDb.query.mockRejectedValueOnce(new Error('DB error'));
    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(500);
  });
});

// ── PATCH /api/admin/users/:userId/block ──────────────────────────────────────
describe('PATCH /api/admin/users/:userId/block', () => {
  let app;
  beforeEach(() => { app = createApp(); mockDb.query.mockReset(); });

  it('returns 400 when "blocked" is not a boolean', async () => {
    const res = await request(app)
      .patch('/api/admin/users/5/block')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ blocked: 'yes' });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('"blocked" must be a boolean');
  });

  it('returns 404 when user not found', async () => {
    mockDb.query.mockResolvedValueOnce({ rows: [] });
    const res = await request(app)
      .patch('/api/admin/users/999/block')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ blocked: true });
    expect(res.status).toBe(404);
  });

  it('blocks a user and returns 200', async () => {
    mockDb.query.mockResolvedValueOnce({
      rows: [{ id: 5, full_name: 'Test User', is_blocked: true }],
    });
    const res = await request(app)
      .patch('/api/admin/users/5/block')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ blocked: true });
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/blocked successfully/i);
    expect(res.body.user.blocked).toBe(true);
  });

  it('unblocks a user and returns 200', async () => {
    mockDb.query.mockResolvedValueOnce({
      rows: [{ id: 5, full_name: 'Test User', is_blocked: false }],
    });
    const res = await request(app)
      .patch('/api/admin/users/5/block')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ blocked: false });
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/unblocked successfully/i);
  });
});

// ── PUT /api/admin/users/:userId/role ─────────────────────────────────────────
describe('PUT /api/admin/users/:userId/role', () => {
  let app;
  beforeEach(() => { app = createApp(); mockDb.query.mockReset(); });

  it('returns 400 for an invalid role', async () => {
    const res = await request(app)
      .put('/api/admin/users/1/role')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'SUPERADMIN' });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Invalid role');
  });

  it('updates role to ORGANIZER and returns 200', async () => {
    mockDb.query.mockResolvedValueOnce({
      rows: [{ id: 1, full_name: 'Alice', email: 'alice@test.com', role: 'ORGANIZER' }],
    });
    const res = await request(app)
      .put('/api/admin/users/1/role')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'ORGANIZER' });
    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe('ORGANIZER');
  });

  it('returns 404 when user not found', async () => {
    mockDb.query.mockResolvedValueOnce({ rows: [] });
    const res = await request(app)
      .put('/api/admin/users/999/role')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'USER' });
    expect(res.status).toBe(404);
  });
});

// ── DELETE /api/admin/users/:userId ──────────────────────────────────────────
describe('DELETE /api/admin/users/:userId', () => {
  let app;
  beforeEach(() => { app = createApp(); mockDb.query.mockReset(); });

  it('returns 200 and success message when user is deleted', async () => {
    mockDb.query.mockResolvedValueOnce({ rows: [{ id: 3 }] });
    const res = await request(app)
      .delete('/api/admin/users/3')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/deleted/i);
  });

  it('returns 404 when user not found', async () => {
    mockDb.query.mockResolvedValueOnce({ rows: [] });
    const res = await request(app)
      .delete('/api/admin/users/999')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(404);
  });
});

// ── GET /api/admin/stats ──────────────────────────────────────────────────────
describe('GET /api/admin/stats', () => {
  let app;
  beforeEach(() => { app = createApp(); mockDb.query.mockReset(); });

  it('returns 200 with stats object', async () => {
    mockDb.query
      .mockResolvedValueOnce({ rows: [{ count: '10' }] })   // users
      .mockResolvedValueOnce({ rows: [{ count: '5' }] })    // events
      .mockResolvedValueOnce({ rows: [{ count: '20' }] })   // bookings
      .mockResolvedValueOnce({ rows: [{ count: '3' }] });   // organizers
    const res = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.stats).toMatchObject({
      totalUsers: 10,
      totalEvents: 5,
      totalBookings: 20,
      totalOrganizers: 3,
    });
  });
});

// ── GET /api/admin/events/pending ────────────────────────────────────────────
describe('GET /api/admin/events/pending', () => {
  let app;
  beforeEach(() => { app = createApp(); mockDb.query.mockReset(); });

  it('returns 200 with pending events list', async () => {
    mockDb.query.mockResolvedValueOnce({
      rows: [
        { id: 1, title: 'Pending Event', description: 'Desc', date: new Date(), location: 'KTM', max_attendees: 100, status: 'PENDING_APPROVAL', organizer_name: 'Org', organizer_email: 'org@test.com' },
      ],
    });
    const res = await request(app)
      .get('/api/admin/events/pending')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.events).toHaveLength(1);
    expect(res.body.events[0].title).toBe('Pending Event');
  });
});

// ── POST /api/admin/users/create-admin ───────────────────────────────────────
describe('POST /api/admin/users/create-admin', () => {
  let app;
  beforeEach(() => { app = createApp(); mockDb.query.mockReset(); });

  it('returns 400 when required fields are missing', async () => {
    const res = await request(app)
      .post('/api/admin/users/create-admin')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ fullName: 'New Admin' });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('All fields are required');
  });

  it('creates an admin user and returns 201', async () => {
    mockDb.query.mockResolvedValueOnce({
      rows: [{ id: 99, full_name: 'New Admin', email: 'newadmin@test.com', role: 'ADMIN' }],
    });
    const res = await request(app)
      .post('/api/admin/users/create-admin')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ fullName: 'New Admin', email: 'newadmin@test.com', password: 'pass123' });
    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('ADMIN');
  });
});
