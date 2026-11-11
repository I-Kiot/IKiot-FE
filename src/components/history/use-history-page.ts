"use client";

import { useEffect, useState } from "react";
import type { HistoryPagination } from "@/types/history";

type Result<T> = {
  /** Yêu cầu (bộ lọc + trang) mà kết quả này trả lời. */
  forKey: string;
  rows: T[];
  pagination: HistoryPagination | null;
  error: boolean;
};

/**
 * Tải từng trang lịch sử. `fetchPage` phải được memo (đổi khi bộ lọc đổi); `filterKey` là chuỗi nhận diện bộ lọc,
 * đổi thì quay về trang 1. `enabled=false` thì không gọi (vd. hộp thoại đang đóng).
 */
export function useHistoryPage<T>(
  fetchPage: (page: number) => Promise<{ data: T[]; pagination: HistoryPagination }>,
  enabled: boolean,
  filterKey: string,
) {
  const [pageState, setPageState] = useState({ filterKey, page: 1 });
  const page = pageState.filterKey === filterKey ? pageState.page : 1;
  const requestKey = `${filterKey}#${page}`;
  const [result, setResult] = useState<Result<T> | null>(null);
  const [reloadTick, setReloadTick] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    fetchPage(page)
      .then((res) => {
        if (!cancelled) setResult({ forKey: requestKey, rows: res.data, pagination: res.pagination, error: false });
      })
      .catch(() => {
        if (!cancelled) setResult({ forKey: requestKey, rows: [], pagination: null, error: true });
      });
    return () => {
      cancelled = true;
    };
  }, [enabled, fetchPage, page, requestKey, reloadTick]);

  const loading = enabled && result?.forKey !== requestKey;
  return {
    rows: result?.rows ?? [],
    pagination: result?.pagination ?? null,
    loading,
    error: !loading && (result?.error ?? false),
    page,
    setPage: (next: number) => setPageState({ filterKey, page: next }),
    reload: () => setReloadTick((n) => n + 1),
  };
}
