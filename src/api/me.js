import { api } from './client';

export async function getMe() {
  const data = await api.get('/api/me');
  return data.user;
}

export async function updateMe(payload) {
  const data = await api.put('/api/me', payload);
  return data.user;
}
