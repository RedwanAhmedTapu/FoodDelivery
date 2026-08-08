import { api } from '../api';
import { Cart } from '@/types';

export interface AddItemPayload {
  foodId: string;
  quantity?: number;
  variantName?: string;
  addonNames?: string[];
  notes?: string;
  forceReplace?: boolean;
}

export const cartApi = {
  async get() {
    const res = await api.get('/cart');
    return res.data.data as { cart: Cart; subtotal: number };
  },
  async addItem(payload: AddItemPayload) {
    const res = await api.post('/cart/items', payload);
    return res.data.data as { cart?: Cart; subtotal?: number; conflict?: boolean };
  },
  async updateItem(itemId: string, quantity: number) {
    const res = await api.patch(`/cart/items/${itemId}`, { quantity });
    return res.data.data as { cart: Cart; subtotal: number };
  },
  async removeItem(itemId: string) {
    const res = await api.delete(`/cart/items/${itemId}`);
    return res.data.data as { cart: Cart; subtotal: number };
  },
  async clear() {
    const res = await api.delete('/cart');
    return res.data.data as { cart: Cart; subtotal: number };
  },
};
