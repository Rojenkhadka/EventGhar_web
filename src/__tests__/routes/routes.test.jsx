import { describe, it, expect } from 'vitest';
import { publicRoutes } from '../../routes/publicRoutes';
import { privateRoutes } from '../../routes/privateRoutes';

// ── Public Routes ─────────────────────────────────────────────────────────────
describe('publicRoutes', () => {
  it('is an array', () => {
    expect(Array.isArray(publicRoutes)).toBe(true);
  });

  it('contains exactly 6 routes', () => {
    expect(publicRoutes).toHaveLength(6);
  });

  const expectedPaths = ['/', '/login', '/register', '/events', '/forgot-password', '/reset-password'];

  expectedPaths.forEach((path) => {
    it(`defines the "${path}" route`, () => {
      const route = publicRoutes.find((r) => r.path === path);
      expect(route).toBeDefined();
      expect(route.element).toBeTruthy();
    });
  });

  it('every route has a path and element', () => {
    publicRoutes.forEach((route) => {
      expect(route).toHaveProperty('path');
      expect(route).toHaveProperty('element');
      expect(typeof route.path).toBe('string');
      expect(route.path.startsWith('/')).toBe(true);
    });
  });

  it('has no duplicate paths', () => {
    const paths = publicRoutes.map((r) => r.path);
    const unique = new Set(paths);
    expect(unique.size).toBe(paths.length);
  });
});

// ── Private Routes ────────────────────────────────────────────────────────────
describe('privateRoutes', () => {
  it('is an array', () => {
    expect(Array.isArray(privateRoutes)).toBe(true);
  });

  const expectedPaths = [
    '/dashboard',
    '/admin/dashboard',
    '/user/dashboard',
    '/organizer/dashboard',
    '/events',
    '/events/:eventId',
    '/products',
    '/vendors',
    '/tasks',
    '/feedback',
    '/settings',
  ];

  expectedPaths.forEach((path) => {
    it(`defines the private "${path}" route`, () => {
      const route = privateRoutes.find((r) => r.path === path);
      expect(route).toBeDefined();
      expect(route.element).toBeTruthy();
    });
  });

  it('every route has a path and element', () => {
    privateRoutes.forEach((route) => {
      expect(route).toHaveProperty('path');
      expect(route).toHaveProperty('element');
      expect(typeof route.path).toBe('string');
    });
  });

  it('has no duplicate paths', () => {
    const paths = privateRoutes.map((r) => r.path);
    const unique = new Set(paths);
    expect(unique.size).toBe(paths.length);
  });

  it('includes dashboard-related routes', () => {
    const dashboardRoutes = privateRoutes.filter((r) => r.path.includes('dashboard'));
    expect(dashboardRoutes.length).toBeGreaterThanOrEqual(4);
  });
});
