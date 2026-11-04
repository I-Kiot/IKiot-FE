/** Loại địa điểm, viết đúng như BE và DB lưu (`Location.type`, CHECK constraint giữ hai giá trị này). Hai phía dùng cùng cách viết, FE không dịch. */
export type LocationType = "BRANCH" | "WAREHOUSE";

/** Dạng địa điểm trong phản hồi tồn kho (`inventory.location`, `stockDetails[].location`, `fromLocation`/`toLocation`). */
export interface LocationRef {
  id: string;
  type: LocationType;
  name: string;
}
