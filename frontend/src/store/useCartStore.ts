'use client';

import { create } from 'zustand';
import { Cart } from '@/types';
import { AddItemPayload, cartApi } from '@/lib/endpoints/cart';
import toast from 'react-hot-toast';

interface CartState {
  cart: Cart | null;
  subtotal: number;
  isLoading: boolean;
  refresh: () => Promise<void>;
  addItem: (payload: AddItemPayload) => Promise<{ conflict?: boolean }>;
  updateItem: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clear: () => Promise<void>;
}

export const useCartStore = create<CartState>((set) => ({
  cart: null,
  subtotal: 0,
  isLoading: false,

  refresh: async () => {
    set({ isLoading: true });
    try {
      const { cart, subtotal } = await cartApi.get();
      set({ cart, subtotal, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  addItem: async (payload) => {
    const result = await cartApi.addItem(payload);
    if (result.conflict) return { conflict: true };
    if (result.cart) set({ cart: result.cart, subtotal: result.subtotal || 0 });
    toast.success('Added to cart');
    return {};
  },

  updateItem: async (itemId, quantity) => {
    const { cart, subtotal } = await cartApi.updateItem(itemId, quantity);
    set({ cart, subtotal });
  },

  removeItem: async (itemId) => {
    const { cart, subtotal } = await cartApi.removeItem(itemId);
    set({ cart, subtotal });
    toast.success('Item removed');
  },

  clear: async () => {
    const { cart, subtotal } = await cartApi.clear();
    set({ cart, subtotal });
  },
}));
