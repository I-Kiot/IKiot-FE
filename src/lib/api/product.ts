import client from "@/lib/api/client";
import { parseLocationKey } from "@/lib/location-key";
import { useAuthStore } from "@/store/auth-store";
import type {
  Product,
  ProductItem,
  ProductQueryParams,
  ProductType,
  ProductListResponse,
  ProductCreatePayload,
  ProductUpdatePayload,
  ProductItemCreatePayload,
  ProductItemUpdatePayload,
  PaginationResponse,
  ProductDetailResponse,
  ProductSearchParams,
  ProductItemListEntry,
  ProductItemListParams,
  ProductAttribute,
  PriceHistoryField,
  ProductPriceHistoryResponse,
} from "@/types/product";

type ApiDoc<T extends object> = Omit<T, "id"> & { id: string };

// GET /products, GET /products/:id - có items (nested) và totalStock
type ApiProductDoc = ApiDoc<Omit<Product, "items">> & {
  items?: ApiDoc<ProductItem>[];
};

// POST /products, PATCH /products/:id - không trả về items hay totalStock
type ApiProductBase = ApiDoc<Omit<Product, "items" | "totalStock">>;

function mapId<T extends object>(doc: ApiDoc<T>): T & { id: string } {
  const { id, ...rest } = doc;
  return { ...(rest as unknown as T), id: id };
}

// Một phiên bản như BE trả về: giá trị thuộc tính nằm ở `details`.
type ApiItemDoc = ApiDoc<ProductItem> & { details?: ProductItem["productDetails"] };

// Đổi `details` của BE thành `productDetails`.
function mapItem(doc: ApiItemDoc): ProductItem {
  const item = mapId(doc) as ProductItem & { details?: ProductItem["productDetails"] };
  const { details, ...rest } = item;
  return { ...rest, productDetails: item.productDetails ?? details };
}

function mapProduct(prod: ApiProductDoc): Product {
  const { id, items, ...rest } = prod;
  return {
    ...(rest as unknown as Omit<Product, "id" | "items">),
    id: id,
    items: items?.map(mapItem),
  };
}

export const productApi = {
  getList: async (
    params?: ProductQueryParams,
  ): Promise<ProductListResponse> => {
    const parsed = parseLocationKey(useAuthStore.getState().locationKey);
    const locationParams = parsed
      ? { locationId: parsed.locationId, locationType: parsed.locationType }
      : {};

    const mergedParams = {
      ...locationParams,
      ...params,
      // BE nhận danh sách cách nhau bằng dấu phẩy; axios mặc định gửi mảng thành productType[]=...
      productType: params?.productType?.join(","),
    };

    const res = await client.get<{
      data: ApiProductDoc[];
      pagination: PaginationResponse;
    }>("/products", { params: mergedParams });
    return {
      data: res.data.data.map(mapProduct),
      pagination: res.data.pagination,
    };
  },

  // Danh sách SKU phẳng.
  listItems: async (
    params?: ProductItemListParams,
  ): Promise<ProductItemListEntry[]> => {
    const res = await client.get<{ data: ApiDoc<Omit<ProductItemListEntry, "id">>[] }>(
      "/products/items",
      { params: { ...params, productType: params?.productType?.join(",") } },
    );
    return res.data.data.map(mapId);
  },

  search: async (
    params: ProductSearchParams,
    signal?: AbortSignal,
  ): Promise<ProductListResponse> => {
    const res = await client.get<{
      data: ApiProductDoc[];
      pagination: PaginationResponse;
    }>("/products/search", { params, signal });
    return {
      data: res.data.data.map(mapProduct),
      pagination: res.data.pagination,
    };
  },

  getById: async (id: string): Promise<ProductDetailResponse> => {
    const parsed = parseLocationKey(useAuthStore.getState().locationKey);
    const params = parsed
      ? { locationId: parsed.locationId, locationType: parsed.locationType }
      : {};
    const res = await client.get<{ data: ApiProductDoc }>(`/products/${id}`, {
      params,
    });
    return mapProduct(res.data.data) as ProductDetailResponse;
  },

  /** Lịch sử đổi giá bán / giá vốn của một phiên bản, mới nhất trước (products:read). */
  getPriceHistory: async (
    itemId: string,
    params?: { field?: PriceHistoryField; page?: number; limit?: number },
  ): Promise<ProductPriceHistoryResponse> => {
    const res = await client.get<ProductPriceHistoryResponse>(`/products/items/${itemId}/price-history`, { params });
    const body = res.data;
    return {
      ...body,
      data: body.data.map((c) => ({
        ...c,
        fromValue: c.fromValue == null ? null : Number(c.fromValue),
        toValue: Number(c.toValue),
      })),
    };
  },

  /** Thêm một thuộc tính cho sản phẩm; trùng tên thì trả thuộc tính đã có. */
  addAttribute: async (
    productId: string,
    payload: { name: string; unit?: string },
  ): Promise<ProductAttribute> => {
    const res = await client.post<{ data: ProductAttribute }>(`/products/${productId}/attributes`, payload);
    return res.data.data;
  },

  create: async (payload: ProductCreatePayload): Promise<Product> => {
    const res = await client.post<{ data: ApiProductBase }>(
      "/products",
      payload,
    );
    return mapId(res.data.data);
  },

  update: async (
    id: string,
    payload: ProductUpdatePayload,
  ): Promise<Product> => {
    const res = await client.patch<{ data: ApiProductBase }>(
      `/products/${id}`,
      payload,
    );
    return mapId(res.data.data);
  },

  remove: async (id: string): Promise<void> => {
    await client.delete(`/products/${id}`);
  },

  createItem: async (
    productId: string,
    payload: ProductItemCreatePayload,
  ): Promise<ProductItem> => {
    const res = await client.post<{ data: ApiItemDoc }>(
      `/products/${productId}/items`,
      payload,
    );
    // Đi qua mapItem để có thuộc tính.
    return mapItem(res.data.data);
  },

  updateItem: async (
    itemId: string,
    payload: ProductItemUpdatePayload,
  ): Promise<ProductItem> => {
    const res = await client.patch<{ data: ApiItemDoc }>(
      `/products/items/${itemId}`,
      payload,
    );
    // Như createItem: đổi `details` của BE thành `productDetails`.
    return mapItem(res.data.data);
  },

  removeItem: async (itemId: string): Promise<void> => {
    await client.delete(`/products/items/${itemId}`);
  },

  // POST /products/export - file cùng khuôn file mẫu nhập; `ids` là hàng đã tích, bỏ trống là mọi hàng của các loại.
  exportFile: async (body: { ids?: string[]; productType?: ProductType[] }): Promise<Blob> => {
    const res = await client.post<Blob>("/products/export", body, { responseType: "blob" });
    return res.data;
  },

  // Tải file Excel mẫu.
  downloadImportTemplate: async (): Promise<Blob> => {
    const res = await client.get<Blob>("/products/import/template", {
      responseType: "blob",
    });
    return res.data;
  },

  // POST /products/import - cả file hợp lệ mới tạo; lỗi 400 kèm `errors` theo dòng (xem importErrorsOf).
  importFile: async (
    file: File,
  ): Promise<{ productCount: number; itemCount: number; productIds: string[] }> => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await client.post<{
      data: { productCount: number; itemCount: number; productIds: string[] };
    }>("/products/import", formData, {
      headers: { "Content-Type": undefined },
    });
    return res.data.data;
  },
};
