import { getCachedUser } from "@/lib/auth";
import { parseLocationKey } from "@/lib/location-key";
import { useAuthStore } from "@/store/auth-store";
import type { StockMovementLocationOption } from "@/types/stock-movement";

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
  locationType?: "branch" | "warehouse";
  /** true khi TENANT_OWNER bị khóa bởi switcher, không phải JWT BM/WM. */
  lockedBySwitcher: boolean;
}

/** Lọc location theo effective scope (JWT BM/WM hoặc tenant switch BR/WH). */
export function filterLocationsByAuthScope(
  locations: StockMovementLocationOption[],
  scope: AuthScope & {
    locationId?: string;
    locationType?: "branch" | "warehouse";
  },
): StockMovementLocationOption[] {
  if (
    scope.locationId &&
    (scope.locationType === "warehouse" || scope.locationType === "branch")
  ) {
    return locations.filter(
      (l) => l.id === scope.locationId && l.type === scope.locationType,
    );
  }
  // A posting is what narrows the list now. The old test also asked for the
  // WAREHOUSE_MANAGER / BRANCH_MANAGER role, which no account carries any more - so this
  // fell through and offered every location in the shop to everyone.
  const { warehouseId, branchId } = scope;
  if (warehouseId) return locations.filter((l) => l.id === warehouseId);
  if (branchId) return locations.filter((l) => l.id === branchId);
  return locations;
}

/**
 * Who the caller is and where they work - read from the cached `/auth/me` row.
 *
 * It used to come out of the access token. The rewritten backend signs **only** `{ sub }`
 * (see `jwt.strategy.ts`), so `branchId`/`warehouseId`/`role` were all `undefined` and
 * every scope built on them silently widened to "no restriction". `/auth/me` returns all
 * three, and `AuthGuard` refreshes it on mount, so the cached user is both available and
 * current.
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
      locationType: "warehouse",
      lockedBySwitcher: false,
    };
  }
  if (auth.branchId) {
    return {
      ...auth,
      locationId: auth.branchId,
      locationType: "branch",
      lockedBySwitcher: false,
    };
  }
  if (auth.role === "TENANT_OWNER") {
    const parsed = parseLocationKey(key);
    if (parsed) {
      return {
        ...auth,
        branchId:
          parsed.locationType === "branch" ? parsed.locationId : undefined,
        warehouseId:
          parsed.locationType === "warehouse" ? parsed.locationId : undefined,
        locationId: parsed.locationId,
        locationType: parsed.locationType,
        lockedBySwitcher: true,
      };
    }
  }
  return { ...auth, lockedBySwitcher: false };
}
