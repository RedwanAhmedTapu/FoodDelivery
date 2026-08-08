import { api } from '../api';
import { Food, PaginationMeta } from '@/types';

export const foodsApi = {
  async search(params: Record<string, string | number | undefined> = {}) {
    const res = await api.get('/foods', { params });
    return { items: res.data.data as Food[], meta: res.data.meta as PaginationMeta };
  },
  async listByStore(storeId: string, params: Record<string, string | number | undefined> = {}) {
    const res = await api.get(`/foods/store/${storeId}`, { params });
    return { items: res.data.data as Food[], meta: res.data.meta as PaginationMeta };
  },
  async getById(id: string) {
    const res = await api.get(`/foods/${id}`);
    return res.data.data as Food;
  },
  async create(payload: Partial<Food> & { storeId: string; categoryId: string }) {
    const res = await api.post('/foods', payload);
    return res.data.data as Food;
  },
  async update(id: string, payload: Partial<Food>) {
    const res = await api.patch(`/foods/${id}`, payload);
    return res.data.data as Food;
  },
  async remove(id: string) {
    await api.delete(`/foods/${id}`);
  },
  async setActive(id: string, isActive: boolean) {
    const res = await api.patch(`/foods/${id}/status`, { isActive });
    return res.data.data as Food;
  },
  async uploadImages(id: string, files: File[]) {
    const form = new FormData();
    files.forEach((f) => form.append('images', f));
    const res = await api.patch(`/foods/${id}/images`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data as Food;
  },
  async bulkUpload(storeId: string, file: File) {
    const form = new FormData();
    form.append('storeId', storeId);
    form.append('file', file);
    const res = await api.post('/foods/bulk-upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data as {
      totalRows: number;
      successCount: number;
      failedCount: number;
      failedRows: { rowNumber: number; errors: string[] }[];
    };
  },
};
