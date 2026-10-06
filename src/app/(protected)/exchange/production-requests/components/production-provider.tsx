"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { toast } from "sonner";
import { productionRequestApi } from "@/lib/api/production-request";
import { supplierApi } from "@/lib/api/supplier";
import { branchApi } from "@/lib/api/branch";
import { warehouseApi } from "@/lib/api/warehouse";
import { getApiErrorBody, messageForCode } from "@/lib/api/error-codes";
import { parseLocationKey } from "@/lib/location-key";
import { allows } from "@/components/sidebar/constants/role-permissions";
import { useAuthStore } from "@/store/auth-store";
import type { Supplier } from "@/types/supplier";
import type {
  CreateProductionRequestPayload,
  Paginated,
  ProductionRequest,
  ProductionRequestLinePayload,
  ProductionRequestStatus,
  ReceiveProductionPayload,
} from "@/types/order-flow";

export interface LocationOption {
  id: string;
  name: string;
  type: "BRANCH" | "WAREHOUSE";
  isSellable: boolean;
}

/** A line being put together in the create / edit dialog. `label` is display only. */
export interface DraftLine extends ProductionRequestLinePayload {
  label: string;
}

/** Same SKU for the same order line = the same line. */
export const lineKey = (
  line: Pick<DraftLine, "productItemId" | "orderItemId">,
) => `${line.productItemId}|${line.orderItemId ?? ""}`;

export type ProductionDialog =
  /** `onlyShort` opens the product picker filtered to what needs ordering. */
  | { kind: "create"; onlyShort?: boolean }
  | { kind: "edit"; request: ProductionRequest }
  | { kind: "receive"; request: ProductionRequest }
  | { kind: "closeShort"; request: ProductionRequest }
  | null;

/** Câu tiếng Việt theo `code` (bảng ERROR_MESSAGES), lùi về câu chung. */
export function productionErrorMessage(
  error: unknown,
  fallback: string,
): string {
  return messageForCode(getApiErrorBody(error)?.code) ?? fallback;
}

export interface RequestFilter {
  status: ProductionRequestStatus | "ALL";
  locationId: string;
  search: string;
  page: number;
  limit: number;
}

interface ProductionContextType {
  can: { create: boolean; update: boolean; delete: boolean; receive: boolean };

  workshops: Supplier[];
  locations: LocationOption[];
  /** Where the switcher in the header is pinned, if anywhere. */
  scopedLocationId?: string;

  requests: Paginated<ProductionRequest>;
  requestsLoading: boolean;
  filter: RequestFilter;
  /** Any change but `page` goes back to page 1. */
  setFilter: (patch: Partial<RequestFilter>) => void;
  /** How many SKUs need ordering in scope - the header's call to action. */
  shortRows: number;
  /** Bumped after every write, so the product picker's numbers reload too. */
  version: number;

  dialog: ProductionDialog;
  setDialog: (dialog: ProductionDialog) => void;

  create: (payload: CreateProductionRequestPayload) => Promise<boolean>;
  update: (
    id: string,
    payload: Partial<CreateProductionRequestPayload>,
  ) => Promise<boolean>;
  send: (id: string) => Promise<void>;
  cancel: (id: string) => Promise<void>;
  /** Close a partly received request: what never came stops counting as on order. */
  closeShort: (id: string, reason: string) => Promise<boolean>;
  remove: (id: string) => Promise<void>;
  receive: (id: string, payload: ReceiveProductionPayload) => Promise<boolean>;
}

const ProductionContext = createContext<ProductionContextType | null>(null);

const EMPTY_PAGE: Paginated<ProductionRequest> = {
  data: [],
  pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
};

export function ProductionProvider({
  initialLocationId,
  openCreateShort,
  children,
}: {
  initialLocationId?: string;
  /** A shortage notification lands with the create dialog open on what needs ordering. */
  openCreateShort?: boolean;
  children: React.ReactNode;
}) {
  const role = useAuthStore((s) => s.user?.role);
  const locationKey = useAuthStore((s) => s.locationKey);
  const scopedLocationId = useMemo(
    () => parseLocationKey(locationKey)?.locationId,
    [locationKey],
  );

  const [workshops, setWorkshops] = useState<Supplier[]>([]);
  const [locations, setLocations] = useState<LocationOption[]>([]);
  const [filterState, setFilterState] = useState<RequestFilter>({
    status: "ALL",
    locationId: initialLocationId ?? "ALL",
    search: "",
    page: 1,
    limit: 20,
  });
  // The header's location switcher pins the screen to that location.
  const filter = scopedLocationId
    ? { ...filterState, locationId: scopedLocationId }
    : filterState;

  // Loaded for a key (filters + a version bumped after every write); "loading" until the rows
  // on screen belong to the current key.
  const [version, setVersion] = useState(0);
  const requestKey = JSON.stringify({ ...filter, version });
  const shortKey = JSON.stringify({ locationId: filter.locationId, version });
  const [requestState, setRequestState] = useState<{
    key: string;
    page: Paginated<ProductionRequest>;
  }>({ key: "", page: EMPTY_PAGE });
  const [shortRows, setShortRows] = useState(0);
  const [dialog, setDialog] = useState<ProductionDialog>(
    openCreateShort ? { kind: "create", onlyShort: true } : null,
  );

  const can = useMemo(
    () => ({
      create: allows(role, "production_requests", "create"),
      update: allows(role, "production_requests", "update"),
      delete: allows(role, "production_requests", "delete"),
      receive: allows(role, "production", "receive"),
    }),
    [role],
  );

  useEffect(() => {
    supplierApi
      .getList({ type: "WORKSHOP", limit: 100 })
      .then((res) => setWorkshops(res.data))
      .catch(() => setWorkshops([]));
    Promise.all([
      branchApi.getList({ status: "ACTIVE", limit: 100 }).catch(() => null),
      warehouseApi.getList({ status: "ACTIVE", limit: 100 }).catch(() => null),
    ]).then(([branches, warehouses]) => {
      setLocations([
        ...(branches?.data ?? []).map((b) => ({
          id: b.id,
          name: b.name,
          type: "BRANCH" as const,
          isSellable: b.isSellable !== false,
        })),
        ...(warehouses?.data ?? []).map((w) => ({
          id: w.id,
          name: w.name,
          type: "WAREHOUSE" as const,
          isSellable: w.isSellable !== false,
        })),
      ]);
    });
  }, []);

  useEffect(() => {
    let alive = true;
    const f = JSON.parse(requestKey) as RequestFilter;
    productionRequestApi
      .getList({
        page: f.page,
        limit: f.limit,
        status: f.status === "ALL" ? undefined : f.status,
        locationId: f.locationId === "ALL" ? undefined : f.locationId,
        search: f.search.trim() || undefined,
      })
      .then((page) => alive && setRequestState({ key: requestKey, page }))
      .catch((error) => {
        if (!alive) return;
        setRequestState({ key: requestKey, page: EMPTY_PAGE });
        toast.error(
          productionErrorMessage(
            error,
            "Không tải được danh sách yêu cầu sản xuất",
          ),
        );
      });
    return () => {
      alive = false;
    };
  }, [requestKey]);

  useEffect(() => {
    let alive = true;
    const { locationId } = JSON.parse(shortKey) as { locationId: string };
    productionRequestApi
      .getProductionList({
        onlyShort: true,
        limit: 1,
        locationId: locationId === "ALL" ? undefined : locationId,
      })
      .then((page) => alive && setShortRows(page.summary.shortRows))
      .catch(() => alive && setShortRows(0));
    return () => {
      alive = false;
    };
  }, [shortKey]);

  /** Every write changes the numbers: a request moves on-order / drafted, a receipt moves stock. */
  const refreshAll = useCallback(() => setVersion((v) => v + 1), []);

  const run = useCallback(
    async (
      work: () => Promise<unknown>,
      success: string,
      failure: string,
    ): Promise<boolean> => {
      try {
        await work();
        toast.success(success);
        refreshAll();
        return true;
      } catch (error) {
        toast.error(productionErrorMessage(error, failure));
        return false;
      }
    },
    [refreshAll],
  );

  const value: ProductionContextType = {
    can,
    workshops,
    locations,
    scopedLocationId,
    requests: requestState.page,
    requestsLoading: requestState.key !== requestKey,
    filter,
    setFilter: (patch) =>
      setFilterState((f) => ({ ...f, ...patch, page: patch.page ?? 1 })),
    shortRows,
    version,
    dialog,
    setDialog,
    create: (payload) =>
      run(
        () => productionRequestApi.create(payload),
        "Đã tạo yêu cầu sản xuất",
        "Không tạo được yêu cầu sản xuất",
      ),
    update: (id, payload) =>
      run(
        () =>
          productionRequestApi.update(
            id,
            payload as CreateProductionRequestPayload,
          ),
        "Đã cập nhật yêu cầu sản xuất",
        "Không cập nhật được yêu cầu sản xuất",
      ),
    send: async (id) => {
      await run(
        () => productionRequestApi.updateStatus(id, { status: "SENT" }),
        "Đã đánh dấu đã gửi xưởng",
        "Không gửi được yêu cầu",
      );
    },
    cancel: async (id) => {
      await run(
        () => productionRequestApi.updateStatus(id, { status: "CANCELLED" }),
        "Đã huỷ yêu cầu sản xuất",
        "Không huỷ được yêu cầu",
      );
    },
    closeShort: (id, reason) =>
      run(
        () =>
          productionRequestApi.updateStatus(id, {
            status: "COMPLETED",
            note: reason,
          }),
        "Đã đóng yêu cầu, phần còn lại không chờ nữa",
        "Không đóng được yêu cầu",
      ),
    remove: async (id) => {
      await run(
        () => productionRequestApi.remove(id),
        "Đã xoá yêu cầu nháp",
        "Không xoá được yêu cầu",
      );
    },
    receive: (id, payload) =>
      run(
        () => productionRequestApi.receive(id, payload),
        "Đã nhập hàng xưởng vào kho",
        "Không nhập được hàng xưởng",
      ),
  };

  return (
    <ProductionContext.Provider value={value}>
      {children}
    </ProductionContext.Provider>
  );
}

export function useProduction() {
  const ctx = useContext(ProductionContext);
  if (!ctx)
    throw new Error("useProduction must be used within <ProductionProvider>");
  return ctx;
}
