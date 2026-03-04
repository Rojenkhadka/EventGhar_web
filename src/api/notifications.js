import { api } from './client';

export const getNotifications = async () => {
  const res = await api.get('/api/notifications');
  return res.notifications || [];
};

export const getUnreadCount = async () => {
  const res = await api.get('/api/notifications/unread-count');
  return res.count || 0;
};

export const markAsRead = async (id) => {
  const res = await api.patch(`/api/notifications/${id}/read`);
  return res;
};

export const markAllAsRead = async () => {
  const res = await api.patch('/api/notifications/mark-all-read');
  return res;
};

export const deleteNotification = async (id) => {
  const res = await api.del(`/api/notifications/${id}`);
  return res;
};
