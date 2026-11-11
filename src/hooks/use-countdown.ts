"use client";

import { useEffect, useState } from "react";

export interface Countdown {
  remainingMs: number;
  expired: boolean;
  /** mm:ss */
  label: string;
}

/**
 * Đếm ngược tới `expiresAt` do server trả (nguồn sự thật, FE không tự cộng TTL).
 * `expiresAt` null hoặc không đọc được thì coi như đã hết hạn.
 */
export function useCountdown(expiresAt: string | null): Countdown {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!expiresAt) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [expiresAt]);

  const at = expiresAt ? Date.parse(expiresAt) : NaN;
  const remainingMs = Number.isNaN(at) ? 0 : Math.max(0, at - now);
  const totalSeconds = Math.ceil(remainingMs / 1000);
  const label = `${String(Math.floor(totalSeconds / 60)).padStart(2, "0")}:${String(totalSeconds % 60).padStart(2, "0")}`;
  return { remainingMs, expired: remainingMs <= 0, label };
}
