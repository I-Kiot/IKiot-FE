"use client";

// Khung chung của các widget nhỏ trên dashboard: icon + tiêu đề + link "Xem tất cả", để mọi
// thẻ có cùng nhịp tiêu đề và khoảng cách.

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TONE_TILE, type Tone } from "../shared/tones";

interface WidgetCardProps {
  title: string;
  icon: LucideIcon;
  tone: Tone;
  /** Link "Xem tất cả" ở góc phải; bỏ trống khi người xem không có quyền mở trang đích. */
  viewAll?: { href: string; label?: string };
  /** Thêm điều khiển ở góc phải (tab, nút sắp xếp...), đặt trước link. */
  actions?: ReactNode;
  className?: string;
  children: ReactNode;
}

export function WidgetCard({ title, icon: Icon, tone, viewAll, actions, className, children }: WidgetCardProps) {
  return (
    <Card className={`gap-4 ${className ?? ""}`}>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${TONE_TILE[tone]}`}>
            <Icon className="size-4" aria-hidden />
          </span>
          <CardTitle className="truncate text-base">{title}</CardTitle>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {actions}
          {viewAll && (
            <Link
              href={viewAll.href}
              className="flex items-center gap-0.5 rounded-sm text-xs font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              {viewAll.label ?? "Xem tất cả"}
              <ChevronRight className="size-3.5" aria-hidden />
            </Link>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1">{children}</CardContent>
    </Card>
  );
}

/** Dòng thông báo trong một widget khi không tải được hoặc không có gì để hiện. */
export function WidgetMessage({ children }: { children: ReactNode }) {
  return <p className="py-6 text-center text-sm text-muted-foreground">{children}</p>;
}
