import { api } from './client';

export async function registerUser(payload) {
  const data = await api.post('/api/auth/register', payload);
  return data.user;
}

export async function loginUser(payload) {
  const data = await api.post('/api/auth/login', payload);
  return data; // { token, user }
}

export async function forgotPassword(email) {
  return api.post('/api/auth/forgot-password', { email });
}

export async function verifyOTP(email, otp) {
  return api.post('/api/auth/verify-otp', { email, otp });
}

export async function resetPassword(resetToken, password) {
  return api.post('/api/auth/reset-password', { resetToken, password });
}

export function setAuthSession({ token, user }) {
  // Clear old user data to prevent profile pic and other data leakage between users
  localStorage.removeItem('eventghar_profile_pic');
  
  if (token) localStorage.setItem('eventghar_token', token);
  if (user) localStorage.setItem('eventghar_current_user', JSON.stringify(user));
}

export function clearAuthSession() {
  localStorage.removeItem('eventghar_token');
  localStorage.removeItem('eventghar_current_user');
  localStorage.removeItem('eventghar_profile_pic');
}
