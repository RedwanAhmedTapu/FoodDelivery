'use client';

import { create } from 'zustand';

interface DeliveryOrdersState {
  refreshKey: number;
  bumpRefresh: () => void;
}

/**
 * DispatchOfferModal and the delivery dashboard page are separate
 * components with no shared props — this lets the modal tell the
 * dashboard "an order just got assigned, refetch your list" without
 * threading callbacks through the layout.
 */
export const useDeliveryOrdersStore = create<DeliveryOrdersState>((set) => ({
  refreshKey: 0,
  bumpRefresh: () => set((s) => ({ refreshKey: s.refreshKey + 1 })),
}));
