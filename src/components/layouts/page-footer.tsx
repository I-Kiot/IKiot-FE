"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

// Chân trang cố định cho thanh phân trang.
//
// Thanh phân trang luôn nằm sát đáy khung nội dung, dù bảng có 0 hay 100 dòng: trang ngắn thì dính đáy
// màn hình, trang dài thì dính đáy khung nhìn (sticky) khi cuộn. Mọi bảng giữ nguyên cách gọi cũ - chỉ cần
// bọc thanh phân trang trong <PageFooter>; nó được đưa (portal) vào ô PageFooterSlot ở cuối layout, thay vì
// nằm ngay dưới bảng. Bên ngoài layout có ô này (hộp thoại, trang không có sidebar) thì hiển thị tại chỗ.

type PageFooterContextValue = { slot: HTMLElement | null; setSlot: (el: HTMLElement | null) => void };

const PageFooterContext = React.createContext<PageFooterContextValue | null>(null);

export function PageFooterProvider({ children }: { children: React.ReactNode }) {
  const [slot, setSlot] = React.useState<HTMLElement | null>(null);
  const value = React.useMemo(() => ({ slot, setSlot }), [slot]);
  return <PageFooterContext.Provider value={value}>{children}</PageFooterContext.Provider>;
}

/** Ô chứa chân trang, đặt là phần tử cuối cùng của khung nội dung (flex-col, cao tối thiểu bằng màn hình). */
export function PageFooterSlot({ className }: { className?: string }) {
  const ctx = React.useContext(PageFooterContext);
  return (
    <div
      ref={ctx?.setSlot}
      data-slot="page-footer"
      className={cn(
        // mt-auto: trang ngắn thì đẩy xuống đáy; sticky bottom-0: trang dài thì luôn thấy khi cuộn.
        // empty:hidden: trang không có phân trang thì không hiện đường kẻ.
        "bg-background sticky bottom-0 z-10 mt-auto border-t px-4 empty:hidden lg:px-6",
        className,
      )}
    />
  );
}

/** Đưa nội dung xuống chân trang; nếu không có layout bao quanh thì hiển thị tại chỗ. */
export function PageFooter({ children }: { children: React.ReactNode }) {
  const ctx = React.useContext(PageFooterContext);
  if (!ctx) return <>{children}</>;
  // Có layout nhưng ô chưa gắn xong (lần render đầu): chưa vẽ gì để thanh khỏi nhảy từ dưới bảng xuống đáy.
  if (!ctx.slot) return null;
  return createPortal(children, ctx.slot);
}
