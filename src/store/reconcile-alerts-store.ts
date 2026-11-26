import { create } from "zustand";
import { statsApi, type Unreconciled } from "@/lib/api/stats";

/** Số khoản cần người xử lý trên màn Đối soát tiền; số dư tham khảo không tính. */
export function reconcileAlertCount(data: Unreconciled): number {
  return (
    data.shipperCash.orderCount +
    data.sepayExceptions.count +
    data.overpaidOrders.count +
    data.heldUndecided.count
  );
}

interface ReconcileAlertsState {
  count: number | null;
  /** Không throw: lỗi làm mới badge không được hiện thành lỗi trên mọi trang. */
  fetchCount: (branchId?: string) => Promise<void>;
}

export const useReconcileAlertsStore = create<ReconcileAlertsState>((set) => ({
  count: null,
  fetchCount: async (branchId) => {
    try {
      set({ count: reconcileAlertCount(await statsApi.getUnreconciled({ branchId })) });
    } catch {
      // Giữ số liệu của lần tải thành công gần nhất.
    }
  },
}));
