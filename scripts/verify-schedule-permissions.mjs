/**
 * Static permission matrix check for schedule module.
 * Run: node scripts/verify-schedule-permissions.mjs
 */

const roles = [
  "TENANT_OWNER",
  "BRANCH_MANAGER",
  "WAREHOUSE_MANAGER",
  "STAFF",
  "CUSTOMER",
];

const SCHEDULE_VIEW = new Set([
  "TENANT_OWNER",
  "BRANCH_MANAGER",
  "WAREHOUSE_MANAGER",
  "STAFF",
]);
const SCHEDULE_CREATE = new Set(["TENANT_OWNER", "BRANCH_MANAGER"]);
const SCHEDULE_DELETE = new Set(["TENANT_OWNER", "BRANCH_MANAGER"]);
const SCHEDULE_UPDATE = new Set(["TENANT_OWNER", "BRANCH_MANAGER"]);
const SCHEDULE_SHIFT_TEMPLATE = new Set(["TENANT_OWNER", "BRANCH_MANAGER"]);
const SCHEDULE_FILTER_STAFF = new Set([
  "TENANT_OWNER",
  "BRANCH_MANAGER",
  "WAREHOUSE_MANAGER",
]);

const expectations = {
  TENANT_OWNER: {
    canViewSchedule: true,
    canCreateSchedule: true,
    canDeleteSchedule: true,
    canUpdateSchedule: true,
    canManageShiftTemplates: true,
    canFilterScheduleByStaff: true,
    listScope: "all",
  },
  BRANCH_MANAGER: {
    canViewSchedule: true,
    canCreateSchedule: true,
    canDeleteSchedule: true,
    canUpdateSchedule: true,
    canManageShiftTemplates: true,
    canFilterScheduleByStaff: true,
    listScope: "branch",
  },
  WAREHOUSE_MANAGER: {
    canViewSchedule: true,
    canCreateSchedule: false,
    canDeleteSchedule: false,
    canUpdateSchedule: false,
    canManageShiftTemplates: false,
    canFilterScheduleByStaff: true,
    listScope: "warehouse",
  },
  STAFF: {
    canViewSchedule: true,
    canCreateSchedule: false,
    canDeleteSchedule: false,
    canUpdateSchedule: false,
    canManageShiftTemplates: false,
    canFilterScheduleByStaff: false,
    listScope: "own",
  },
  CUSTOMER: {
    canViewSchedule: false,
    canCreateSchedule: false,
    canDeleteSchedule: false,
    canUpdateSchedule: false,
    canManageShiftTemplates: false,
    canFilterScheduleByStaff: false,
    listScope: null,
  },
};

function getScheduleListScope(role) {
  switch (role) {
    case "TENANT_OWNER":
      return "all";
    case "BRANCH_MANAGER":
      return "branch";
    case "WAREHOUSE_MANAGER":
      return "warehouse";
    case "STAFF":
      return "own";
    default:
      return null;
  }
}

function isBranchManagerOwnScheduleAssignee(userRole, sessionUserId, assigneeUserId) {
  if (userRole !== "BRANCH_MANAGER") return false;
  if (!sessionUserId || !assigneeUserId) return false;
  return String(sessionUserId) === String(assigneeUserId);
}

function canDeleteScheduleAssignee(userRole, sessionUserId, assigneeUserId) {
  if (!SCHEDULE_DELETE.has(userRole)) return false;
  if (isBranchManagerOwnScheduleAssignee(userRole, sessionUserId, assigneeUserId)) {
    return false;
  }
  return true;
}

function canUpdateScheduleAssignee(userRole, sessionUserId, assigneeUserId) {
  if (!SCHEDULE_UPDATE.has(userRole)) return false;
  if (isBranchManagerOwnScheduleAssignee(userRole, sessionUserId, assigneeUserId)) {
    return false;
  }
  return true;
}

function evaluate(role) {
  return {
    canViewSchedule: SCHEDULE_VIEW.has(role),
    canCreateSchedule: SCHEDULE_CREATE.has(role),
    canDeleteSchedule: SCHEDULE_DELETE.has(role),
    canUpdateSchedule: SCHEDULE_UPDATE.has(role),
    canManageShiftTemplates: SCHEDULE_SHIFT_TEMPLATE.has(role),
    canFilterScheduleByStaff: SCHEDULE_FILTER_STAFF.has(role),
    listScope: getScheduleListScope(role),
  };
}

let failed = 0;

for (const role of roles) {
  const actual = evaluate(role);
  const expected = expectations[role];
  const mismatches = [];

  for (const key of Object.keys(expected)) {
    if (actual[key] !== expected[key]) {
      mismatches.push({ key, expected: expected[key], actual: actual[key] });
    }
  }

  if (mismatches.length > 0) {
    failed += 1;
    console.error(`FAIL ${role}:`, mismatches);
  } else {
    console.log(`OK   ${role}`);
  }
}

if (failed > 0) {
  process.exit(1);
}

const bmOwnDelete = canDeleteScheduleAssignee("BRANCH_MANAGER", "bm1", "bm1");
const bmStaffDelete = canDeleteScheduleAssignee("BRANCH_MANAGER", "bm1", "staff1");
const bmOwnUpdate = canUpdateScheduleAssignee("BRANCH_MANAGER", "bm1", "bm1");
const bmStaffUpdate = canUpdateScheduleAssignee("BRANCH_MANAGER", "bm1", "staff1");

if (bmOwnDelete || bmOwnUpdate) {
  failed += 1;
  console.error("FAIL BM cannot mutate own schedule assignee");
} else {
  console.log("OK   BM cannot mutate own schedule assignee");
}

if (!bmStaffDelete || !bmStaffUpdate) {
  failed += 1;
  console.error("FAIL BM can mutate staff schedule assignee");
} else {
  console.log("OK   BM can mutate staff schedule assignee");
}

if (failed > 0) {
  process.exit(1);
}

console.log("\nAll schedule permission checks passed.");
