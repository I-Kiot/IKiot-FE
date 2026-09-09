import client from "./client";
import type {
  StockMovement,
  StockMovementListResponse,
  StockMovementQueryParams,
  CreateImportPayload,
  CreateExportPayload,
  CreateAdjustPayload,
  ReceiveRequestPayload,
  UpdateDetailsPayload,
  LocationType,
  StockMovementLocationOption,
  StockMovementProductItemOption,
  StockMovementSupplierOption,
} from "@/types/stock-movement";

type ApiRef =
  | string
  | {
      id?: string;
      supplierName?: string;
      fullName?: string;
      email?: string;
      phoneNumber?: string;
      profile?: { firstName?: string; lastName?: string };
    };

type ApiMovementDetail = {
  productItemId?: string | { id?: string; sku?: string; productName?: string };
  quantity?: number;
  importPrice?: number;
  receivedQuantity?: number;
  note?: string;
};

/**
 * "A branch or a warehouse", the shape the API speaks on both sides of the wire.
 *
 * Postgres stores it as a pair of nullable foreign keys, and `location-ref.dto.ts` is the
 * one place on the server that maps between the two - so requests carry `fromLocation:
 * { locationId, locationType }` and responses answer the same object plus a separate
 * `*LocationName`. This file used to send and read the pair **flat**
 * (`fromLocationId` + `fromLocationType`), which is neither: `whitelist: true` dropped the
 * flat keys off every create, and every response read them back as `undefined`. The
 * exchange screens have been showing "warehouse" for every destination because that is the
 * fallback three lines below.
 */
type ApiLocationRef = {
  locationId: string;
  locationType: LocationType;
};

type ApiMovement = {
  id: string;
  tenantId?: string;
  movementType?: StockMovement["movementType"];
  status?: StockMovement["status"];
  fromSupplierId?: ApiRef;
  fromLocation?: ApiLocationRef | null;
  fromLocationName?: string | null;
  toLocation?: ApiLocationRef | null;
  toLocationName?: string | null;
  createdBy?: ApiRef;
  requestedBy?: ApiRef;
  note?: string;
  details?: ApiMovementDetail[];
  createdAt?: string;
  updatedAt?: string;
};

type ApiSupplier = {
  id: string;
  supplierName?: string;
  name?: string;
};

type ApiLocation = {
  id: string;
  name?: string;
};

type ApiProductImage = {
  url?: string;
  isThumbnail?: boolean;
};

type ApiProductItem = {
  id: string;
  productName?: string;
  name?: string;
  sku?: string;
  costPrice?: number;
  retailPrice?: number;
  stock?: number;
  images?: ApiProductImage[];
  productDetails?: Array<{ name?: string; value?: string }>;
  suppliers?: Array<string | { id?: string }>;
};

type ApiProduct = {
  id?: string;
  name?: string;
  images?: ApiProductImage[];
  items?: ApiProductItem[];
  productItems?: ApiProductItem[];
};

type ApiInventoryRow = {
  productItemId?: string | { id?: string };
  stock?: number;
};

function asArray<T>(value: T[] | T | undefined | null): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function resolveRefId(value?: ApiRef): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value.id ?? "";
}

function resolveSupplierName(value?: ApiRef): string | undefined {
  if (!value || typeof value === "string") return undefined;
  return value.supplierName;
}

function resolveUserName(value?: ApiRef): string {
  if (!value || typeof value === "string") return "";
  if (value.fullName?.trim()) return value.fullName.trim();
  const profileName = `${value.profile?.lastName ?? ""} ${value.profile?.firstName ?? ""}`.trim();
  if (profileName) return profileName;
  return value.phoneNumber ?? value.email ?? "";
}

function normalizeNote(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function mapDetail(raw: ApiMovementDetail) {
  const productRef = raw.productItemId;
  const productItemId =
    typeof productRef === "string" ? productRef : (productRef?.id ?? "");

  return {
    productItemId,
    productName: typeof productRef === "string" ? "" : (productRef?.productName ?? ""),
    sku: typeof productRef === "string" ? "" : (productRef?.sku ?? ""),
    quantity: raw.quantity ?? 0,
    importPrice: raw.importPrice ?? 0,
    receivedQuantity: raw.receivedQuantity ?? 0,
    note: normalizeNote(raw.note),
  };
}

function mapMovement(raw: ApiMovement): StockMovement {
  const creator = raw.createdBy ?? raw.requestedBy;
  return {
    id: raw.id,
    tenantId: String(raw.tenantId ?? ""),
    movementType: raw.movementType ?? "IMPORT",
    status: raw.status ?? "PENDING",
    fromSupplierId: resolveRefId(raw.fromSupplierId),
    supplierName: resolveSupplierName(raw.fromSupplierId),
    fromLocationId: raw.fromLocation?.locationId,
    fromLocationName: raw.fromLocationName ?? undefined,
    fromLocationType: raw.fromLocation?.locationType,
    toLocationId: raw.toLocation?.locationId ?? "",
    toLocationName: raw.toLocationName ?? raw.toLocation?.locationId ?? "",
    toLocationType: raw.toLocation?.locationType ?? "warehouse",
    requestedBy: resolveRefId(creator),
    requestedByName: resolveUserName(creator),
    note: normalizeNote(raw.note),
    details: (raw.details ?? []).map(mapDetail),
    createdAt: raw.createdAt ?? "",
    updatedAt: raw.updatedAt ?? "",
  };
}

/**
 * The create body `POST /stock-movements` actually accepts.
 *
 * The screens work in flat ids (that is what a `<Select>` binds to), and
 * `CreateStockMovementDto` takes the pair nested - so the conversion belongs here, once,
 * rather than at each of the four call sites that used to spread a flat payload straight
 * into the request and have both locations dropped in silence.
 *
 * A missing half is left off entirely rather than sent as `{ locationId: undefined }`:
 * IMPORT has no source and ADJUST no destination, and `assertEndpointsValid` decides which
 * of those is legal for the movement type.
 */
function toCreateBody<
  T extends {
    fromLocationId?: string;
    fromLocationType?: LocationType;
    toLocationId?: string;
    toLocationType?: LocationType;
  },
>(payload: T) {
  const {
    fromLocationId,
    fromLocationType,
    toLocationId,
    toLocationType,
    ...rest
  } = payload;

  return {
    ...rest,
    ...(fromLocationId && fromLocationType
      ? { fromLocation: { locationId: fromLocationId, locationType: fromLocationType } }
      : {}),
    ...(toLocationId && toLocationType
      ? { toLocation: { locationId: toLocationId, locationType: toLocationType } }
      : {}),
  };
}

type ProductLookup = Map<string, StockMovementProductItemOption>;
type LocationLookup = Map<string, StockMovementLocationOption>;
type SupplierLookup = Map<string, StockMovementSupplierOption>;

let productLookupCache: { at: number; value: ProductLookup } | null = null;
let locationLookupCache: { at: number; value: LocationLookup } | null = null;
let supplierLookupCache: { at: number; value: SupplierLookup } | null = null;
let productLookupInflight: Promise<ProductLookup> | null = null;
let locationLookupInflight: Promise<LocationLookup> | null = null;
let supplierLookupInflight: Promise<SupplierLookup> | null = null;
const LOOKUP_TTL_MS = 60_000;

function isCacheFresh(at: number) {
  return Date.now() - at < LOOKUP_TTL_MS;
}

async function fetchSupplierOptions(): Promise<StockMovementSupplierOption[]> {
  const response = await client.get("/suppliers", {
    params: { page: 1, limit: 100 },
  });
  return asArray<ApiSupplier>(response.data?.data).map((supplier) => ({
    id: supplier.id,
    name: supplier.supplierName ?? supplier.name ?? supplier.id,
  }));
}

async function fetchLocationOptions(): Promise<StockMovementLocationOption[]> {
  const [warehousesResponse, branchesResponse] = await Promise.all([
    client.get("/warehouses", { params: { page: 1, limit: 100 } }),
    client.get("/branches", { params: { page: 1, limit: 100 } }),
  ]);

  const warehouses = asArray<ApiLocation>(warehousesResponse.data?.data).map(
    (warehouse) => ({
      id: warehouse.id,
      name: warehouse.name ?? warehouse.id,
      type: "warehouse" as const,
    }),
  );
  const branches = asArray<ApiLocation>(branchesResponse.data?.data).map(
    (branch) => ({
      id: branch.id,
      name: branch.name ?? branch.id,
      type: "branch" as const,
    }),
  );

  return [...warehouses, ...branches];
}

async function fetchInventoryAtLocation(
  locationId: string,
  locationType: LocationType,
): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  let page = 1;
  let totalPages = 1;

  do {
    const response = await client.get("/inventory", {
      params: { page, limit: 100, locationId, locationType },
    });
    for (const row of asArray<ApiInventoryRow>(response.data?.data)) {
      const id =
        typeof row.productItemId === "string"
          ? row.productItemId
          : row.productItemId?.id;
      if (id) map.set(id, row.stock ?? 0);
    }
    totalPages = Number(response.data?.pagination?.totalPages ?? 1);
    page += 1;
  } while (page <= totalPages);

  return map;
}

function resolveSupplierIds(
  suppliers?: Array<string | { id?: string }>,
): string[] {
  if (!suppliers?.length) return [];
  return suppliers
    .map((s) => (typeof s === "string" ? s : (s.id ?? "")))
    .filter(Boolean);
}

function resolveProductImageUrl(
  item?: { images?: ApiProductImage[] },
  product?: { images?: ApiProductImage[] },
): string | undefined {
  const fromItem =
    item?.images?.find((i) => i.isThumbnail)?.url ?? item?.images?.[0]?.url;
  if (fromItem) return fromItem;
  return (
    product?.images?.find((i) => i.isThumbnail)?.url ?? product?.images?.[0]?.url
  );
}

function mapProductDetails(
  details?: Array<{ name?: string; value?: string }>,
): Array<{ name: string; value: string }> | undefined {
  if (!details?.length) return undefined;
  const mapped = details
    .map((d) => ({
      name: d.name?.trim() ?? "",
      value: d.value?.trim() ?? "",
    }))
    .filter((d) => d.name && d.value);
  return mapped.length ? mapped : undefined;
}

function mapApiProductsToItemOptions(
  products: ApiProduct[],
): StockMovementProductItemOption[] {
  return products.flatMap((product) =>
    asArray<ApiProductItem>(product.items ?? product.productItems).map(
      (item) => ({
        id: item.id,
        productId: product.id,
        name: item.productName ?? item.name ?? product.name ?? item.id,
        sku: item.sku ?? "",
        costPrice: item.costPrice ?? item.retailPrice ?? 0,
        retailPrice: item.retailPrice,
        imageUrl: resolveProductImageUrl(item, product),
        productDetails: mapProductDetails(item.productDetails),
        supplierIds: resolveSupplierIds(item.suppliers),
        stock: item.stock,
      }),
    ),
  );
}

/** GET /products/search - có items + costPrice/retailPrice. */
async function fetchProductSearch(params: {
  q?: string;
  page?: number;
  limit?: number;
  status?: string;
}): Promise<{
  items: StockMovementProductItemOption[];
  totalPages: number;
}> {
  const response = await client.get("/products/search", {
    params: {
      q: params.q?.trim() || undefined,
      page: params.page ?? 1,
      limit: Math.min(params.limit ?? 50, 50),
      status: params.status ?? "ACTIVE",
    },
  });
  return {
    items: mapApiProductsToItemOptions(
      asArray<ApiProduct>(response.data?.data),
    ),
    totalPages: Number(response.data?.pagination?.totalPages ?? 1),
  };
}

/**
 * Catalog với giá: GET /products/search
 * (GET /products thường không gắn items nên không dùng cho giá).
 */
async function fetchAllProductItemOptions(): Promise<
  StockMovementProductItemOption[]
> {
  const all: StockMovementProductItemOption[] = [];
  let page = 1;
  let totalPages = 1;

  do {
    const res = await fetchProductSearch({ page, limit: 50, status: "ACTIVE" });
    all.push(...res.items);
    totalPages = res.totalPages || 1;
    page += 1;
  } while (page <= totalPages);

  return all;
}

/** Giá gợi ý khi chọn hàng (ưu tiên costPrice, ≤ retailPrice). */
export function resolveItemImportPrice(
  item?: Pick<StockMovementProductItemOption, "costPrice" | "retailPrice">,
): number {
  if (!item) return 0;
  const cost =
    typeof item.costPrice === "number" && Number.isFinite(item.costPrice)
      ? item.costPrice
      : typeof item.retailPrice === "number" && Number.isFinite(item.retailPrice)
        ? item.retailPrice
        : 0;
  if (
    typeof item.retailPrice === "number" &&
    Number.isFinite(item.retailPrice) &&
    item.retailPrice > 0
  ) {
    return Math.min(cost, item.retailPrice);
  }
  return cost;
}

async function getProductLookup(): Promise<ProductLookup> {
  if (productLookupCache && isCacheFresh(productLookupCache.at)) {
    return productLookupCache.value;
  }
  if (productLookupInflight) return productLookupInflight;

  productLookupInflight = fetchAllProductItemOptions()
    .then((options) => {
      const value = new Map(options.map((item) => [item.id, item]));
      productLookupCache = { at: Date.now(), value };
      return value;
    })
    .finally(() => {
      productLookupInflight = null;
    });

  return productLookupInflight;
}

async function getLocationLookup(): Promise<LocationLookup> {
  if (locationLookupCache && isCacheFresh(locationLookupCache.at)) {
    return locationLookupCache.value;
  }
  if (locationLookupInflight) return locationLookupInflight;

  locationLookupInflight = fetchLocationOptions()
    .then((options) => {
      const value = new Map(options.map((item) => [item.id, item]));
      locationLookupCache = { at: Date.now(), value };
      return value;
    })
    .finally(() => {
      locationLookupInflight = null;
    });

  return locationLookupInflight;
}

async function getSupplierLookup(): Promise<SupplierLookup> {
  if (supplierLookupCache && isCacheFresh(supplierLookupCache.at)) {
    return supplierLookupCache.value;
  }
  if (supplierLookupInflight) return supplierLookupInflight;

  supplierLookupInflight = fetchSupplierOptions()
    .then((options) => {
      const value = new Map(options.map((item) => [item.id, item]));
      supplierLookupCache = { at: Date.now(), value };
      return value;
    })
    .finally(() => {
      supplierLookupInflight = null;
    });

  return supplierLookupInflight;
}

function applyLookups(
  movement: StockMovement,
  products: ProductLookup | null,
  locations: LocationLookup | null,
  suppliers: SupplierLookup | null,
): StockMovement {
  const fromLocation = movement.fromLocationId
    ? locations?.get(movement.fromLocationId)
    : undefined;
  const toLocation = locations?.get(movement.toLocationId);
  const supplier = movement.fromSupplierId
    ? suppliers?.get(movement.fromSupplierId)
    : undefined;

  return {
    ...movement,
    supplierName: movement.supplierName || supplier?.name,
    fromLocationName: movement.fromLocationName || fromLocation?.name,
    fromLocationType: movement.fromLocationType || fromLocation?.type,
    toLocationName:
      movement.toLocationName && movement.toLocationName !== movement.toLocationId
        ? movement.toLocationName
        : (toLocation?.name ?? movement.toLocationName),
    toLocationType: movement.toLocationType || toLocation?.type || "warehouse",
    details: movement.details.map((detail) => {
      const product = products?.get(detail.productItemId);
      return {
        ...detail,
        productName: detail.productName || product?.name || "",
        sku: detail.sku || product?.sku || "",
      };
    }),
  };
}

function movementNeedsProducts(movement: StockMovement) {
  return movement.details.some((d) => !d.productName || !d.sku);
}

function movementNeedsLocations(movement: StockMovement) {
  return (
    (!!movement.fromLocationId && !movement.fromLocationName) ||
    !movement.toLocationName ||
    movement.toLocationName === movement.toLocationId
  );
}

function movementNeedsSupplier(movement: StockMovement) {
  return !!movement.fromSupplierId && !movement.supplierName;
}

async function enrichMovement(movement: StockMovement): Promise<StockMovement> {
  const [products, locations, suppliers] = await Promise.all([
    movementNeedsProducts(movement) ? getProductLookup() : Promise.resolve(null),
    movementNeedsLocations(movement) ? getLocationLookup() : Promise.resolve(null),
    movementNeedsSupplier(movement) ? getSupplierLookup() : Promise.resolve(null),
  ]);
  return applyLookups(movement, products, locations, suppliers);
}

async function safeEnrichMovement(movement: StockMovement): Promise<StockMovement> {
  try {
    return await enrichMovement(movement);
  } catch {
    return movement;
  }
}

/** Enrich cả list với tối đa 1 lần gọi lookup. List UI không cần tên SP → bỏ /products. */
async function safeEnrichMovements(
  movements: StockMovement[],
): Promise<StockMovement[]> {
  if (movements.length === 0) return movements;
  try {
    const needsLocations = movements.some(movementNeedsLocations);
    const needsSuppliers = movements.some(movementNeedsSupplier);

    const [locations, suppliers] = await Promise.all([
      needsLocations ? getLocationLookup() : Promise.resolve(null),
      needsSuppliers ? getSupplierLookup() : Promise.resolve(null),
    ]);

    return movements.map((m) => applyLookups(m, null, locations, suppliers));
  } catch {
    return movements;
  }
}

export const stockMovementApi = {
  getList: async (
    params?: StockMovementQueryParams,
  ): Promise<StockMovementListResponse> => {
    const response = await client.get("/stock-movements", { params });
    const payload = response.data ?? {};
    const list = Array.isArray(payload.data) ? payload.data : [];
    const pagination = payload.pagination ?? {};
    const mapped = list.map((raw: ApiMovement) => mapMovement(raw));

    return {
      data: await safeEnrichMovements(mapped),
      total: pagination.total ?? list.length,
      page: pagination.page ?? 1,
      limit: pagination.limit ?? params?.limit ?? list.length,
      totalPages: pagination.totalPages ?? 1,
    };
  },

  getById: async (id: string): Promise<StockMovement> => {
    const response = await client.get(`/stock-movements/${id}`);
    return safeEnrichMovement(mapMovement(response.data?.data as ApiMovement));
  },

  createImport: async (payload: CreateImportPayload): Promise<StockMovement> => {
    const response = await client.post("/stock-movements", toCreateBody(payload));
    return safeEnrichMovement(mapMovement(response.data?.data as ApiMovement));
  },

  createExport: async (payload: CreateExportPayload): Promise<StockMovement> => {
    const response = await client.post("/stock-movements", toCreateBody(payload));
    return safeEnrichMovement(mapMovement(response.data?.data as ApiMovement));
  },

  createAdjust: async (payload: CreateAdjustPayload): Promise<StockMovement> => {
    const response = await client.post(
      "/stock-movements",
      toCreateBody({
        ...payload,
        details: payload.details.map((d) => ({
          productItemId: d.productItemId,
          receivedQuantity: d.receivedQuantity,
          note: d.note,
        })),
      }),
    );
    return safeEnrichMovement(mapMovement(response.data?.data as ApiMovement));
  },

  approveAdjust: async (id: string): Promise<StockMovement> => {
    const response = await client.patch(`/stock-movements/${id}/approve-adjust`);
    return safeEnrichMovement(mapMovement(response.data?.data as ApiMovement));
  },

  open: async (id: string): Promise<StockMovement> => {
    const response = await client.patch(`/stock-movements/${id}/open`);
    return safeEnrichMovement(mapMovement(response.data?.data as ApiMovement));
  },

  close: async (id: string): Promise<StockMovement> => {
    const response = await client.patch(`/stock-movements/${id}/close`);
    return safeEnrichMovement(mapMovement(response.data?.data as ApiMovement));
  },

  updateDetails: async (
    id: string,
    payload: UpdateDetailsPayload,
  ): Promise<StockMovement> => {
    const response = await client.patch(`/stock-movements/${id}/details`, payload);
    return safeEnrichMovement(mapMovement(response.data?.data as ApiMovement));
  },

  ship: async (id: string): Promise<StockMovement> => {
    const response = await client.patch(`/stock-movements/${id}/ship`);
    return safeEnrichMovement(mapMovement(response.data?.data as ApiMovement));
  },

  /**
   * Tạo phiếu trả ngược (đổi from/to) từ phiếu đã nhận, rồi open → close → ship
   * để nơi gửi gốc chỉ cần xác nhận nhận hàng.
   */
  createAndShipReverseReturn: async (
    source: StockMovement,
    options?: { reason?: string },
  ): Promise<StockMovement> => {
    if (!source.fromLocationId || !source.fromLocationType) {
      throw new Error("Phiếu không có nơi gửi để trả về");
    }
    if (!source.toLocationId || !source.toLocationType) {
      throw new Error("Phiếu không có nơi nhận để trả hàng");
    }

    const details = source.details
      .map((d) => {
        const qty = Number(
          d.receivedQuantity != null ? d.receivedQuantity : d.quantity,
        );
        return {
          productItemId: d.productItemId,
          quantity: qty,
          importPrice:
            typeof d.importPrice === "number" && d.importPrice > 0
              ? d.importPrice
              : undefined,
          note: d.note,
        };
      })
      .filter((d) => Number.isFinite(d.quantity) && d.quantity > 0);

    if (details.length === 0) {
      throw new Error("Không có số lượng hàng hợp lệ để trả");
    }

    const fromLocationId = source.toLocationId;
    const fromLocationType = source.toLocationType;
    const toLocationId = source.fromLocationId;
    const toLocationType = source.fromLocationType;

    const movementType =
      fromLocationType === "branch" && toLocationType === "warehouse"
        ? ("RETURN" as const)
        : ("EXPORT" as const);

    const reason = options?.reason?.trim();
    const note = reason
      ? `${reason} (từ phiếu ${source.id})`
      : `Trả hàng từ phiếu ${source.id}`;

    const createResponse = await client.post(
      "/stock-movements",
      toCreateBody({
        movementType,
        fromLocationId,
        fromLocationType,
        toLocationId,
        toLocationType,
        note,
        details,
      }),
    );
    const created = await safeEnrichMovement(
      mapMovement(createResponse.data?.data as ApiMovement),
    );

    await client.patch(`/stock-movements/${created.id}/open`);
    await client.patch(`/stock-movements/${created.id}/close`);
    const shipResponse = await client.patch(
      `/stock-movements/${created.id}/ship`,
    );
    return safeEnrichMovement(
      mapMovement(shipResponse.data?.data as ApiMovement),
    );
  },

  receive: async (
    id: string,
    payload: ReceiveRequestPayload,
  ): Promise<StockMovement> => {
    if (!Array.isArray(payload.details) || payload.details.length === 0) {
      throw new Error("Vui lòng nhập số lượng thực nhận");
    }
    for (const item of payload.details) {
      const qty = Number(item.receivedQuantity);
      if (!Number.isFinite(qty) || qty < 0) {
        throw new Error("Số lượng thực nhận phải là số không âm");
      }
    }
    const response = await client.patch(`/stock-movements/${id}/receive`, payload);
    return safeEnrichMovement(mapMovement(response.data?.data as ApiMovement));
  },

  cancel: async (id: string): Promise<StockMovement> => {
    const response = await client.patch(`/stock-movements/${id}/cancel`);
    return safeEnrichMovement(mapMovement(response.data?.data as ApiMovement));
  },

  getSupplierOptions: fetchSupplierOptions,
  getLocationOptions: fetchLocationOptions,
  searchProductItems: async (q: string) => {
    const res = await fetchProductSearch({
      q,
      page: 1,
      limit: 50,
      status: "ACTIVE",
    });
    return res.items;
  },

  /** Sản phẩm kèm cờ có tại location (nhập hàng) */
  getProductItemsForDestination: async (
    locationId: string,
    locationType: LocationType,
  ): Promise<StockMovementProductItemOption[]> => {
    const [lookup, inventoryMap] = await Promise.all([
      getProductLookup(),
      fetchInventoryAtLocation(locationId, locationType),
    ]);
    // "Has stock here", not "has a row here". A row appears the first time a movement
    // delivers goods and stays afterwards, so its presence only says the location once had
    // some - and the adjustment picker uses this flag to keep a branch manager to the goods
    // actually sitting in their branch right now.
    return [...lookup.values()].map((item) => ({
      ...item,
      atLocation: (inventoryMap.get(item.id) ?? 0) > 0,
      stock: inventoryMap.get(item.id),
    }));
  },

  /** Toàn bộ catalog + giá (không lọc tồn) - dùng nhập từ NCC */
  getCatalogProductItems: async (): Promise<StockMovementProductItemOption[]> => {
    return fetchAllProductItemOptions();
  },

  /** Sản phẩm có tồn tại kho nguồn (chuyển kho) */
  getProductItemsAtSource: async (
    locationId: string,
    locationType: LocationType,
  ): Promise<StockMovementProductItemOption[]> => {
    const [lookup, inventoryMap] = await Promise.all([
      getProductLookup(),
      fetchInventoryAtLocation(locationId, locationType),
    ]);
    return [...lookup.values()]
      .filter((item) => (inventoryMap.get(item.id) ?? 0) > 0)
      .map((item) => ({
        ...item,
        atLocation: true,
        stock: inventoryMap.get(item.id) ?? 0,
      }));
  },
};
