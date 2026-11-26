export type ScheduleStatus = "SCHEDULED" | "COMPLETED" | "CANCELLED";

/** Lịch lặp lại một lượt phân công thuộc về (0 = CN … 6 = T7). */
export interface ScheduleSeriesRef {
  id: string;
  startDate: string;
  endDate: string;
  weekdays: number[];
  status: "ACTIVE" | "DELETED" | string;
}

export type ScheduleDayType =
  | "NORMAL"
  | "SUNDAY"
  | "HOLIDAY"
  | "SUNDAY_HOLIDAY";

export interface ScheduleDayInfo {
  dayType: ScheduleDayType | string;
  isSunday: boolean;
  isHoliday: boolean;
  holidayName?: string | null;
  holidayType?: string | null;
}

export interface ShiftTemplate {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  status?: string;
}

export interface ShiftTemplateOption {
  value: string;
  label: string;
  startTime: string;
  endTime: string;
}

export interface ApiScheduleUser {
  id: string;
  phoneNumber?: string;
  profile?: {
    firstName?: string;
    lastName?: string;
    avatarUrl?: string;
  };
  role?: string;
  branchId?: string | { id: string };
  warehouseId?: string | { id: string };
  series?: ScheduleSeriesRef | null;
}

/** Lịch làm việc thô từ BE. */
export interface ApiWorkingSchedule {
  id: string;
  tenantId: string;
  assignedUsers?: ApiScheduleUser[] | ApiScheduleUser | string | string[];
  user?: ApiScheduleUser;
  managedBy?:
    | string
    | {
        id: string;
        phoneNumber?: string;
        profile?: { firstName?: string; lastName?: string };
      };
  shiftTemplateId: ShiftTemplate | string;
  workDate: string;
  startAt: string;
  endAt: string;
  dayInfo?: ScheduleDayInfo;
  status: ScheduleStatus | "DELETED";
  createdAt: string;
  updatedAt: string;
}

export interface ScheduleAssignee {
  userId: string;
  staffName: string;
  staffAvatarUrl?: string | null;
  staffPhone: string;
  role: string;
  branchId?: string;
  warehouseId?: string;
  /** Khác null = lượt này sinh ra từ một lịch lặp lại. */
  series: ScheduleSeriesRef | null;
}

/** Một ca làm (có thể nhiều nhân viên). */
export interface WorkingSchedule {
  id: string;
  tenantId: string;
  assignees: ScheduleAssignee[];
  managedById?: string;
  managedByName?: string;
  /** Nhãn gộp cho calendar / list. */
  staffName: string;
  staffAvatarUrl?: string | null;
  staffPhone: string;
  shiftTemplateId: string;
  shiftName: string;
  startTime: string;
  endTime: string;
  workDate: string;
  dayInfo?: ScheduleDayInfo;
  status: ScheduleStatus;
  createdAt: string;
  updatedAt: string;
}

export interface WorkingScheduleQueryParams {
  page?: number;
  limit?: number;
  userId?: string;
  startDate?: string;
  endDate?: string;
  status?: ScheduleStatus;
}

export interface WorkingScheduleListApiResponse {
  data: ApiWorkingSchedule[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages?: number;
  };
}

export interface CreateWorkingSchedulePayload {
  userId: string | string[];
  shiftTemplateId: string;
  workDate: string;
}

export interface CreateScheduleSeriesPayload {
  userId: string[];
  shiftTemplateId: string;
  startDate: string;
  endDate: string;
  /** 0 = CN … 6 = T7; bỏ trống = mọi ngày. */
  weekdays?: number[];
}

export interface CreateScheduleSeriesResult {
  series: ScheduleSeriesRef & { shiftTemplateId: string; userIds: string[] };
  createdCount: number;
  skipped: { userId: string; workDate: string }[];
}

export interface UpdateShiftTemplatePayload {
  name: string;
  startTime: string;
  endTime: string;
}

export interface WorkingScheduleListResponse {
  data: WorkingSchedule[];
  total: number;
  page: number;
  totalPages: number;
}

export interface ScheduleCalendarFilters {
  userId: string;
  status: ScheduleStatus | "all";
  startDate: string;
  endDate: string;
}

export interface CurrentWorkingScheduleResponse {
  data: ApiWorkingSchedule | null;
  message?: string;
  serverTime?: string;
}
