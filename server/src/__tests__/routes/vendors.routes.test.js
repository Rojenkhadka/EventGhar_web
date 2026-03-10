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

import vendorsRouter from '../../../src/routes/vendors.js';

const JWT_SECRET = 'your-secret-key-change-in-production';
const userToken = jwt.sign({ userId: 1, email: 'user@test.com', role: 'USER' }, JWT_SECRET);

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/vendors', vendorsRouter);
  return app;
}

const sampleVendorRow = {
  id: 1,
  name: 'DJ Ali',
  category: 'Music',
  phone: '9841000000',
  rating: 4.5,
  created_at: new Date(),
  updated_at: new Date(),
};

// ── Auth guard ────────────────────────────────────────────────────────────────
describe('Vendors routes – auth guard', () => {
  let app;
  beforeEach(() => { app = createApp(); mockDb.query.mockReset(); });

  it('returns 401 on GET / when no token is provided', async () => {
    const res = await request(app).get('/api/vendors');
    expect(res.status).toBe(401);
  });

  it('returns 401 on POST / when no token is provided', async () => {
    const res = await request(app).post('/api/vendors').send({ name: 'Test' });
    expect(res.status).toBe(401);
  });
});

// ── GET /api/vendors ──────────────────────────────────────────────────────────
describe('GET /api/vendors', () => {
  let app;
  beforeEach(() => { app = createApp(); mockDb.query.mockReset(); });

  it('returns 200 with vendors array', async () => {
    mockDb.query.mockResolvedValueOnce({ rows: [sampleVendorRow] });
    const res = await request(app)
      .get('/api/vendors')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('vendors');
    expect(res.body.vendors).toHaveLength(1);
    expect(res.body.vendors[0]).toMatchObject({ name: 'DJ Ali', category: 'Music' });
  });

  it('returns empty array when user has no vendors', async () => {
    mockDb.query.mockResolvedValueOnce({ rows: [] });
    const res = await request(app)
      .get('/api/vendors')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body.vendors).toHaveLength(0);
  });

  it('filters by category when ?category= query param is provided', async () => {
    mockDb.query.mockResolvedValueOnce({ rows: [sampleVendorRow] });
    const res = await request(app)
      .get('/api/vendors?category=Music')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    // The query was called – category filter applied on DB level
    expect(mockDb.query).toHaveBeenCalledWith(
      expect.stringContaining('category'),
      expect.arrayContaining(['Music'])
    );
  });

  it('returns 500 on database error', async () => {
    mockDb.query.mockRejectedValueOnce(new Error('DB error'));
    const res = await request(app)
      .get('/api/vendors')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(500);
  });
});

// ── GET /api/vendors/:id ──────────────────────────────────────────────────────
describe('GET /api/vendors/:id', () => {
  let app;
  beforeEach(() => { app = createApp(); mockDb.query.mockReset(); });

  it('returns 200 with vendor when found', async () => {
    mockDb.query.mockResolvedValueOnce({ rows: [sampleVendorRow] });
    const res = await request(app)
      .get('/api/vendors/1')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body.vendor).toMatchObject({ name: 'DJ Ali' });
  });

  it('returns 404 when vendor not found', async () => {
    mockDb.query.mockResolvedValueOnce({ rows: [] });
    const res = await request(app)
      .get('/api/vendors/999')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Vendor not found');
  });
});

// ── POST /api/vendors ─────────────────────────────────────────────────────────
describe('POST /api/vendors', () => {
  let app;
  beforeEach(() => { app = createApp(); mockDb.query.mockReset(); });

  it('returns 400 when name is missing', async () => {
    const res = await request(app)
      .post('/api/vendors')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ category: 'Music' });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Vendor name is required');
  });

  it('returns 400 when rating is out of range', async () => {
    const res = await request(app)
      .post('/api/vendors')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ name: 'DJ Ali', rating: 6 });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Rating must be between 0 and 5');
  });

  it('creates a vendor and returns 201', async () => {
    mockDb.query.mockResolvedValueOnce({ rows: [sampleVendorRow] });
    const res = await request(app)
      .post('/api/vendors')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ name: 'DJ Ali', category: 'Music', phone: '9841000000', rating: 4.5 });
    expect(res.status).toBe(201);
    expect(res.body.message).toMatch(/created/i);
    expect(res.body.vendor).toMatchObject({ name: 'DJ Ali' });
  });
});

// ── PUT /api/vendors/:id ──────────────────────────────────────────────────────
describe('PUT /api/vendors/:id', () => {
  let app;
  beforeEach(() => { app = createApp(); mockDb.query.mockReset(); });

  it('returns 400 when name is missing', async () => {
    const res = await request(app)
      .put('/api/vendors/1')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ category: 'Catering' });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Vendor name is required');
  });

  it('returns 404 when vendor not found or belongs to different user', async () => {
    mockDb.query.mockResolvedValueOnce({ rows: [] });
    const res = await request(app)
      .put('/api/vendors/999')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ name: 'Caterer X' });
    expect(res.status).toBe(404);
  });

  it('updates a vendor and returns 200', async () => {
    mockDb.query.mockResolvedValueOnce({
      rows: [{ ...sampleVendorRow, name: 'DJ Ali Updated', updated_at: new Date() }],
    });
    const res = await request(app)
      .put('/api/vendors/1')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ name: 'DJ Ali Updated', category: 'Music', phone: '9841000000', rating: 5 });
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/updated/i);
    expect(res.body.vendor.name).toBe('DJ Ali Updated');
  });
});

// ── DELETE /api/vendors/:id ───────────────────────────────────────────────────
describe('DELETE /api/vendors/:id', () => {
  let app;
  beforeEach(() => { app = createApp(); mockDb.query.mockReset(); });

  it('returns 200 when vendor is deleted', async () => {
    mockDb.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });
    const res = await request(app)
      .delete('/api/vendors/1')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/deleted/i);
  });

  it('returns 404 when vendor not found', async () => {
    mockDb.query.mockResolvedValueOnce({ rows: [] });
    const res = await request(app)
      .delete('/api/vendors/999')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(404);
  });

  it('returns 401 when no token provided', async () => {
    const res = await request(app).delete('/api/vendors/1');
    expect(res.status).toBe(401);
  });
});
