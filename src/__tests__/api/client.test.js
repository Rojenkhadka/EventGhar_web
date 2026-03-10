import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

import { api } from '../../api/client';

beforeEach(() => {
  mockFetch.mockReset();
  localStorage.clear();
});

afterEach(() => {
  localStorage.clear();
});

function makeResponse({ status = 200, json = null, text = null, contentType = 'application/json' } = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: () => contentType },
    json: () => Promise.resolve(json),
    text: () => Promise.resolve(text ?? JSON.stringify(json)),
  };
}

describe('api/client - GET requests', () => {
  it('fetches with GET method by default', async () => {
    mockFetch.mockResolvedValue(makeResponse({ json: { hello: 'world' } }));
    const result = await api.get('/api/test');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/test'),
      expect.objectContaining({ method: 'GET' })
    );
    expect(result).toEqual({ hello: 'world' });
  });

  it('includes Authorization header when token is in localStorage', async () => {
    localStorage.setItem('eventghar_token', 'my-jwt-token');
    mockFetch.mockResolvedValue(makeResponse({ json: {} }));
    await api.get('/api/secure');
    const callHeaders = mockFetch.mock.calls[0][1].headers;
    expect(callHeaders['Authorization']).toBe('Bearer my-jwt-token');
  });

  it('does not include Authorization header when no token', async () => {
    mockFetch.mockResolvedValue(makeResponse({ json: {} }));
    await api.get('/api/public');
    const callHeaders = mockFetch.mock.calls[0][1].headers;
    expect(callHeaders['Authorization']).toBeUndefined();
  });
});

describe('api/client - POST PUT PATCH DELETE', () => {
  it('sends POST with JSON body and Content-Type header', async () => {
    mockFetch.mockResolvedValue(makeResponse({ json: { created: true } }));
    const result = await api.post('/api/resource', { name: 'Event' });
    const callArgs = mockFetch.mock.calls[0][1];
    expect(callArgs.method).toBe('POST');
    expect(callArgs.headers['Content-Type']).toBe('application/json');
    expect(callArgs.body).toBe(JSON.stringify({ name: 'Event' }));
    expect(result).toEqual({ created: true });
  });

  it('sends PUT with correct method', async () => {
    mockFetch.mockResolvedValue(makeResponse({ json: { updated: true } }));
    await api.put('/api/resource/1', { name: 'Updated' });
    expect(mockFetch.mock.calls[0][1].method).toBe('PUT');
  });

  it('sends PATCH with correct method', async () => {
    mockFetch.mockResolvedValue(makeResponse({ json: { patched: true } }));
    await api.patch('/api/resource/1', { active: true });
    expect(mockFetch.mock.calls[0][1].method).toBe('PATCH');
  });

  it('sends DELETE with correct method and no body', async () => {
    mockFetch.mockResolvedValue(makeResponse({ contentType: 'text/plain', text: '', json: null }));
    await api.del('/api/resource/1');
    const callArgs = mockFetch.mock.calls[0][1];
    expect(callArgs.method).toBe('DELETE');
    expect(callArgs.body).toBeUndefined();
  });
});

describe('api/client - error handling', () => {
  it('throws an Error with message from JSON response on non-ok status', async () => {
    mockFetch.mockResolvedValue(makeResponse({ status: 400, json: { message: 'Bad input' } }));
    await expect(api.get('/api/fail')).rejects.toThrow('Bad input');
  });

  it('throws with fallback message when JSON has no message field', async () => {
    mockFetch.mockResolvedValue(makeResponse({ status: 500, json: {} }));
    await expect(api.get('/api/fail')).rejects.toThrow('Request failed (500)');
  });

  it('removes token from localStorage on 401 response', async () => {
    localStorage.setItem('eventghar_token', 'expired-token');
    mockFetch.mockResolvedValue(makeResponse({ status: 401, json: { message: 'Unauthorized' } }));
    await expect(api.get('/api/protected')).rejects.toThrow();
    expect(localStorage.getItem('eventghar_token')).toBeNull();
  });

  it('attaches status code to the thrown error', async () => {
    mockFetch.mockResolvedValue(makeResponse({ status: 403, json: { message: 'Forbidden' } }));
    let err;
    try { await api.get('/api/forbidden'); } catch (e) { err = e; }
    expect(err.status).toBe(403);
  });
});

describe('api/client - non-JSON response', () => {
  it('returns plain text when content-type is not JSON', async () => {
    mockFetch.mockResolvedValue(makeResponse({ contentType: 'text/plain', text: 'OK', json: null }));
    const result = await api.get('/api/text-endpoint');
    expect(result).toBe('OK');
  });
});
