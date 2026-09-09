export type MovementType = "IMPORT" | "EXPORT" | "RETURN" | "ADJUST";

export type MovementStatus =
  | "DRAFT"
  | "OPENING"
  | "CLOSED"
  | "PENDING"
  | "IN_TRANSIT"
  | "RECEIVED"
  | "CANCELLED"
  | "COMPLETED";

export type LocationType = "branch" | "warehouse";

export interface StockMovementDetail {
  productItemId: string;
  productName: string;
  sku: string;
  quantity: number;
  importPrice: number;
  receivedQuantity: number;
  note?: string;
}

export interface StockMovement {
  id: string;
  tenantId: string;
  movementType: MovementType;
  status: MovementStatus;
  fromSupplierId?: string;
  supplierName?: string;
  fromLocationId?: string;
  fromLocationName?: string;
  fromLocationType?: LocationType;
  toLocationId: string;
  toLocationName: string;
  toLocationType: LocationType;
  requestedBy: string;
  requestedByName: string;
  note?: string;
  details: StockMovementDetail[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateImportPayload {
  movementType: "IMPORT";
  fromSupplierId: string;
  toLocationId: string;
  toLocationType: LocationType;
  /** FE gắn = toLocation để WM ship/cancel (BE auth fromLocation). */
  fromLocationId?: string;
  fromLocationType?: LocationType;
  note?: string;
  details: {
    productItemId: string;
    quantity: number;
    importPrice: number;
    note?: string;
  }[];
}

export interface CreateExportPayload {
  movementType: "EXPORT" | "RETURN";
  fromLocationId: string;
  fromLocationType: LocationType;
  toLocationId: string;
  toLocationType: LocationType;
  note?: string;
  details: {
    productItemId: string;
    quantity: number;
    importPrice?: number;
    note?: string;
  }[];
}

export interface CreateAdjustPayload {
  movementType: "ADJUST";
  /** Kho/chi nhánh cần điều chỉnh tồn kho */
  fromLocationId: string;
  fromLocationType: LocationType;
  /** BE schema yêu cầu toLocationId – truyền cùng giá trị fromLocationId */
  toLocationId: string;
  toLocationType: LocationType;
  note?: string;
  details: {
    productItemId: string;
    /** Tồn thực tế sau kiểm kê - BE tự snapshot quantity hệ thống */
    receivedQuantity: number;
    note?: string;
  }[];
}

export interface ReceiveRequestPayload {
  details: {
    productItemId: string;
    receivedQuantity: number;
  }[];
}

export interface UpdateDetailsPayload {
  details: {
    productItemId: string;
    quantity?: number;
    receivedQuantity?: number;
    importPrice?: number;
    note?: string;
  }[];
}

export interface StockMovementListResponse {
  data: StockMovement[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface StockMovementQueryParams {
  page?: number;
  limit?: number;
  status?: MovementStatus;
  movementType?: MovementType;
}

export interface StockMovementSupplierOption {
  id: string;
  name: string;
}

export interface StockMovementLocationOption {
  id: string;
  name: string;
  type: LocationType;
}

export interface StockMovementProductItemOption {
  id: string;
  name: string;
  sku: string;
  /** Product parent id - dùng để tải suppliers khi cần */
  productId?: string;
  costPrice?: number;
  retailPrice?: number;
  /** Thumbnail URL (item hoặc product) */
  imageUrl?: string;
  /** Thuộc tính biến thể (Màu, dung lượng, …) */
  productDetails?: Array<{ name: string; value: string }>;
  /** Id NCC đã gắn với biến thể (ProductItem.suppliers) */
  supplierIds?: string[];
  /** Có bản ghi tồn kho tại location đang chọn */
  atLocation?: boolean;
  /** Tồn tại location nguồn (chuyển kho) */
  stock?: number;
}
