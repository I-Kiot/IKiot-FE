/**
 * Schedule mapper / calendar expansion / workplace scope checks.
 * Run: node scripts/verify-schedule-mapper.mjs
 */

function buildStaffLabel(assignees) {
  if (assignees.length === 0) return "-";
  if (assignees.length === 1) return assignees[0].staffName;
  if (assignees.length === 2) {
    return `${assignees[0].staffName}, ${assignees[1].staffName}`;
  }
  return `${assignees.length} nhân viên`;
}

function filterScheduleToWorkplaceScope(schedule, scope) {
  if (!scope) return schedule;

  const assignees =
    scope.type === "branch"
      ? schedule.assignees.filter((a) => a.branchId === scope.branchId)
      : schedule.assignees.filter((a) => a.warehouseId === scope.warehouseId);

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

function filterScheduleToAssignee(schedule, userId) {
  const assignee = schedule.assignees.find((a) => a.userId === userId);
  if (!assignee) return schedule;
  return {
    ...schedule,
    assignees: [assignee],
    staffName: assignee.staffName,
  };
}

function expandSchedulesForCalendar(schedules, filterUserId = "all") {
  const entries = [];
  for (const schedule of schedules) {
    for (const assignee of schedule.assignees) {
      if (filterUserId !== "all" && assignee.userId !== filterUserId) {
        continue;
      }
      entries.push({
        chipKey: `${schedule._id}-${assignee.userId}`,
        displayName: assignee.staffName,
      });
    }
  }
  return entries;
}

const multiSchedule = {
  _id: "s1",
  assignees: [
    { userId: "u1", staffName: "An", branchId: "br-a" },
    { userId: "u2", staffName: "Bình", branchId: "br-b" },
  ],
  staffName: "An, Bình",
  attendance: {},
};

let failed = 0;

const filtered = filterScheduleToAssignee(multiSchedule, "u1");
if (filtered.assignees.length !== 1 || filtered.staffName !== "An") {
  failed += 1;
  console.error("FAIL filterScheduleToAssignee");
} else {
  console.log("OK   filterScheduleToAssignee");
}

const allChips = expandSchedulesForCalendar([multiSchedule]);
if (allChips.length !== 2) {
  failed += 1;
  console.error("FAIL expand all assignees", allChips.length);
} else {
  console.log("OK   expand all assignees");
}

const oneChip = expandSchedulesForCalendar([multiSchedule], "u2");
if (oneChip.length !== 1 || oneChip[0].displayName !== "Bình") {
  failed += 1;
  console.error("FAIL expand filtered assignee");
} else {
  console.log("OK   expand filtered assignee");
}

const scopedA = filterScheduleToWorkplaceScope(multiSchedule, {
  type: "branch",
  branchId: "br-a",
});
if (
  !scopedA ||
  scopedA.assignees.length !== 1 ||
  scopedA.assignees[0].userId !== "u1"
) {
  failed += 1;
  console.error("FAIL branch scope keeps only same-branch assignees");
} else {
  console.log("OK   branch scope keeps only same-branch assignees");
}

const scopedB = filterScheduleToWorkplaceScope(multiSchedule, {
  type: "branch",
  branchId: "br-c",
});
if (scopedB !== null) {
  failed += 1;
  console.error("FAIL branch scope drops schedule with no local assignees");
} else {
  console.log("OK   branch scope drops schedule with no local assignees");
}

const bmChips = expandSchedulesForCalendar(
  [filterScheduleToWorkplaceScope(multiSchedule, { type: "branch", branchId: "br-a" })].filter(Boolean),
);
if (bmChips.length !== 1 || bmChips[0].displayName !== "An") {
  failed += 1;
  console.error("FAIL BM calendar only shows branch staff");
} else {
  console.log("OK   BM calendar only shows branch staff");
}

function toHolidayDateKey(dateValue) {
  if (!dateValue) return "";
  return dateValue.slice(0, 10);
}

function buildHolidayNamesByDate(holidays, schedules = []) {
  const map = new Map();
  for (const holiday of holidays) {
    if (holiday.isActive === false) continue;
    const key = toHolidayDateKey(holiday.date);
    const name = holiday.name?.trim();
    if (key && name) map.set(key, name);
  }
  if (map.size > 0 || schedules.length === 0) return map;
  for (const schedule of schedules) {
    const name = schedule.dayInfo?.holidayName?.trim();
    if (!schedule.dayInfo?.isHoliday || !name) continue;
    const key = toHolidayDateKey(schedule.workDate);
    if (key && !map.has(key)) map.set(key, name);
  }
  return map;
}

const holidayMap = buildHolidayNamesByDate(
  [{ date: "2026-09-02T00:00:00.000Z", name: "Quốc khánh", isActive: true }],
  [
    {
      workDate: "2026-09-02",
      dayInfo: { isHoliday: true, holidayName: "Tên cũ" },
    },
  ],
);
if (holidayMap.get("2026-09-02") !== "Quốc khánh") {
  failed += 1;
  console.error("FAIL holiday map prefers /holidays name");
} else {
  console.log("OK   holiday map prefers /holidays name");
}

const holidayFallback = buildHolidayNamesByDate([], [
  {
    workDate: "2026-04-18",
    dayInfo: { isHoliday: true, holidayName: "Giỗ Tổ Hùng Vương" },
  },
]);
if (holidayFallback.get("2026-04-18") !== "Giỗ Tổ Hùng Vương") {
  failed += 1;
  console.error("FAIL holiday map falls back to dayInfo");
} else {
  console.log("OK   holiday map falls back to dayInfo");
}

if (failed > 0) {
  process.exit(1);
}

console.log("\nSchedule mapper checks passed.");
