import client from "./client";
import {
  getSessionBranchId,
  getSessionRole,
  getSessionWarehouseId,
} from "@/lib/auth";
import {
  filterSchedulesToWorkplaceScope,
  filterScheduleToWorkplaceScope,
  filterVisibleSchedules,
  mapScheduleFromApi,
  resolveScheduleWorkplaceScope,
} from "./schedule-mapper";
import {
  getScheduleListScope,
  type ScheduleListScope,
} from "@/app/(protected)/staffs/shared/schedule-permissions";
import { isDeletedScheduleStatus } from "@/app/(protected)/staffs/shared/schedule-utils";
import type {
  ApiScheduleUser,
  ApiWorkingSchedule,
  CreateScheduleSeriesPayload,
  CreateScheduleSeriesResult,
  CreateWorkingSchedulePayload,
  CurrentWorkingScheduleResponse,
  ShiftTemplate,
  UpdateShiftTemplatePayload,
  WorkingSchedule,
  WorkingScheduleListApiResponse,
  WorkingScheduleListResponse,
  WorkingScheduleQueryParams,
} from "@/types/working-schedule";

interface ShiftTemplateListResponse {
  data: ShiftTemplate[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

const LIST_PATH: Record<ScheduleListScope, string> = {
  all: "/working-schedules",
  branch: "/working-schedules/branches",
  warehouse: "/working-schedules/warehouses",
  own: "/working-schedules/me",
};

function resolveListPath(role?: string | null): string {
  const scope = getScheduleListScope(role);
  if (!scope) {
    throw new Error("Bạn không có quyền xem lịch làm việc");
  }
  return LIST_PATH[scope];
}

function mapListResponse(
  raw: WorkingScheduleListApiResponse,
  role = getSessionRole(),
): WorkingScheduleListResponse {
  const visible = filterVisibleSchedules(raw.data ?? []);
  const scope = resolveScheduleWorkplaceScope(
    role,
    getSessionBranchId(),
    getSessionWarehouseId(),
  );
  const mapped = filterSchedulesToWorkplaceScope(
    visible.map(mapScheduleFromApi),
    scope,
  );
  const pagination = raw.pagination;
  const limit = pagination?.limit ?? mapped.length;
  const total = pagination?.total ?? mapped.length;
  const totalPages =
    pagination?.totalPages ??
    pagination?.totalPages ??
    Math.max(1, Math.ceil(total / (limit || 1)));

  return {
    data: mapped,
    total: pagination?.total ?? mapped.length,
    page: pagination?.page ?? 1,
    totalPages,
  };
}

function applyWorkplaceScope(
  schedule: WorkingSchedule,
  role = getSessionRole(),
): WorkingSchedule | null {
  const scope = resolveScheduleWorkplaceScope(
    role,
    getSessionBranchId(),
    getSessionWarehouseId(),
  );
  return filterScheduleToWorkplaceScope(schedule, scope);
}

function normalizeBulkUserId(
  userId: CreateWorkingSchedulePayload["userId"],
): string | string[] {
  return Array.isArray(userId) ? userId : userId;
}

export const shiftTemplateApi = {
  getList: async (params?: {
    page?: number;
    limit?: number;
    name?: string;
  }): Promise<ShiftTemplateListResponse> => {
    const response = await client.get<ShiftTemplateListResponse>(
      "/shift-templates",
      { params },
    );
    return response.data;
  },

  getById: async (id: string): Promise<ShiftTemplate> => {
    const response = await client.get<ShiftTemplate>(
      `/shift-templates/${id}`,
    );
    return response.data;
  },

  create: async (
    payload: UpdateShiftTemplatePayload,
  ): Promise<ShiftTemplate> => {
    const response = await client.post<{ data: ShiftTemplate }>(
      "/shift-templates",
      payload,
    );
    return response.data.data;
  },

  update: async (
    id: string,
    payload: UpdateShiftTemplatePayload,
  ): Promise<ShiftTemplate> => {
    const response = await client.patch<{ data: ShiftTemplate }>(
      `/shift-templates/${id}`,
      payload,
    );
    return response.data.data;
  },

  remove: async (id: string): Promise<void> => {
    await client.delete(`/shift-templates/${id}`);
  },
};

export const workingScheduleApi = {
  getList: async (
    params?: WorkingScheduleQueryParams,
    role = getSessionRole(),
  ): Promise<WorkingScheduleListResponse> => {
    const response = await client.get<WorkingScheduleListApiResponse>(
      resolveListPath(role),
      { params },
    );
    return mapListResponse(response.data, role);
  },

  getById: async (id: string): Promise<WorkingSchedule> => {
    const response = await client.get<ApiWorkingSchedule>(
      `/working-schedules/${id}`,
    );
    if (isDeletedScheduleStatus(response.data.status)) {
      throw new Error("Không tìm thấy lịch làm việc");
    }
    const scoped = applyWorkplaceScope(mapScheduleFromApi(response.data));
    if (!scoped) {
      throw new Error("Bạn không có quyền xem lịch làm việc này");
    }
    return scoped;
  },

  getUserDetail: async (
    scheduleId: string,
    userId: string,
  ): Promise<WorkingSchedule> => {
    // Ca của một người.
    const response = await client.get<ApiWorkingSchedule>(
      `/working-schedules/${scheduleId}/users/${userId}`,
    );

    const scoped = applyWorkplaceScope(mapScheduleFromApi(response.data));
    if (!scoped) {
      throw new Error("Bạn không có quyền xem lịch làm việc này");
    }
    return scoped;
  },

  getCurrent: async (): Promise<{
    schedule: WorkingSchedule | null;
    message?: string;
    serverTime?: string;
  }> => {
    const response = await client.get<CurrentWorkingScheduleResponse>(
      "/working-schedules/current",
    );
    const raw = response.data;
    const apiSchedule = raw?.data ?? null;
    return {
      schedule: apiSchedule ? mapScheduleFromApi(apiSchedule) : null,
      message: raw?.message,
      serverTime: raw?.serverTime,
    };
  },

  createBulk: async (
    schedules: CreateWorkingSchedulePayload[],
  ): Promise<WorkingSchedule[]> => {
    const response = await client.post<{ data: ApiWorkingSchedule[] }>(
      "/working-schedules/bulk",
      {
        schedules: schedules.map((schedule) => ({
          userId: normalizeBulkUserId(schedule.userId),
          shiftTemplateId: schedule.shiftTemplateId,
          workDate: schedule.workDate,
        })),
      },
    );
    return (response.data.data ?? []).map(mapScheduleFromApi);
  },

  create: async (
    payload: CreateWorkingSchedulePayload,
  ): Promise<WorkingSchedule[]> => {
    return workingScheduleApi.createBulk([payload]);
  },

  /** Thay toàn bộ người / ca / ngày của một ca (BE giữ liên kết lịch lặp nếu ca + ngày không đổi). */
  update: async (
    id: string,
    payload: CreateWorkingSchedulePayload,
  ): Promise<WorkingSchedule> => {
    const response = await client.patch<{ data: ApiWorkingSchedule }>(
      `/working-schedules/${id}`,
      {
        userId: normalizeBulkUserId(payload.userId),
        shiftTemplateId: payload.shiftTemplateId,
        workDate: payload.workDate,
      },
    );
    return mapScheduleFromApi(response.data.data);
  },

  remove: async (id: string): Promise<void> => {
    await client.delete(`/working-schedules/${id}`);
  },

  /** Lịch lặp lại: BE sinh sẵn từng ngày khớp thành ca. */
  createSeries: async (
    payload: CreateScheduleSeriesPayload,
  ): Promise<CreateScheduleSeriesResult> => {
    const response = await client.post<{ data: CreateScheduleSeriesResult }>(
      "/working-schedules/series",
      payload,
    );
    return response.data.data;
  },

  /** Dừng lịch lặp từ `fromDate` (YYYY-MM-DD); ca đã qua giữ nguyên. */
  removeSeries: async (
    seriesId: string,
    fromDate: string,
  ): Promise<{ removedCount: number }> => {
    const response = await client.delete<{ data: { removedCount: number } }>(
      `/working-schedules/series/${seriesId}`,
      { params: { fromDate } },
    );
    return response.data.data;
  },
};
