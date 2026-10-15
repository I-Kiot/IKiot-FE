import { create } from "zustand";
import { orderJourneyApi } from "@/lib/api/order-journey";
import type { OrderAlerts } from "@/types/order-flow";

interface OrderAlertsState {
  alerts: OrderAlerts | null;
  /** Never throws: a failed badge refresh must not surface as an error on every page. */
  fetchAlerts: (branchId?: string) => Promise<void>;
}

export const useOrderAlertsStore = create<OrderAlertsState>((set) => ({
  alerts: null,
  fetchAlerts: async (branchId) => {
    try {
      set({ alerts: await orderJourneyApi.getAlerts(branchId) });
    } catch {
      // keep the last known numbers
    }
  },
}));
