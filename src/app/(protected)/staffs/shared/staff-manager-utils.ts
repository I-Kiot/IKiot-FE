/**
 * What is left of the old role-hierarchy rules.
 *
 * The previous backend had three fixed roles and decided who could edit whom by comparing
 * them - BRANCH_MANAGER could act on STAFF at their own branch, and deleting a manager
 * required handing their location to somebody else in the same call
 * (`replacementManagerId`). None of that exists any more:
 *
 *  - roles are rows a shop owner defines, so "is this person a manager" is not something a
 *    role name can answer;
 *  - who may edit staff is a single permission (`users:update` / `users:delete`), not a
 *    comparison between two roles;
 *  - running a location is `Branch.managerId` / `Warehouse.managerId`, appointed through
 *    `PATCH /branches/:id/manager`. The delete and deactivate routes take **no body** now,
 *    so a `replacementManagerId` sent from here is silently dropped. The backend refuses
 *    the delete instead and says to reassign the location first - which is the message the
 *    dialogs surface.
 *
 * Only the caller-side check survives, and only in the form the backend still enforces.
 */

/**
 * Whether this account may deactivate or delete somebody else's staff record.
 *
 * It takes only the caller: the old version also weighed the *target's* role, and there is
 * no longer a role hierarchy to weigh.
 */
export function canManageStaffRow(userRole: string | undefined | null): boolean {
  if (!userRole) return false;
  // The backend re-checks this; the button is hidden so the refusal isn't a surprise.
  return userRole === "TENANT_OWNER" || userRole === "ADMIN";
}

export const canDeactivateStaffRow = canManageStaffRow;
export const canDeleteStaffRow = canManageStaffRow;
