import { api } from './client';

export async function listVendors() {
  const data = await api.get('/api/vendors');
  return data.vendors || [];
}

export async function createVendor(payload) {
  const data = await api.post('/api/vendors', payload);
  return data.vendor;
}

export async function updateVendor(id, payload) {
  const data = await api.put(`/api/vendors/${encodeURIComponent(id)}`, payload);
  return data.vendor;
}

export async function deleteVendor(id) {
  await api.del(`/api/vendors/${encodeURIComponent(id)}`);
}
