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
  /** Thay vài trường của một dòng sau khi đổi ngay tại danh sách (người phụ trách, shipper), không tải lại cả trang. */
  patchOrder: (id: string, patch: Partial<OrderListItem>) => void;
};

/** Danh sách đơn chỉ tự cập nhật khi bảng `orders` đổi (tồn kho trên dòng đơn: chờ sự kiện đơn kế tiếp, xem kế hoạch live refresh). */
const LIVE_RESOURCES = [CHANGE_RESOURCES.ORDERS] as const;
/**
 * "Đủ / thiếu hàng" của dòng đơn tính lúc đọc từ tồn kho, nên nhận hàng xưởng, nhập kho, chuyển kho là thay đổi của bảng khác chứ không phải của đơn.
 * Đăng ký riêng, không truyền `ids`/`visibleIds` nên chỉ tải lại im lặng, không bao giờ toast.
 */
const STOCK_RESOURCES = [
  CHANGE_RESOURCES.INVENTORIES,
  CHANGE_RESOURCES.PRODUCTION_REQUESTS,
  CHANGE_RESOURCES.PRODUCTION_DELIVERIES,
] as const;

const OrdersContext = React.createContext<OrdersContextType | null>(null);

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
  // `?status=` mở danh sách đã lọc sẵn (các dòng "Tình trạng đơn" trên dashboard trỏ vào đây).
  // Chỉ đọc lúc mở trang; sau đó bộ lọc trên màn hình là nguồn duy nhất.
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
  const liveTick = ordersTick + stockTick;

  // Đổi chi nhánh ở header đưa danh sách về trang 1; điều chỉnh ngay lúc render, đúng cách React khuyến nghị cho state theo input đổi.
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
    // Bộ chuyển chi nhánh ở header áp dụng cho danh sách. Chọn kho không lọc theo nơi bán, vì kho còn xử lý đơn của các chi nhánh.
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
    // Bộ lọc đổi nhanh hơn server trả lời: request có bộ lọc cũ sẽ bị bỏ khi về, nên đơn cũ không đè kết quả mới.
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

  const resetFilters = useCallback(() => {
    setKeywordInput("");
    setListQuery((prev) => ({ ...DEFAULT_LIST_QUERY, limit: prev.limit }));
  }, []);

  return (
    <OrdersContext.Provider
      value={{
        // Kết quả cũ vẫn hiện (mờ) trong lúc tải kết quả mới.
        orders: result?.orders ?? [],
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
