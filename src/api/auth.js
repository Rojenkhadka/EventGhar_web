import { api } from './client';

export async function registerUser(payload) {
  const data = await api.post('/api/auth/register', payload);
  return data.user;
}

export async function loginUser(payload) {
  const data = await api.post('/api/auth/login', payload);
  return data; // { token, user }
}

export function setAuthSession({ token, user }) {
  if (token) localStorage.setItem('eventghar_token', token);
  if (user) localStorage.setItem('eventghar_current_user', JSON.stringify(user));
}

export function clearAuthSession() {
  localStorage.removeItem('eventghar_token');
  localStorage.removeItem('eventghar_current_user');
}
