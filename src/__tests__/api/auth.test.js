import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

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
  registerUser,
  loginUser,
  forgotPassword,
  verifyOTP,
  resetPassword,
  setAuthSession,
  clearAuthSession,
} from '../../api/auth';

beforeEach(() => {
  vi.resetAllMocks();
  localStorage.clear();
});

afterEach(() => {
  localStorage.clear();
});

describe('auth – registerUser', () => {
  it('posts to /api/auth/register and returns user', async () => {
    api.post.mockResolvedValue({ user: { id: 1, name: 'Alice' } });
    const result = await registerUser({ name: 'Alice', email: 'a@a.com', password: 'pass' });
    expect(api.post).toHaveBeenCalledWith('/api/auth/register', {
      name: 'Alice', email: 'a@a.com', password: 'pass',
    });
    expect(result).toEqual({ id: 1, name: 'Alice' });
  });
});

describe('auth – loginUser', () => {
  it('posts to /api/auth/login and returns full response', async () => {
    const mockResponse = { token: 'abc123', user: { id: 2, name: 'Bob' } };
    api.post.mockResolvedValue(mockResponse);
    const result = await loginUser({ email: 'b@b.com', password: '1234' });
    expect(api.post).toHaveBeenCalledWith('/api/auth/login', { email: 'b@b.com', password: '1234' });
    expect(result).toEqual(mockResponse);
  });
});

describe('auth – forgotPassword', () => {
  it('posts email to /api/auth/forgot-password', async () => {
    api.post.mockResolvedValue({ message: 'OTP sent' });
    await forgotPassword('c@c.com');
    expect(api.post).toHaveBeenCalledWith('/api/auth/forgot-password', { email: 'c@c.com' });
  });
});

describe('auth – verifyOTP', () => {
  it('posts email and otp to /api/auth/verify-otp', async () => {
    api.post.mockResolvedValue({ valid: true });
    await verifyOTP('d@d.com', '123456');
    expect(api.post).toHaveBeenCalledWith('/api/auth/verify-otp', {
      email: 'd@d.com', otp: '123456',
    });
  });
});

describe('auth – resetPassword', () => {
  it('posts resetToken and password to /api/auth/reset-password', async () => {
    api.post.mockResolvedValue({ message: 'Password reset' });
    await resetPassword('reset-token-xyz', 'newPassword1');
    expect(api.post).toHaveBeenCalledWith('/api/auth/reset-password', {
      resetToken: 'reset-token-xyz',
      password: 'newPassword1',
    });
  });
});

describe('auth – setAuthSession', () => {
  it('saves token to localStorage', () => {
    setAuthSession({ token: 'tok123', user: null });
    expect(localStorage.getItem('eventghar_token')).toBe('tok123');
  });

  it('saves user to localStorage as JSON', () => {
    const user = { id: 5, name: 'Eve' };
    setAuthSession({ token: 'tok', user });
    expect(JSON.parse(localStorage.getItem('eventghar_current_user'))).toEqual(user);
  });

  it('clears old eventghar_profile_pic on setAuthSession', () => {
    localStorage.setItem('eventghar_profile_pic', 'old_pic');
    setAuthSession({ token: 'tok', user: null });
    expect(localStorage.getItem('eventghar_profile_pic')).toBeNull();
  });

  it('does not set token when token is falsy', () => {
    setAuthSession({ token: null, user: null });
    expect(localStorage.getItem('eventghar_token')).toBeNull();
  });

  it('does not set user when user is falsy', () => {
    setAuthSession({ token: 'tok', user: null });
    expect(localStorage.getItem('eventghar_current_user')).toBeNull();
  });
});

describe('auth – clearAuthSession', () => {
  it('removes token from localStorage', () => {
    localStorage.setItem('eventghar_token', 'my-token');
    clearAuthSession();
    expect(localStorage.getItem('eventghar_token')).toBeNull();
  });

  it('removes current user from localStorage', () => {
    localStorage.setItem('eventghar_current_user', JSON.stringify({ id: 1 }));
    clearAuthSession();
    expect(localStorage.getItem('eventghar_current_user')).toBeNull();
  });

  it('removes profile pic from localStorage', () => {
    localStorage.setItem('eventghar_profile_pic', 'pic_data');
    clearAuthSession();
    expect(localStorage.getItem('eventghar_profile_pic')).toBeNull();
  });
});
