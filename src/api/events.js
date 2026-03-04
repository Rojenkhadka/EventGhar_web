
// Organizer: Get all events created by the current organizer (all statuses)
export async function listMyEvents() {
  try {
    const data = await api.get('/api/events/my');
    return Array.isArray(data?.events) ? data.events : [];
  } catch (err) {
    return [];
  }
}
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
  // Form sends 'venue'; server expects 'location' — normalise here
  const { venue, ...rest } = payload;
  const body = { ...rest, location: rest.location || venue };
  const data = await api.post('/api/events', body);
  return data.event;
}

export async function updateEvent(id, payload) {
  // Form sends 'venue'; server expects 'location' — normalise here
  const { venue, ...rest } = payload;
  const body = { ...rest, location: rest.location || venue };
  const data = await api.put(`/api/events/${encodeURIComponent(id)}`, body);
  return data.event;
}

export async function deleteEvent(id) {
  await api.del(`/api/events/${encodeURIComponent(id)}`);
}

// Publish event (organizer can publish their own events)
export async function publishEvent(id) {
  const data = await api.patch(`/api/events/${encodeURIComponent(id)}/publish`);
  return data;
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
    return data; // Return the full response object with events property
  } catch (err) {
    return { events: [] };
  }
}
