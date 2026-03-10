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
import { getMe, updateMe } from '../../api/me';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from '../../api/notifications';
import {
  listFeedback,
  createFeedback,
  updateFeedback,
  deleteFeedback,
} from '../../api/feedback';

beforeEach(() => vi.resetAllMocks());

// ── me ────────────────────────────────────────────────────────────────────────
describe('me – getMe', () => {
  it('calls GET /api/auth/me and returns data', async () => {
    api.get.mockResolvedValue({ id: 1, name: 'Alice' });
    const result = await getMe();
    expect(api.get).toHaveBeenCalledWith('/api/auth/me');
    expect(result).toEqual({ id: 1, name: 'Alice' });
  });
});

describe('me – updateMe', () => {
  it('calls PUT /api/auth/me with payload and returns user', async () => {
    api.put.mockResolvedValue({ user: { id: 1, name: 'Alice Updated' } });
    const result = await updateMe({ name: 'Alice Updated' });
    expect(api.put).toHaveBeenCalledWith('/api/auth/me', { name: 'Alice Updated' });
    expect(result).toEqual({ id: 1, name: 'Alice Updated' });
  });
});

// ── notifications ─────────────────────────────────────────────────────────────
describe('notifications – getNotifications', () => {
  it('returns notifications array', async () => {
    api.get.mockResolvedValue({ notifications: [{ id: 1, message: 'Hello' }] });
    const result = await getNotifications();
    expect(api.get).toHaveBeenCalledWith('/api/notifications');
    expect(result).toEqual([{ id: 1, message: 'Hello' }]);
  });

  it('returns empty array when property is missing', async () => {
    api.get.mockResolvedValue({});
    const result = await getNotifications();
    expect(result).toEqual([]);
  });
});

describe('notifications – getUnreadCount', () => {
  it('returns count number', async () => {
    api.get.mockResolvedValue({ count: 5 });
    const result = await getUnreadCount();
    expect(result).toBe(5);
  });

  it('returns 0 when count is missing', async () => {
    api.get.mockResolvedValue({});
    const result = await getUnreadCount();
    expect(result).toBe(0);
  });
});

describe('notifications – markAsRead', () => {
  it('calls PATCH /api/notifications/:id/read', async () => {
    api.patch.mockResolvedValue({ success: true });
    const result = await markAsRead(3);
    expect(api.patch).toHaveBeenCalledWith('/api/notifications/3/read');
    expect(result).toEqual({ success: true });
  });
});

describe('notifications – markAllAsRead', () => {
  it('calls PATCH /api/notifications/mark-all-read', async () => {
    api.patch.mockResolvedValue({ success: true });
    await markAllAsRead();
    expect(api.patch).toHaveBeenCalledWith('/api/notifications/mark-all-read');
  });
});

describe('notifications – deleteNotification', () => {
  it('calls DELETE /api/notifications/:id', async () => {
    api.del.mockResolvedValue(null);
    await deleteNotification(7);
    expect(api.del).toHaveBeenCalledWith('/api/notifications/7');
  });
});

// ── feedback ──────────────────────────────────────────────────────────────────
describe('feedback – listFeedback', () => {
  it('returns feedback array from GET /api/feedback', async () => {
    const items = [{ id: 1, message: 'Great!' }];
    api.get.mockResolvedValue({ feedback: items });
    const result = await listFeedback();
    expect(api.get).toHaveBeenCalledWith('/api/feedback');
    expect(result).toEqual(items);
  });

  it('returns empty array when feedback property is missing', async () => {
    api.get.mockResolvedValue({});
    const result = await listFeedback();
    expect(result).toEqual([]);
  });
});

describe('feedback – createFeedback', () => {
  it('posts to /api/feedback and returns created feedback', async () => {
    const newFb = { id: 2, message: 'Excellent event!' };
    api.post.mockResolvedValue({ feedback: newFb });
    const result = await createFeedback({ message: 'Excellent event!' });
    expect(api.post).toHaveBeenCalledWith('/api/feedback', { message: 'Excellent event!' });
    expect(result).toEqual(newFb);
  });
});

describe('feedback – updateFeedback', () => {
  it('puts to /api/feedback/:id and returns updated feedback', async () => {
    const updated = { id: 2, message: 'Updated!' };
    api.put.mockResolvedValue({ feedback: updated });
    const result = await updateFeedback(2, { message: 'Updated!' });
    expect(api.put).toHaveBeenCalledWith('/api/feedback/2', { message: 'Updated!' });
    expect(result).toEqual(updated);
  });
});

describe('feedback – deleteFeedback', () => {
  it('calls DELETE /api/feedback/:id', async () => {
    api.del.mockResolvedValue(null);
    await deleteFeedback(2);
    expect(api.del).toHaveBeenCalledWith('/api/feedback/2');
  });
});
