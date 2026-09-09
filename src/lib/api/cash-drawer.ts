import client from "./client";
import type {
  CashDrawerSession,
  OpenSessionPayload,
  ShiftLogPayload,
  FinalizeSessionPayload,
} from "@/types/cash-drawer";

export const cashDrawerApi = {
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
