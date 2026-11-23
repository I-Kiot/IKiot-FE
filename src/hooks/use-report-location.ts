"use client"

// [Hook – nơi xem báo cáo trên URL] Mọi trang báo cáo / thống kê chọn nơi xem ngay trên trang: `?place=all | branch-<id> | warehouse-<id>`
// (cùng dạng khoá với bộ chọn địa điểm trên header). Không có thì lấy theo địa điểm đang chọn trên header.
// Chỉ chủ shop được chọn; nhân viên luôn bị ghim ở chi nhánh/kho được gán như header (backend cũng tự giới hạn phạm vi).
// Trang dùng hook này phải bọc Suspense vì đọc `useSearchParams`.

import { useCallback, useEffect, useMemo, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { branchApi } from "@/lib/api/branch"
import { warehouseApi } from "@/lib/api/warehouse"
import { getSessionRole } from "@/lib/auth"
import { locationFilter, parseLocationKey } from "@/lib/location-key"
import { useAuthStore } from "@/store/auth-store"

export interface ReportLocationOption {
  /** Khoá `branch-<id>` / `warehouse-<id>`. */
  key: string
  id: string
  name: string
  type: "BRANCH" | "WAREHOUSE"
  inactive: boolean
}

export const ALL_LOCATIONS = "all"

/** Chọn được mọi nơi: chủ shop và admin (danh sách quyền rỗng = mọi quyền). Nhân viên bị ghim như bộ chọn trên header. */
function canChooseLocation(role: string | undefined): boolean {
  return role === "TENANT_OWNER" || role === "ADMIN"
}

type Option = ReportLocationOption

const branchOption = (b: { id: string; name: string; status?: string }): Option => ({
  key: `branch-${b.id}`,
  id: b.id,
  name: b.name,
  type: "BRANCH",
  inactive: b.status === "INACTIVE",
})
const warehouseOption = (w: { id: string; name: string; status?: string }): Option => ({
  key: `warehouse-${w.id}`,
  id: w.id,
  name: w.name,
  type: "WAREHOUSE",
  inactive: w.status === "INACTIVE",
})

/**
 * Chi nhánh / kho cho dropdown, tải một lần cho mỗi trang. Người chọn được thì lấy cả danh sách của shop;
 * nhân viên chỉ lấy đúng nơi được gán (như bộ chọn trên header) để hiện tên.
 */
function useLocationOptions(canChoose: boolean, pinnedKey: string): { branches: Option[]; warehouses: Option[] } {
  const [lists, setLists] = useState<{ branches: Option[]; warehouses: Option[] }>({ branches: [], warehouses: [] })

  useEffect(() => {
    let cancelled = false
    const pinned = parseLocationKey(pinnedKey)
    const request: Promise<{ branches: Option[]; warehouses: Option[] }> = canChoose
      ? Promise.all([
          branchApi.getList({ limit: 100 }).catch(() => ({ data: [] })),
          warehouseApi.getList({ limit: 100 }).catch(() => ({ data: [] })),
        ]).then(([branches, warehouses]) => ({
          branches: (branches.data ?? []).map(branchOption),
          warehouses: (warehouses.data ?? []).map(warehouseOption),
        }))
      : pinned?.locationType === "BRANCH"
        ? branchApi
            .getById(pinned.locationId)
            .then((b) => ({ branches: [branchOption(b)], warehouses: [] }))
            .catch(() => ({ branches: [], warehouses: [] }))
        : pinned?.locationType === "WAREHOUSE"
          ? warehouseApi
              .getById(pinned.locationId)
              .then((w) => ({ branches: [], warehouses: [warehouseOption(w)] }))
              .catch(() => ({ branches: [], warehouses: [] }))
          : Promise.resolve({ branches: [], warehouses: [] })
    request.then((result) => {
      if (!cancelled) setLists(result)
    })
    return () => {
      cancelled = true
    }
  }, [canChoose, pinnedKey])

  return lists
}

export function useReportLocation() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const headerKey = useAuthStore((state) => state.locationKey)
  const canChoose = canChooseLocation(getSessionRole())
  const { branches, warehouses } = useLocationOptions(canChoose, headerKey)

  const requested = searchParams.get("place")
  // Khoá trên URL chỉ có hiệu lực với người được chọn và đúng dạng khoá; nhân viên luôn theo header.
  const locationKey =
    canChoose && requested && (requested === ALL_LOCATIONS || parseLocationKey(requested)) ? requested : headerKey || ALL_LOCATIONS

  const setLocationKey = useCallback(
    (key: string) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set("place", key)
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [pathname, router, searchParams],
  )

  const { branchId, warehouseId } = locationFilter(locationKey)
  const selected = useMemo(
    () => [...branches, ...warehouses].find((option) => option.key === locationKey) ?? null,
    [branches, warehouses, locationKey],
  )
  const parsed = parseLocationKey(locationKey)
  const locationName =
    locationKey === ALL_LOCATIONS
      ? "Toàn cửa hàng"
      : (selected?.name ?? (parsed?.locationType === "WAREHOUSE" ? "Kho" : "Chi nhánh"))

  return {
    /** `all` | `branch-<id>` | `warehouse-<id>`. */
    locationKey,
    setLocationKey,
    canChoose,
    branchId,
    warehouseId,
    /** Id của nơi đang xem (chi nhánh hoặc kho; id dùng chung), cho các báo cáo bán hàng. */
    place: branchId ?? warehouseId,
    isAll: locationKey === ALL_LOCATIONS,
    isWarehouse: Boolean(warehouseId),
    locationName,
    branches,
    warehouses,
  }
}

export type ReportLocation = ReturnType<typeof useReportLocation>
