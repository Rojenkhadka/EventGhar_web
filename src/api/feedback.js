import { api } from './client';

export async function listFeedback() {
  const data = await api.get('/api/feedback');
  return data.feedback || [];
}

export async function createFeedback(payload) {
  const data = await api.post('/api/feedback', payload);
  return data.feedback;
}

export async function updateFeedback(id, payload) {
  const data = await api.put(`/api/feedback/${encodeURIComponent(id)}`, payload);
  return data.feedback;
}

export async function deleteFeedback(id) {
  await api.del(`/api/feedback/${encodeURIComponent(id)}`);
}
