/**
 * Helper xác thực: quản lý token và trạng thái đăng nhập.
 */

import axios from "axios";
import type { LocationRef } from "@/types/location";

const AUTH_TOKEN_KEY = "auth_token";
const REFRESH_TOKEN_KEY = "refresh_token";

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn?: number;
}

export interface User {
  id: string;
  /** Không bắt buộc ở backend; `phoneNumber` mới là định danh bắt buộc. */
  email?: string | null;
  full_name?: string;
  display_name?: string;
  avatar_url?: string;
  phone?: string;
  bio?: string;
  created_at?: string;
  updated_at?: string;
  /**
   * **Loại tài khoản** (`ADMIN | TENANT_OWNER | STAFF | CUSTOMER`), lấy từ `systemRole`.
   * `normalizeSessionUser` map lại vì backend dùng `role` cho relation Role.
   */
  role?: string;
  /**
   * Quyền `"resource:action"` tài khoản có, theo `GET /auth/me`. **Rỗng với ADMIN và TENANT_OWNER**:
   * nghĩa là không áp dụng, không phải không có quyền. Đọc qua `allows()` trong `role-permissions.ts`.
   */
  permissions?: string[];
  /** Tên loại tài khoản do backend trả, giữ cạnh `role` đã normalise. */
  systemRole?: string;
  /** Tên hiển thị của role do tenant định nghĩa, nếu tài khoản có role. */
  roleName?: string;
  /**
   * Cửa hàng của tài khoản. **Không bao giờ có giá trị**: `/auth/me` không trả tenant.
   * Lấy từ `getMyTenant()` (`lib/api/tenant.ts`).
   */
  tenant?: {
    id?: string;
    name?: string;
    phoneNumber?: string;
    mainAddress?: string;
    taxNumber?: string;
    hasSepayKey?: boolean;
    banking?: {
      accountNumber?: string;
      accountName?: string;
      bankName?: string;
    };
  };
  phoneNumber?: string;
  status?: string;
  tenantId?: string;
  /** Vị trí làm việc backend trả (`User.locationId` + relation `location`); null với owner và admin vì họ không gắn vị trí nào. */
  locationId?: string | null;
  location?: LocationRef | null;
  /** `location` tách theo loại, do `normalizeSessionUser` tính (backend không gửi), vì ~40 màn đọc qua hai tên này. */
  branchId?: string;
  warehouseId?: string;
  /** Nhân viên xưởng (2026-10-09): xưởng (NCC loại WORKSHOP) tài khoản này thuộc về; null với người khác. */
  workshopId?: string | null;
  workshop?: { id: string; supplierName: string } | null;
  profile?: {
    firstName?: string;
    lastName?: string;
    avatarUrl?: string;
    dob?: string;
    taxNumber?: string;
    identificationId?: string;
    address?: string;
    gender?: "MALE" | "FEMALE" | "OTHER";
  };
  /**
   * **Đã bỏ**: `/auth/me` không bao giờ trả field này. Gói hiện tại lấy từ `getCurrentSubscription()` (`lib/api/subscription.ts`).
   */
}

/**
 * Kiểm tra đã có access token trong localStorage.
 */
export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  return !!token;
}

/**
 * Lấy access token từ localStorage.
 */
export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

/**
 * Lấy refresh token từ localStorage.
 */
export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

/**
 * Lưu token vào localStorage.
 */
export function setTokens(tokens: AuthTokens): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(AUTH_TOKEN_KEY, tokens.accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
}

/**
 * Xoá token khỏi localStorage.
 */
export function clearTokens(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

/**
 * Decode JWT payload (không verify - chỉ đọc role/branch từ access token).
 */
export function getJwtPayload(): Record<string, unknown> | null {
  const token = getAccessToken();
  if (!token) return null;

  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** Ưu tiên role trong JWT (khớp BE authorize), fallback cache user. */
export function getSessionRole(): string | undefined {
  const fromJwt = getJwtPayload()?.role;
  if (typeof fromJwt === "string" && fromJwt) return fromJwt;
  return getCachedUser()?.role;
}

// Access token chỉ mang `sub`, nên posting lấy từ cached profile; xem `normalizeSessionUser`.
export function getSessionBranchId(): string | undefined {
  return getCachedUser()?.branchId;
}

export function getSessionWarehouseId(): string | undefined {
  return getCachedUser()?.warehouseId;
}

/** userId từ JWT (khớp assignee.userId trên lịch). */
export function getSessionUserId(): string | undefined {
  const fromJwt = getJwtPayload()?.userId;
  if (typeof fromJwt === "string" && fromJwt) return fromJwt;
  const cached = getCachedUser()?.id;
  return cached ? String(cached) : undefined;
}

export function mergeUserWithJwtPayload(user: User): User {
  const payload = getJwtPayload();
  if (!payload) return user;

  return {
    ...user,
    id: user.id || String(payload.userId ?? ""),
    role: (typeof payload.role === "string" ? payload.role : user.role) as
      | string
      | undefined,
    branchId:
      typeof payload.branchId === "string"
        ? payload.branchId
        : user.branchId,
    warehouseId:
      typeof payload.warehouseId === "string"
        ? payload.warehouseId
        : user.warehouseId,
  };
}

/**
 * Lấy user đã cache trong localStorage (nếu có).
 */
export function getCachedUser(): User | null {
  if (typeof window === "undefined") return null;
  const userStr = localStorage.getItem("user");
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

/**
 * Cache user vào localStorage.
 */
export function setCachedUser(user: User): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("user", JSON.stringify(user));
}

/**
 * Xoá user đã cache khỏi localStorage.
 */
export function clearCachedUser(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("user");
}
