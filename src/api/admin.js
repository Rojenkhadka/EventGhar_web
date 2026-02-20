import { api } from './client';

// User Management
export const getAllUsers = async () => {
  const res = await api.get('/api/admin/users');
  return res;
};

export const updateUserRole = async (userId, role) => {
  const res = await api.put(`/api/admin/users/${userId}/role`, { role });
  return res;
};

export const deleteUser = async (userId) => {
  const res = await api.del(`/api/admin/users/${userId}`);
  return res;
};

export const createAdminUser = async (data) => {
  const res = await api.post('/api/admin/users/create-admin', data);
  return res;
};

// Statistics
export const getAdminStats = async () => {
  const res = await api.get('/api/admin/stats');
  return res;
};

// Analytics
export const getWeeklyRegistrations = async () => {
  const res = await api.get('/api/admin/analytics/weekly-registrations');
  return res;
};

// Event Management
export const getPendingEvents = async () => {
  const res = await api.get('/api/admin/events/pending');
  return res;
};

export const getAllEventsAdmin = async () => {
  const res = await api.get('/api/events/admin/all');
  return res;
};

export const approveEvent = async (eventId) => {
  const res = await api.patch(`/api/events/${eventId}/approve`, {});
  return res;
};

export const rejectEvent = async (eventId) => {
  const res = await api.patch(`/api/events/${eventId}/reject`, {});
  return res;
};
