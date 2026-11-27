import { create } from "zustand";
import { orderJourneyApi } from "@/lib/api/order-journey";
import type { OrderAlerts } from "@/types/order-flow";

interface OrderAlertsState {
  alerts: OrderAlerts | null;
  /** Không throw: lỗi làm mới badge không được hiện thành lỗi trên mọi trang. */
  fetchAlerts: (branchId?: string) => Promise<void>;
}

export const useOrderAlertsStore = create<OrderAlertsState>((set) => ({
  alerts: null,
  fetchAlerts: async (branchId) => {
    try {
      set({ alerts: await orderJourneyApi.getAlerts(branchId) });
    } catch {
      // Giữ số liệu của lần tải thành công gần nhất.
    }
  },
}));
