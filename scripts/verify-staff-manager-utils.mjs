/**
 * Manager replacement rules aligned with BE StaffHelperFunctions.
 * Run: node scripts/verify-staff-manager-utils.mjs
 */

function isActiveBranchManager(staff) {
  return staff.role === "BRANCH_MANAGER" && Boolean(staff.branchId);
}

function isActiveWarehouseManager(staff) {
  return staff.role === "WAREHOUSE_MANAGER" && Boolean(staff.warehouseId);
}

function requiresManagerReplacement(staff) {
  return isActiveBranchManager(staff) || isActiveWarehouseManager(staff);
}

function isManagerRole(role) {
  return role === "BRANCH_MANAGER" || role === "WAREHOUSE_MANAGER";
}

function canDeactivateStaffRow(userRole, staff, requesterBranchId) {
  if (!userRole) return false;
  if (isManagerRole(staff.role)) {
    return userRole === "TENANT_OWNER";
  }
  if (userRole === "TENANT_OWNER") return true;
  if (userRole === "BRANCH_MANAGER") {
    if (staff.role !== "STAFF" || !staff.branchId || !requesterBranchId) {
      return false;
    }
    return staff.branchId === requesterBranchId;
  }
  return false;
}

function canDeleteStaffRow(userRole, staff, requesterBranchId) {
  if (!userRole) return false;
  if (isManagerRole(staff.role)) {
    return userRole === "TENANT_OWNER";
  }
  if (userRole === "TENANT_OWNER") return true;
  if (userRole === "BRANCH_MANAGER") {
    if (staff.role !== "STAFF" || !staff.branchId || !requesterBranchId) {
      return false;
    }
    return staff.branchId === requesterBranchId;
  }
  return false;
}

const cases = [
  {
    label: "STAFF active - no replacement",
    staff: { role: "STAFF", status: "ACTIVE", branchId: "b1" },
    needsReplacement: false,
    bmCanDeactivate: true,
    toCanDeactivate: true,
  },
  {
    label: "BM active with branch - needs replacement",
    staff: { role: "BRANCH_MANAGER", status: "ACTIVE", branchId: "b1" },
    needsReplacement: true,
    bmCanDeactivate: false,
    toCanDeactivate: true,
  },
  {
    label: "WM active with warehouse - needs replacement",
    staff: {
      role: "WAREHOUSE_MANAGER",
      status: "ACTIVE",
      warehouseId: "w1",
    },
    needsReplacement: true,
    bmCanDeactivate: false,
    toCanDeactivate: true,
  },
  {
    label: "BM without branch - no replacement UI, only TO deactivates",
    staff: { role: "BRANCH_MANAGER", status: "ACTIVE", branchId: "" },
    needsReplacement: false,
    bmCanDeactivate: false,
    toCanDeactivate: true,
  },
];

const deleteCases = [
  {
    label: "BM can deactivate STAFF in same branch",
    staff: { role: "STAFF", status: "ACTIVE", branchId: "b1" },
    userRole: "BRANCH_MANAGER",
    requesterBranchId: "b1",
    canDeactivate: true,
  },
  {
    label: "BM cannot deactivate STAFF in other branch",
    staff: { role: "STAFF", status: "ACTIVE", branchId: "b2" },
    userRole: "BRANCH_MANAGER",
    requesterBranchId: "b1",
    canDeactivate: false,
  },
  {
    label: "BM can delete STAFF in same branch",
    staff: { role: "STAFF", status: "ACTIVE", branchId: "b1" },
    userRole: "BRANCH_MANAGER",
    requesterBranchId: "b1",
    canDelete: true,
  },
  {
    label: "BM cannot delete STAFF in other branch",
    staff: { role: "STAFF", status: "ACTIVE", branchId: "b2" },
    userRole: "BRANCH_MANAGER",
    requesterBranchId: "b1",
    canDelete: false,
  },
];

let failed = 0;

for (const testCase of cases) {
  const needs = requiresManagerReplacement(testCase.staff);
  const bm = canDeactivateStaffRow("BRANCH_MANAGER", testCase.staff, "b1");
  const to = canDeactivateStaffRow("TENANT_OWNER", testCase.staff);

  const mismatches = [];
  if (needs !== testCase.needsReplacement) {
    mismatches.push({
      field: "needsReplacement",
      expected: testCase.needsReplacement,
      actual: needs,
    });
  }
  if (bm !== testCase.bmCanDeactivate) {
    mismatches.push({
      field: "bmCanDeactivate",
      expected: testCase.bmCanDeactivate,
      actual: bm,
    });
  }
  if (to !== testCase.toCanDeactivate) {
    mismatches.push({
      field: "toCanDeactivate",
      expected: testCase.toCanDeactivate,
      actual: to,
    });
  }

  if (mismatches.length > 0) {
    failed += 1;
    console.error(`FAIL ${testCase.label}:`, mismatches);
  } else {
    console.log(`OK   ${testCase.label}`);
  }
}

for (const testCase of deleteCases) {
  const canDelete = canDeleteStaffRow(
    testCase.userRole,
    testCase.staff,
    testCase.requesterBranchId,
  );
  const canDeactivate =
    testCase.canDeactivate !== undefined
      ? canDeactivateStaffRow(
          testCase.userRole,
          testCase.staff,
          testCase.requesterBranchId,
        )
      : undefined;

  const mismatches = [];
  if (
    testCase.canDelete !== undefined &&
    canDelete !== testCase.canDelete
  ) {
    mismatches.push({
      field: "canDelete",
      expected: testCase.canDelete,
      actual: canDelete,
    });
  }
  if (
    canDeactivate !== undefined &&
    canDeactivate !== testCase.canDeactivate
  ) {
    mismatches.push({
      field: "canDeactivate",
      expected: testCase.canDeactivate,
      actual: canDeactivate,
    });
  }

  if (mismatches.length > 0) {
    failed += 1;
    console.error(`FAIL ${testCase.label}:`, mismatches);
  } else {
    console.log(`OK   ${testCase.label}`);
  }
}

if (failed > 0) {
  process.exit(1);
}

console.log("\nAll manager replacement checks passed.");
