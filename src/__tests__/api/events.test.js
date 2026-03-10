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
import {
  listEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  publishEvent,
  getEventBookings,
  getPublicEvents,
  listMyEvents,
} from '../../api/events';

beforeEach(() => vi.resetAllMocks());

const sampleEvent = { id: 1, title: 'Tech Expo', location: 'Kathmandu' };

describe('events – listEvents', () => {
  it('returns events array from /api/events', async () => {
    api.get.mockResolvedValue({ events: [sampleEvent] });
    const result = await listEvents();
    expect(api.get).toHaveBeenCalledWith('/api/events');
    expect(result).toEqual([sampleEvent]);
  });

  it('returns empty array on error', async () => {
    api.get.mockRejectedValue(new Error('Network error'));
    const result = await listEvents();
    expect(result).toEqual([]);
  });

  it('returns empty array when response has no events property', async () => {
    api.get.mockResolvedValue({});
    const result = await listEvents();
    expect(result).toEqual([]);
  });
});

describe('events – getEvent', () => {
  it('fetches a single event by id', async () => {
    api.get.mockResolvedValue({ event: sampleEvent });
    const result = await getEvent(1);
    expect(api.get).toHaveBeenCalledWith('/api/events/1');
    expect(result).toEqual(sampleEvent);
  });
});

describe('events – createEvent', () => {
  it('posts to /api/events and returns new event', async () => {
    api.post.mockResolvedValue({ event: sampleEvent });
    const payload = { title: 'Tech Expo', location: 'Kathmandu', date: '2026-05-01' };
    const result = await createEvent(payload);
    expect(api.post).toHaveBeenCalledWith('/api/events', expect.objectContaining({ location: 'Kathmandu' }));
    expect(result).toEqual(sampleEvent);
  });

  it('maps "venue" field to "location" before posting', async () => {
    api.post.mockResolvedValue({ event: sampleEvent });
    await createEvent({ title: 'Fest', venue: 'Pokhara' });
    const body = api.post.mock.calls[0][1];
    expect(body.location).toBe('Pokhara');
    expect(body.venue).toBeUndefined();
  });

  it('prefers existing location over venue', async () => {
    api.post.mockResolvedValue({ event: sampleEvent });
    await createEvent({ title: 'Fest', venue: 'Pokhara', location: 'Lalitpur' });
    const body = api.post.mock.calls[0][1];
    expect(body.location).toBe('Lalitpur');
  });
});

describe('events – updateEvent', () => {
  it('puts to /api/events/:id and returns updated event', async () => {
    api.put.mockResolvedValue({ event: { ...sampleEvent, title: 'Updated' } });
    const result = await updateEvent(1, { title: 'Updated', location: 'Bhaktapur' });
    expect(api.put).toHaveBeenCalledWith('/api/events/1', expect.objectContaining({ title: 'Updated' }));
    expect(result.title).toBe('Updated');
  });

  it('maps venue to location on update', async () => {
    api.put.mockResolvedValue({ event: sampleEvent });
    await updateEvent(1, { title: 'x', venue: 'New Venue' });
    const body = api.put.mock.calls[0][1];
    expect(body.location).toBe('New Venue');
  });
});

describe('events – deleteEvent', () => {
  it('calls del with the correct path', async () => {
    api.del.mockResolvedValue(null);
    await deleteEvent(1);
    expect(api.del).toHaveBeenCalledWith('/api/events/1');
  });
});

describe('events – publishEvent', () => {
  it('patches /api/events/:id/publish', async () => {
    api.patch.mockResolvedValue({ success: true });
    const result = await publishEvent(1);
    expect(api.patch).toHaveBeenCalledWith('/api/events/1/publish');
    expect(result).toEqual({ success: true });
  });
});

describe('events – getEventBookings', () => {
  it('returns bookings array', async () => {
    const bookings = [{ id: 1 }, { id: 2 }];
    api.get.mockResolvedValue({ bookings });
    const result = await getEventBookings(5);
    expect(api.get).toHaveBeenCalledWith('/api/events/5/bookings');
    expect(result).toEqual(bookings);
  });

  it('returns empty array when no bookings', async () => {
    api.get.mockResolvedValue({});
    const result = await getEventBookings(5);
    expect(result).toEqual([]);
  });
});

describe('events – getPublicEvents', () => {
  it('returns full response object from /api/events/public', async () => {
    const resp = { events: [sampleEvent] };
    api.get.mockResolvedValue(resp);
    const result = await getPublicEvents();
    expect(api.get).toHaveBeenCalledWith('/api/events/public');
    expect(result).toEqual(resp);
  });

  it('returns { events: [] } on error', async () => {
    api.get.mockRejectedValue(new Error('Network'));
    const result = await getPublicEvents();
    expect(result).toEqual({ events: [] });
  });
});

describe('events – listMyEvents', () => {
  it('returns organizer\'s events from /api/events/my', async () => {
    api.get.mockResolvedValue({ events: [sampleEvent] });
    const result = await listMyEvents();
    expect(api.get).toHaveBeenCalledWith('/api/events/my');
    expect(result).toEqual([sampleEvent]);
  });

  it('returns empty array on error', async () => {
    api.get.mockRejectedValue(new Error('Fail'));
    const result = await listMyEvents();
    expect(result).toEqual([]);
  });
});
