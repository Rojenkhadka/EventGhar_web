import { api } from './client';

export async function getMe() {
  const data = await api.get('/api/auth/me');
  return data; // Backend returns user directly, not { user: {...} }
}

export async function updateMe(payload) {
  const data = await api.put('/api/auth/me', payload);
  return data.user;
}
