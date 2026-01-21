import { api } from './client';

export async function listProducts() {
  const data = await api.get('/api/products');
  return data.products || [];
}

export async function createProduct(payload) {
  const data = await api.post('/api/products', payload);
  return data.product;
}

export async function updateProduct(id, payload) {
  const data = await api.put(`/api/products/${encodeURIComponent(id)}`, payload);
  return data.product;
}

export async function deleteProduct(id) {
  await api.del(`/api/products/${encodeURIComponent(id)}`);
}
