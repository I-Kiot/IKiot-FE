import client from "./client";
import type {
  CashDrawerSession,
  CashDrawerUserRef,
  CashierOption,
  OverdueCashDrawer,
  OpenSessionPayload,
  ShiftLogPayload,
  FinalizeSessionPayload,
  OpeningHint,
  CashDrawerReconciliation,
  CashDrawerHistory,
  CashDrawerHistoryQuery,
  CashierReport,
  CashDrawerToday,
} from "@/types/cash-drawer";

const toCashierOption = (row: CashDrawerUserRef): CashierOption => ({
  id: row.id,
  fullName:
    [row.profile?.lastName, row.profile?.firstName].filter(Boolean).join(" ").trim() || "Nhân viên",
});

export const cashDrawerApi = {
  /** Két còn mở từ ngày trước. */
  getOverdue: async (branchId?: string): Promise<OverdueCashDrawer[]> => {
    const res = await client.get<{ success: boolean; data: OverdueCashDrawer[] }>(
      "/cash-drawer-sessions/overdue",
      { params: branchId ? { branchId } : undefined },
    );
    return res.data.data || [];
  },

  /** Tiền lẻ phiên trước để lại trong két, để điền sẵn tiền đầu ca. */
  getOpeningHint: async (branchId: string): Promise<OpeningHint> => {
    const res = await client.get<{ success: boolean; data: OpeningHint }>(
      "/cash-drawer-sessions/opening-hint",
      { params: { branchId } },
    );
    return res.data.data;
  },

  /** Số sổ (dự kiến) so với số đếm của một phiên. */
  getReconciliation: async (id: string): Promise<CashDrawerReconciliation> => {
    const res = await client.get<{ success: boolean; data: CashDrawerReconciliation }>(
      `/cash-drawer-sessions/${id}/reconciliation`,
    );
    return res.data.data;
  },

  /** Lịch sử két: mỗi phiên một dòng, đã đối soát; tổng tính trên toàn bộ lọc. */
  getHistory: async (params: CashDrawerHistoryQuery): Promise<CashDrawerHistory> => {
    const res = await client.get<{ success: boolean } & CashDrawerHistory>(
      "/cash-drawer-sessions/reconciliation",
      { params },
    );
    return { data: res.data.data, pagination: res.data.pagination, totals: res.data.totals };
  },

  /** Chênh lệch gộp theo thu ngân trong kỳ; người chỉ có `read_own` chỉ nhận dòng của mình. */
  getCashierReport: async (
    params: Omit<CashDrawerHistoryQuery, "page" | "limit" | "varianceOnly">,
  ): Promise<CashierReport> => {
    const res = await client.get<{ success: boolean } & CashierReport>(
      "/cash-drawer-sessions/reconciliation/by-cashier",
      { params },
    );
    return { data: res.data.data, unattributed: res.data.unattributed };
  },

  /** File Excel của lịch sử két, cùng bộ lọc (bỏ phân trang). */
  exportHistory: async (params: Omit<CashDrawerHistoryQuery, "page" | "limit">): Promise<Blob> => {
    const res = await client.get<Blob>("/cash-drawer-sessions/reconciliation/export", {
      params,
      responseType: "blob",
    });
    return res.data;
  },

  /** Người nhận được két khi mở két đầu ngày. */
  getEligibleStaff: async (branchId?: string): Promise<CashierOption[]> => {
    const res = await client.get<{ success: boolean; data: CashDrawerUserRef[] }>(
      "/cash-drawer-sessions/eligible-staff",
      { params: branchId ? { branchId } : undefined },
    );
    return (res.data.data || []).map(toCashierOption);
  },

  /** Ai nhận được bàn giao của phiên này. Chỉ người đang giữ két gọi được; không gồm chính họ. */
  getHandoverCandidates: async (id: string): Promise<CashierOption[]> => {
    const res = await client.get<{ success: boolean; data: CashDrawerUserRef[] }>(
      `/cash-drawer-sessions/${id}/handover-candidates`,
    );
    return (res.data.data || []).map(toCashierOption);
  },

  /** Két hôm nay của chi nhánh: đang mở, hôm nay đã chốt, hay chưa mở. */
  getToday: async (branchId: string): Promise<CashDrawerToday> => {
    const res = await client.get<{ success: boolean; data: CashDrawerToday }>(
      "/cash-drawer-sessions/today",
      { params: { branchId } },
    );
    return res.data.data;
  },

  getCurrentSession: async (branchId?: string): Promise<CashDrawerSession> => {
    const res = await client.get<{ success: boolean; data: CashDrawerSession }>(
      "/cash-drawer-sessions/current",
      {
        params: branchId ? { branchId } : undefined,
      }
    );
    return res.data.data;
  },

  getSessionById: async (id: string): Promise<CashDrawerSession> => {
    const res = await client.get<{ success: boolean; data: CashDrawerSession }>(
      `/cash-drawer-sessions/${id}`
    );
    return res.data.data;
  },

  openSession: async (payload: OpenSessionPayload): Promise<CashDrawerSession> => {
    const res = await client.post<{ success: boolean; data: CashDrawerSession }>(
      "/cash-drawer-sessions",
      payload
    );
    return res.data.data;
  },

  submitShiftLog: async (
    id: string,
    payload: ShiftLogPayload
  ): Promise<CashDrawerSession> => {
    const res = await client.post<{ success: boolean; data: CashDrawerSession }>(
      `/cash-drawer-sessions/${id}/shift-logs`,
      payload
    );
    return res.data.data;
  },

  /** Mở lại két chốt nhầm trong ngày: giao két cho `staffId`, gỡ kết quả chốt và dòng sổ lúc chốt. */
  reopenSession: async (
    id: string,
    payload: { staffId: string; reason: string },
  ): Promise<CashDrawerSession> => {
    const res = await client.post<{ success: boolean; data: CashDrawerSession }>(
      `/cash-drawer-sessions/${id}/reopen`,
      payload,
    );
    return res.data.data;
  },

  finalizeSession: async (
    id: string,
    payload: FinalizeSessionPayload
  ): Promise<CashDrawerSession> => {
    const res = await client.post<{ success: boolean; data: CashDrawerSession }>(
      `/cash-drawer-sessions/${id}/finalize`,
      payload
    );
    return res.data.data;
  },
};
