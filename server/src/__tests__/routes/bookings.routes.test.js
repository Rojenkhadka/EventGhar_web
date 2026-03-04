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

import bookingsRouter from '../../../src/routes/bookings.js';

const JWT_SECRET = 'your-secret-key-change-in-production';
const userToken = jwt.sign({ userId: 1, email: 'u@test.com', role: 'USER' }, JWT_SECRET);

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/bookings', bookingsRouter);
  return app;
}

// ── GET /api/bookings ─────────────────────────────────────────────────────────
describe('GET /api/bookings', () => {
  let app;
  beforeEach(() => { app = createApp(); mockDb.query.mockReset(); });

  it('returns 401 when no token provided', async () => {
    const res = await request(app).get('/api/bookings');
    expect(res.status).toBe(401);
  });

  it('returns 200 with bookings array for authenticated user', async () => {
    mockDb.query.mockResolvedValueOnce({
      rows: [{ id: 1, event_id: 10, event_title: 'Tech Conf', event_date: '2026-06-01', event_time: '10:00:00', event_location: 'KTM', event_image: null, event_description: 'desc', event_status: 'PUBLISHED', event_max_attendees: 100, organizer_name: 'Org Name', status: 'CONFIRMED', attendee_count: 2, notes: null, created_at: new Date().toISOString() }],
    });
    const res = await request(app).get('/api/bookings').set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('bookings');
    expect(res.body.bookings).toHaveLength(1);
    expect(res.body.bookings[0].eventTitle).toBe('Tech Conf');
  });

  it('returns 200 with empty array when user has no bookings', async () => {
    mockDb.query.mockResolvedValueOnce({ rows: [] });
    const res = await request(app).get('/api/bookings').set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body.bookings).toHaveLength(0);
  });

  it('returns 500 when database fails', async () => {
    mockDb.query.mockRejectedValueOnce(new Error('DB error'));
    const res = await request(app).get('/api/bookings').set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(500);
  });
});

// ── GET /api/bookings/:id ─────────────────────────────────────────────────────
describe('GET /api/bookings/:id', () => {
  let app;
  beforeEach(() => { app = createApp(); mockDb.query.mockReset(); });

  it('returns 401 when no token provided', async () => {
    const res = await request(app).get('/api/bookings/1');
    expect(res.status).toBe(401);
  });

  it('returns 404 when booking does not exist', async () => {
    mockDb.query.mockResolvedValueOnce({ rows: [] });
    const res = await request(app).get('/api/bookings/9999').set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(404);
  });

  it('returns 200 with booking data when found', async () => {
    mockDb.query.mockResolvedValueOnce({
      rows: [{ id: 1, event_id: 10, event_title: 'Tech Conf', event_date: '2026-06-01', event_time: '10:00', event_location: 'KTM', event_image: null, event_description: 'desc', event_status: 'PUBLISHED', event_max_attendees: 100, organizer_name: 'Org', status: 'CONFIRMED', attendee_count: 1, notes: null, created_at: new Date().toISOString() }],
    });
    const res = await request(app).get('/api/bookings/1').set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('booking');
  });
});

// ── POST /api/bookings ────────────────────────────────────────────────────────
describe('POST /api/bookings', () => {
  let app;
  beforeEach(() => { app = createApp(); mockDb.query.mockReset(); });

  it('returns 401 when no token provided', async () => {
    const res = await request(app).post('/api/bookings').send({ eventId: 1 });
    expect(res.status).toBe(401);
  });

  it('returns 400 when eventId is missing', async () => {
    const res = await request(app).post('/api/bookings').set('Authorization', `Bearer ${userToken}`).send({});
    expect(res.status).toBe(400);
    expect(res.body.message).toContain('Event ID');
  });

  it('returns 404 when event does not exist', async () => {
    mockDb.query.mockResolvedValueOnce({ rows: [] });
    const res = await request(app).post('/api/bookings').set('Authorization', `Bearer ${userToken}`).send({ eventId: 999 });
    expect(res.status).toBe(404);
  });

  it('returns 400 when user has already booked the event', async () => {
    mockDb.query
      .mockResolvedValueOnce({ rows: [{ id: 10, max_attendees: 100, status: 'APPROVED' }] })
      .mockResolvedValueOnce({ rows: [{ id: 1 }] });
    const res = await request(app).post('/api/bookings').set('Authorization', `Bearer ${userToken}`).send({ eventId: 10 });
    expect(res.status).toBe(400);
    expect(res.body.message).toContain('already booked');
  });

  it('returns 400 when event is sold out', async () => {
    mockDb.query
      .mockResolvedValueOnce({ rows: [{ id: 10, max_attendees: 10, status: 'APPROVED' }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ total_sold: 10 }] });
    const res = await request(app).post('/api/bookings').set('Authorization', `Bearer ${userToken}`).send({ eventId: 10, attendeeCount: 1 });
    expect(res.status).toBe(400);
    expect(res.body.message).toContain('sold out');
  });

  it('returns 201 with booking on successful creation', async () => {
    mockDb.query
      .mockResolvedValueOnce({ rows: [{ id: 10, max_attendees: 100, status: 'APPROVED' }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ total_sold: 5 }] })
      .mockResolvedValueOnce({ rows: [{ id: 55, event_id: 10, user_id: 1, status: 'CONFIRMED', attendee_count: 1, notes: null, created_at: new Date() }] });
    const res = await request(app).post('/api/bookings').set('Authorization', `Bearer ${userToken}`).send({ eventId: 10, attendeeCount: 1 });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('booking');
  });
});

// ── DELETE /api/bookings/:id ──────────────────────────────────────────────────
describe('DELETE /api/bookings/:id', () => {
  let app;
  beforeEach(() => { app = createApp(); mockDb.query.mockReset(); });

  it('returns 401 when no token provided', async () => {
    const res = await request(app).delete('/api/bookings/1');
    expect(res.status).toBe(401);
  });

  it('returns 404 when booking does not exist for user', async () => {
    mockDb.query.mockResolvedValueOnce({ rows: [] });
    const res = await request(app).delete('/api/bookings/999').set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(404);
  });

  it('returns 200 when booking is successfully cancelled', async () => {
    mockDb.query
      .mockResolvedValueOnce({ rows: [{ user_id: 1 }] })
      .mockResolvedValueOnce({ rows: [] });
    const res = await request(app).delete('/api/bookings/1').set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body.message).toContain('cancelled');
  });
});
