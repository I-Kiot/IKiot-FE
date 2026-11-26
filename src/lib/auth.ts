/** Helper xác thực: token và trạng thái đăng nhập. */

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
  /** Loại tài khoản, lấy từ `systemRole`. */
  role?: string;
  /** Quyền `resource:action` của tài khoản; rỗng với ADMIN và TENANT_OWNER (mọi quyền). */
  permissions?: string[];
  /** Tên loại tài khoản do backend trả, giữ cạnh `role` đã normalise. */
  systemRole?: string;
  /** Tên hiển thị của role do tenant định nghĩa, nếu tài khoản có role. */
  roleName?: string;
  /** Không dùng: `/auth/me` không trả tenant, lấy qua `getMyTenant()`. */
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
  /** Nơi làm việc của user, null với chủ shop và admin. */
  locationId?: string | null;
  location?: LocationRef | null;
  /** Chi nhánh / kho tách từ `location`. */
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
  /** Không dùng: lấy gói qua `getCurrentSubscription()`. */
}

/** Đã có access token chưa. */
export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  return !!token;
}

/** Lấy access token. */
export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

/** Lấy refresh token. */
export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

/** Lưu token. */
export function setTokens(tokens: AuthTokens): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(AUTH_TOKEN_KEY, tokens.accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
}

/** Xoá token. */
export function clearTokens(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

/** Đọc payload JWT (không verify). */
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

/** Lấy user đã cache. */
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

/** Cache user. */
export function setCachedUser(user: User): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("user", JSON.stringify(user));
}

/** Xoá user đã cache. */
export function clearCachedUser(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("user");
}
