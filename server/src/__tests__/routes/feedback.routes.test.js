import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';

const mockDb = { query: jest.fn() };

jest.mock('pg', () => ({
  __esModule: true,
  default: {
    Pool: jest.fn(function () { this.query = (...args) => mockDb.query(...args); }),
  },
}));

import feedbackRouter from '../../../src/routes/feedback.js';

const JWT_SECRET = 'your-secret-key-change-in-production';
const userToken  = jwt.sign({ userId: 1, email: 'u@test.com', role: 'USER' }, JWT_SECRET);
const adminToken = jwt.sign({ userId: 9, email: 'a@test.com', role: 'ADMIN' }, JWT_SECRET);

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/feedback', feedbackRouter);
  return app;
}

// ── GET /api/feedback ─────────────────────────────────────────────────────────
describe('GET /api/feedback', () => {
  let app;
  beforeEach(() => { app = createApp(); mockDb.query.mockReset(); });

  it('returns 401 when no token provided', async () => {
    const res = await request(app).get('/api/feedback');
    expect(res.status).toBe(401);
  });

  it('returns 200 with feedback array for authenticated user', async () => {
    mockDb.query.mockResolvedValueOnce({
      rows: [
        { id: 1, subject: 'Great event', message: 'Loved it', rating: 5, created_at: new Date(), updated_at: new Date() },
        { id: 2, subject: 'Okay event',  message: 'It was fine', rating: 3, created_at: new Date(), updated_at: new Date() },
      ],
    });
    const res = await request(app).get('/api/feedback').set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('feedback');
    expect(res.body.feedback).toHaveLength(2);
    expect(res.body.feedback[0].subject).toBe('Great event');
  });

  it('returns 200 with empty array when user has no feedback', async () => {
    mockDb.query.mockResolvedValueOnce({ rows: [] });
    const res = await request(app).get('/api/feedback').set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body.feedback).toHaveLength(0);
  });
});

// ── GET /api/feedback/all (admin) ─────────────────────────────────────────────
describe('GET /api/feedback/all', () => {
  let app;
  beforeEach(() => { app = createApp(); mockDb.query.mockReset(); });

  it('returns 401 when no token provided', async () => {
    const res = await request(app).get('/api/feedback/all');
    expect(res.status).toBe(401);
  });

  it('returns 403 when user is not admin', async () => {
    const res = await request(app).get('/api/feedback/all').set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(403);
  });

  it('returns 200 with all feedback for admin', async () => {
    mockDb.query.mockResolvedValueOnce({
      rows: [
        { id: 1, subject: 'Good', message: 'Nice', rating: 4, user_name: 'Alice', user_email: 'alice@test.com', created_at: new Date(), updated_at: new Date() },
      ],
    });
    const res = await request(app).get('/api/feedback/all').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.feedback[0].userName).toBe('Alice');
    expect(res.body.feedback[0].userEmail).toBe('alice@test.com');
  });
});

// ── GET /api/feedback/:id ─────────────────────────────────────────────────────
describe('GET /api/feedback/:id', () => {
  let app;
  beforeEach(() => { app = createApp(); mockDb.query.mockReset(); });

  it('returns 401 when no token', async () => {
    const res = await request(app).get('/api/feedback/1');
    expect(res.status).toBe(401);
  });

  it('returns 404 when feedback not found', async () => {
    mockDb.query.mockResolvedValueOnce({ rows: [] });
    const res = await request(app).get('/api/feedback/999').set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(404);
  });

  it('returns 200 with feedback data when found', async () => {
    mockDb.query.mockResolvedValueOnce({
      rows: [{ id: 1, subject: 'Great', message: 'Really enjoyed it', rating: 5, created_at: new Date(), updated_at: new Date() }],
    });
    const res = await request(app).get('/api/feedback/1').set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body.feedback.subject).toBe('Great');
    expect(res.body.feedback.rating).toBe(5);
  });
});

// ── POST /api/feedback ────────────────────────────────────────────────────────
describe('POST /api/feedback', () => {
  let app;
  beforeEach(() => { app = createApp(); mockDb.query.mockReset(); });

  it('returns 401 when no token', async () => {
    const res = await request(app).post('/api/feedback').send({ subject: 'Test', message: 'Test' });
    expect(res.status).toBe(401);
  });

  it('returns 400 when subject is missing', async () => {
    const res = await request(app).post('/api/feedback').set('Authorization', `Bearer ${userToken}`)
      .send({ message: 'No subject here' });
    expect(res.status).toBe(400);
    expect(res.body.message).toContain('Subject and message are required');
  });

  it('returns 400 when message is missing', async () => {
    const res = await request(app).post('/api/feedback').set('Authorization', `Bearer ${userToken}`)
      .send({ subject: 'No message here' });
    expect(res.status).toBe(400);
  });

  it('returns 400 when rating is out of range', async () => {
    const res = await request(app).post('/api/feedback').set('Authorization', `Bearer ${userToken}`)
      .send({ subject: 'Test', message: 'Test', rating: 6 });
    expect(res.status).toBe(400);
    expect(res.body.message).toContain('Rating must be between 1 and 5');
  });

  it('returns 201 on successful feedback submission', async () => {
    mockDb.query.mockResolvedValueOnce({
      rows: [{ id: 10, subject: 'Great event', message: 'Loved it', rating: 5, created_at: new Date() }],
    });
    const res = await request(app).post('/api/feedback').set('Authorization', `Bearer ${userToken}`)
      .send({ subject: 'Great event', message: 'Loved it', rating: 5 });
    expect(res.status).toBe(201);
    expect(res.body.feedback.subject).toBe('Great event');
    expect(res.body.message).toBe('Feedback submitted successfully');
  });

  it('returns 201 when feedback is submitted without a rating', async () => {
    mockDb.query.mockResolvedValueOnce({
      rows: [{ id: 11, subject: 'No rating', message: 'Just a comment', rating: null, created_at: new Date() }],
    });
    const res = await request(app).post('/api/feedback').set('Authorization', `Bearer ${userToken}`)
      .send({ subject: 'No rating', message: 'Just a comment' });
    expect(res.status).toBe(201);
    expect(res.body.feedback.rating).toBeNull();
  });
});

// ── PUT /api/feedback/:id ─────────────────────────────────────────────────────
describe('PUT /api/feedback/:id', () => {
  let app;
  beforeEach(() => { app = createApp(); mockDb.query.mockReset(); });

  it('returns 401 when no token', async () => {
    const res = await request(app).put('/api/feedback/1').send({ subject: 'x', message: 'y' });
    expect(res.status).toBe(401);
  });

  it('returns 400 when subject is missing', async () => {
    const res = await request(app).put('/api/feedback/1').set('Authorization', `Bearer ${userToken}`)
      .send({ message: 'no subject' });
    expect(res.status).toBe(400);
  });

  it('returns 400 when rating is invalid', async () => {
    const res = await request(app).put('/api/feedback/1').set('Authorization', `Bearer ${userToken}`)
      .send({ subject: 'Test', message: 'Test', rating: 0 });
    expect(res.status).toBe(400);
  });

  it('returns 404 when feedback not found', async () => {
    mockDb.query.mockResolvedValueOnce({ rows: [] });
    const res = await request(app).put('/api/feedback/999').set('Authorization', `Bearer ${userToken}`)
      .send({ subject: 'Updated', message: 'Updated message' });
    expect(res.status).toBe(404);
  });

  it('returns 200 on successful update', async () => {
    mockDb.query.mockResolvedValueOnce({
      rows: [{ id: 1, subject: 'Updated', message: 'Updated message', rating: 4, updated_at: new Date() }],
    });
    const res = await request(app).put('/api/feedback/1').set('Authorization', `Bearer ${userToken}`)
      .send({ subject: 'Updated', message: 'Updated message', rating: 4 });
    expect(res.status).toBe(200);
    expect(res.body.feedback.subject).toBe('Updated');
    expect(res.body.message).toBe('Feedback updated successfully');
  });
});

// ── DELETE /api/feedback/:id ──────────────────────────────────────────────────
describe('DELETE /api/feedback/:id', () => {
  let app;
  beforeEach(() => { app = createApp(); mockDb.query.mockReset(); });

  it('returns 401 when no token', async () => {
    const res = await request(app).delete('/api/feedback/1');
    expect(res.status).toBe(401);
  });

  it('returns 404 when feedback not found', async () => {
    mockDb.query.mockResolvedValueOnce({ rows: [] });
    const res = await request(app).delete('/api/feedback/999').set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(404);
  });

  it('returns 200 on successful deletion', async () => {
    mockDb.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });
    const res = await request(app).delete('/api/feedback/1').set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Feedback deleted successfully');
  });
});
