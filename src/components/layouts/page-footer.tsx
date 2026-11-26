"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

// Chân trang cố định cho thanh phân trang, render qua portal vào PageFooterSlot.

type PageFooterContextValue = { slot: HTMLElement | null; setSlot: (el: HTMLElement | null) => void };

const PageFooterContext = React.createContext<PageFooterContextValue | null>(null);

export function PageFooterProvider({ children }: { children: React.ReactNode }) {
  const [slot, setSlot] = React.useState<HTMLElement | null>(null);
  const value = React.useMemo(() => ({ slot, setSlot }), [slot]);
  return <PageFooterContext.Provider value={value}>{children}</PageFooterContext.Provider>;
}

/** Ô chứa chân trang, cuối khung nội dung. */
export function PageFooterSlot({ className }: { className?: string }) {
  const ctx = React.useContext(PageFooterContext);
  return (
    <div
      ref={ctx?.setSlot}
      data-slot="page-footer"
      className={cn(
        // Luôn dính đáy; ẩn khi không có phân trang.
        "bg-background shrink-0 border-t px-4 empty:hidden lg:px-6",
        className,
      )}
    />
  );
}

/** Đưa nội dung xuống chân trang; nếu không có layout bao quanh thì hiển thị tại chỗ. */
export function PageFooter({ children }: { children: React.ReactNode }) {
  const ctx = React.useContext(PageFooterContext);
  if (!ctx) return <>{children}</>;
  // Chưa vẽ khi ô chưa gắn xong.
  if (!ctx.slot) return null;
  return createPortal(children, ctx.slot);
}
