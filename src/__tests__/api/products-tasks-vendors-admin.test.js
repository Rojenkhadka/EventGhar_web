import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../api/client', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    del: vi.fn(),
  },
}));

import { api } from '../../api/client';
import { listProducts, createProduct, updateProduct, deleteProduct } from '../../api/products';
import { listTasks, createTask, updateTask, deleteTask } from '../../api/tasks';
import { listVendors, createVendor, updateVendor, deleteVendor } from '../../api/vendors';
import {
  getAllUsers,
  blockUser,
  updateUserRole,
  deleteUser,
  createAdminUser,
  getAdminStats,
  getWeeklyRegistrations,
  getPendingEvents,
  getAllEventsAdmin,
  approveEvent,
  rejectEvent,
  deleteEventAdmin,
} from '../../api/admin';

beforeEach(() => vi.resetAllMocks());

// ── products ──────────────────────────────────────────────────────────────────
describe('products – listProducts', () => {
  it('returns products array from /api/products', async () => {
    api.get.mockResolvedValue({ products: [{ id: 1, name: 'Tent' }] });
    const result = await listProducts();
    expect(api.get).toHaveBeenCalledWith('/api/products');
    expect(result).toEqual([{ id: 1, name: 'Tent' }]);
  });

  it('returns empty array when products property is missing', async () => {
    api.get.mockResolvedValue({});
    expect(await listProducts()).toEqual([]);
  });
});

describe('products – createProduct', () => {
  it('posts payload and returns new product', async () => {
    api.post.mockResolvedValue({ product: { id: 2, name: 'Stage' } });
    const result = await createProduct({ name: 'Stage' });
    expect(api.post).toHaveBeenCalledWith('/api/products', { name: 'Stage' });
    expect(result).toEqual({ id: 2, name: 'Stage' });
  });
});

describe('products – updateProduct', () => {
  it('puts to /api/products/:id and returns updated product', async () => {
    api.put.mockResolvedValue({ product: { id: 2, name: 'Updated Stage' } });
    const result = await updateProduct(2, { name: 'Updated Stage' });
    expect(api.put).toHaveBeenCalledWith('/api/products/2', { name: 'Updated Stage' });
    expect(result.name).toBe('Updated Stage');
  });
});

describe('products – deleteProduct', () => {
  it('calls DELETE /api/products/:id', async () => {
    api.del.mockResolvedValue(null);
    await deleteProduct(2);
    expect(api.del).toHaveBeenCalledWith('/api/products/2');
  });
});

// ── tasks ─────────────────────────────────────────────────────────────────────
describe('tasks – listTasks', () => {
  it('returns tasks array from /api/tasks', async () => {
    api.get.mockResolvedValue({ tasks: [{ id: 1, title: 'Setup stage' }] });
    const result = await listTasks();
    expect(api.get).toHaveBeenCalledWith('/api/tasks');
    expect(result).toEqual([{ id: 1, title: 'Setup stage' }]);
  });

  it('returns empty array when tasks property is missing', async () => {
    api.get.mockResolvedValue({});
    expect(await listTasks()).toEqual([]);
  });
});

describe('tasks – createTask', () => {
  it('posts task payload and returns created task', async () => {
    api.post.mockResolvedValue({ task: { id: 3, title: 'Sound check' } });
    const result = await createTask({ title: 'Sound check' });
    expect(api.post).toHaveBeenCalledWith('/api/tasks', { title: 'Sound check' });
    expect(result).toEqual({ id: 3, title: 'Sound check' });
  });
});

describe('tasks – updateTask', () => {
  it('puts to /api/tasks/:id', async () => {
    api.put.mockResolvedValue({ task: { id: 3, title: 'Sound check done' } });
    const result = await updateTask(3, { title: 'Sound check done' });
    expect(api.put).toHaveBeenCalledWith('/api/tasks/3', { title: 'Sound check done' });
    expect(result.title).toBe('Sound check done');
  });
});

describe('tasks – deleteTask', () => {
  it('calls DELETE /api/tasks/:id', async () => {
    api.del.mockResolvedValue(null);
    await deleteTask(3);
    expect(api.del).toHaveBeenCalledWith('/api/tasks/3');
  });
});

// ── vendors ───────────────────────────────────────────────────────────────────
describe('vendors – listVendors', () => {
  it('returns vendors array from /api/vendors', async () => {
    api.get.mockResolvedValue({ vendors: [{ id: 1, name: 'DJ Ali' }] });
    const result = await listVendors();
    expect(api.get).toHaveBeenCalledWith('/api/vendors');
    expect(result).toEqual([{ id: 1, name: 'DJ Ali' }]);
  });

  it('returns empty array when vendors property is missing', async () => {
    api.get.mockResolvedValue({});
    expect(await listVendors()).toEqual([]);
  });
});

describe('vendors – createVendor', () => {
  it('posts vendor payload and returns created vendor', async () => {
    api.post.mockResolvedValue({ vendor: { id: 2, name: 'Caterer X' } });
    const result = await createVendor({ name: 'Caterer X' });
    expect(api.post).toHaveBeenCalledWith('/api/vendors', { name: 'Caterer X' });
    expect(result).toEqual({ id: 2, name: 'Caterer X' });
  });
});

describe('vendors – updateVendor', () => {
  it('puts to /api/vendors/:id', async () => {
    api.put.mockResolvedValue({ vendor: { id: 2, name: 'Updated Vendor' } });
    const result = await updateVendor(2, { name: 'Updated Vendor' });
    expect(api.put).toHaveBeenCalledWith('/api/vendors/2', { name: 'Updated Vendor' });
    expect(result.name).toBe('Updated Vendor');
  });
});

describe('vendors – deleteVendor', () => {
  it('calls DELETE /api/vendors/:id', async () => {
    api.del.mockResolvedValue(null);
    await deleteVendor(2);
    expect(api.del).toHaveBeenCalledWith('/api/vendors/2');
  });
});

// ── admin ─────────────────────────────────────────────────────────────────────
describe('admin – getAllUsers', () => {
  it('calls GET /api/admin/users and returns response', async () => {
    api.get.mockResolvedValue({ users: [{ id: 1 }] });
    const result = await getAllUsers();
    expect(api.get).toHaveBeenCalledWith('/api/admin/users');
    expect(result).toEqual({ users: [{ id: 1 }] });
  });
});

describe('admin – blockUser', () => {
  it('patches /api/admin/users/:id/block with blocked flag', async () => {
    api.patch.mockResolvedValue({ success: true });
    await blockUser(5, true);
    expect(api.patch).toHaveBeenCalledWith('/api/admin/users/5/block', { blocked: true });
  });
});

describe('admin – updateUserRole', () => {
  it('puts role to /api/admin/users/:id/role', async () => {
    api.put.mockResolvedValue({ user: { id: 5, role: 'admin' } });
    await updateUserRole(5, 'admin');
    expect(api.put).toHaveBeenCalledWith('/api/admin/users/5/role', { role: 'admin' });
  });
});

describe('admin – deleteUser', () => {
  it('calls DELETE /api/admin/users/:id', async () => {
    api.del.mockResolvedValue(null);
    await deleteUser(5);
    expect(api.del).toHaveBeenCalledWith('/api/admin/users/5');
  });
});

describe('admin – createAdminUser', () => {
  it('posts to /api/admin/users/create-admin', async () => {
    api.post.mockResolvedValue({ user: { id: 99 } });
    const result = await createAdminUser({ email: 'admin@a.com', password: 'p' });
    expect(api.post).toHaveBeenCalledWith('/api/admin/users/create-admin', { email: 'admin@a.com', password: 'p' });
    expect(result).toEqual({ user: { id: 99 } });
  });
});

describe('admin – getAdminStats', () => {
  it('calls GET /api/admin/stats', async () => {
    api.get.mockResolvedValue({ totalUsers: 42 });
    const result = await getAdminStats();
    expect(api.get).toHaveBeenCalledWith('/api/admin/stats');
    expect(result).toEqual({ totalUsers: 42 });
  });
});

describe('admin – getWeeklyRegistrations', () => {
  it('calls GET /api/admin/analytics/weekly-registrations', async () => {
    api.get.mockResolvedValue({ data: [1, 2, 3] });
    const result = await getWeeklyRegistrations();
    expect(api.get).toHaveBeenCalledWith('/api/admin/analytics/weekly-registrations');
    expect(result).toEqual({ data: [1, 2, 3] });
  });
});

describe('admin – getPendingEvents', () => {
  it('calls GET /api/admin/events/pending', async () => {
    api.get.mockResolvedValue({ events: [] });
    const result = await getPendingEvents();
    expect(api.get).toHaveBeenCalledWith('/api/admin/events/pending');
    expect(result).toEqual({ events: [] });
  });
});

describe('admin – getAllEventsAdmin', () => {
  it('calls GET /api/events/admin/all', async () => {
    api.get.mockResolvedValue({ events: [] });
    await getAllEventsAdmin();
    expect(api.get).toHaveBeenCalledWith('/api/events/admin/all');
  });
});

describe('admin – approveEvent', () => {
  it('patches /api/events/:id/approve', async () => {
    api.patch.mockResolvedValue({ approved: true });
    await approveEvent(10);
    expect(api.patch).toHaveBeenCalledWith('/api/events/10/approve', {});
  });
});

describe('admin – rejectEvent', () => {
  it('patches /api/events/:id/reject', async () => {
    api.patch.mockResolvedValue({ rejected: true });
    await rejectEvent(10);
    expect(api.patch).toHaveBeenCalledWith('/api/events/10/reject', {});
  });
});

describe('admin – deleteEventAdmin', () => {
  it('calls DELETE /api/events/:id', async () => {
    api.del.mockResolvedValue(null);
    await deleteEventAdmin(10);
    expect(api.del).toHaveBeenCalledWith('/api/events/10');
  });
});
