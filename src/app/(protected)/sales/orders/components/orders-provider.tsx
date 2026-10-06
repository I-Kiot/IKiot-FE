"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { orderJourneyApi } from "@/lib/api/order-journey";
import { getApiErrorBody, messageForCode } from "@/lib/api/error-codes";
import { getSessionUserId } from "@/lib/auth";
import { parseLocationKey } from "@/lib/location-key";
import { useAuthStore } from "@/store/auth-store";
import type {
  OrderJourneyQuery,
  OrderListItem,
  OrderPriority,
  OrderSort,
  OrderStatus,
  StockCheckStatus,
} from "@/types/order-flow";

/** The list's own filters; "all" = not sent. */
export interface OrdersListQuery {
  page: number;
  limit: number;
  search: string;
  status: OrderStatus | "all";
  priority: OrderPriority | "all";
  stockSummary: StockCheckStatus | "all";
  sort: OrderSort;
  /** Only orders the signed-in account is in charge of. */
  mineOnly: boolean;
}

const DEFAULT_LIST_QUERY: OrdersListQuery = {
  page: 1,
  limit: 10,
  search: "",
  status: "all",
  priority: "all",
  stockSummary: "all",
  sort: "createdAt",
  mineOnly: false,
};

/** One answer from the server, tagged with the request it answers. */
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
  /** Change one filter; every change but the page itself goes back to page 1. */
  updateQuery: (patch: Partial<Omit<OrdersListQuery, "page">>) => void;
  updatePage: (page: number) => void;
  resetFilters: () => void;
};

const OrdersContext = React.createContext<OrdersContextType | null>(null);

function errorMessage(error: unknown): string {
  return (
    messageForCode(getApiErrorBody(error)?.code) ??
    "Không tải được danh sách đơn hàng"
  );
}

type OrdersProviderProps = {
  children: React.ReactNode;
  enabled?: boolean;
};

/** State and fetching for the order list (D-1, `GET /orders`): filters, sort and paging all run on the server. */
export function OrdersProvider({ children, enabled = true }: OrdersProviderProps) {
  const [listQuery, setListQuery] = useState<OrdersListQuery>(DEFAULT_LIST_QUERY);
  const [keywordInput, setKeywordInput] = useState("");
  const [result, setResult] = useState<ListResult | null>(null);
  const locationKey = useAuthStore((state) => state.locationKey);

  // Switching branch in the header starts the list again from page 1 - adjusted while
  // rendering, the way React recommends for state that follows a changing input.
  const [listedLocationKey, setListedLocationKey] = useState(locationKey);
  if (listedLocationKey !== locationKey) {
    setListedLocationKey(locationKey);
    setListQuery((prev) => (prev.page === 1 ? prev : { ...prev, page: 1 }));
  }

  // Typing waits 400ms before it becomes a request, as on the staff list.
  useEffect(() => {
    const timer = setTimeout(() => {
      setListQuery((prev) =>
        prev.search === keywordInput ? prev : { ...prev, search: keywordInput, page: 1 },
      );
    }, 400);
    return () => clearTimeout(timer);
  }, [keywordInput]);

  const params = useMemo<OrderJourneyQuery>(() => {
    // The header's branch switcher scopes the list. Orders belong to a branch, not a
    // warehouse, so a warehouse in the switcher narrows nothing here.
    const scope = parseLocationKey(locationKey);
    return {
      page: listQuery.page,
      limit: listQuery.limit,
      search: listQuery.search || undefined,
      status: listQuery.status === "all" ? undefined : listQuery.status,
      priority: listQuery.priority === "all" ? undefined : listQuery.priority,
      stockSummary: listQuery.stockSummary === "all" ? undefined : listQuery.stockSummary,
      sort: listQuery.sort,
      assigneeId: listQuery.mineOnly ? getSessionUserId() : undefined,
      branchId: scope?.locationType === "BRANCH" ? scope.locationId : undefined,
    };
  }, [listQuery, locationKey]);

  useEffect(() => {
    if (!enabled) return;
    // Filters change faster than the server answers: a request whose filters are no longer
    // current is dropped when it lands, so an old answer never overwrites a newer one.
    let cancelled = false;
    orderJourneyApi
      .getList(params)
      .then((response) => {
        if (cancelled) return;
        setResult({
          params,
          orders: response.data,
          total: response.pagination.total,
          totalPages: Math.max(1, response.pagination.totalPages),
        });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        toast.error(errorMessage(error));
        setResult({ params, orders: [], total: 0, totalPages: 1 });
      });
    return () => {
      cancelled = true;
    };
  }, [params, enabled]);

  const updateQuery = useCallback(
    (patch: Partial<Omit<OrdersListQuery, "page">>) => {
      setListQuery((prev) => ({ ...prev, ...patch, page: 1 }));
    },
    [],
  );

  const updatePage = useCallback((page: number) => {
    setListQuery((prev) => ({ ...prev, page }));
  }, []);

  const resetFilters = useCallback(() => {
    setKeywordInput("");
    setListQuery((prev) => ({ ...DEFAULT_LIST_QUERY, limit: prev.limit }));
  }, []);

  return (
    <OrdersContext.Provider
      value={{
        // The last answer stays on screen (dimmed) while the next one loads.
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
      }}
    >
      {children}
    </OrdersContext.Provider>
  );
}

export function useOrders() {
  const context = React.useContext(OrdersContext);
  if (!context) throw new Error("useOrders must be used within <OrdersProvider>");
  return context;
}
