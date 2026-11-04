export type ScheduleStatus = "SCHEDULED" | "COMPLETED" | "CANCELLED";

export type ScheduleType = "NORMAL" | "OVERTIME";

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
}

/**
 * Response thô từ BE. `assignedUsers` là danh sách nhân viên cùng ca (bảng nối nên không phải một `userId`); `user` là khoá của `GET /working-schedules/:id/users/:userId`, chỉ trả về một người.
 */
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
  scheduleType?: ScheduleType | string;
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
  scheduleType: ScheduleType;
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
  scheduleType?: ScheduleType;
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
  scheduleType?: ScheduleType;
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
