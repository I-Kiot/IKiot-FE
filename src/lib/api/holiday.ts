import client from "@/lib/api/client";
import type {
  CreateHolidayPayload,
  Holiday,
  HolidayListResponse,
  HolidayQueryParams,
  UpdateHolidayPayload,
} from "@/types/holiday";

function unwrapHoliday(response: { data: unknown }): Holiday {
  const body = response.data as { data?: Holiday };
  return body.data ?? (response.data as Holiday);
}

function toListQuery(params?: HolidayQueryParams) {
  const query: Record<string, string | number | undefined> = {
    page: params?.page,
    limit: params?.limit,
    year: params?.year,
    source: params?.source,
    name: params?.name,
  };
  if (params?.isActive !== undefined) {
    query.isActive = params.isActive ? "true" : "false";
  }
  return query;
}

export const holidayApi = {
  getList: async (params?: HolidayQueryParams): Promise<HolidayListResponse> => {
    const response = await client.get<HolidayListResponse>("/holidays", {
      params: toListQuery(params),
    });
    return response.data;
  },

  /** ACTIVE holidays trong năm (VN < 30 ngày → 1 request). */
  getActiveByYear: async (year: number): Promise<Holiday[]> => {
    const response = await holidayApi.getList({
      year,
      isActive: true,
      page: 1,
      limit: 100,
    });
    return response.data ?? [];
  },

  create: async (payload: CreateHolidayPayload): Promise<Holiday> => {
    const response = await client.post("/holidays", {
      date: payload.date,
      name: payload.name,
      ...(payload.isActive !== undefined ? { isActive: payload.isActive } : {}),
    });
    return unwrapHoliday(response);
  },

  update: async (
    holidayId: string,
    payload: UpdateHolidayPayload,
  ): Promise<Holiday> => {
    const body: UpdateHolidayPayload = {};
    if (payload.date !== undefined) body.date = payload.date;
    if (payload.name !== undefined) body.name = payload.name;
    const response = await client.patch(`/holidays/${holidayId}`, body);
    return unwrapHoliday(response);
  },

  updateStatus: async (
    holidayId: string,
    isActive: boolean,
  ): Promise<Holiday> => {
    const response = await client.patch(`/holidays/${holidayId}/status`, {
      isActive,
    });
    return unwrapHoliday(response);
  },

  syncVietnam: async (year: number): Promise<void> => {
    await client.post("/holidays/sync/vietnam", { year: Number(year) });
  },
};
