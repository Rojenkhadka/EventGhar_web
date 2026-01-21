import { api } from './client';

export async function listTasks() {
  const data = await api.get('/api/tasks');
  return data.tasks || [];
}

export async function createTask(payload) {
  const data = await api.post('/api/tasks', payload);
  return data.task;
}

export async function updateTask(id, payload) {
  const data = await api.put(`/api/tasks/${encodeURIComponent(id)}`, payload);
  return data.task;
}

export async function deleteTask(id) {
  await api.del(`/api/tasks/${encodeURIComponent(id)}`);
}
