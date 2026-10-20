"use client";

// Trạng thái chung của dashboard tổng quan: kỳ đang xem, địa điểm đang chọn, và hai "phiên bản"
// để các widget biết lúc nào phải tải lại.

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useAuthStore } from "@/store/auth-store";
import { locationFilter } from "@/lib/location-key";
import { getSocket } from "@/lib/socket";
import { resolveOverviewRange, type OverviewRange, type ResolvedRange } from "../shared/overview-range";

/** Socket thường bắn dồn (một đơn đổi nhiều bước liền nhau) - gom lại rồi mới tải một lần. */
const SOCKET_REFRESH_DELAY_MS = 1500;

interface OverviewContextValue {
  range: OverviewRange;
  /** Kỳ đã quy ra ngày, tính đúng một lần lúc chọn - không tính lại mỗi lần render. */
  resolved: ResolvedRange;
  setRange: (range: OverviewRange) => void;
  branchId?: string;
  warehouseId?: string;
  isWarehouse: boolean;
  /**
   * Tăng khi có sự kiện realtime: chỉ các widget "ngay lúc này" (tình trạng đơn, tồn kho, đơn
   * gần đây) tải lại; "Làm mới" cũng tăng nó. Số liệu theo kỳ tải lại vì `resolved` được tính lại.
   */
  liveVersion: number;
  refresh: () => void;
}

const OverviewContext = React.createContext<OverviewContextValue | null>(null);

interface RangeState {
  range: OverviewRange;
  resolved: ResolvedRange;
}

export function OverviewProvider({ children }: { children: React.ReactNode }) {
  const locationKey = useAuthStore((state) => state.locationKey);
  const { branchId, warehouseId } = locationFilter(locationKey);

  // Kỳ và bản quy đổi của nó đi cùng nhau, đặt trong handler. `toParam` mang "bây giờ", nên nếu
  // tính trong render thì mỗi lần render ra một giá trị mới và widget tải lại không dừng.
  const [rangeState, setRangeState] = useState<RangeState>(() => {
    const range: OverviewRange = { preset: "today" };
    return { range, resolved: resolveOverviewRange(range) };
  });
  const [liveVersion, setLiveVersion] = useState(0);

  const setRange = useCallback((range: OverviewRange) => {
    setRangeState({ range, resolved: resolveOverviewRange(range) });
  }, []);

  const refresh = useCallback(() => {
    setRangeState((current) => ({ range: current.range, resolved: resolveOverviewRange(current.range) }));
    setLiveVersion((version) => version + 1);
  }, []);

  // Đơn được thanh toán, hay một thông báo mới (hàng sắp hết, phiếu kho...) đều có thể đổi các
  // con số "ngay lúc này". Gom các sự kiện đến dồn trong 1,5 giây thành một lần tải.
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    const socket = getSocket();
    const schedule = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setLiveVersion((version) => version + 1), SOCKET_REFRESH_DELAY_MS);
    };
    socket.on("order:paid", schedule);
    socket.on("notification", schedule);
    return () => {
      socket.off("order:paid", schedule);
      socket.off("notification", schedule);
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  return (
    <OverviewContext.Provider
      value={{
        range: rangeState.range,
        resolved: rangeState.resolved,
        setRange,
        branchId,
        warehouseId,
        isWarehouse: Boolean(warehouseId),
        liveVersion,
        refresh,
      }}
    >
      {children}
    </OverviewContext.Provider>
  );
}

export function useOverview() {
  const context = React.useContext(OverviewContext);
  if (!context) throw new Error("useOverview must be used within <OverviewProvider>");
  return context;
}
