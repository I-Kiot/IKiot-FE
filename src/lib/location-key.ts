import type { LocationType } from "@/types/location"

/** Parse key địa điểm `"all" | "branch-{id}" | "warehouse-{id}"`. */
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

/** Đổi key địa điểm thành filter `{ branchId?, warehouseId? }`. */
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
