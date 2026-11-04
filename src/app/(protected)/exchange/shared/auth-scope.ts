import { getCachedUser } from "@/lib/auth";
import { parseLocationKey } from "@/lib/location-key";
import { useAuthStore } from "@/store/auth-store";
import type {
  LocationType,
  StockMovementLocationOption,
} from "@/types/stock-movement";

export interface AuthScope {
  userId?: string;
  tenantId?: string;
  role?: string;
  branchId?: string;
  warehouseId?: string;
}

/** JWT scope + tenant switcher (locationKey) → location hiệu lực cho exchange. */
export interface EffectiveLocationScope extends AuthScope {
  /** Location đang khóa (JWT BM/WM hoặc tenant đã switch BR/WH). */
  locationId?: string;
  locationType?: LocationType;
  /** true khi TENANT_OWNER bị khóa bởi switcher, không phải JWT BM/WM. */
  lockedBySwitcher: boolean;
}

/** Lọc location theo effective scope (JWT BM/WM hoặc tenant switch BR/WH). */
export function filterLocationsByAuthScope(
  locations: StockMovementLocationOption[],
  scope: AuthScope & {
    locationId?: string;
    locationType?: LocationType;
  },
): StockMovementLocationOption[] {
  if (
    scope.locationId &&
    (scope.locationType === "WAREHOUSE" || scope.locationType === "BRANCH")
  ) {
    return locations.filter(
      (l) => l.id === scope.locationId && l.type === scope.locationType,
    );
  }
  // Chính warehouseId / branchId là thứ thu hẹp danh sách. Điều kiện cũ còn đòi role WAREHOUSE_MANAGER /
  // BRANCH_MANAGER mà không tài khoản nào còn mang, nên rơi xuống nhánh cuối và hiện mọi nơi trong shop cho tất cả.
  const { warehouseId, branchId } = scope;
  if (warehouseId) return locations.filter((l) => l.id === warehouseId);
  if (branchId) return locations.filter((l) => l.id === branchId);
  return locations;
}

/**
 * Người gọi là ai và làm ở đâu - đọc từ dòng `/auth/me` đã cache.
 *
 * Trước đây lấy từ access token. Backend viết lại chỉ ký `{ sub }` (xem `jwt.strategy.ts`) nên
 * `branchId` / `warehouseId` / `role` đều `undefined`, và mọi scope dựa trên chúng âm thầm nới thành "không giới hạn".
 * `/auth/me` trả đủ ba trường, `AuthGuard` làm mới khi mount nên cache luôn hiện tại.
 */
export function getAuthScope(): AuthScope {
  const cached = getCachedUser();
  const asString = (value: unknown) =>
    typeof value === "string" && value.trim() ? value : undefined;

  return {
    userId: asString(cached?.id),
    tenantId: asString(cached?.tenantId),
    role: cached?.role,
    branchId: asString(cached?.branchId),
    warehouseId: asString(cached?.warehouseId),
  };
}

/**
 * Scope location hiệu lực: BM/WM theo JWT; TENANT_OWNER theo locationKey
 * (giống productApi.getList gắn locationId/locationType).
 */
export function getEffectiveLocationScope(
  locationKey?: string,
): EffectiveLocationScope {
  const auth = getAuthScope();
  const key =
    locationKey ??
    (typeof window !== "undefined"
      ? useAuthStore.getState().locationKey
      : "all");

  if (auth.warehouseId) {
    return {
      ...auth,
      locationId: auth.warehouseId,
      locationType: "WAREHOUSE",
      lockedBySwitcher: false,
    };
  }
  if (auth.branchId) {
    return {
      ...auth,
      locationId: auth.branchId,
      locationType: "BRANCH",
      lockedBySwitcher: false,
    };
  }
  if (auth.role === "TENANT_OWNER") {
    const parsed = parseLocationKey(key);
    if (parsed) {
      return {
        ...auth,
        branchId:
          parsed.locationType === "BRANCH" ? parsed.locationId : undefined,
        warehouseId:
          parsed.locationType === "WAREHOUSE" ? parsed.locationId : undefined,
        locationId: parsed.locationId,
        locationType: parsed.locationType,
        lockedBySwitcher: true,
      };
    }
  }
  return { ...auth, lockedBySwitcher: false };
}
