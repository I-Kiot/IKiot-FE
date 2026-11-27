"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { orderJourneyApi } from "@/lib/api/order-journey";
import { getApiErrorBody, messageForCode } from "@/lib/api/error-codes";
import { getSessionUserId } from "@/lib/auth";
import { parseLocationKey } from "@/lib/location-key";
import { useAuthStore } from "@/store/auth-store";
import { useLiveTick } from "@/hooks/use-live-refresh";
import { CHANGE_RESOURCES } from "@/types/change-feed";
import {
  ORDER_STATUSES,
  type FulfillmentType,
  type OrderAttention,
  type OrderJourneyQuery,
  type OrderListItem,
  type OrderPriority,
  type OrderSort,
  type OrderStatus,
  type RemittanceStatus,
  type StockCheckStatus,
} from "@/types/order-flow";

/** Bộ lọc riêng của danh sách; "all" = không gửi. */
export interface OrdersListQuery {
  page: number;
  limit: number;
  search: string;
  status: OrderStatus | "all";
  priority: OrderPriority | "all";
  /** Hình thức giao, vd chỉ đơn khách tới lấy. */
  fulfillmentType: FulfillmentType | "all";
  stockSummary: StockCheckStatus | "all";
  /** Lối tắt từ banner: đơn thiếu hàng trên kệ, hoặc đơn sắp đến hạn giao. */
  attention: OrderAttention | "all";
  /** D-9: đơn mà tiền còn ở shipper (`PENDING`) hoặc đã nộp lại. */
  cashRemittanceStatus: RemittanceStatus | "all";
  sort: OrderSort;
  /** Chỉ đơn do tài khoản đang đăng nhập phụ trách. */
  mineOnly: boolean;
}

const DEFAULT_LIST_QUERY: OrdersListQuery = {
  page: 1,
  limit: 10,
  search: "",
  status: "all",
  priority: "all",
  fulfillmentType: "all",
  stockSummary: "all",
  attention: "all",
  cashRemittanceStatus: "all",
  sort: "createdAt",
  mineOnly: false,
};

/** Một kết quả từ server, gắn với request mà nó trả lời. */
interface ListResult {
  params: OrderJourneyQuery;
  orders: OrderListItem[];
  total: number;
  totalPages: number;
}

type OrdersContextType = {
  orders: OrderListItem[];
  isInitialLoading: boolean;
  isFetching: boolean;
  total: number;
  totalPages: number;
  listQuery: OrdersListQuery;
  keywordInput: string;
  setKeywordInput: (value: string) => void;
  /** Đổi một bộ lọc; mọi thay đổi (trừ trang) đưa về trang 1. */
  updateQuery: (patch: Partial<Omit<OrdersListQuery, "page">>) => void;
  updatePage: (page: number) => void;
  resetFilters: () => void;
  /** Cập nhật vài trường của một dòng. */
  patchOrder: (id: string, patch: Partial<OrderListItem>) => void;
  /** Đơn đang tích (theo id) - bảng tích, nút "Sao chép" ở header đọc. Chỉ trong trang đang xem. */
  rowSelection: Record<string, boolean>;
  setRowSelection: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  selectedOrders: OrderListItem[];
  /** Tải lại danh sách với bộ lọc hiện tại. */
  reload: () => void;
};

/** Tải lại khi bảng `orders` đổi. */
const LIVE_RESOURCES = [CHANGE_RESOURCES.ORDERS] as const;
/** Tải lại im lặng khi tồn kho đổi. */
const STOCK_RESOURCES = [
  CHANGE_RESOURCES.INVENTORIES,
  CHANGE_RESOURCES.PRODUCTION_REQUESTS,
  CHANGE_RESOURCES.PRODUCTION_DELIVERIES,
] as const;

const OrdersContext = React.createContext<OrdersContextType | null>(null);

const EMPTY_SELECTION: Record<string, boolean> = {};

function errorMessage(error: unknown): string {
  return (
    messageForCode(getApiErrorBody(error)?.code) ??
    "Không tải được danh sách đơn hàng"
  );
}

/** Trạng thái lấy từ URL; giá trị lạ (gõ tay, link cũ) coi như không lọc. */
function statusFromUrl(value: string | null): OrderStatus | "all" {
  const known = ORDER_STATUSES.find((status) => status === value);
  return known ?? "all";
}

type OrdersProviderProps = {
  children: React.ReactNode;
  enabled?: boolean;
};

/** State và fetch danh sách đơn (D-1, `GET /orders`): lọc, sắp xếp, phân trang đều chạy ở server. */
export function OrdersProvider({
  children,
  enabled = true,
}: OrdersProviderProps) {
  // `?status=` mở danh sách đã lọc sẵn.
  const searchParams = useSearchParams();
  const [listQuery, setListQuery] = useState<OrdersListQuery>(() => ({
    ...DEFAULT_LIST_QUERY,
    status: statusFromUrl(searchParams.get("status")),
  }));
  const [keywordInput, setKeywordInput] = useState("");
  const [result, setResult] = useState<ListResult | null>(null);
  const locationKey = useAuthStore((state) => state.locationKey);
  // Params của kết quả đang hiện: lần tải cùng params là lần tải nền (tick từ sự kiện), không báo lỗi.
  const shownParamsRef = useRef<OrderJourneyQuery | null>(null);
  const visibleIds = useMemo(() => result?.orders.map((order) => order.id) ?? [], [result]);
  const ordersTick = useLiveTick({ resources: LIVE_RESOURCES, visibleIds, enabled });
  const stockTick = useLiveTick({ resources: STOCK_RESOURCES, enabled });
  // Tải lại theo yêu cầu (vd. vừa nhập đơn từ Excel: realtime không phát lại cho chính tab gây ra thay đổi).
  const [reloadTick, setReloadTick] = useState(0);
  const reload = useCallback(() => setReloadTick((tick) => tick + 1), []);
  const liveTick = ordersTick + stockTick + reloadTick;

  // Đổi chi nhánh thì về trang 1.
  const [listedLocationKey, setListedLocationKey] = useState(locationKey);
  if (listedLocationKey !== locationKey) {
    setListedLocationKey(locationKey);
    setListQuery((prev) => (prev.page === 1 ? prev : { ...prev, page: 1 }));
  }

  // Gõ tìm kiếm chờ 400ms mới thành request, như danh sách nhân viên.
  useEffect(() => {
    const timer = setTimeout(() => {
      setListQuery((prev) =>
        prev.search === keywordInput
          ? prev
          : { ...prev, search: keywordInput, page: 1 },
      );
    }, 400);
    return () => clearTimeout(timer);
  }, [keywordInput]);

  const params = useMemo<OrderJourneyQuery>(() => {
    // Lọc theo chi nhánh ở header.
    const scope = parseLocationKey(locationKey);
    return {
      page: listQuery.page,
      limit: listQuery.limit,
      search: listQuery.search || undefined,
      status: listQuery.status === "all" ? undefined : listQuery.status,
      priority: listQuery.priority === "all" ? undefined : listQuery.priority,
      fulfillmentType:
        listQuery.fulfillmentType === "all" ? undefined : listQuery.fulfillmentType,
      stockSummary:
        listQuery.stockSummary === "all" ? undefined : listQuery.stockSummary,
      cashRemittanceStatus:
        listQuery.cashRemittanceStatus === "all"
          ? undefined
          : listQuery.cashRemittanceStatus,
      attention:
        listQuery.attention === "all" ? undefined : listQuery.attention,
      sort: listQuery.sort,
      assigneeId: listQuery.mineOnly ? getSessionUserId() : undefined,
      branchId: scope?.locationType === "BRANCH" ? scope.locationId : undefined,
      // Bán tại quầy dùng chung route nhưng không thuộc hành trình (contract §2).
      excludePos: true,
    };
  }, [listQuery, locationKey]);

  useEffect(() => {
    if (!enabled) return;
    // Bỏ kết quả của bộ lọc cũ.
    let cancelled = false;
    // Tải lại nền (cùng bộ lọc, do `liveTick`): giữ nguyên dữ liệu đang hiện, lỗi thì im lặng.
    const silent = shownParamsRef.current === params;
    orderJourneyApi
      .getList(params)
      .then((response) => {
        if (cancelled) return;
        shownParamsRef.current = params;
        setResult({
          params,
          orders: response.data,
          total: response.pagination.total,
          totalPages: Math.max(1, response.pagination.totalPages),
        });
      })
      .catch((error: unknown) => {
        if (cancelled || silent) return;
        toast.error(errorMessage(error));
        shownParamsRef.current = params;
        setResult({ params, orders: [], total: 0, totalPages: 1 });
      });
    return () => {
      cancelled = true;
    };
  }, [params, enabled, liveTick]);

  const updateQuery = useCallback(
    (patch: Partial<Omit<OrdersListQuery, "page">>) => {
      setListQuery((prev) => ({ ...prev, ...patch, page: 1 }));
    },
    [],
  );

  const updatePage = useCallback((page: number) => {
    setListQuery((prev) => ({ ...prev, page }));
  }, []);

  const patchOrder = useCallback((id: string, patch: Partial<OrderListItem>) => {
    setResult((prev) =>
      prev
        ? {
            ...prev,
            orders: prev.orders.map((order) => (order.id === id ? { ...order, ...patch } : order)),
          }
        : prev,
    );
  }, []);

  // Lựa chọn gắn với bộ lọc / trang lúc tích.
  const [selection, setSelection] = useState<{
    query: OrdersListQuery;
    ids: Record<string, boolean>;
  }>({ query: listQuery, ids: {} });
  const rowSelection = selection.query === listQuery ? selection.ids : EMPTY_SELECTION;
  const setRowSelection: OrdersContextType["setRowSelection"] = useCallback(
    (update) =>
      setSelection((prev) => {
        const current = prev.query === listQuery ? prev.ids : EMPTY_SELECTION;
        return {
          query: listQuery,
          ids: typeof update === "function" ? update(current) : update,
        };
      }),
    [listQuery],
  );
  const orders = result?.orders ?? [];
  const selectedOrders = orders.filter((order) => rowSelection[order.id]);

  const resetFilters = useCallback(() => {
    setKeywordInput("");
    setListQuery((prev) => ({ ...DEFAULT_LIST_QUERY, limit: prev.limit }));
  }, []);

  return (
    <OrdersContext.Provider
      value={{
        // Kết quả cũ vẫn hiện (mờ) trong lúc tải kết quả mới.
        orders,
        isInitialLoading: enabled && result === null,
        isFetching: enabled && result?.params !== params,
        total: result?.total ?? 0,
        totalPages: result?.totalPages ?? 1,
        listQuery,
        keywordInput,
        setKeywordInput,
        updateQuery,
        updatePage,
        resetFilters,
        patchOrder,
        rowSelection,
        setRowSelection,
        selectedOrders,
        reload,
      }}
    >
      {children}
    </OrdersContext.Provider>
  );
}

export function useOrders() {
  const context = React.useContext(OrdersContext);
  if (!context)
    throw new Error("useOrders must be used within <OrdersProvider>");
  return context;
}
