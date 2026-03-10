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

import notificationsRouter from '../../../src/routes/notifications.js';

const JWT_SECRET = 'your-secret-key-change-in-production';
const userToken = jwt.sign({ userId: 1, email: 'user@test.com', role: 'USER' }, JWT_SECRET);

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/notifications', notificationsRouter);
  return app;
}

// ── Auth guard ────────────────────────────────────────────────────────────────
describe('Notifications routes – auth guard', () => {
  let app;
  beforeEach(() => { app = createApp(); mockDb.query.mockReset(); });

  it('returns 401 on GET / when no token provided', async () => {
    const res = await request(app).get('/api/notifications');
    expect(res.status).toBe(401);
  });

  it('returns 401 on GET /unread-count when no token provided', async () => {
    const res = await request(app).get('/api/notifications/unread-count');
    expect(res.status).toBe(401);
  });
});

// ── GET /api/notifications ────────────────────────────────────────────────────
describe('GET /api/notifications', () => {
  let app;
  beforeEach(() => { app = createApp(); mockDb.query.mockReset(); });

  it('returns 200 with notifications array', async () => {
    mockDb.query.mockResolvedValueOnce({
      rows: [
        { id: 1, type: 'BOOKING', title: 'Booking confirmed', message: 'Your booking is confirmed.', read: false, created_at: new Date(), event_id: 10, event_title: 'Tech Fest' },
        { id: 2, type: 'GENERAL',  title: 'Welcome',           message: 'Welcome to EventGhar!',      read: true,  created_at: new Date(), event_id: null, event_title: null },
      ],
    });
    const res = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('notifications');
    expect(res.body.notifications).toHaveLength(2);
    expect(res.body.notifications[0]).toMatchObject({ title: 'Booking confirmed', read: false });
  });

  it('returns empty notifications array when user has none', async () => {
    mockDb.query.mockResolvedValueOnce({ rows: [] });
    const res = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body.notifications).toHaveLength(0);
  });

  it('returns 500 on database error', async () => {
    mockDb.query.mockRejectedValueOnce(new Error('DB error'));
    const res = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(500);
  });
});

// ── GET /api/notifications/unread-count ──────────────────────────────────────
describe('GET /api/notifications/unread-count', () => {
  let app;
  beforeEach(() => { app = createApp(); mockDb.query.mockReset(); });

  it('returns 200 with unread count', async () => {
    mockDb.query.mockResolvedValueOnce({ rows: [{ count: '4' }] });
    const res = await request(app)
      .get('/api/notifications/unread-count')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body.count).toBe(4);
  });

  it('returns 0 when no unread notifications', async () => {
    mockDb.query.mockResolvedValueOnce({ rows: [{ count: '0' }] });
    const res = await request(app)
      .get('/api/notifications/unread-count')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body.count).toBe(0);
  });
});

// ── PATCH /api/notifications/:id/read ────────────────────────────────────────
describe('PATCH /api/notifications/:id/read', () => {
  let app;
  beforeEach(() => { app = createApp(); mockDb.query.mockReset(); });

  it('returns 200 when notification is marked as read', async () => {
    mockDb.query.mockResolvedValueOnce({ rows: [{ id: 1, read: true }] });
    const res = await request(app)
      .patch('/api/notifications/1/read')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/marked as read/i);
  });

  it('returns 404 when notification not found or belongs to another user', async () => {
    mockDb.query.mockResolvedValueOnce({ rows: [] });
    const res = await request(app)
      .patch('/api/notifications/999/read')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(404);
  });

  it('returns 401 when no token provided', async () => {
    const res = await request(app).patch('/api/notifications/1/read');
    expect(res.status).toBe(401);
  });
});

// ── PATCH /api/notifications/mark-all-read ───────────────────────────────────
describe('PATCH /api/notifications/mark-all-read', () => {
  let app;
  beforeEach(() => { app = createApp(); mockDb.query.mockReset(); });

  it('returns 200 and marks all notifications as read', async () => {
    mockDb.query.mockResolvedValueOnce({ rowCount: 3 });
    const res = await request(app)
      .patch('/api/notifications/mark-all-read')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/all notifications marked as read/i);
  });

  it('returns 500 on database error', async () => {
    mockDb.query.mockRejectedValueOnce(new Error('DB error'));
    const res = await request(app)
      .patch('/api/notifications/mark-all-read')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(500);
  });
});

// ── DELETE /api/notifications/:id ────────────────────────────────────────────
describe('DELETE /api/notifications/:id', () => {
  let app;
  beforeEach(() => { app = createApp(); mockDb.query.mockReset(); });

  it('returns 200 when notification is deleted', async () => {
    mockDb.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });
    const res = await request(app)
      .delete('/api/notifications/1')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/deleted/i);
  });

  it('returns 404 when notification not found', async () => {
    mockDb.query.mockResolvedValueOnce({ rows: [] });
    const res = await request(app)
      .delete('/api/notifications/999')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(404);
  });

  it('returns 401 when no token provided', async () => {
    const res = await request(app).delete('/api/notifications/1');
    expect(res.status).toBe(401);
  });
});
