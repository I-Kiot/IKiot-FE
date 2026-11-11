"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { getApiErrorBody } from "@/lib/api/error-codes";
import { sepayTransactionApi } from "@/lib/api/sepay-transaction";
import type { Paginated } from "@/types/order-flow";
import type { SepayResolution, SepayTransaction } from "@/types/sepay-transaction";

const DEFAULT_PAGE_SIZE = 15;

/** Danh sách giao dịch SePay cần xử lý + thao tác đánh dấu đã xử lý. */
export function useSepayTransactions(enabled: boolean) {
  const [unresolvedOnly, setUnresolvedOnlyState] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(DEFAULT_PAGE_SIZE);
  const [list, setList] = useState<Paginated<SepayTransaction> | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  // Khoá của lần tải đã xong gần nhất; đang tải = khoá hiện tại chưa được tải xong (không cần setState đồng bộ trong effect).
  const [settledKey, setSettledKey] = useState<string | null>(null);
  const requestKey = `${unresolvedOnly}|${page}|${pageSize}|${reloadKey}`;
  const isLoading = enabled && settledKey !== requestKey;

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    sepayTransactionApi
      .getList({ unresolved: unresolvedOnly || undefined, page, limit: pageSize })
      .then((res) => {
        if (!cancelled) setList(res);
      })
      .catch((error: unknown) => {
        if (!cancelled) toast.error(getApiErrorBody(error)?.message ?? "Không tải được giao dịch SePay");
      })
      .finally(() => {
        if (!cancelled) setSettledKey(requestKey);
      });
    return () => {
      cancelled = true;
    };
  }, [enabled, unresolvedOnly, page, pageSize, requestKey]);

  const refetch = useCallback(() => setReloadKey((key) => key + 1), []);

  const setUnresolvedOnly = (value: boolean) => {
    setUnresolvedOnlyState(value);
    setPage(1);
  };
  const setPageSize = (value: number) => {
    setPageSizeState(value);
    setPage(1);
  };

  /** Trả true khi ghi thành công. Đã xử lý rồi (409) thì tải lại danh sách để thấy trạng thái thật. */
  const resolve = useCallback(
    async (id: string, resolution: SepayResolution, note: string): Promise<boolean> => {
      try {
        await sepayTransactionApi.resolve(id, { resolution, note: note.trim() || undefined });
        toast.success("Đã đánh dấu giao dịch là đã xử lý");
        setReloadKey((key) => key + 1);
        return true;
      } catch (error) {
        const body = getApiErrorBody(error);
        toast.error(body?.message ?? "Không xử lý được giao dịch, vui lòng thử lại");
        if (body?.code === "SEPAY_TRANSACTION_ALREADY_RESOLVED") setReloadKey((key) => key + 1);
        return false;
      }
    },
    [],
  );

  return {
    list,
    isLoading,
    unresolvedOnly,
    setUnresolvedOnly,
    page,
    setPage,
    pageSize,
    setPageSize,
    refetch,
    resolve,
  };
}
