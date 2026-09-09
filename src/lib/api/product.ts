import client from "@/lib/api/client";
import { parseLocationKey } from "@/lib/location-key";
import { useAuthStore } from "@/store/auth-store";
import type {
  Product,
  ProductItem,
  ProductQueryParams,
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

function mapProduct(prod: ApiProductDoc): Product {
  const { id, items, ...rest } = prod;
  return {
    ...(rest as unknown as Omit<Product, "id" | "items">),
    id: id,
    items: items?.map(mapId),
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

  // GET /products/items - flat SKU list, does not require fetching each product's detail
  // (GET /products list responses don't include `items` per product; see ProductService.js).
  listItems: async (
    params?: ProductItemListParams,
  ): Promise<ProductItemListEntry[]> => {
    const res = await client.get<{ data: ApiDoc<Omit<ProductItemListEntry, "id">>[] }>(
      "/products/items",
      { params },
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
    const res = await client.post<{ data: ApiDoc<ProductItem> }>(
      `/products/${productId}/items`,
      payload,
    );
    return mapId(res.data.data);
  },

  updateItem: async (
    itemId: string,
    payload: ProductItemUpdatePayload,
  ): Promise<ProductItem> => {
    const res = await client.patch<{ data: ApiDoc<ProductItem> }>(
      `/products/items/${itemId}`,
      payload,
    );
    return mapId(res.data.data);
  },

  removeItem: async (itemId: string): Promise<void> => {
    await client.delete(`/products/items/${itemId}`);
  },
};
