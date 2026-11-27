import type { HistoryPage, HistoryPerson } from './history'
import type { LocationRef, LocationType } from "./location";

export type { LocationRef, LocationType } from "./location";

export type ProductStatus = "ACTIVE" | "INACTIVE" | "DISCONTINUED";

export interface ProductImage {
  id?: string;
  url: string;
  isThumbnail: boolean;
}

export interface ProductDetail {
  id?: string;
  /** Thuộc tính của sản phẩm mà giá trị này thuộc về (null = dòng ghi tự do). */
  attributeId?: string | null;
  name: string;
  value: string;
}

/** Thuộc tính định nghĩa ở sản phẩm (2026-10-16); mỗi SKU giữ giá trị trong `productDetails`. */
export interface ProductAttribute {
  id?: string;
  name: string;
  /** Đơn vị của giá trị (cm, kg...). */
  unit?: string | null;
  position?: number;
}

/** Loại SKU. */
export type ProductItemType = "PRODUCT" | "COMBO" | "SERVICE";

/** Loại sản phẩm, cố định lúc tạo. */
export type ProductType = "PRODUCT" | "COMBO" | "SERVICE";

/** Một thành phần của combo. */
export interface ComboComponent {
  quantity: number;
  componentItem: {
    id: string;
    productId: string;
    sku: string;
    productName: string;
    itemType: ProductItemType;
    retailPrice: number;
    costPrice: number;
    /** Ảnh của phiên bản, không có thì ảnh hàng hoá; null = chưa có ảnh nào. */
    thumbnailUrl: string | null;
    /** Tồn của thành phần tại địa điểm đang xem (combo lồng: số bộ). Dịch vụ luôn 0. */
    stock?: number;
    /** Số bán được ngay = tồn trên kệ. Combo lồng: số bộ combo con còn bán được. */
    availableStock?: number;
    /** Tồn toàn chuỗi (cùng nghĩa với `availableStock` nhưng qua mọi chi nhánh/kho). */
    stockAllLocations?: number;
  };
}

/** Thành phần gửi lên khi tạo / sửa combo - luôn là toàn bộ danh sách. */
export interface ComboComponentPayload {
  componentItemId: string;
  quantity: number;
}

export interface StockDetail {
  inventoryId: string;
  /** Hàng bán được tại đây (kể cả đã đóng gói cho đơn). Không gồm hàng hỏng. */
  stock: number;
  /** Trên kệ (`stock − đã đóng gói`): phần đánh dấu hỏng được. */
  shelf?: number;
  /** Hàng hỏng tại đây, nằm ngoài `stock` (2026-11-26). */
  damagedQuantity?: number;
  /** Chiếc may riêng còn tốt tại đây, theo dòng đơn - chọn đúng chiếc khi đánh dấu hỏng. */
  customUnits?: { orderItemId: string; orderCode: string; quantity: number }[];
  location: LocationRef;
}

// Các trường NCC gắn với phiên bản.
export interface ProductItemSupplier {
  id: string;
  supplierName: string;
  email?: string;
  phoneNumber?: string;
}

/** Món lá của combo làm riêng được (PRODUCT, sản phẩm bật "Có thể sản xuất"). */
export interface MadeToOrderComponent {
  productItemId: string;
  sku: string | null;
  productName: string;
  /** Số chiếc trong một bộ. */
  quantity: number;
}

export interface ProductItem {
  id: string;
  tenantId: string;
  productId: string;
  productName: string;
  productCode: string;
  sku: string;
  barcode?: string;
  description?: string;
  retailPrice: number;
  costPrice: number;
  vat?: number;
  warrantyPeriod?: string;
  images?: ProductImage[];
  productDetails?: ProductDetail[];
  suppliers?: ProductItemSupplier[];
  itemType?: ProductItemType;
  comboComponents?: ComboComponent[];
  /** Chỉ combo, chỉ trong `GET /products/search`: các món lá làm riêng được khi tạo đơn. Rỗng = không có nút làm riêng. */
  madeToOrderComponents?: MadeToOrderComponent[];
  // Tồn tại địa điểm đang xem (tổng stockDetails); không lọc địa điểm thì bằng stockAllLocations.
  stock?: number;
  // Tồn ở mọi chi nhánh / kho.
  stockAllLocations?: number;
  // Số bán được tại nơi đang xem.
  availableStock?: number;
  stockDetails?: StockDetail[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Product {
  id: string;
  tenantId: string;
  brandId?: string;
  categoryId?: string;
  name: string;
  status: ProductStatus;
  categoryName?: string;
  /** Đặt xưởng sản xuất được; false = chỉ nhập từ NCC. */
  isManufacturable?: boolean;
  productType?: ProductType;
  images?: ProductImage[];
  attributes?: ProductAttribute[];
  items?: ProductItem[];
  // Tồn tại địa điểm đang xem; không lọc địa điểm thì bằng totalStockAllLocations.
  totalStock?: number;
  // Tồn toàn chuỗi.
  totalStockAllLocations?: number;
  /** Hàng hỏng cùng phạm vi địa điểm với totalStock, nằm ngoài totalStock (2026-11-26). */
  damagedStock?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductDetailResponse extends Product {
  items: ProductItem[];
}

export interface ProductQueryParams {
  search?: string;
  q?: string;
  status?: ProductStatus;
  categoryId?: string;
  supplierId?: string;
  locationId?: string;
  locationType?: LocationType;
  /** Không gửi = mọi loại. BE không có mặc định - mỗi màn tự nói nó liệt kê loại nào. */
  productType?: ProductType[];
  page?: number;
  limit?: number;
}

export interface PaginationResponse {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ProductListResponse {
  data: Product[];
  pagination: PaginationResponse;
}

export interface ProductSearchParams {
  q?: string;
  status?: ProductStatus;
  categoryId?: string;
  supplierId?: string;
  locationId?: string;
  locationType?: LocationType;
  /** Chỉ lấy sản phẩm chứa các phiên bản này. */
  itemIds?: string;
  page?: number;
  limit?: number;
}

// Danh sách SKU phẳng.
export interface ProductItemListEntry {
  id: string;
  productId: string;
  productName: string;
  productCode: string;
  sku: string;
  itemType: ProductItemType;
  costPrice: number;
  /** Ảnh của phiên bản, không có thì ảnh hàng hoá; null = chưa có ảnh nào. */
  thumbnailUrl: string | null;
  // Chỉ có khi request kèm `branchIds`; 0 = chi nhánh chưa có hàng, không phải không bán.
  stock?: number;
}

export interface ProductItemListParams {
  limit?: number;
  search?: string;
  // Gắn tồn của các chi nhánh này.
  branchIds?: string;
  /** true = bỏ phiên bản của hàng đã ngừng kinh doanh (lọc ở BE, trước `limit`). */
  excludeDiscontinued?: boolean;
  /** Chỉ phiên bản của sản phẩm thuộc các loại này; không gửi = mọi loại. */
  productType?: ProductType[];
}

export interface InitialStock {
  locationId: string;
  locationType: LocationType;
}

export interface ProductItemCreatePayload {
  productName: string;
  productCode?: string;
  sku?: string;
  barcode?: string;
  description?: string;
  retailPrice: number;
  /** Bắt buộc với hàng thường; combo không gửi - BE tự tính từ giá vốn các món. */
  costPrice?: number;
  vat?: number;
  warrantyPeriod?: string;
  images?: ProductImage[];
  productDetails?: ProductDetail[];
  initialStock?: InitialStock[];
  itemType?: ProductItemType;
  /** Bắt buộc khi itemType = COMBO, không được gửi với loại khác. */
  comboComponents?: ComboComponentPayload[];
}

export interface ProductItemUpdatePayload {
  productName?: string;
  productCode?: string;
  sku?: string;
  barcode?: string;
  description?: string;
  retailPrice?: number;
  costPrice?: number;
  vat?: number;
  warrantyPeriod?: string;
  images?: ProductImage[];
  productDetails?: ProductDetail[];
  /** Chỉ với combo; thay toàn bộ danh sách thành phần. Loại (itemType) không đổi được sau khi tạo. */
  comboComponents?: ComboComponentPayload[];
}

export interface ProductCreatePayload {
  name: string;
  brandId?: string | null;
  categoryId?: string | null;
  status: ProductStatus;
  isManufacturable?: boolean;
  /** Mặc định PRODUCT. Phiên bản lấy itemType theo đây, nên không cần gửi itemType. */
  productType?: ProductType;
  images?: ProductImage[];
  attributes?: ProductAttribute[];
  items: ProductItemCreatePayload[];
}

export interface ProductUpdatePayload {
  name?: string;
  brandId?: string | null;
  categoryId?: string | null;
  status?: ProductStatus;
  isManufacturable?: boolean;
  images?: ProductImage[];
  /** Thay toàn bộ thuộc tính. */
  attributes?: ProductAttribute[];
}

export type PriceHistoryField = 'RETAIL_PRICE' | 'COST_PRICE'

/** Một lần đổi giá của phiên bản. */
export interface ProductPriceChange {
  id: string
  productItemId: string
  field: PriceHistoryField
  fromValue: number | null
  toValue: number
  changedBy: HistoryPerson | null
  createdAt: string
}

export interface ProductPriceHistoryResponse extends HistoryPage<ProductPriceChange> {
  item: { id: string; productName: string; sku: string; retailPrice: number; costPrice: number }
}
