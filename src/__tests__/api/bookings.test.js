import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../api/client', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    del: vi.fn(),
  },
}));

import { api } from '../../api/client';
import {
  getMyBookings,
  createBooking,
  cancelBooking,
  getPublicEvents,
  getEventBookings,
} from '../../api/bookings';

beforeEach(() => vi.resetAllMocks());

describe('bookings – getMyBookings', () => {
  it('calls GET /api/bookings and returns response', async () => {
    const mockData = { bookings: [{ id: 1 }, { id: 2 }] };
    api.get.mockResolvedValue(mockData);
    const result = await getMyBookings();
    expect(api.get).toHaveBeenCalledWith('/api/bookings');
    expect(result).toEqual(mockData);
  });

  it('propagates errors from the API', async () => {
    api.get.mockRejectedValue(new Error('Unauthorized'));
    await expect(getMyBookings()).rejects.toThrow('Unauthorized');
  });
});

describe('bookings – createBooking', () => {
  it('posts to /api/bookings and returns response', async () => {
    const payload = { eventId: 5 };
    const mockResp = { booking: { id: 10, eventId: 5 } };
    api.post.mockResolvedValue(mockResp);
    const result = await createBooking(payload);
    expect(api.post).toHaveBeenCalledWith('/api/bookings', payload);
    expect(result).toEqual(mockResp);
  });

  it('propagates error when booking fails', async () => {
    api.post.mockRejectedValue(new Error('Sold out'));
    await expect(createBooking({ eventId: 99 })).rejects.toThrow('Sold out');
  });
});

describe('bookings – cancelBooking', () => {
  it('calls DELETE on /api/bookings/:id', async () => {
    api.del.mockResolvedValue({ cancelled: true });
    const result = await cancelBooking(3);
    expect(api.del).toHaveBeenCalledWith('/api/bookings/3');
    expect(result).toEqual({ cancelled: true });
  });

  it('propagates errors', async () => {
    api.del.mockRejectedValue(new Error('Not found'));
    await expect(cancelBooking(999)).rejects.toThrow('Not found');
  });
});

describe('bookings – getPublicEvents', () => {
  it('calls GET /api/events/public and returns response', async () => {
    const mockData = { events: [{ id: 1, title: 'Fest' }] };
    api.get.mockResolvedValue(mockData);
    const result = await getPublicEvents();
    expect(api.get).toHaveBeenCalledWith('/api/events/public');
    expect(result).toEqual(mockData);
  });
});

describe('bookings – getEventBookings', () => {
  it('calls GET /api/bookings/event/:eventId and returns bookings', async () => {
    const mockData = { bookings: [{ id: 1 }, { id: 2 }] };
    api.get.mockResolvedValue(mockData);
    const result = await getEventBookings(7);
    expect(api.get).toHaveBeenCalledWith('/api/bookings/event/7');
    expect(result).toEqual([{ id: 1 }, { id: 2 }]);
  });

  it('returns empty array when bookings property is missing', async () => {
    api.get.mockResolvedValue({});
    const result = await getEventBookings(7);
    expect(result).toEqual([]);
  });
});
