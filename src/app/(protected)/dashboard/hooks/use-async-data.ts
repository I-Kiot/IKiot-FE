"use client";

// Tải dữ liệu cho một widget, bỏ kết quả muộn.

import { useEffect, useState } from "react";

interface Loaded<T> {
  /** Hàm tải và khoá đã sinh ra kết quả này - khác cái hiện tại nghĩa là kết quả đã cũ. */
  load: () => Promise<T>;
  reloadKey: number;
  data: T | null;
  failed: boolean;
}

export interface AsyncData<T> {
  /** Kết quả gần nhất; vẫn giữ trong lúc tải lần mới để màn hình không nháy trắng. */
  data: T | null;
  /** Chưa có kết quả cho lần tải hiện tại. */
  isLoading: boolean;
  failed: boolean;
}

/** `load` phải được useCallback; `reloadKey` buộc tải lại. */
export function useAsyncData<T>(load: () => Promise<T>, reloadKey = 0): AsyncData<T> {
  const [loaded, setLoaded] = useState<Loaded<T> | null>(null);

  useEffect(() => {
    let cancelled = false;
    load().then(
      (data) => {
        if (!cancelled) setLoaded({ load, reloadKey, data, failed: false });
      },
      (error: unknown) => {
        if (cancelled) return;
        console.error(error);
        setLoaded({ load, reloadKey, data: null, failed: true });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [load, reloadKey]);

  const isCurrent = loaded !== null && loaded.load === load && loaded.reloadKey === reloadKey;
  return {
    data: loaded?.data ?? null,
    isLoading: !isCurrent,
    failed: isCurrent && loaded.failed,
  };
}
