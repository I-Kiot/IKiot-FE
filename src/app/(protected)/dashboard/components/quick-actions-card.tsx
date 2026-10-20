"use client";

// Lối tắt tới các việc làm hằng ngày. Ô nào người xem không có quyền thì ẩn hẳn, không hiện
// rồi để họ bấm vào gặp màn hình từ chối.

import Link from "next/link";
import { BarChart3, Boxes, FilePlus2, PackagePlus, Settings, TicketPercent, Zap } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { allows } from "@/components/sidebar/constants/role-permissions";
import { getSessionRole } from "@/lib/auth";
import { WidgetCard } from "./widget-card";
import { TONE_TILE, type Tone } from "../shared/tones";

interface QuickAction {
  label: string;
  href: string;
  icon: LucideIcon;
  tone: Tone;
  /** Quyền của trang đích; null = ai đăng nhập cũng mở được. */
  permission: readonly [string, string] | null;
}

const ACTIONS: QuickAction[] = [
  { label: "Tạo đơn hàng", href: "/sales/orders/new", icon: FilePlus2, tone: "orange", permission: ["orders", "create"] },
  { label: "Sản phẩm", href: "/products", icon: Boxes, tone: "violet", permission: ["products", "read"] },
  { label: "Nhập hàng", href: "/exchange/imports", icon: PackagePlus, tone: "emerald", permission: ["stock_movement", "read"] },
  { label: "Khuyến mãi", href: "/promotions", icon: TicketPercent, tone: "red", permission: ["promotions", "read"] },
  { label: "Báo cáo", href: "/reports", icon: BarChart3, tone: "blue", permission: ["reports", "read"] },
  { label: "Cài đặt cửa hàng", href: "/settings", icon: Settings, tone: "slate", permission: null },
];

export function QuickActionsCard() {
  const role = getSessionRole();
  const visible = ACTIONS.filter((action) => action.permission === null || allows(role, action.permission[0], action.permission[1]));

  return (
    <WidgetCard title="Thao tác nhanh" icon={Zap} tone="amber">
      <div className="grid grid-cols-3 gap-1 xl:grid-cols-6">
        {visible.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.href}
              href={action.href}
              className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg border border-transparent p-1.5 text-center transition-colors hover:border-border hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring"
            >
              <span className={`flex size-8 items-center justify-center rounded-lg ${TONE_TILE[action.tone]}`}>
                <Icon className="size-4" aria-hidden />
              </span>
              <span className="text-xs font-medium leading-tight">{action.label}</span>
            </Link>
          );
        })}
      </div>
    </WidgetCard>
  );
}
