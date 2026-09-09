/**
 * Static permission matrix check for staff module.
 * Run: node scripts/verify-staff-permissions.mjs
 */

const roles = [
  "TENANT_OWNER",
  "BRANCH_MANAGER",
  "WAREHOUSE_MANAGER",
  "STAFF",
  "CUSTOMER",
];

const expectations = {
  TENANT_OWNER: {
    canViewStaff: true,
    canCreateStaff: true,
    canDeleteStaff: true,
    canFilterBranch: true,
    canFilterWarehouse: true,
    canAssignBranchManager: true,
    canAssignWarehouseOnStaffForm: true,
    hrStaffList: true,
    hrSchedule: true,
    hrLeave: true,
    hrPayroll: false,
    canDeactivateManager: true,
  },
  BRANCH_MANAGER: {
    canViewStaff: true,
    canCreateStaff: true,
    canDeleteStaff: true,
    canFilterBranch: false,
    canFilterWarehouse: false,
    canAssignBranchManager: true,
    canAssignWarehouseOnStaffForm: false,
    hrStaffList: true,
    hrSchedule: true,
    hrLeave: true,
    hrPayroll: false,
    canDeactivateManager: false,
  },
  WAREHOUSE_MANAGER: {
    canViewStaff: false,
    canCreateStaff: false,
    canDeleteStaff: false,
    canFilterBranch: false,
    canFilterWarehouse: false,
    canAssignBranchManager: false,
    canAssignWarehouseOnStaffForm: false,
    hrStaffList: false,
    hrSchedule: true,
    hrLeave: true,
    hrPayroll: false,
    canDeactivateManager: false,
  },
  STAFF: {
    canViewStaff: false,
    canCreateStaff: false,
    canDeleteStaff: false,
    canFilterBranch: false,
    canFilterWarehouse: false,
    canAssignBranchManager: false,
    canAssignWarehouseOnStaffForm: false,
    hrStaffList: false,
    hrSchedule: true,
    hrLeave: true,
    hrPayroll: false,
    canDeactivateManager: false,
  },
  CUSTOMER: {
    canViewStaff: false,
    canCreateStaff: false,
    canDeleteStaff: false,
    canFilterBranch: false,
    canFilterWarehouse: false,
    canAssignBranchManager: false,
    canAssignWarehouseOnStaffForm: false,
    hrStaffList: false,
    hrSchedule: false,
    hrLeave: false,
    hrPayroll: false,
    canDeactivateManager: false,
  },
};

const STAFF_WRITE = new Set(["TENANT_OWNER", "BRANCH_MANAGER"]);
const STAFF_DELETE = new Set(["TENANT_OWNER", "BRANCH_MANAGER"]);

const HR_NAV = {
  staffList: ["TENANT_OWNER", "BRANCH_MANAGER"],
  schedule: ["TENANT_OWNER", "BRANCH_MANAGER", "WAREHOUSE_MANAGER", "STAFF"],
  leaveRequests: [
    "TENANT_OWNER",
    "BRANCH_MANAGER",
    "WAREHOUSE_MANAGER",
    "STAFF",
  ],
  payroll: [],
};

function canAccessHr(item, role) {
  return HR_NAV[item].includes(role);
}

function evaluate(role) {
  return {
    canViewStaff: STAFF_WRITE.has(role),
    canCreateStaff: STAFF_WRITE.has(role),
    canDeleteStaff: STAFF_DELETE.has(role),
    canFilterBranch: role === "TENANT_OWNER",
    canFilterWarehouse: role === "TENANT_OWNER",
    canAssignBranchManager: role === "TENANT_OWNER" || role === "BRANCH_MANAGER",
    canAssignWarehouseOnStaffForm: role === "TENANT_OWNER",
    hrStaffList: canAccessHr("staffList", role),
    hrSchedule: canAccessHr("schedule", role),
    hrLeave: canAccessHr("leaveRequests", role),
    hrPayroll: canAccessHr("payroll", role),
    canDeactivateManager: role === "TENANT_OWNER",
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

console.log("\nAll role permission checks passed.");
