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

import eventsRouter from '../../../src/routes/events.js';

const JWT_SECRET = 'your-secret-key-change-in-production';
const userToken  = jwt.sign({ userId: 1, email: 'u@test.com', role: 'USER' }, JWT_SECRET);
const orgToken   = jwt.sign({ userId: 2, email: 'o@test.com', role: 'ORGANIZER' }, JWT_SECRET);

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/events', eventsRouter);
  return app;
}

// ── GET /api/events ───────────────────────────────────────────────────────────
describe('GET /api/events', () => {
  let app;
  beforeEach(() => { app = createApp(); mockDb.query.mockReset(); });

  it('returns 200 with events array', async () => {
    mockDb.query.mockResolvedValueOnce({
      rows: [
        { id: 1, title: 'Tech Conf', date: '2026-06-10', location: 'KTM', status: 'PUBLISHED', tickets_sold: 5 },
        { id: 2, title: 'Art Show',  date: '2026-07-01', location: 'PKR', status: 'PUBLISHED', tickets_sold: 0 },
      ],
    });
    const res = await request(app).get('/api/events');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('events');
    expect(res.body.events).toHaveLength(2);
  });

  it('returns an empty events array when no events exist', async () => {
    mockDb.query.mockResolvedValueOnce({ rows: [] });
    const res = await request(app).get('/api/events');
    expect(res.status).toBe(200);
    expect(res.body.events).toHaveLength(0);
  });

  it('returns 500 when database query fails', async () => {
    mockDb.query.mockRejectedValueOnce(new Error('DB connection failed'));
    const res = await request(app).get('/api/events');
    expect(res.status).toBe(500);
  });
});

// ── GET /api/events/my ────────────────────────────────────────────────────────
describe('GET /api/events/my', () => {
  let app;
  beforeEach(() => { app = createApp(); mockDb.query.mockReset(); });

  it('returns 401 when no token provided', async () => {
    const res = await request(app).get('/api/events/my');
    expect(res.status).toBe(401);
  });

  it('returns 403 when user role is USER', async () => {
    const res = await request(app).get('/api/events/my').set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(403);
  });

  it("returns 200 with organizer's events", async () => {
    mockDb.query.mockResolvedValueOnce({
      rows: [{ id: 10, title: 'My Event', date: '2026-05-01', location: 'KTM', status: 'PUBLISHED', tickets_sold: 3, max_attendees: 50 }],
    });
    const res = await request(app).get('/api/events/my').set('Authorization', `Bearer ${orgToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('events');
  });
});

// ── GET /api/events/:id ───────────────────────────────────────────────────────
describe('GET /api/events/:id', () => {
  let app;
  beforeEach(() => { app = createApp(); mockDb.query.mockReset(); });

  it('returns 404 when event does not exist', async () => {
    mockDb.query.mockResolvedValueOnce({ rows: [] });
    const res = await request(app).get('/api/events/9999');
    expect(res.status).toBe(404);
  });

  it('returns 200 with event data when found', async () => {
    mockDb.query.mockResolvedValueOnce({
      rows: [{ id: 1, title: 'Tech Conf', date: '2026-06-10', time: '10:00:00', location: 'KTM', description: 'Great event', status: 'PUBLISHED', max_attendees: 100, image: null, full_name: 'Organizer Name', tickets_sold: 10 }],
    });
    const res = await request(app).get('/api/events/1');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('event');
    expect(res.body.event.title).toBe('Tech Conf');
  });
});

// ── POST /api/events ──────────────────────────────────────────────────────────
describe('POST /api/events', () => {
  let app;
  beforeEach(() => { app = createApp(); mockDb.query.mockReset(); });

  it('returns 401 when no token provided', async () => {
    const res = await request(app).post('/api/events').send({ title: 'Test' });
    expect(res.status).toBe(401);
  });

  it('returns 403 when role is USER', async () => {
    const res = await request(app).post('/api/events').set('Authorization', `Bearer ${userToken}`)
      .send({ title: 'Test Event', date: '2026-06-01', location: 'KTM', description: 'desc' });
    expect(res.status).toBe(403);
  });

  it('returns 400 when required fields are missing', async () => {
    const res = await request(app).post('/api/events').set('Authorization', `Bearer ${orgToken}`)
      .send({ title: 'No date or location' });
    expect(res.status).toBe(400);
  });

  it('returns 201 when organizer creates a valid event', async () => {
    mockDb.query.mockResolvedValueOnce({
      rows: [{ id: 5, title: 'New Event', date: '2026-06-01', location: 'KTM', status: 'PUBLISHED', max_attendees: null }],
    });
    const res = await request(app).post('/api/events').set('Authorization', `Bearer ${orgToken}`)
      .send({ title: 'New Event', date: '2026-06-01', location: 'KTM', description: 'A great event' });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('event');
  });
});

// ── DELETE /api/events/:id ────────────────────────────────────────────────────
describe('DELETE /api/events/:id', () => {
  let app;
  beforeEach(() => { app = createApp(); mockDb.query.mockReset(); });

  it('returns 401 when no token', async () => {
    const res = await request(app).delete('/api/events/1');
    expect(res.status).toBe(401);
  });

  it('returns 403 when user is not organizer or admin', async () => {
    mockDb.query.mockResolvedValueOnce({ rows: [{ id: 1, user_id: 99, title: 'Other Event' }] });
    const res = await request(app).delete('/api/events/1').set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(403);
  });

  it('returns 404 when event does not exist', async () => {
    mockDb.query.mockResolvedValueOnce({ rows: [] });
    const res = await request(app).delete('/api/events/999').set('Authorization', `Bearer ${orgToken}`);
    expect(res.status).toBe(404);
  });

  it('returns 200 when organizer deletes own event', async () => {
    mockDb.query
      .mockResolvedValueOnce({ rows: [{ id: 1, user_id: 2, title: 'My Event' }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ id: 1, title: 'My Event' }] });
    const res = await request(app).delete('/api/events/1').set('Authorization', `Bearer ${orgToken}`);
    expect(res.status).toBe(200);
  });
});
