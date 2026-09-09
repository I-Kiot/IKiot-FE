import client from "./client";
import {
  isDeletedStaff,
  mapStaffFromApi,
  unwrapStaffPayload,
  type ApiStaffUser,
} from "./staff-mapper";
import { parseIdentificationId } from "@/app/(protected)/staffs/shared/identification-format";
import {
  normalizeDateInput,
  parseTaxNumber,
} from "@/app/(protected)/staffs/shared/staff-date-validation";
import type {
  CreateStaffAccountPayload,
  CreateStaffPayload,
  Staff,
  StaffLeaveBalance,
  StaffListResponse,
  StaffQueryParams,
  StaffRoleOption,
  UpdateStaffPayload,
} from "@/types/staff";

interface StaffListApiResponse {
  success?: boolean;
  data: ApiStaffUser[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/** Response shape from POST/PATCH /staff/:staffId/leave-balance */
type LeaveBalanceApiResponse = {
  success?: boolean;
  message?: string;
  leaveBalance?: StaffLeaveBalance & { usedDays?: number };
};

export type StaffLeaveBalanceResult = {
  message?: string;
  leaveBalance: StaffLeaveBalance & { usedDays?: number };
};

function mapLeaveBalanceResult(
  payload: LeaveBalanceApiResponse | undefined,
): StaffLeaveBalanceResult {
  const leaveBalance = payload?.leaveBalance;
  const annual = Number(leaveBalance?.annualLeaveDays);
  const remaining = Number(leaveBalance?.remainingDays);
  if (!leaveBalance || !Number.isFinite(annual) || !Number.isFinite(remaining)) {
    throw new Error("Không nhận được leaveBalance từ máy chủ");
  }

  return {
    message: payload?.message,
    leaveBalance: {
      annualLeaveDays: annual,
      remainingDays: remaining,
      ...(leaveBalance.usedDays != null
        ? { usedDays: Number(leaveBalance.usedDays) }
        : {}),
    },
  };
}

function buildProfileBody(
  firstName?: string,
  lastName?: string,
  profile?: CreateStaffPayload["profile"],
) {
  const result: Record<string, string> = {};

  if (firstName !== undefined) result.firstName = firstName;
  if (lastName !== undefined) result.lastName = lastName;
  if (profile?.identificationId) {
    result.identificationId = parseIdentificationId(profile.identificationId);
  }
  if (profile?.address) result.address = profile.address;
  if (profile?.gender) result.gender = profile.gender;
  if (profile?.dob) result.dob = normalizeDateInput(profile.dob) ?? profile.dob;
  if (profile?.avatarUrl !== undefined) result.avatarUrl = profile.avatarUrl;
  if (profile?.taxNumber) result.taxNumber = parseTaxNumber(profile.taxNumber);

  return Object.keys(result).length > 0 ? result : undefined;
}

/**
 * The body of `POST /users` - hiring somebody, without a login.
 *
 * `newPassword`/`reEnterPassword` ride along on `CreateStaffPayload` but are deliberately
 * **not** in here: switching the login on is `POST /users/:id/account`, a second call the
 * provider makes right after this one.
 *
 * Two things this used to get wrong, both invisible because `whitelist: true` drops
 * unknown keys without complaining. `paySheetId` is `paysheetId` on the wire (lowercase
 * `s`), so nobody was ever hired onto a pay scheme. And `avatarUrl`/`taxNumber`/`dob` were
 * repeated flat beside `profile`, which `CreateUserDto` has never accepted at the top
 * level - the nested copy is the one that counts, so the flat trio is gone rather than
 * left there implying the server reads it.
 */
function buildCreateBody(payload: CreateStaffPayload) {
  const profile = buildProfileBody(
    payload.firstName,
    payload.lastName,
    payload.profile,
  );

  return {
    phoneNumber: payload.phoneNumber,
    email: payload.email,
    roleId: payload.roleId,
    ...(payload.branchId
      ? { branchId: payload.branchId }
      : payload.warehouseId
        ? { warehouseId: payload.warehouseId }
        : {}),
    hireDate: normalizeDateInput(payload.hireDate),
    firstName: payload.firstName,
    lastName: payload.lastName,
    profile,
    ...(payload.paySheetId ? { paysheetId: payload.paySheetId } : {}),
  };
}

/**
 * The body of `PATCH /users/:id`.
 *
 * Three things about it were wrong at once, and the first one hid the other two:
 *
 * 1. It used to `return { data }`. The server's global `ValidationPipe({ whitelist: true })`
 *    **drops unknown keys silently** rather than erroring, so the whole edit arrived as an
 *    empty object: HTTP 200, nothing saved, no complaint anywhere. Return the fields flat.
 * 2. `paySheetId` is `paysheetId` on the wire (lowercase `s`) - `UpdateUserDto` spells it
 *    that way, and the misspelt key was being whitelisted away with everything else.
 *    `null` still removes the assignment.
 * 3. **At most one posting may be sent.** `UserService.resolvePosting` throws 400 the
 *    moment `branchId` *and* `warehouseId` are both present - `undefined` is the only
 *    "leave it alone", and naming one already clears the other server-side. The edit
 *    dialog sends `warehouseId: null` alongside a real `branchId`, which would have been
 *    a 400 on the first edit after this function started sending anything at all.
 *
 * `roleId` is sent too. The old comment here said role changes went through the
 * branch/warehouse manager assignment instead - that stopped being true when appointing a
 * manager became `PATCH /branches/:id/manager` and the role became an ordinary field; the
 * dialog has been putting `roleId` in the payload since, and this dropped it on the floor.
 */
function buildUpdateBody(payload: UpdateStaffPayload) {
  const data: Record<string, unknown> = {};

  if (payload.email !== undefined) data.email = payload.email;
  if (payload.roleId !== undefined) data.roleId = payload.roleId;
  if (payload.hireDate !== undefined) {
    data.hireDate = normalizeDateInput(payload.hireDate) ?? payload.hireDate;
  }
  if (payload.accountNote !== undefined) {
    data.accountNote = payload.accountNote.trim();
  }
  if (payload.paySheetId !== undefined) {
    data.paysheetId = payload.paySheetId;
  }

  // Exactly one, never both. A form that clears the posting sends null for both, and the
  // server has no "unposted" state to move someone into - so that case sends neither.
  if (payload.branchId) {
    data.branchId = payload.branchId;
  } else if (payload.warehouseId) {
    data.warehouseId = payload.warehouseId;
  }

  const profile = buildProfileBody(
    payload.firstName,
    payload.lastName,
    payload.profile,
  );
  if (profile) data.profile = profile;

  return data;
}

/** One row of `GET /roles`. `_count.users` is how many accounts hold it. */
interface StaffRoleRow {
  id: string;
  name: string;
  description?: string | null;
}

export const staffApi = {
  getList: async (params?: StaffQueryParams): Promise<StaffListResponse> => {
    const response = await client.get<StaffListApiResponse>("/users", {
      params: {
        page: params?.page ?? 1,
        limit: params?.limit ?? 10,
        roleId: params?.roleId,
        status: params?.status,
        branchId: params?.branchId,
        warehouseId: params?.warehouseId,
        search: params?.search,
      },
    });

    const rawItems = response.data?.data ?? [];
    const items = rawItems.filter((user) => !isDeletedStaff(user));
    const pagination = response.data?.pagination;
    const limit = pagination?.limit ?? items.length;
    const rawTotal = pagination?.total ?? items.length;
    const deletedOnPage = rawItems.length - items.length;
    const total =
      !params?.status && deletedOnPage > 0
        ? Math.max(items.length, rawTotal - deletedOnPage)
        : rawTotal;
    const totalPages =
      pagination?.totalPages ??
      Math.max(1, Math.ceil(total / (limit || 1)));

    return {
      data: items.map(mapStaffFromApi),
      total,
      page: pagination?.page ?? 1,
      limit,
      totalPages,
    };
  },

  /** Paginate GET /staff - dùng cho dropdown phân ca (chỉ nhân viên ACTIVE). */
  getActiveForScheduleOptions: async (): Promise<Staff[]> => {
    const all = await staffApi.getAllForOptions();
    return all.filter((staff) => staff.status === "ACTIVE");
  },

  /** Paginate GET /staff to collect all staff records across pages. */
  getAllForOptions: async (): Promise<Staff[]> => {
    const merged: Staff[] = [];
    let page = 1;
    let totalPages = 1;
    const limit = 100;

    while (page <= totalPages && page <= 10) {
      const response = await staffApi.getList({ page, limit });
      merged.push(...response.data);
      totalPages = response.totalPages;
      page += 1;
    }

    return merged;
  },

  create: async (payload: CreateStaffPayload): Promise<Staff> => {
    const response = await client.post<unknown>("/users", buildCreateBody(payload));
    const user = unwrapStaffPayload(response.data);
    if (!user) throw new Error("Không nhận được dữ liệu nhân viên từ máy chủ");
    return mapStaffFromApi(user);
  },

  createAccount: async (
    id: string,
    payload: CreateStaffAccountPayload,
  ): Promise<void> => {
    await client.post(`/users/${id}/account`, payload);
  },

  update: async (id: string, payload: UpdateStaffPayload): Promise<void> => {
    await client.patch(`/users/${id}`, buildUpdateBody(payload));
  },

  updatePassword: async (
    id: string,
    payload: CreateStaffAccountPayload,
  ): Promise<void> => {
    await client.patch(`/users/${id}/account/password`, payload);
  },

  /** Takes no body: the rewrite dropped `replacementManagerId` (see staff-manager-utils). */
  deactivateAccount: async (id: string): Promise<void> => {
    await client.patch(`/users/${id}/account/deactivate`);
  },

  remove: async (id: string): Promise<void> => {
    await client.delete(`/users/${id}`);
  },

  /**
   * The roles this shop has defined.
   *
   * `GET /staff/roles` used to answer with the fixed three-value enum the old backend
   * shipped. Roles are tenant-owned rows now (`GET /roles`), so an empty list means the
   * owner has not created any yet - which is a real state, not a failure: `POST /users`
   * requires a `roleId`, so nobody can be hired until at least one role exists.
   */
  getRoles: async (): Promise<StaffRoleOption[]> => {
    const response = await client.get<{ data: StaffRoleRow[] }>("/roles");
    return (response.data?.data ?? []).map((role) => ({
      value: role.id,
      label: role.name,
    }));
  },

  /** POST /staff/:staffId/leave-balance - body: { annualLeaveDays } */
  createLeaveBalance: async (
    staffId: string,
    annualLeaveDays: number,
  ): Promise<StaffLeaveBalanceResult> => {
    const response = await client.post<LeaveBalanceApiResponse>(
      `/users/${staffId}/leave-balance`,
      { annualLeaveDays },
    );
    return mapLeaveBalanceResult(response.data);
  },

  /** PATCH /staff/:staffId/leave-balance - body: { annualLeaveDays } */
  updateAnnualLeaveDays: async (
    staffId: string,
    annualLeaveDays: number,
  ): Promise<StaffLeaveBalanceResult> => {
    const response = await client.patch<LeaveBalanceApiResponse>(
      `/users/${staffId}/leave-balance`,
      { annualLeaveDays },
    );
    return mapLeaveBalanceResult(response.data);
  },
};
