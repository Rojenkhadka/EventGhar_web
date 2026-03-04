// Jest globals (describe, it, expect, beforeEach) are injected automatically
import jwt from 'jsonwebtoken';
import { authenticateToken, requireAdmin, requireOrganizer } from '../../../src/middleware/auth.js';

const JWT_SECRET = 'your-secret-key-change-in-production';

// Helper to generate a valid JWT
const makeToken = (payload, opts = {}) =>
  jwt.sign(payload, JWT_SECRET, { expiresIn: '1h', ...opts });

// ── authenticateToken ─────────────────────────────────────────────────────────
describe('authenticateToken', () => {
  let req, res, next;

  beforeEach(() => {
    req = { headers: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
  });

  it('returns 401 when Authorization header is missing', () => {
    authenticateToken(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'No token provided' });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when Authorization header has no Bearer prefix', () => {
    req.headers.authorization = 'invalid-token';
    authenticateToken(req, res, next);
    // split(' ')[1] is undefined → no token
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when token is malformed', () => {
    req.headers.authorization = 'Bearer this.is.not.a.jwt';
    authenticateToken(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid or expired token' });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when token is expired', () => {
    const expiredToken = makeToken({ userId: 1, role: 'USER' }, { expiresIn: '-1s' });
    req.headers.authorization = `Bearer ${expiredToken}`;
    authenticateToken(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when token is signed with a different secret', () => {
    const badToken = jwt.sign({ userId: 1, role: 'USER' }, 'wrong-secret');
    req.headers.authorization = `Bearer ${badToken}`;
    authenticateToken(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next() and attaches decoded payload to req.user for a valid token', () => {
    const token = makeToken({ userId: 42, email: 'user@test.com', role: 'USER' });
    req.headers.authorization = `Bearer ${token}`;
    authenticateToken(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(req.user).toMatchObject({ userId: 42, email: 'user@test.com', role: 'USER' });
    expect(res.status).not.toHaveBeenCalled();
  });

  it('sets req.user.userId correctly', () => {
    const token = makeToken({ userId: 7, role: 'ORGANIZER' });
    req.headers.authorization = `Bearer ${token}`;
    authenticateToken(req, res, next);
    expect(req.user.userId).toBe(7);
  });
});

// ── requireAdmin ──────────────────────────────────────────────────────────────
describe('requireAdmin', () => {
  let req, res, next;

  beforeEach(() => {
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
  });

  it('returns 403 when user role is USER', () => {
    req = { user: { role: 'USER' } };
    requireAdmin(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: 'Admin access required' });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 403 when user role is ORGANIZER', () => {
    req = { user: { role: 'ORGANIZER' } };
    requireAdmin(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 403 when user is undefined', () => {
    req = { user: undefined };
    requireAdmin(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next() when user role is ADMIN', () => {
    req = { user: { role: 'ADMIN' } };
    requireAdmin(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });
});

// ── requireOrganizer ──────────────────────────────────────────────────────────
describe('requireOrganizer', () => {
  let req, res, next;

  beforeEach(() => {
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
  });

  it('returns 403 when user role is USER', () => {
    req = { user: { role: 'USER' } };
    requireOrganizer(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: 'Organizer access required' });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 403 when user is undefined', () => {
    req = { user: undefined };
    requireOrganizer(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next() when user role is ORGANIZER', () => {
    req = { user: { role: 'ORGANIZER' } };
    requireOrganizer(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('calls next() when user role is ADMIN (admins can access organizer routes)', () => {
    req = { user: { role: 'ADMIN' } };
    requireOrganizer(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });
});
