"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  addMonths,
  endOfMonth,
  format,
  startOfMonth,
  subMonths,
} from "date-fns";
import { toast } from "sonner";
import {
  shiftTemplateApi,
  workingScheduleApi,
} from "@/lib/api/schedule";
import { holidayApi } from "@/lib/api/holiday";
import { leaveRequestApi } from "@/lib/api/leave-request";
import {
  mapShiftTemplatesToOptions,
  scheduleMatchesUserFilter,
} from "@/lib/api/schedule-mapper";
import { staffApi } from "@/lib/api/staff";
import { getSessionRole, getSessionUserId } from "@/lib/auth";
import {
  getApiErrorMessage,
} from "@/lib/api/staff-mapper";
import {
  canCreateSchedule,
  canManageShiftTemplates,
  canViewSchedule,
} from "@/app/(protected)/staffs/shared/schedule-permissions";
import { canCreatePersonalLeave } from "@/components/sidebar/constants/role-permissions";
import { buildHolidayNamesByDate } from "@/app/(protected)/staffs/shared/schedule-day-meta";
import type { Holiday } from "@/types/holiday";
import type { LeaveRequestPerDay } from "@/types/leave-request";
import type {
  CreateWorkingSchedulePayload,
  ScheduleCalendarFilters,
  ScheduleStatus,
  ShiftTemplate,
  ShiftTemplateOption,
  UpdateShiftTemplatePayload,
  WorkingSchedule,
} from "@/types/working-schedule";
import type { ScheduleStaffOption } from "./schedule-staff-picker";

const EMPTY_SCHEDULES: WorkingSchedule[] = [];
const EMPTY_STAFF_OPTIONS: ScheduleStaffOption[] = [];

type ScheduleDialogType = "add" | "edit" | "delete" | "shiftTemplate";

function getMonthRange(date: Date) {
  return {
    startDate: format(startOfMonth(date), "yyyy-MM-dd"),
    endDate: format(endOfMonth(date), "yyyy-MM-dd"),
  };
}

const DEFAULT_CALENDAR_MONTH = new Date();

const DEFAULT_FILTERS: ScheduleCalendarFilters = {
  userId: "all",
  status: "all",
  ...getMonthRange(DEFAULT_CALENDAR_MONTH),
};

function clearPanelSelection(
  setSelectedSchedule: React.Dispatch<
    React.SetStateAction<WorkingSchedule | null>
  >,
  setSelectedDayDate: React.Dispatch<React.SetStateAction<string | null>>,
  setSelectedAssigneeUserId?: React.Dispatch<
    React.SetStateAction<string | null>
  >,
) {
  setSelectedDayDate(null);
  setSelectedSchedule(null);
  setSelectedAssigneeUserId?.(null);
}

type ScheduleContextType = {
  schedules: WorkingSchedule[];
  /** YYYY-MM-DD → tên ngày lễ thật (từ /holidays, bổ sung dayInfo). */
  holidaysByDate: Map<string, string>;
  /** YYYY-MM-DD → đơn nghỉ phép cá nhân (GET /leave-requests/me/per-day). */
  leaveByDate: Map<string, LeaveRequestPerDay[]>;
  isInitialLoading: boolean;
  isFetching: boolean;
  filters: ScheduleCalendarFilters;
  open: ScheduleDialogType | null;
  setOpen: (value: ScheduleDialogType | null) => void;
  currentRow: WorkingSchedule | null;
  setCurrentRow: React.Dispatch<React.SetStateAction<WorkingSchedule | null>>;
  currentSchedule: WorkingSchedule | null;
  fetchScheduleById: (id: string) => Promise<WorkingSchedule | null>;
  fetchScheduleDetail: (
    scheduleId: string,
    userId?: string | null,
  ) => Promise<WorkingSchedule | null>;
  handleAdd: (payload: CreateWorkingSchedulePayload) => Promise<void>;
  handleEdit: (
    scheduleId: string,
    payload: CreateWorkingSchedulePayload,
  ) => Promise<void>;
  handleDelete: (id: string) => Promise<void>;
  handleCreateShiftTemplate: (
    payload: UpdateShiftTemplatePayload,
  ) => Promise<void>;
  handleUpdateShiftTemplate: (
    id: string,
    payload: UpdateShiftTemplatePayload,
  ) => Promise<void>;
  handleDeleteShiftTemplate: (id: string) => Promise<void>;
  shiftTemplates: ShiftTemplate[];
  shiftTemplateOptions: ShiftTemplateOption[];
  staffOptions: ScheduleStaffOption[];
  updateStatusFilter: (status: ScheduleStatus | "all") => void;
  updateUserFilter: (userId: string) => void;
  calendarMonth: Date;
  goToPreviousMonth: () => void;
  goToNextMonth: () => void;
  goToToday: () => void;
  goToMonth: (date: Date) => void;
  selectedSchedule: WorkingSchedule | null;
  setSelectedSchedule: React.Dispatch<
    React.SetStateAction<WorkingSchedule | null>
  >;
  selectedAssigneeUserId: string | null;
  setSelectedAssigneeUserId: React.Dispatch<React.SetStateAction<string | null>>;
  selectedDayDate: string | null;
  setSelectedDayDate: React.Dispatch<React.SetStateAction<string | null>>;
};

const ScheduleContext = React.createContext<ScheduleContextType | null>(null);

type ScheduleProviderProps = {
  children: React.ReactNode;
  enabled?: boolean;
};

export function ScheduleProvider({
  children,
  enabled = true,
}: ScheduleProviderProps) {
  const userRole = getSessionRole();
  const canFetch = enabled && canViewSchedule(userRole);
  const canLoadStaffOptions = canCreateSchedule(userRole);

  const [schedules, setSchedules] = useState<WorkingSchedule[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(canFetch);
  const [isFetching, setIsFetching] = useState(false);
  const [filters, setFilters] = useState<ScheduleCalendarFilters>(
    DEFAULT_FILTERS,
  );
  const [open, setOpen] = useState<ScheduleDialogType | null>(null);
  const [currentRow, setCurrentRow] = useState<WorkingSchedule | null>(null);
  const [shiftTemplates, setShiftTemplates] = useState<ShiftTemplate[]>([]);
  const [shiftTemplateOptions, setShiftTemplateOptions] = useState<
    ShiftTemplateOption[]
  >([]);
  const [staffOptions, setStaffOptions] =
    useState<ScheduleStaffOption[]>(EMPTY_STAFF_OPTIONS);  const [calendarMonth, setCalendarMonth] = useState(
    () => DEFAULT_CALENDAR_MONTH,
  );
  const [selectedSchedule, setSelectedSchedule] =
    useState<WorkingSchedule | null>(null);
  const [selectedAssigneeUserId, setSelectedAssigneeUserId] = useState<
    string | null
  >(null);
  const [selectedDayDate, setSelectedDayDate] = useState<string | null>(null);
  const [currentSchedule, setCurrentSchedule] =
    useState<WorkingSchedule | null>(null);
  const [monthHolidays, setMonthHolidays] = useState<Holiday[]>([]);
  const [myLeaveDays, setMyLeaveDays] = useState<LeaveRequestPerDay[]>([]);
  const holidayYear = calendarMonth.getFullYear();
  const sessionUserId = getSessionUserId();
  const canFetchPersonalLeave = canCreatePersonalLeave(userRole);

  // Có /holidays thì không scan lại schedules mỗi lần list ca đổi.
  const holidayScheduleFallback = monthHolidays.length > 0 ? EMPTY_SCHEDULES : schedules;
  const holidaysByDate = useMemo(
    () => buildHolidayNamesByDate(monthHolidays, holidayScheduleFallback),
    [monthHolidays, holidayScheduleFallback],
  );

  const leaveByDate = useMemo(() => {
    const map = new Map<string, LeaveRequestPerDay[]>();
    // Chỉ hiện nghỉ của chính mình; khi filter nhân viên khác thì ẩn.
    const showMine =
      filters.userId === "all" ||
      (!!sessionUserId && filters.userId === sessionUserId);
    if (!showMine) return map;

    for (const item of myLeaveDays) {
      if (item.status !== "APPROVED" && item.status !== "PENDING") continue;
      const key = item.date.slice(0, 10);
      if (!key) continue;
      const list = map.get(key);
      if (list) list.push(item);
      else map.set(key, [item]);
    }
    return map;
  }, [myLeaveDays, filters.userId, sessionUserId]);

  const visibleSchedules = useMemo(() => {
    return schedules.filter((schedule) => {
      if (
        filters.userId !== "all" &&
        !scheduleMatchesUserFilter(schedule, filters.userId)
      ) {
        return false;
      }
      if (filters.status !== "all" && schedule.status !== filters.status) {
        return false;
      }
      return true;
    });
  }, [schedules, filters.userId, filters.status]);

  const derivedStaffOptions = useMemo(() => {
    if (staffOptions.length > 0) return staffOptions;

    const map = new Map<string, ScheduleStaffOption>();
    schedules.forEach((schedule) => {
      schedule.assignees.forEach((assignee) => {
        map.set(assignee.userId, {
          value: assignee.userId,
          label: assignee.staffName,
          branchId: assignee.branchId || "",
          branchName: "-",
          phone: assignee.staffPhone || "",
        });
      });
    });

    return Array.from(map.values());
  }, [staffOptions, schedules]);

  const refreshShiftTemplates = useCallback(async () => {
    if (!canManageShiftTemplates(userRole)) {
      setShiftTemplates([]);
      setShiftTemplateOptions([]);
      return;
    }

    try {
      const res = await shiftTemplateApi.getList({ limit: 100 });
      const templates = res.data ?? [];
      setShiftTemplates(templates);
      setShiftTemplateOptions(mapShiftTemplatesToOptions(templates));
    } catch (error) {
      toast.error(getApiErrorMessage(error));
      setShiftTemplates([]);
      setShiftTemplateOptions([]);
    }
  }, [userRole]);

  const fetchSchedules = useCallback(async () => {
    if (!canFetch) {
      setIsInitialLoading(false);
      return;
    }

    setIsFetching(true);
    try {
      const baseParams = {
        limit: 100,
        userId: filters.userId === "all" ? undefined : filters.userId,
        status: filters.status === "all" ? undefined : filters.status,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
      };

      let page = 1;
      let allData: WorkingSchedule[] = [];
      let pages = 1;

      do {
        const response = await workingScheduleApi.getList(
          { ...baseParams, page },
          userRole,
        );
        allData = allData.concat(response.data);
        pages = response.totalPages;
        page += 1;
      } while (page <= pages);

      setSchedules(allData);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
      setSchedules([]);
    } finally {
      setIsFetching(false);
      setIsInitialLoading(false);
    }
  }, [
    canFetch,
    filters.endDate,
    filters.startDate,
    filters.status,
    filters.userId,
    userRole,
  ]);

  const fetchMyLeaveDays = useCallback(async () => {
    if (!canFetch || !canFetchPersonalLeave) {
      setMyLeaveDays([]);
      return;
    }

    try {
      const days = await leaveRequestApi.getMinePerDay({
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
      });
      setMyLeaveDays(days);
    } catch {
      // TO không có read_mine; role khác lỗi thì bỏ qua để lịch ca vẫn dùng được.
      setMyLeaveDays([]);
    }
  }, [
    canFetch,
    canFetchPersonalLeave,
    filters.endDate,
    filters.startDate,
  ]);

  const fetchScheduleById = useCallback(async (id: string) => {
    try {
      return await workingScheduleApi.getById(id);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
      return null;
    }
  }, []);

  const fetchScheduleDetail = useCallback(
    async (scheduleId: string, userId?: string | null) => {
      try {
        if (userId) {
          return await workingScheduleApi.getUserDetail(scheduleId, userId);
        }
        return await workingScheduleApi.getById(scheduleId);
      } catch (error) {
        toast.error(getApiErrorMessage(error));
        return null;
      }
    },
    [],
  );

  const fetchCurrentSchedule = useCallback(async () => {
    if (!canFetch) {
      setCurrentSchedule(null);
      return;
    }
    try {
      const res = await workingScheduleApi.getCurrent();
      setCurrentSchedule(res.schedule);
    } catch {
      setCurrentSchedule(null);
    }
  }, [canFetch]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  useEffect(() => {
    void fetchMyLeaveDays();
  }, [fetchMyLeaveDays]);

  useEffect(() => {
    if (!canFetch) {
      setMonthHolidays([]);
      return;
    }

    let cancelled = false;
    void holidayApi
      .getActiveByYear(holidayYear)
      .then((rows) => {
        if (!cancelled) setMonthHolidays(rows);
      })
      .catch(() => {
        // BM/WM có thể không có holidays:read - fallback dayInfo trên schedule.
        if (!cancelled) setMonthHolidays([]);
      });

    return () => {
      cancelled = true;
    };
  }, [canFetch, holidayYear]);

  useEffect(() => {
    void fetchCurrentSchedule();
  }, [fetchCurrentSchedule]);

  useEffect(() => {
    void refreshShiftTemplates();
  }, [refreshShiftTemplates]);

  useEffect(() => {
    if (!canLoadStaffOptions) {
      setStaffOptions([]);
      return;
    }

    void staffApi
      .getActiveForScheduleOptions()
      .then((activeStaff) => {
        setStaffOptions(
          activeStaff.map((s) => ({
            value: s.id,
            label: `${s.fullName} (${s.roleName})`,
            branchId: s.branchId || "",
            branchName: s.branchName || "-",
            phone: s.phoneNumber || "",
          })),
        );
      })
      .catch(() => {
        setStaffOptions(EMPTY_STAFF_OPTIONS);
      });
  }, [canLoadStaffOptions]);

  async function handleAdd(payload: CreateWorkingSchedulePayload) {
    try {
      await workingScheduleApi.create(payload);
      toast.success("Đã thêm lịch làm việc");
      await Promise.all([fetchSchedules(), fetchCurrentSchedule()]);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
      throw error;
    }
  }

  async function handleEdit(
    scheduleId: string,
    payload: CreateWorkingSchedulePayload,
  ) {
    try {
      await workingScheduleApi.remove(scheduleId);
      await workingScheduleApi.create(payload);
      toast.success("Đã cập nhật lịch làm việc");
      setSelectedSchedule((prev) => (prev?.id === scheduleId ? null : prev));
      setSelectedAssigneeUserId(null);
      setCurrentRow((prev) => (prev?.id === scheduleId ? null : prev));
      await Promise.all([fetchSchedules(), fetchCurrentSchedule()]);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
      throw error;
    }
  }

  async function handleDelete(id: string) {
    try {
      await workingScheduleApi.remove(id);
      toast.success("Đã xóa lịch làm việc");
      setSelectedSchedule((prev) => {
        if (prev?.id === id) {
          setSelectedAssigneeUserId(null);
        }
        return prev?.id === id ? null : prev;
      });
      setCurrentRow((prev) => (prev?.id === id ? null : prev));
      await Promise.all([fetchSchedules(), fetchCurrentSchedule()]);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
      throw error;
    }
  }

  async function handleCreateShiftTemplate(
    payload: UpdateShiftTemplatePayload,
  ) {
    try {
      await shiftTemplateApi.create(payload);
      toast.success("Đã tạo ca mẫu");
      await refreshShiftTemplates();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
      throw error;
    }
  }

  async function handleUpdateShiftTemplate(
    id: string,
    payload: UpdateShiftTemplatePayload,
  ) {
    try {
      await shiftTemplateApi.update(id, payload);
      toast.success("Đã cập nhật ca mẫu");
      await refreshShiftTemplates();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
      throw error;
    }
  }

  async function handleDeleteShiftTemplate(id: string) {
    try {
      await shiftTemplateApi.remove(id);
      toast.success("Đã xóa ca mẫu");
      await refreshShiftTemplates();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
      throw error;
    }
  }

  const updateStatusFilter = useCallback((status: ScheduleStatus | "all") => {
    clearPanelSelection(
      setSelectedSchedule,
      setSelectedDayDate,
      setSelectedAssigneeUserId,
    );
    setFilters((prev) => ({ ...prev, status }));
  }, []);

  const updateUserFilter = useCallback((userId: string) => {
    clearPanelSelection(
      setSelectedSchedule,
      setSelectedDayDate,
      setSelectedAssigneeUserId,
    );
    setFilters((prev) => ({ ...prev, userId }));
  }, []);

  const goToPreviousMonth = useCallback(() => {
    clearPanelSelection(
      setSelectedSchedule,
      setSelectedDayDate,
      setSelectedAssigneeUserId,
    );
    setCalendarMonth((prev) => {
      const next = subMonths(prev, 1);
      const range = getMonthRange(next);
      setFilters((current) => ({ ...current, ...range }));
      return next;
    });
  }, []);

  const goToNextMonth = useCallback(() => {
    clearPanelSelection(
      setSelectedSchedule,
      setSelectedDayDate,
      setSelectedAssigneeUserId,
    );
    setCalendarMonth((prev) => {
      const next = addMonths(prev, 1);
      const range = getMonthRange(next);
      setFilters((current) => ({ ...current, ...range }));
      return next;
    });
  }, []);

  const goToToday = useCallback(() => {
    clearPanelSelection(
      setSelectedSchedule,
      setSelectedDayDate,
      setSelectedAssigneeUserId,
    );
    const today = new Date();
    const range = getMonthRange(today);
    setCalendarMonth(today);
    setFilters((current) => ({ ...current, ...range }));
  }, []);

  const goToMonth = useCallback((date: Date) => {
    clearPanelSelection(
      setSelectedSchedule,
      setSelectedDayDate,
      setSelectedAssigneeUserId,
    );
    const monthDate = startOfMonth(date);
    const range = getMonthRange(monthDate);
    setCalendarMonth(monthDate);
    setFilters((current) => ({ ...current, ...range }));
  }, []);

  return (
    <ScheduleContext.Provider
      value={{
        schedules: visibleSchedules,
        holidaysByDate,
        leaveByDate,
        isInitialLoading,
        isFetching,
        filters,
        open,
        setOpen,
        currentRow,
        setCurrentRow,
        currentSchedule,
        fetchScheduleById,
        fetchScheduleDetail,
        handleAdd,
        handleEdit,
        handleDelete,
        handleCreateShiftTemplate,
        handleUpdateShiftTemplate,
        handleDeleteShiftTemplate,
        shiftTemplates,
        shiftTemplateOptions,
        staffOptions: derivedStaffOptions,
        updateStatusFilter,
        updateUserFilter,
        calendarMonth,
        goToPreviousMonth,
        goToNextMonth,
        goToToday,
        goToMonth,
        selectedSchedule,
        setSelectedSchedule,
        selectedAssigneeUserId,
        setSelectedAssigneeUserId,
        selectedDayDate,
        setSelectedDayDate,
      }}
    >
      {children}
    </ScheduleContext.Provider>
  );
}

export function useSchedule() {
  const ctx = React.useContext(ScheduleContext);
  if (!ctx)
    throw new Error("useSchedule must be used within <ScheduleProvider>");
  return ctx;
}
