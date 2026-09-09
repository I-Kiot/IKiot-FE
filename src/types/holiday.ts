export type HolidaySource = "GOOGLE_CALENDAR" | "MANUAL";

export interface Holiday {
  id: string;
  date: string;
  name: string;
  type: "PUBLIC_HOLIDAY";
  isActive: boolean;
  source: HolidaySource;
  isManuallyEdited?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface HolidayQueryParams {
  page?: number;
  limit?: number;
  year?: number;
  isActive?: boolean;
  source?: HolidaySource;
  name?: string;
}

export interface HolidayPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface HolidayListResponse {
  success?: boolean;
  data: Holiday[];
  pagination?: Partial<HolidayPagination>;
}

export interface CreateHolidayPayload {
  date: string;
  name: string;
  isActive?: boolean;
}

export type UpdateHolidayPayload = Partial<Pick<CreateHolidayPayload, "date" | "name">>;
