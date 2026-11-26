"use client";

// State chung của dashboard: kỳ, địa điểm, phiên bản tải lại.

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
  /** Nơi đang xem cho số liệu đơn hàng. */
  branchId?: string;
  /** Chỉ có khi đang xem kho; số liệu tồn kho ưu tiên giá trị này. */
  warehouseId?: string;
  /** Tăng khi có realtime hoặc bấm "Làm mới". */
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

  // Đặt kỳ và bản quy đổi trong handler.
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

  // Gom sự kiện trong 1,5 giây thành một lần tải.
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
        branchId: branchId ?? warehouseId,
        warehouseId,
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
