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

/** PRODUCT có tồn riêng; COMBO bán theo bộ, tồn tính qua thành phần; SERVICE không có hàng. Chốt lúc tạo. */
export type ProductItemType = "PRODUCT" | "COMBO" | "SERVICE";

/**
 * Loại của cả sản phẩm, cố định lúc tạo. Mọi phiên bản có itemType bằng đúng loại này - BE tự gán.
 * `/products` liệt kê PRODUCT + SERVICE, `/combos` liệt kê COMBO.
 */
export type ProductType = "PRODUCT" | "COMBO" | "SERVICE";

/** Một thành phần của combo. `componentItem` có thể lại là COMBO (combo lồng nhau) - mở tiếp bằng `productId`. */
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
  stock: number;
  location: LocationRef;
}

// Populated subset of Supplier as returned on ProductItem.suppliers
// (BE populates only these fields - see ProductService.getProductById/addSupplierToItem).
export interface ProductItemSupplier {
  id: string;
  supplierName: string;
  email?: string;
  phoneNumber?: string;
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
  // Tồn tại địa điểm đang xem (tổng của stockDetails). Khi không lọc địa điểm thì bằng
  // stockAllLocations.
  stock?: number;
  // Tồn của biến thể này ở TẤT CẢ chi nhánh/kho, không phụ thuộc bộ lọc địa điểm. BE luôn
  // trả về số - 0 nghĩa là cả chuỗi chưa có, không phải "chưa nạp".
  stockAllLocations?: number;
  // Số có thể bán ngay tại địa điểm đang xem: tồn trên kệ = tồn − hàng đã đóng gói cho đơn khác.
  // Với combo là số bộ còn bán được (món khan nhất quyết định). Quầy chặn thêm giỏ theo số này,
  // không theo `stock`, vì BE chỉ trừ được phần trên kệ.
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
  // Tồn tại địa điểm đang xem. Khi danh sách không lọc địa điểm thì bằng
  // totalStockAllLocations.
  totalStock?: number;
  // Tồn toàn chuỗi (mọi chi nhánh + kho). Dùng để trả lời "cửa hàng có mặt hàng này không"
  // khi chi nhánh đang xem chưa nhập về - lúc đó totalStock là 0 còn số này thì không.
  totalStockAllLocations?: number;
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
  page?: number;
  limit?: number;
}

// GET /products/items - flat SKU list for pickers (e.g. promotion product-scope selector).
// Unlike Product.items, this doesn't require fetching every product's detail.
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
  // Comma-separated branch IDs. Không lọc danh sách - chỉ gắn thêm `stock` của (các) chi
  // nhánh đó vào từng biến thể, 0 khi chi nhánh chưa từng nhập mặt hàng.
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
  /** Thay toàn bộ danh sách thuộc tính; dòng có `id` được giữ, dòng vắng mặt bị xoá cùng giá trị trên mọi SKU. */
  attributes?: ProductAttribute[];
}
