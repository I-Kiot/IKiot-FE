export type ProductStatus = "ACTIVE" | "INACTIVE" | "DISCONTINUED";
export type LocationType = "branch" | "warehouse";

export interface ProductImage {
  id?: string;
  url: string;
  isThumbnail: boolean;
}

export interface ProductDetail {
  id?: string;
  name: string;
  value: string;
}

export interface StockDetail {
  inventoryId: string;
  locationId: string;
  locationType: LocationType;
  stock: number;
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
  // Tồn tại địa điểm đang xem (tổng của stockDetails). Khi không lọc địa điểm thì bằng
  // stockAllLocations.
  stock?: number;
  // Tồn của biến thể này ở TẤT CẢ chi nhánh/kho, không phụ thuộc bộ lọc địa điểm. BE luôn
  // trả về số - 0 nghĩa là cả chuỗi chưa có, không phải "chưa nạp".
  stockAllLocations?: number;
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
  images?: ProductImage[];
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
  // Chỉ có khi request kèm `branchIds`; 0 = chi nhánh chưa có hàng, không phải không bán.
  stock?: number;
}

export interface ProductItemListParams {
  limit?: number;
  search?: string;
  // Comma-separated branch IDs. Không lọc danh sách - chỉ gắn thêm `stock` của (các) chi
  // nhánh đó vào từng biến thể, 0 khi chi nhánh chưa từng nhập mặt hàng.
  branchIds?: string;
}

export interface InitialStock {
  locationId: string;
  locationType: LocationType;
}

export interface ProductItemCreatePayload {
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
  initialStock?: InitialStock[];
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
}

export interface ProductCreatePayload {
  name: string;
  brandId?: string | null;
  categoryId?: string | null;
  status: ProductStatus;
  images?: ProductImage[];
  items: ProductItemCreatePayload[];
}

export interface ProductUpdatePayload {
  name?: string;
  brandId?: string | null;
  categoryId?: string | null;
  status?: ProductStatus;
  images?: ProductImage[];
}
