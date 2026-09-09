import { getApiErrorBody, messageForCode } from "@/lib/api/error-codes";
import type {
  Staff,
  StaffGender,
  StaffLeaveBalance,
  StaffProfile,
  StaffStatus,
} from "@/types/staff";

export interface ApiBranchRef {
  id: string;
  name?: string;
  address?: string;
}

export interface ApiStaffUser {
  id?: string;
  tenantId?: string;
  email?: string;
  phoneNumber: string;
  roleId?: string | null;
  role?: { id: string; name: string } | null;
  status: string;
  branchId?: string | ApiBranchRef | null;
  warehouseId?: string | { id: string; name?: string } | null;
  branch?: string | ApiBranchRef | null;
  warehouse?: string | { id: string; name?: string } | null;
  profile?: StaffProfile & {
    firstName?: string;
    lastName?: string;
  };
  hireDate?: string;
  accountNote?: string;
  /**
   * `paysheetId` with a lowercase `s` - that is how the column, `UpdateUserDto` and the
   * response all spell it. This interface said `paySheetId`, so every staff row read the
   * pay scheme as `undefined` and the column rendered empty. `paysheet` carries the name
   * beside it, which is what the list actually displays.
   */
  paysheetId?: string | null;
  paysheet?: { id?: string; name?: string } | null;
  leaveBalance?: {
    annualLeaveDays?: number;
    remainingDays?: number;
  };
  createdAt: string;
  updatedAt: string;
}

const GENDER_LABELS: Record<StaffGender, string> = {
  MALE: "Nam",
  FEMALE: "Nữ",
  OTHER: "Khác",
};

/**
 * A role's display name.
 *
 * There used to be a fixed table of three here, because the old backend had exactly three
 * roles. Roles are rows the shop owner creates now, so the name comes with the data and
 * the only thing left to decide is what to show when a staff member has no role yet.
 */
export function getStaffRoleLabel(roleName?: string | null): string {
  return roleName?.trim() || "Chưa phân quyền";
}

export function getStaffGenderLabel(gender?: StaffGender): string {
  if (!gender) return "-";
  return GENDER_LABELS[gender] ?? gender;
}

function resolveRefId(
  ref?: string | { id: string } | null,
): string {
  if (!ref) return "";
  return typeof ref === "string" ? ref : ref.id;
}

function resolveRefName(
  ref?: string | ApiBranchRef | null,
): string {
  if (!ref) return "-";
  if (typeof ref === "string") return ref;
  return ref.name ?? ref.id;
}

function mapStatus(status: string): StaffStatus {
  if (status === "ACTIVE") return "ACTIVE";
  if (status === "SUSPENDED") return "SUSPENDED";
  return "INACTIVE";
}

function mapProfile(profile?: ApiStaffUser["profile"]): StaffProfile | undefined {
  if (!profile) return undefined;

  const mapped: StaffProfile = {};
  if (profile.identificationId) mapped.identificationId = profile.identificationId;
  if (profile.address) mapped.address = profile.address;
  if (profile.gender) mapped.gender = profile.gender;
  if (profile.dob) mapped.dob = profile.dob;
  if (profile.avatarUrl) mapped.avatarUrl = profile.avatarUrl;
  if (profile.taxNumber) mapped.taxNumber = profile.taxNumber;

  return Object.keys(mapped).length > 0 ? mapped : undefined;
}

function mapLeaveBalance(
  balance?: ApiStaffUser["leaveBalance"],
): StaffLeaveBalance | undefined {
  if (!balance) return undefined;
  const annual = Number(balance.annualLeaveDays);
  const remaining = Number(balance.remainingDays);
  if (!Number.isFinite(annual) || !Number.isFinite(remaining)) return undefined;
  return { annualLeaveDays: annual, remainingDays: remaining };
}

function resolvePaySheetId(
  ref?: string | { id?: string; name?: string } | null,
): string | null | undefined {
  if (ref === null) return null;
  if (ref === undefined) return undefined;
  if (typeof ref === "string") return ref || null;
  return ref.id ?? null;
}

function resolvePaySheetName(
  ref?: string | { id?: string; name?: string } | null,
): string | undefined {
  if (!ref || typeof ref === "string") return undefined;
  return ref.name?.trim() || undefined;
}

export function isDeletedStaff(user: ApiStaffUser): boolean {
  return user.status === "DELETED";
}

/** Unwrap create (raw user) hoặc { staff } / { data } từ các action khác. */
export function unwrapStaffPayload(payload: unknown): ApiStaffUser | null {
  if (!payload || typeof payload !== "object") return null;
  const body = payload as Record<string, unknown>;

  if (body.staff && typeof body.staff === "object") {
    return body.staff as ApiStaffUser;
  }
  if (body.data && typeof body.data === "object" && !Array.isArray(body.data)) {
    return body.data as ApiStaffUser;
  }
  if (
    typeof body.phoneNumber === "string" ||
    typeof body.id === "string" ||
    typeof body.id === "string"
  ) {
    return body as unknown as ApiStaffUser;
  }
  return null;
}

export function mapStaffFromApi(user: ApiStaffUser): Staff {
  const firstName = user.profile?.firstName ?? "";
  const lastName = user.profile?.lastName ?? "";
  const branchRef = user.branchId ?? user.branch;
  const warehouseRef = user.warehouseId ?? user.warehouse;
  const id = user.id ?? "";

  return {
    id: String(id),
    tenantId: String(user.tenantId ?? ""),
    branchId: resolveRefId(branchRef),
    branchName: resolveRefName(branchRef),
    warehouseId: resolveRefId(warehouseRef) || undefined,
    warehouseName: warehouseRef ? resolveRefName(warehouseRef) : undefined,
    firstName,
    lastName,
    fullName: `${lastName} ${firstName}`.trim() || user.phoneNumber,
    phoneNumber: user.phoneNumber,
    email: user.email,
    roleId: user.role?.id ?? user.roleId ?? null,
    roleName: getStaffRoleLabel(user.role?.name),
    status: mapStatus(user.status),
    joinedAt: user.hireDate ?? user.createdAt,
    paySheetId: resolvePaySheetId(user.paysheetId),
    paySheetName: resolvePaySheetName(user.paysheet),
    profile: mapProfile(user.profile),
    accountNote: user.accountNote,
    leaveBalance: mapLeaveBalance(user.leaveBalance),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export function getApiFieldErrors(
  error: unknown,
): Record<string, string> | undefined {
  if (typeof error !== "object" || error === null || !("response" in error)) {
    return undefined;
  }

  const data = (error as { response?: { data?: Record<string, unknown> } })
    .response?.data;
  const errors = data?.errors;

  if (!errors || typeof errors !== "object" || Array.isArray(errors)) {
    return undefined;
  }

  const mapped: Record<string, string> = {};
  for (const [key, value] of Object.entries(errors)) {
    if (typeof value === "string") {
      mapped[key] = value;
    } else if (Array.isArray(value) && typeof value[0] === "string") {
      mapped[key] = value[0];
    }
  }

  return Object.keys(mapped).length > 0 ? mapped : undefined;
}

export function getApiErrorMessage(error: unknown): string {
  // `code` trước tiên: nó không đổi khi backend sửa câu chữ hoặc dịch sang tiếng Anh.
  // Phần dưới là đường lùi cho backend cũ, vốn chỉ trả `message`.
  const mapped = messageForCode(getApiErrorBody(error)?.code);
  if (mapped) return mapped;

  if (typeof error === "object" && error !== null && "response" in error) {
    const data = (error as { response?: { data?: Record<string, unknown> } })
      .response?.data;

    if (typeof data?.error === "string") return data.error;
    if (typeof data?.message === "string") {
      if (data.message === "Invalid or expired token.") {
        return "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
      }
      if (data.message === "Staff account is not active") {
        return "Tài khoản chưa được kích hoạt hoặc chưa có mật khẩu. Vui lòng dùng «Kích hoạt tài khoản» trước.";
      }
      if (
        data.message.includes("password") &&
        data.message.includes("required")
      ) {
        return "Nhân viên chưa có tài khoản đăng nhập. Vui lòng «Kích hoạt tài khoản» trước khi đổi quản lý hoặc thay thế quản lý.";
      }
      if (data.message.includes("phân công quản lý")) {
        return data.message;
      }
      return data.message;
    }

    const status = (error as { response?: { status?: number } }).response?.status;
    if (status === 403) {
      return "Bạn không có quyền thực hiện thao tác này.";
    }
  }
  if (error instanceof Error) return error.message;
  return "Đã xảy ra lỗi";
}
