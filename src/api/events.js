import { api } from './client';

export async function listEvents() {
  try {
    const data = await api.get('/api/events');
    return Array.isArray(data?.events) ? data.events : [];
  } catch (err) {
    return [];
  }
}

export async function getEvent(id) {
  const data = await api.get(`/api/events/${encodeURIComponent(id)}`);
  return data.event;
}

export async function createEvent(payload) {
  const data = await api.post('/api/events', payload);
  return data.event;
}

export async function updateEvent(id, payload) {
  const data = await api.put(`/api/events/${encodeURIComponent(id)}`, payload);
  return data.event;
}

export async function deleteEvent(id) {
  await api.del(`/api/events/${encodeURIComponent(id)}`);
}

// Organizer: Get bookings for a specific event
export async function getEventBookings(eventId) {
  const data = await api.get(`/api/events/${encodeURIComponent(eventId)}/bookings`);
  return data.bookings || [];
}

// Public events for users to browse
export async function getPublicEvents() {
  try {
    const data = await api.get('/api/events/public');
    return Array.isArray(data?.events) ? data.events : [];
  } catch (err) {
    return [];
  }
}
