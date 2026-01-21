import { api } from './client';

export const getMyBookings = async () => {
  const res = await api.get('/api/bookings');
  return res;
};

export const createBooking = async (data) => {
  const res = await api.post('/api/bookings', data);
  return res;
};

export const cancelBooking = async (id) => {
  const res = await api.del(`/api/bookings/${id}`);
  return res;
};

export const getPublicEvents = async () => {
  const res = await api.get('/api/events/public');
  return res;
};
