import { api } from '../api';
import { PaginationMeta, Store } from '@/types';

export const storesApi = {
  async list(params: Record<string, string | number | undefined> = {}) {
    const res = await api.get('/stores', { params });
    return { items: res.data.data as Store[], meta: res.data.meta as PaginationMeta };
  },
  async nearby(lng: number, lat: number, radius = 5) {
    const res = await api.get('/stores/nearby', { params: { lng, lat, radius } });
    return { items: res.data.data as Store[], meta: res.data.meta as PaginationMeta };
  },
  async getBySlug(slug: string) {
    const res = await api.get(`/stores/slug/${slug}`);
    return res.data.data as Store;
  },
  async getById(id: string) {
    const res = await api.get(`/stores/${id}`);
    return res.data.data as Store;
  },
  async myStores() {
    const res = await api.get('/stores/owner/mine');
    return res.data.data as Store[];
  },
  async adminAll(params: Record<string, string | number | undefined> = {}) {
    const res = await api.get('/stores/admin/all', { params });
    return { items: res.data.data as Store[], meta: res.data.meta as PaginationMeta };
  },
  async create(payload: Partial<Store> & { coordinates: [number, number] }) {
    const res = await api.post('/stores', payload);
    return res.data.data as Store;
  },
  async update(id: string, payload: Partial<Store> & { coordinates?: [number, number] }) {
    const res = await api.patch(`/stores/${id}`, payload);
    return res.data.data as Store;
  },
  async activate(id: string) {
    const res = await api.patch(`/stores/${id}/activate`);
    return res.data.data as Store;
  },
  async deactivate(id: string) {
    const res = await api.patch(`/stores/${id}/deactivate`);
    return res.data.data as Store;
  },
  async uploadLogo(id: string, file: File) {
    const form = new FormData();
    form.append('logo', file);
    const res = await api.patch(`/stores/${id}/logo`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data as Store;
  },
  async uploadCover(id: string, file: File) {
    const form = new FormData();
    form.append('cover', file);
    const res = await api.patch(`/stores/${id}/cover`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data as Store;
  },
  // Admin
  async setApproval(id: string, approvalStatus: 'APPROVED' | 'REJECTED', rejectionReason?: string) {
    const res = await api.patch(`/stores/${id}/approval`, { approvalStatus, rejectionReason });
    return res.data.data as Store;
  },
};
