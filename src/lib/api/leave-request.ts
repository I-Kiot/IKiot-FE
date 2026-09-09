import client from "./client";
import { allows } from "@/components/sidebar/constants/role-permissions";
import {
  extractCreatedLeaveRequest,
  extractHandoverPreview,
  mapLeaveRequestFromApi,
  toApiDate,
} from "./leave-request-mapper";
import type {
  ApproveLeavePayload,
  CreateEmergencyLeavePayload,
  CreatePersonalLeavePayload,
  HandoverPreview,
  LeaveBalance,
  LeaveRequest,
  LeaveRequestListApiResponse,
  LeaveRequestListResponse,
  LeaveRequestPerDay,
  LeaveRequestPerDayQueryParams,
  LeaveRequestQueryParams,
  LeaveRequestUserContext,
  ApiLeaveRequest,
} from "@/types/leave-request";

/**
 * Which list endpoint this account may actually call.
 *
 * Each one needs its own permission - `/branches` wants `leaveRequests:readBR`,
 * `/warehouses` wants `readWH`, the unscoped list wants `read_all`, and `/me` needs only
 * `read_mine`. The old version picked by role name and fell through to the **tenant-wide**
 * list for anything it did not recognise, so after the rename every staff account asked for
 * the widest endpoint and got a 403 instead of their own leave. Widest-first, own last.
 */
function resolveListUrl(role?: string | null): string {
  if (allows(role, "leaveRequests", "read_all")) return "/leave-requests";
  if (allows(role, "leaveRequests", "readBR")) return "/leave-requests/branches";
  if (allows(role, "leaveRequests", "readWH")) return "/leave-requests/warehouses";
  return "/leave-requests/me";
}

function buildQueryParams(params?: LeaveRequestQueryParams) {
  return {
    page: params?.page ?? 1,
    limit: params?.limit ?? 10,
    status: params?.status,
    // No `role`: the backend has no such filter on any leave-request list, so it was
    // being sent and dropped by the global whitelist.
    branchId: params?.branchId,
    warehouseId: params?.warehouseId,
    // `keyword`, not `search`. `QueryLeaveRequestDto` is the one list endpoint that kept
    // the old name - it matches the reason text and the requester's name - so a `search`
    // key was dropped by `whitelist: true` and the box filtered nothing.
    keyword: params?.search?.trim() || undefined,
    startDate: params?.startDate ? toApiDate(params.startDate) : undefined,
    endDate: params?.endDate ? toApiDate(params.endDate) : undefined,
  };
}

function unwrapData<T>(payload: unknown): T {
  if (payload && typeof payload === "object" && "data" in payload) {
    return (payload as { data: T }).data;
  }
  return payload as T;
}

function mapListResponse(
  response: LeaveRequestListApiResponse | undefined,
  params?: LeaveRequestQueryParams,
): LeaveRequestListResponse {
  const pagination = response?.pagination;
  const total = pagination?.total ?? response?.data?.length ?? 0;
  const limit =
    pagination?.limit ?? params?.limit ?? 10;

  return {
    data: (response?.data ?? []).map(mapLeaveRequestFromApi),
    total,
    page: pagination?.page ?? params?.page ?? 1,
    totalPages:
      pagination?.totalPages ?? Math.max(1, Math.ceil(total / limit)),
  };
}

function mapCreatedResponse(data: unknown): LeaveRequest {
  const raw = extractCreatedLeaveRequest(data);
  if (!raw?.id) {
    throw new Error("Phản hồi tạo đơn nghỉ phép không hợp lệ");
  }
  return mapLeaveRequestFromApi(raw);
}

export const leaveRequestApi = {
  getListForUser: async (
    context: LeaveRequestUserContext,
    params?: LeaveRequestQueryParams,
  ): Promise<LeaveRequestListResponse> => {
    const response = await client.get<LeaveRequestListApiResponse>(
      resolveListUrl(context.role),
      { params: buildQueryParams(params) },
    );
    return mapListResponse(response.data, params);
  },

  getMinePerDay: async (
    params?: LeaveRequestPerDayQueryParams,
  ): Promise<LeaveRequestPerDay[]> => {
    const response = await client.get<{ data?: ApiLeaveRequest[] }>(
      "/leave-requests/me/per-day",
      {
        params: {
          status: params?.status,
          // `QueryLeavePerDayDto` takes status + the date range and nothing else - this
          // calendar view has no text search server-side, so the key is not sent.
          startDate: params?.startDate
            ? toApiDate(params.startDate)
            : undefined,
          endDate: params?.endDate ? toApiDate(params.endDate) : undefined,
        },
      },
    );

    return (response.data?.data ?? []).map((item) => {
      const raw = item as ApiLeaveRequest & { date?: string };
      return {
        id: raw.id,
        date: (raw.date ?? raw.startDate ?? "").slice(0, 10),
        status: raw.status,
        reason: raw.reason,
      };
    });
  },

  getById: async (id: string): Promise<LeaveRequest> => {
    const response = await client.get<{ data: unknown }>(
      `/leave-requests/${id}`,
    );
    const raw = unwrapData<unknown>(response.data);
    const leave =
      raw && typeof raw === "object" && "leaveRequest" in raw
        ? (raw as { leaveRequest: ApiLeaveRequest }).leaveRequest
        : (raw as ApiLeaveRequest);
    return mapLeaveRequestFromApi(leave);
  },

  getBalance: async (): Promise<LeaveBalance> => {
    const response = await client.get<{ data?: LeaveBalance } & LeaveBalance>(
      "/leave-requests/balance",
    );
    const data = unwrapData<LeaveBalance>(response.data) ?? response.data;
    return {
      annualLeaveDays: Number(data?.annualLeaveDays ?? 12),
      remainingDays: Number(data?.remainingDays ?? 12),
      usedDays: Number(data?.usedDays ?? 0),
    };
  },

  previewHandover: async (
    startDate: string,
    endDate: string,
  ): Promise<HandoverPreview> => {
    const response = await client.post<unknown>(
      "/leave-requests/handover/preview",
      {
        startDate: toApiDate(startDate),
        endDate: toApiDate(endDate),
      },
    );
    return extractHandoverPreview(response.data);
  },

  createPersonal: async (
    payload: CreatePersonalLeavePayload,
  ): Promise<LeaveRequest> => {
    const body: Record<string, string> = {
      startDate: toApiDate(payload.startDate),
      endDate: toApiDate(payload.endDate),
      reason: payload.reason,
    };
    if (payload.handoverToUserId) {
      body.handoverToUserId = payload.handoverToUserId;
    }

    const response = await client.post<{ data: unknown }>(
      "/leave-requests",
      body,
    );
    return mapCreatedResponse(response.data?.data);
  },

  createEmergency: async (
    payload: CreateEmergencyLeavePayload,
  ): Promise<LeaveRequest> => {
    const response = await client.post<{ data: unknown }>(
      "/leave-requests/emergency",
      {
        userId: payload.userId,
        startDate: toApiDate(payload.startDate),
        endDate: toApiDate(payload.endDate),
        reason: payload.reason,
      },
    );
    return mapCreatedResponse(response.data?.data);
  },

  approve: async (id: string, payload: ApproveLeavePayload): Promise<void> => {
    await client.post(`/leave-requests/${id}/approve`, {
      paidLeaveDays: payload.paidLeaveDays,
      unpaidLeaveDays: payload.unpaidLeaveDays,
      reviewNote: payload.reviewNote?.trim() || undefined,
    });
  },

  reject: async (id: string, reviewNote: string): Promise<void> => {
    await client.post(`/leave-requests/${id}/reject`, {
      reviewNote: reviewNote.trim(),
    });
  },

  cancel: async (id: string): Promise<void> => {
    await client.post(`/leave-requests/${id}/cancel`);
  },
};
