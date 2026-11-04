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
 * Body của `POST /users` (thuê người, chưa có tài khoản đăng nhập).
 *
 * `newPassword`/`reEnterPassword` có trong `CreateStaffPayload` nhưng cố tình không gửi ở đây: bật đăng nhập là `POST /users/:id/account`, một lệnh riêng ngay sau đó.
 * `avatarUrl`/`taxNumber`/`dob` chỉ nằm trong `profile`: `CreateUserDto` không nhận chúng ở cấp trên cùng, `whitelist: true` bỏ im lặng.
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
    ...(payload.workshopId ? { workshopId: payload.workshopId } : {}),
    hireDate: normalizeDateInput(payload.hireDate),
    firstName: payload.firstName,
    lastName: payload.lastName,
    profile,
  };
}

/**
 * Body của `PATCH /users/:id`. Hai lưu ý:
 *
 * 1. Phải trả các trường phẳng, không `{ data }`: `ValidationPipe({ whitelist: true })` bỏ im lặng key lạ, nên lần sửa thành object rỗng mà vẫn 200.
 * 2. **Tối đa một nơi làm việc.** `UserService.resolvePosting` trả 400 nếu có cả `branchId` và `warehouseId`; `undefined` là "giữ nguyên", đặt một cái đã xoá cái kia phía server.
 *
 * `roleId` cũng được gửi; trước đây hàm này bỏ rơi nó dù form đã gửi.
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
  // Khác nơi làm việc: `null` là trạng thái thật (bỏ gắn xưởng), BE nhận `workshopId: null`.
  if (payload.workshopId !== undefined) data.workshopId = payload.workshopId;

  // Chỉ gửi đúng một trong hai, không bao giờ cả hai. Form bỏ gắn gửi null cho cả hai, server không có trạng thái "chưa gắn" nên trường hợp đó không gửi gì.
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

/** Một dòng của `GET /roles`. `_count.users` là số tài khoản đang giữ vai trò. */
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

  /** Phân trang GET /staff để lấy hết nhân viên qua mọi trang. */
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

  /** Không có body: bản viết lại đã bỏ `replacementManagerId` (xem staff-manager-utils). */
  deactivateAccount: async (id: string): Promise<void> => {
    await client.patch(`/users/${id}/account/deactivate`);
  },

  remove: async (id: string): Promise<void> => {
    await client.delete(`/users/${id}`);
  },

  /**
   * Các vai trò shop đã định nghĩa (`GET /roles`). Danh sách rỗng là trạng thái thật, không phải lỗi:
   * `POST /users` cần `roleId` nên chưa ai được thuê khi chưa có vai trò nào.
   */
  getRoles: async (): Promise<StaffRoleOption[]> => {
    const response = await client.get<{ data: StaffRoleRow[] }>("/roles");
    return (response.data?.data ?? []).map((role) => ({
      value: role.id,
      label: role.name,
    }));
  },
};
