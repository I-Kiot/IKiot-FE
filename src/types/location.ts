/**
 * A location's type, spelled exactly as the backend and the database store it
 * (`Location.type`, held to these two values by a CHECK constraint). One spelling on
 * every side of the wire - nothing on this side translates it.
 */
export type LocationType = "BRANCH" | "WAREHOUSE";

/** The one shape a location takes in stock responses (`inventory.location`, `stockDetails[].location`, `fromLocation`/`toLocation`). */
export interface LocationRef {
  id: string;
  type: LocationType;
  name: string;
}
