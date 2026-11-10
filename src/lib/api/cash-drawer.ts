import client from "./client";
import type {
  CashDrawerSession,
  CashDrawerUserRef,
  CashierOption,
  OpenSessionPayload,
  ShiftLogPayload,
  FinalizeSessionPayload,
} from "@/types/cash-drawer";

const toCashierOption = (row: CashDrawerUserRef): CashierOption => ({
  id: row.id,
  fullName:
    [row.profile?.lastName, row.profile?.firstName].filter(Boolean).join(" ").trim() || "Nhân viên",
});

export const cashDrawerApi = {
  /** Ai nhận được két khi mở két đầu ngày (quyền `cash_drawers:open`). Thay cho `GET /users`, vốn cần `users:read`. */
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
