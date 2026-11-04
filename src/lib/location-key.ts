import type { LocationType } from "@/types/location"

/**
 * Parse key switcher `"all" | "branch-{id}" | "warehouse-{id}"`.
 *
 * Key giữ tiền tố chữ thường vì được lưu trong localStorage (`activeLocationKey`); đổi sẽ làm mất mọi lựa chọn đã lưu. `locationType` là `BRANCH` / `WAREHOUSE` của API, dùng thẳng được trong request.
 */
export type ParsedLocationKey = {
  locationId: string
  locationType: LocationType
}

const KEY_PREFIX_TYPE: Record<string, LocationType> = {
  branch: "BRANCH",
  warehouse: "WAREHOUSE",
}

export function parseLocationKey(
  key: string | null | undefined,
): ParsedLocationKey | null {
  if (!key || key === "all") return null
  const [prefix, ...rest] = key.split("-")
  const id = rest.join("-")
  const locationType = KEY_PREFIX_TYPE[prefix]
  if (locationType && id) {
    return { locationId: id, locationType }
  }
  return null
}

/**
 * Cặp filter `{ branchId?, warehouseId? }` cho endpoint list. Đừng tự `split("-")`: UUID chứa dấu gạch,
 * cắt sai id làm màn hình hiện danh sách rỗng mà không báo lỗi.
 */
export function locationFilter(key: string | null | undefined): {
  branchId?: string
  warehouseId?: string
} {
  const parsed = parseLocationKey(key)
  if (!parsed) return {}
  return parsed.locationType === "BRANCH"
    ? { branchId: parsed.locationId }
    : { warehouseId: parsed.locationId }
}

/** Chỉ lấy branch, cho các endpoint không nhận filter kho. */
export function branchIdOf(key: string | null | undefined): string | undefined {
  const parsed = parseLocationKey(key)
  return parsed?.locationType === "BRANCH" ? parsed.locationId : undefined
}
