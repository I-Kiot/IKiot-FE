import {
  extractVietnamTimeFromIso,
  resolveWorkDateText,
} from "@/app/(protected)/staffs/shared/vietnam-datetime";
import {
  formatShiftTimeRange,
  isDeletedScheduleStatus,
} from "@/app/(protected)/staffs/shared/schedule-utils";
import type {
  ApiScheduleUser,
  ApiWorkingSchedule,
  AttendanceDetail,
  AttendanceLocation,
  ScheduleAssignee,
  ShiftTemplate,
  ShiftTemplateOption,
  WorkingSchedule,
} from "@/types/working-schedule";

function resolveId(ref: { id: string } | string | undefined | null): string {
  if (!ref) return "";
  return typeof ref === "string" ? ref : ref.id;
}

function resolveStaffName(user: ApiScheduleUser): string {
  const { firstName, lastName } = user.profile ?? {};
  const name = `${lastName ?? ""} ${firstName ?? ""}`.trim();
  return name || user.phoneNumber || user.id;
}

function mapAttendanceLocation(value: unknown): AttendanceLocation | null {
  if (!value || typeof value !== "object") return null;
  const loc = value as Record<string, unknown>;
  return {
    latitude: typeof loc.latitude === "number" ? loc.latitude : undefined,
    longitude: typeof loc.longitude === "number" ? loc.longitude : undefined,
    accuracy: typeof loc.accuracy === "number" ? loc.accuracy : undefined,
    distance: typeof loc.distance === "number" ? loc.distance : undefined,
    verificationStatus:
      typeof loc.verificationStatus === "string"
        ? loc.verificationStatus
        : undefined,
  };
}

function mapAttendance(
  att: ApiScheduleUser["attendance"],
): AttendanceDetail {
  return {
    id: att?.id,
    status: att?.status ?? "NOT_CHECKED_IN",
    actualCheckinAt: att?.actualCheckinAt ?? null,
    actualCheckoutAt: att?.actualCheckoutAt ?? null,
    checkInLocation:
      att && "checkInLocation" in att
        ? mapAttendanceLocation(att.checkInLocation)
        : null,
    checkOutLocation:
      att && "checkOutLocation" in att
        ? mapAttendanceLocation(att.checkOutLocation)
        : null,
    workedMinutes:
      att && "workedMinutes" in att ? (att.workedMinutes ?? null) : null,
    overtimeMinute:
      att && "overtimeMinute" in att ? (att.overtimeMinute ?? null) : null,
    lateMinutes:
      att && "lateMinutes" in att ? (att.lateMinutes ?? null) : null,
  };
}

/**
 * Everyone rostered on a shift.
 *
 * The response key is **`assignedUsers`** - `WorkingSchedule` has a join table, so a shift
 * carries a list of people, not one `userId`. This read `raw.userId`, which the API has
 * never sent: every schedule came back with an empty assignee list, so the roster showed
 * blank names and `staffPhone: ""` on every row. The old Mongo model did have a `userId`
 * array, which is where the name came from.
 *
 * The string/single-object branches are kept because the same mapper runs over
 * `GET /working-schedules/:id/users/:userId`, which answers one `user` rather than a list.
 */
function normalizeApiUsers(
  assigned: ApiWorkingSchedule["assignedUsers"],
): ApiScheduleUser[] {
  if (!assigned) return [];

  if (Array.isArray(assigned)) {
    return assigned.map((entry) =>
      typeof entry === "string" ? { id: entry } : entry,
    );
  }

  if (typeof assigned === "string") {
    return [{ id: assigned }];
  }

  return [assigned];
}

function resolveWorkplaceId(
  ref?: string | { id?: string } | null,
): string | undefined {
  if (!ref) return undefined;
  if (typeof ref === "string") return ref;
  if (typeof ref === "object" && ref.id) return String(ref.id);
  return undefined;
}

function mapAssignee(user: ApiScheduleUser): ScheduleAssignee {
  const userId =
    typeof user.id === "string" ? user.id : String(user.id ?? "");

  return {
    userId,
    staffName: resolveStaffName(user),
    staffAvatarUrl: user.profile?.avatarUrl?.trim() || null,
    staffPhone: user.phoneNumber ?? "",
    role: user.role ?? "STAFF",
    branchId: resolveWorkplaceId(user.branchId),
    warehouseId: resolveWorkplaceId(user.warehouseId),
    attendance: mapAttendance(user.attendance),
  };
}

export function buildStaffLabel(assignees: ScheduleAssignee[]): string {
  if (assignees.length === 0) return "-";
  if (assignees.length === 1) return assignees[0].staffName;
  if (assignees.length === 2) {
    return `${assignees[0].staffName}, ${assignees[1].staffName}`;
  }
  return `${assignees.length} nhân viên`;
}

function resolveManagedBy(
  managedBy: ApiWorkingSchedule["managedBy"],
): { id?: string; name?: string } {
  if (!managedBy) return {};
  if (typeof managedBy === "string") {
    return { id: managedBy };
  }
  const name = managedBy.profile
    ? `${managedBy.profile.lastName ?? ""} ${managedBy.profile.firstName ?? ""}`.trim()
    : managedBy.phoneNumber;
  return { id: managedBy.id, name: name || undefined };
}

function resolveShiftTimes(
  raw: ApiWorkingSchedule,
  shiftTemplate: ShiftTemplate | null,
) {
  if (shiftTemplate?.startTime && shiftTemplate?.endTime) {
    return {
      startTime: shiftTemplate.startTime,
      endTime: shiftTemplate.endTime,
    };
  }

  if (raw.startAt && raw.endAt) {
    return {
      startTime: extractVietnamTimeFromIso(raw.startAt),
      endTime: extractVietnamTimeFromIso(raw.endAt),
    };
  }

  return {
    startTime: shiftTemplate?.startTime ?? "",
    endTime: shiftTemplate?.endTime ?? "",
  };
}

export function mapScheduleFromApi(raw: ApiWorkingSchedule): WorkingSchedule {
  const shiftTemplate =
    typeof raw.shiftTemplateId === "string" ? null : raw.shiftTemplateId;

  const assignees = normalizeApiUsers(raw.assignedUsers ?? raw.user).map(
    mapAssignee,
  );
  const firstAssignee = assignees[0];
  const managedBy = resolveManagedBy(raw.managedBy);
  const workDate = resolveWorkDateText(raw.workDate, raw.startAt);

  const { startTime, endTime } = resolveShiftTimes(raw, shiftTemplate);
  const scheduleType =
    raw.scheduleType === "OVERTIME" ? "OVERTIME" : "NORMAL";

  return {
    id: raw.id,
    tenantId: String(raw.tenantId),
    assignees,
    managedById: managedBy.id,
    managedByName: managedBy.name,
    staffName: buildStaffLabel(assignees),
    staffAvatarUrl: firstAssignee?.staffAvatarUrl,
    staffPhone: firstAssignee?.staffPhone ?? "",
    shiftTemplateId: resolveId(raw.shiftTemplateId),
    shiftName: shiftTemplate?.name ?? "-",
    startTime,
    endTime,
    workDate,
    scheduleType,
    dayInfo: raw.dayInfo
      ? {
          dayType: raw.dayInfo.dayType ?? "NORMAL",
          isSunday: Boolean(raw.dayInfo.isSunday),
          isHoliday: Boolean(raw.dayInfo.isHoliday),
          holidayName: raw.dayInfo.holidayName ?? null,
          holidayType: raw.dayInfo.holidayType ?? null,
        }
      : undefined,
    status: raw.status as WorkingSchedule["status"],
    attendance: firstAssignee?.attendance ?? mapAttendance(undefined),
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

export function scheduleMatchesUserFilter(
  schedule: WorkingSchedule,
  userId: string,
): boolean {
  if (userId === "all") return true;
  return schedule.assignees.some((assignee) => assignee.userId === userId);
}

export function mapShiftTemplatesToOptions(
  templates: ShiftTemplate[],
): ShiftTemplateOption[] {
  return templates.map((t) => ({
    value: t.id,
    label: `${t.name} (${formatShiftTimeRange(t.startTime, t.endTime)})`,
    startTime: t.startTime,
    endTime: t.endTime,
  }));
}

export function filterVisibleSchedules(
  items: ApiWorkingSchedule[],
): ApiWorkingSchedule[] {
  return items.filter((item) => !isDeletedScheduleStatus(item.status));
}

export type ScheduleWorkplaceScope =
  | { type: "branch"; branchId: string }
  | { type: "warehouse"; warehouseId: string };

/**
 * The workplace a roster response should be narrowed to, or `null` for "show everything".
 *
 * A **posting** decides this now. The old test also demanded the BRANCH_MANAGER /
 * WAREHOUSE_MANAGER role, which no account carries, so it always returned `null` and
 * `filterScheduleToWorkplaceScope` handed back every assignee on a mixed shift.
 */
export function resolveScheduleWorkplaceScope(
  _role?: string | null,
  branchId?: string | null,
  warehouseId?: string | null,
): ScheduleWorkplaceScope | null {
  if (branchId) return { type: "branch", branchId };
  if (warehouseId) return { type: "warehouse", warehouseId };
  return null;
}

/** BM/WM: chỉ giữ assignee thuộc workplace của session (BE có thể trả ca mixed). */
export function filterScheduleToWorkplaceScope(
  schedule: WorkingSchedule,
  scope: ScheduleWorkplaceScope | null | undefined,
): WorkingSchedule | null {
  if (!scope) return schedule;

  const assignees =
    scope.type === "branch"
      ? schedule.assignees.filter(
          (assignee) => assignee.branchId === scope.branchId,
        )
      : schedule.assignees.filter(
          (assignee) => assignee.warehouseId === scope.warehouseId,
        );

  if (assignees.length === 0) return null;

  const firstAssignee = assignees[0];
  return {
    ...schedule,
    assignees,
    staffName: buildStaffLabel(assignees),
    staffAvatarUrl: firstAssignee?.staffAvatarUrl,
    staffPhone: firstAssignee?.staffPhone ?? "",
    attendance: firstAssignee?.attendance ?? schedule.attendance,
  };
}

export function filterSchedulesToWorkplaceScope(
  schedules: WorkingSchedule[],
  scope: ScheduleWorkplaceScope | null | undefined,
): WorkingSchedule[] {
  if (!scope) return schedules;

  return schedules
    .map((schedule) => filterScheduleToWorkplaceScope(schedule, scope))
    .filter((schedule): schedule is WorkingSchedule => schedule !== null);
}
