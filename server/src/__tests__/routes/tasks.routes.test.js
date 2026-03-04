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

import tasksRouter from '../../../src/routes/tasks.js';

const JWT_SECRET = 'your-secret-key-change-in-production';
const userToken = jwt.sign({ userId: 1, email: 'u@test.com', role: 'USER' }, JWT_SECRET);

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/tasks', tasksRouter);
  return app;
}

// ── GET /api/tasks ────────────────────────────────────────────────────────────
describe('GET /api/tasks', () => {
  let app;
  beforeEach(() => { app = createApp(); mockDb.query.mockReset(); });

  it('returns 401 when no token provided', async () => {
    const res = await request(app).get('/api/tasks');
    expect(res.status).toBe(401);
  });

  it('returns 200 with tasks array', async () => {
    mockDb.query.mockResolvedValueOnce({
      rows: [
        { id: 1, text: 'Buy tickets',  done: false, created_at: new Date(), updated_at: new Date() },
        { id: 2, text: 'Book venue',   done: true,  created_at: new Date(), updated_at: new Date() },
      ],
    });
    const res = await request(app).get('/api/tasks').set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('tasks');
    expect(res.body.tasks).toHaveLength(2);
    expect(res.body.tasks[0].text).toBe('Buy tickets');
  });

  it('returns 200 with empty array when user has no tasks', async () => {
    mockDb.query.mockResolvedValueOnce({ rows: [] });
    const res = await request(app).get('/api/tasks').set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body.tasks).toHaveLength(0);
  });

  it('filters tasks by done=true query param', async () => {
    mockDb.query.mockResolvedValueOnce({
      rows: [{ id: 2, text: 'Book venue', done: true, created_at: new Date(), updated_at: new Date() }],
    });
    const res = await request(app).get('/api/tasks?done=true').set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body.tasks).toHaveLength(1);
    expect(res.body.tasks[0].done).toBe(true);
  });

  it('filters tasks by done=false query param', async () => {
    mockDb.query.mockResolvedValueOnce({
      rows: [{ id: 1, text: 'Buy tickets', done: false, created_at: new Date(), updated_at: new Date() }],
    });
    const res = await request(app).get('/api/tasks?done=false').set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body.tasks).toHaveLength(1);
    expect(res.body.tasks[0].done).toBe(false);
  });
});

// ── GET /api/tasks/:id ────────────────────────────────────────────────────────
describe('GET /api/tasks/:id', () => {
  let app;
  beforeEach(() => { app = createApp(); mockDb.query.mockReset(); });

  it('returns 401 when no token', async () => {
    const res = await request(app).get('/api/tasks/1');
    expect(res.status).toBe(401);
  });

  it('returns 404 when task not found', async () => {
    mockDb.query.mockResolvedValueOnce({ rows: [] });
    const res = await request(app).get('/api/tasks/999').set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Task not found');
  });

  it('returns 200 with task data when found', async () => {
    mockDb.query.mockResolvedValueOnce({
      rows: [{ id: 1, text: 'Buy tickets', done: false, created_at: new Date(), updated_at: new Date() }],
    });
    const res = await request(app).get('/api/tasks/1').set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body.task.text).toBe('Buy tickets');
    expect(res.body.task.done).toBe(false);
  });
});

// ── POST /api/tasks ───────────────────────────────────────────────────────────
describe('POST /api/tasks', () => {
  let app;
  beforeEach(() => { app = createApp(); mockDb.query.mockReset(); });

  it('returns 401 when no token', async () => {
    const res = await request(app).post('/api/tasks').send({ text: 'Do something' });
    expect(res.status).toBe(401);
  });

  it('returns 400 when text is missing', async () => {
    const res = await request(app).post('/api/tasks').set('Authorization', `Bearer ${userToken}`).send({});
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Task text is required');
  });

  it('returns 400 when text is only whitespace', async () => {
    const res = await request(app).post('/api/tasks').set('Authorization', `Bearer ${userToken}`)
      .send({ text: '   ' });
    expect(res.status).toBe(400);
  });

  it('returns 201 on successful task creation', async () => {
    mockDb.query.mockResolvedValueOnce({
      rows: [{ id: 10, text: 'Buy tickets', done: false, created_at: new Date() }],
    });
    const res = await request(app).post('/api/tasks').set('Authorization', `Bearer ${userToken}`)
      .send({ text: 'Buy tickets' });
    expect(res.status).toBe(201);
    expect(res.body.task.text).toBe('Buy tickets');
    expect(res.body.task.done).toBe(false);
    expect(res.body.message).toBe('Task created successfully');
  });
});

// ── PUT /api/tasks/:id ────────────────────────────────────────────────────────
describe('PUT /api/tasks/:id', () => {
  let app;
  beforeEach(() => { app = createApp(); mockDb.query.mockReset(); });

  it('returns 401 when no token', async () => {
    const res = await request(app).put('/api/tasks/1').send({ text: 'Updated' });
    expect(res.status).toBe(401);
  });

  it('returns 400 when text is empty string', async () => {
    const res = await request(app).put('/api/tasks/1').set('Authorization', `Bearer ${userToken}`)
      .send({ text: '' });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Task text cannot be empty');
  });

  it('returns 400 when no fields to update are provided', async () => {
    const res = await request(app).put('/api/tasks/1').set('Authorization', `Bearer ${userToken}`).send({});
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('No fields to update');
  });

  it('returns 404 when task not found', async () => {
    mockDb.query.mockResolvedValueOnce({ rows: [] });
    const res = await request(app).put('/api/tasks/999').set('Authorization', `Bearer ${userToken}`)
      .send({ text: 'Updated text' });
    expect(res.status).toBe(404);
  });

  it('returns 200 when updating text only', async () => {
    mockDb.query.mockResolvedValueOnce({
      rows: [{ id: 1, text: 'Updated text', done: false, updated_at: new Date() }],
    });
    const res = await request(app).put('/api/tasks/1').set('Authorization', `Bearer ${userToken}`)
      .send({ text: 'Updated text' });
    expect(res.status).toBe(200);
    expect(res.body.task.text).toBe('Updated text');
    expect(res.body.message).toBe('Task updated successfully');
  });

  it('returns 200 when updating done status only', async () => {
    mockDb.query.mockResolvedValueOnce({
      rows: [{ id: 1, text: 'Buy tickets', done: true, updated_at: new Date() }],
    });
    const res = await request(app).put('/api/tasks/1').set('Authorization', `Bearer ${userToken}`)
      .send({ done: true });
    expect(res.status).toBe(200);
    expect(res.body.task.done).toBe(true);
  });
});

// ── PATCH /api/tasks/:id/toggle ───────────────────────────────────────────────
describe('PATCH /api/tasks/:id/toggle', () => {
  let app;
  beforeEach(() => { app = createApp(); mockDb.query.mockReset(); });

  it('returns 401 when no token', async () => {
    const res = await request(app).patch('/api/tasks/1/toggle');
    expect(res.status).toBe(401);
  });

  it('returns 404 when task not found', async () => {
    mockDb.query.mockResolvedValueOnce({ rows: [] });
    const res = await request(app).patch('/api/tasks/999/toggle').set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(404);
  });

  it('toggles task from false to true', async () => {
    mockDb.query.mockResolvedValueOnce({
      rows: [{ id: 1, text: 'Buy tickets', done: true, updated_at: new Date() }],
    });
    const res = await request(app).patch('/api/tasks/1/toggle').set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body.task.done).toBe(true);
    expect(res.body.message).toBe('Task toggled successfully');
  });

  it('toggles task from true to false', async () => {
    mockDb.query.mockResolvedValueOnce({
      rows: [{ id: 2, text: 'Book venue', done: false, updated_at: new Date() }],
    });
    const res = await request(app).patch('/api/tasks/2/toggle').set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body.task.done).toBe(false);
  });
});

// ── DELETE /api/tasks/:id ─────────────────────────────────────────────────────
describe('DELETE /api/tasks/:id', () => {
  let app;
  beforeEach(() => { app = createApp(); mockDb.query.mockReset(); });

  it('returns 401 when no token', async () => {
    const res = await request(app).delete('/api/tasks/1');
    expect(res.status).toBe(401);
  });

  it('returns 404 when task not found', async () => {
    mockDb.query.mockResolvedValueOnce({ rows: [] });
    const res = await request(app).delete('/api/tasks/999').set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(404);
  });

  it('returns 200 on successful deletion', async () => {
    mockDb.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });
    const res = await request(app).delete('/api/tasks/1').set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Task deleted successfully');
  });
});

// ── DELETE /api/tasks/completed/all ──────────────────────────────────────────
describe('DELETE /api/tasks/completed/all', () => {
  let app;
  beforeEach(() => { app = createApp(); mockDb.query.mockReset(); });

  it('returns 401 when no token', async () => {
    const res = await request(app).delete('/api/tasks/completed/all');
    expect(res.status).toBe(401);
  });

  it('returns 200 with count when completed tasks are deleted', async () => {
    mockDb.query.mockResolvedValueOnce({ rows: [{ id: 1 }, { id: 2 }, { id: 3 }] });
    const res = await request(app).delete('/api/tasks/completed/all').set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body.count).toBe(3);
    expect(res.body.message).toContain('3');
  });

  it('returns 200 with count 0 when no completed tasks exist', async () => {
    mockDb.query.mockResolvedValueOnce({ rows: [] });
    const res = await request(app).delete('/api/tasks/completed/all').set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body.count).toBe(0);
  });
});
