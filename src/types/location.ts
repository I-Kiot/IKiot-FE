/** Loại địa điểm. */
export type LocationType = "BRANCH" | "WAREHOUSE";

/** Địa điểm trong response tồn kho. */
export interface LocationRef {
  id: string;
  type: LocationType;
  name: string;
}
