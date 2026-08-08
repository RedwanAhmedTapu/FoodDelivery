'use client';

import { create } from 'zustand';
import { User } from '@/types';
import { authApi } from '@/lib/endpoints/auth';
import { clearTokens, getAccessToken } from '@/lib/api';
import { disconnectSocket } from '@/lib/socket';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isHydrated: boolean;
  hydrate: () => Promise<void>;
  setUser: (user: User | null) => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  isHydrated: false,

  hydrate: async () => {
    const token = getAccessToken();
    if (!token) {
      set({ isHydrated: true });
      return;
    }
    set({ isLoading: true });
    try {
      const user = await authApi.me();
      set({ user, isLoading: false, isHydrated: true });
    } catch {
      clearTokens();
      set({ user: null, isLoading: false, isHydrated: true });
    }
  },

  setUser: (user) => set({ user }),

  logout: async () => {
    await authApi.logout();
    disconnectSocket();
    set({ user: null });
  },
}));
