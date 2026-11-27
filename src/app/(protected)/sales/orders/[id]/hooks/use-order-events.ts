"use client";

import { useEffect, useState } from "react";
import { getApiErrorBody, messageForCode } from "@/lib/api/error-codes";
import { orderJourneyApi } from "@/lib/api/order-journey";
import type { OrderEvent } from "@/types/order-event";

type State = { key: string; events: OrderEvent[]; error: string | null };

/** Nhật ký thao tác của đơn; tải lại mỗi khi `refreshKey` đổi (sau hành động / cập nhật đơn). */
export function useOrderEvents(orderId: string, refreshKey: string) {
  const key = `${orderId}|${refreshKey}`;
  const [state, setState] = useState<State | null>(null);

  useEffect(() => {
    let cancelled = false;
    orderJourneyApi
      .getEvents(orderId)
      .then((events) => {
        if (!cancelled) setState({ key, events: Array.isArray(events) ? events : [], error: null });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        const message = messageForCode(getApiErrorBody(error)?.code) ?? "Không tải được lịch sử đơn hàng";
        // Giữ danh sách cũ nếu lần đọc lại thất bại.
        setState((prev) => ({ key, events: prev?.events ?? [], error: message }));
      });
    return () => {
      cancelled = true;
    };
  }, [orderId, key]);

  return {
    events: state?.events ?? [],
    loading: state === null,
    error: state?.error ?? null,
  };
}
