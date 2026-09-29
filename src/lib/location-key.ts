import type { LocationType } from "@/types/location"

/**
 * Parse switcher key: "all" | "branch-{id}" | "warehouse-{id}".
 *
 * The key keeps its lowercase prefix - it is persisted in localStorage (`activeLocationKey`)
 * and changing it would strand every saved selection. The parsed `locationType` is the
 * API's own `BRANCH` / `WAREHOUSE`, so it can go straight into a request.
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
 * The `{ branchId?, warehouseId? }` pair the list endpoints filter by.
 *
 * Eight call sites had each written their own version of this, and six of them wrote it
 * as `const [type, id] = key.split("-")` - which **truncates the id at the UUID's first
 * hyphen**, leaving 8 of 36 characters. The request then filtered on a branch that does
 * not exist, so the screen showed an empty list rather than an error. Only the two that
 * spelled the parse out (`rest.join("-")`) were right, which is why this lives here now
 * and nowhere else.
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

/** Just the branch, for the endpoints that take no warehouse filter at all. */
export function branchIdOf(key: string | null | undefined): string | undefined {
  const parsed = parseLocationKey(key)
  return parsed?.locationType === "BRANCH" ? parsed.locationId : undefined
}
