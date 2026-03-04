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

import productsRouter from '../../../src/routes/products.js';

const JWT_SECRET = 'your-secret-key-change-in-production';
const userToken = jwt.sign({ userId: 1, email: 'u@test.com', role: 'USER' }, JWT_SECRET);

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/products', productsRouter);
  return app;
}

// ── GET /api/products ─────────────────────────────────────────────────────────
describe('GET /api/products', () => {
  let app;
  beforeEach(() => { app = createApp(); mockDb.query.mockReset(); });

  it('returns 401 when no token provided', async () => {
    const res = await request(app).get('/api/products');
    expect(res.status).toBe(401);
  });

  it('returns 200 with products array', async () => {
    mockDb.query.mockResolvedValueOnce({
      rows: [
        { id: 1, name: 'Widget A', price: '9.99',  created_at: new Date(), updated_at: new Date() },
        { id: 2, name: 'Widget B', price: '19.99', created_at: new Date(), updated_at: new Date() },
      ],
    });
    const res = await request(app).get('/api/products').set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('products');
    expect(res.body.products).toHaveLength(2);
    expect(res.body.products[0].price).toBe(9.99);
  });

  it('returns 200 with empty array when user has no products', async () => {
    mockDb.query.mockResolvedValueOnce({ rows: [] });
    const res = await request(app).get('/api/products').set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body.products).toHaveLength(0);
  });
});

// ── GET /api/products/:id ─────────────────────────────────────────────────────
describe('GET /api/products/:id', () => {
  let app;
  beforeEach(() => { app = createApp(); mockDb.query.mockReset(); });

  it('returns 401 when no token', async () => {
    const res = await request(app).get('/api/products/1');
    expect(res.status).toBe(401);
  });

  it('returns 404 when product not found', async () => {
    mockDb.query.mockResolvedValueOnce({ rows: [] });
    const res = await request(app).get('/api/products/999').set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Product not found');
  });

  it('returns 200 with product data when found', async () => {
    mockDb.query.mockResolvedValueOnce({
      rows: [{ id: 1, name: 'Widget A', price: '9.99', created_at: new Date(), updated_at: new Date() }],
    });
    const res = await request(app).get('/api/products/1').set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body.product.name).toBe('Widget A');
    expect(res.body.product.price).toBe(9.99);
  });
});

// ── POST /api/products ────────────────────────────────────────────────────────
describe('POST /api/products', () => {
  let app;
  beforeEach(() => { app = createApp(); mockDb.query.mockReset(); });

  it('returns 401 when no token', async () => {
    const res = await request(app).post('/api/products').send({ name: 'Widget', price: 5 });
    expect(res.status).toBe(401);
  });

  it('returns 400 when name is missing', async () => {
    const res = await request(app).post('/api/products').set('Authorization', `Bearer ${userToken}`)
      .send({ price: 9.99 });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Name and price are required');
  });

  it('returns 400 when price is missing', async () => {
    const res = await request(app).post('/api/products').set('Authorization', `Bearer ${userToken}`)
      .send({ name: 'Widget A' });
    expect(res.status).toBe(400);
  });

  it('returns 400 when price is negative', async () => {
    const res = await request(app).post('/api/products').set('Authorization', `Bearer ${userToken}`)
      .send({ name: 'Widget A', price: -1 });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Price must be a positive number');
  });

  it('returns 201 on successful product creation', async () => {
    mockDb.query.mockResolvedValueOnce({
      rows: [{ id: 5, name: 'Widget A', price: '9.99', created_at: new Date() }],
    });
    const res = await request(app).post('/api/products').set('Authorization', `Bearer ${userToken}`)
      .send({ name: 'Widget A', price: 9.99 });
    expect(res.status).toBe(201);
    expect(res.body.product.name).toBe('Widget A');
    expect(res.body.product.price).toBe(9.99);
    expect(res.body.message).toBe('Product created successfully');
  });
});

// ── PUT /api/products/:id ─────────────────────────────────────────────────────
describe('PUT /api/products/:id', () => {
  let app;
  beforeEach(() => { app = createApp(); mockDb.query.mockReset(); });

  it('returns 401 when no token', async () => {
    const res = await request(app).put('/api/products/1').send({ name: 'x', price: 1 });
    expect(res.status).toBe(401);
  });

  it('returns 400 when name is missing', async () => {
    const res = await request(app).put('/api/products/1').set('Authorization', `Bearer ${userToken}`)
      .send({ price: 5 });
    expect(res.status).toBe(400);
  });

  it('returns 400 when price is negative', async () => {
    const res = await request(app).put('/api/products/1').set('Authorization', `Bearer ${userToken}`)
      .send({ name: 'Widget', price: -5 });
    expect(res.status).toBe(400);
  });

  it('returns 404 when product not found', async () => {
    mockDb.query.mockResolvedValueOnce({ rows: [] });
    const res = await request(app).put('/api/products/999').set('Authorization', `Bearer ${userToken}`)
      .send({ name: 'Widget', price: 5 });
    expect(res.status).toBe(404);
  });

  it('returns 200 on successful update', async () => {
    mockDb.query.mockResolvedValueOnce({
      rows: [{ id: 1, name: 'Updated Widget', price: '14.99', updated_at: new Date() }],
    });
    const res = await request(app).put('/api/products/1').set('Authorization', `Bearer ${userToken}`)
      .send({ name: 'Updated Widget', price: 14.99 });
    expect(res.status).toBe(200);
    expect(res.body.product.name).toBe('Updated Widget');
    expect(res.body.message).toBe('Product updated successfully');
  });
});

// ── DELETE /api/products/:id ──────────────────────────────────────────────────
describe('DELETE /api/products/:id', () => {
  let app;
  beforeEach(() => { app = createApp(); mockDb.query.mockReset(); });

  it('returns 401 when no token', async () => {
    const res = await request(app).delete('/api/products/1');
    expect(res.status).toBe(401);
  });

  it('returns 404 when product not found', async () => {
    mockDb.query.mockResolvedValueOnce({ rows: [] });
    const res = await request(app).delete('/api/products/999').set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(404);
  });

  it('returns 200 on successful deletion', async () => {
    mockDb.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });
    const res = await request(app).delete('/api/products/1').set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Product deleted successfully');
  });
});
