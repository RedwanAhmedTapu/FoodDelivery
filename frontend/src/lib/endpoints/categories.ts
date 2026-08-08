import { api } from '../api';
import { FoodCategory } from '@/types';

export const categoriesApi = {
  async listActive() {
    const res = await api.get('/categories/active');
    return res.data.data as FoodCategory[];
  },
  async list(params: Record<string, string | number | undefined> = {}) {
    const res = await api.get('/categories', { params });
    return res.data.data as FoodCategory[];
  },
  async create(payload: Partial<FoodCategory>) {
    const res = await api.post('/categories', payload);
    return res.data.data as FoodCategory;
  },
  async update(id: string, payload: Partial<FoodCategory>) {
    const res = await api.patch(`/categories/${id}`, payload);
    return res.data.data as FoodCategory;
  },
  async remove(id: string) {
    await api.delete(`/categories/${id}`);
  },
  async setActive(id: string, isActive: boolean) {
    const res = await api.patch(`/categories/${id}/status`, { isActive });
    return res.data.data as FoodCategory;
  },
  async uploadImage(id: string, file: File) {
    const form = new FormData();
    form.append('image', file);
    const res = await api.patch(`/categories/${id}/image`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data as FoodCategory;
  },
};
