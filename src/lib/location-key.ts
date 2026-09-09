/** Parse switcher key: "all" | "branch-{id}" | "warehouse-{id}". */
export type ParsedLocationKey = {
  locationId: string
  locationType: "branch" | "warehouse"
}

export function parseLocationKey(
  key: string | null | undefined,
): ParsedLocationKey | null {
  if (!key || key === "all") return null
  const [type, ...rest] = key.split("-")
  const id = rest.join("-")
  if ((type === "branch" || type === "warehouse") && id) {
    return { locationId: id, locationType: type }
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
  return parsed.locationType === "branch"
    ? { branchId: parsed.locationId }
    : { warehouseId: parsed.locationId }
}

/** Just the branch, for the endpoints that take no warehouse filter at all. */
export function branchIdOf(key: string | null | undefined): string | undefined {
  const parsed = parseLocationKey(key)
  return parsed?.locationType === "branch" ? parsed.locationId : undefined
}
