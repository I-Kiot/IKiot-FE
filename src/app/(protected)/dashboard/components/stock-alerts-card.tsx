"use client";

// Cảnh báo tồn kho: hết hàng, sắp hết, dưới mức tối thiểu, lâu không bán (30 / 60 / 90 ngày).
// Mỗi nhóm mở ra 5 dòng nặng nhất; con số bên cạnh là tổng của cả nhóm.

import { useCallback, type ReactNode } from "react";
import Link from "next/link";
import { ArchiveX, Clock3, PackageMinus, PackageX, PackagePlus, TrendingDown, Warehouse } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { allows } from "@/components/sidebar/constants/role-permissions";
import { getSessionRole } from "@/lib/auth";
import { statsApi, type StockAgingLevel, type StockAlertItem, type StockAlerts } from "@/lib/api/stats";
import { formatNumber } from "@/lib/stats-format";
import { useAsyncData } from "../hooks/use-async-data";
import { useOverview } from "./overview-provider";
import { WidgetCard, WidgetMessage } from "./widget-card";
import { TONE_TEXT, TONE_TILE, type Tone } from "../shared/tones";

/** Ngưỡng "sắp hết" của dashboard: tồn trên kệ từ 1 đến số này. Trang Báo cáo cho chỉnh bằng thanh trượt. */
const LOW_STOCK_THRESHOLD = 10;

type AgingCountKey = keyof StockAlerts["counts"]["aging"];

/** Ba mức lâu không bán (chốt 2026-10-20), mỗi mức kèm khoá đếm của nó trong `counts.aging`. */
const AGING_DISPLAY: Record<Exclude<StockAgingLevel, "NORMAL">, { label: string; tone: Tone; countKey: AgingCountKey }> = {
  WARNING: { label: "30–59 ngày", tone: "amber", countKey: "warning" },
  ATTENTION: { label: "60–89 ngày", tone: "orange", countKey: "attention" },
  STALE: { label: "Từ 90 ngày", tone: "red", countKey: "stale" },
};

type AlertGroupKey = keyof StockAlerts["items"];

interface AlertGroup {
  key: AlertGroupKey;
  label: string;
  hint: string;
  icon: LucideIcon;
  tone: Tone;
  count: number;
  items: StockAlertItem[];
}

function groupsOf(alerts: StockAlerts): AlertGroup[] {
  const { counts, items } = alerts;
  return [
    { key: "outOfStock", label: "Hết hàng", hint: "Trên kệ không còn cái nào", icon: PackageX, tone: "red", count: counts.outOfStock, items: items.outOfStock },
    { key: "lowStock", label: "Sắp hết hàng", hint: `Còn 1–${alerts.lowStockThreshold} trên kệ`, icon: PackageMinus, tone: "orange", count: counts.lowStock, items: items.lowStock },
    { key: "belowMin", label: "Dưới mức tối thiểu", hint: "Tồn trên kệ ≤ mức tối thiểu đã đặt", icon: TrendingDown, tone: "amber", count: counts.belowMin, items: items.belowMin },
    {
      key: "aging",
      label: "Lâu không bán",
      hint: "Không bán được từ 30 ngày trở lên",
      icon: Clock3,
      tone: "slate",
      count: counts.aging.warning + counts.aging.attention + counts.aging.stale,
      items: items.aging,
    },
  ];
}

/** Con số phụ của từng dòng: tồn trên kệ, mức tối thiểu, hay số ngày chưa bán. */
function itemDetail(group: AlertGroupKey, item: StockAlertItem): ReactNode {
  if (group === "belowMin") {
    return `${formatNumber(item.shelf)} / tối thiểu ${formatNumber(item.minStock)}`;
  }
  if (group === "aging" && item.agingLevel && item.agingLevel !== "NORMAL") {
    const display = AGING_DISPLAY[item.agingLevel];
    return <span className={TONE_TEXT[display.tone]}>{formatNumber(item.daysIdle ?? 0)} ngày</span>;
  }
  return `Còn ${formatNumber(item.shelf)}`;
}

export function StockAlertsCard() {
  const { branchId, warehouseId, liveVersion } = useOverview();
  const load = useCallback(
    () => statsApi.getStockAlerts({ branchId, warehouseId, lowStockThreshold: LOW_STOCK_THRESHOLD }),
    [branchId, warehouseId],
  );
  const { data, isLoading, failed } = useAsyncData(load, liveVersion);
  const role = getSessionRole();
  const canImport = allows(role, "stock_movement", "create");

  let body: ReactNode;
  if (!data && isLoading) {
    body = (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-10 w-full" />
        ))}
      </div>
    );
  } else if (!data || failed) {
    body = <WidgetMessage>Không tải được cảnh báo tồn kho.</WidgetMessage>;
  } else {
    body = (
      <div className={`transition-opacity ${isLoading ? "opacity-60" : ""}`}>
        <Accordion type="single" collapsible className="-mx-2">
          {groupsOf(data).map((group) => {
            const Icon = group.icon;
            return (
              <AccordionItem key={group.key} value={group.key} className="border-b-0">
                <AccordionTrigger
                  className="min-h-11 cursor-pointer items-center rounded-md px-2 py-1.5 hover:bg-muted hover:no-underline disabled:cursor-default"
                  disabled={group.count === 0}
                >
                  <span className="flex flex-1 items-center gap-3">
                    <span className={`flex size-8 shrink-0 items-center justify-center rounded-md ${TONE_TILE[group.tone]}`}>
                      <Icon className="size-4" aria-hidden />
                    </span>
                    <span className="flex flex-col items-start text-left">
                      <span className="text-sm font-normal">{group.label}</span>
                      <span className="text-xs font-normal text-muted-foreground">{group.hint}</span>
                    </span>
                    <span className={`ml-auto text-base font-semibold tabular-nums ${group.count > 0 ? TONE_TEXT[group.tone] : "text-muted-foreground"}`}>
                      {formatNumber(group.count)}
                    </span>
                  </span>
                </AccordionTrigger>
                <AccordionContent className="px-2 pb-2">
                  {group.key === "aging" && (
                    <div className="mb-2 flex flex-wrap gap-1.5 pl-11">
                      {Object.values(AGING_DISPLAY).map((level) => (
                        <span key={level.countKey} className={`rounded-full px-2 py-0.5 text-xs font-medium ${TONE_TILE[level.tone]}`}>
                          {level.label}: {formatNumber(data.counts.aging[level.countKey])}
                        </span>
                      ))}
                    </div>
                  )}
                  <ul className="space-y-1.5 pl-11">
                    {group.items.map((item) => (
                      <li key={item.inventoryId} className="flex items-baseline justify-between gap-3 text-sm">
                        <span className="min-w-0">
                          <span className="block truncate">{item.productName}</span>
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Warehouse className="size-3" aria-hidden />
                            {item.locationName}
                            {item.sku ? ` · ${item.sku}` : ""}
                          </span>
                        </span>
                        <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{itemDetail(group.key, item)}</span>
                      </li>
                    ))}
                  </ul>
                  {group.count > group.items.length && (
                    <p className="mt-2 pl-11 text-xs text-muted-foreground">
                      và {formatNumber(group.count - group.items.length)} dòng khác
                    </p>
                  )}
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
        {canImport && (
          <Button asChild variant="outline" size="sm" className="mt-3 w-full">
            <Link href="/exchange/imports">
              <PackagePlus className="size-4" aria-hidden />
              Tạo phiếu nhập hàng
            </Link>
          </Button>
        )}
      </div>
    );
  }

  return (
    <WidgetCard title="Cảnh báo tồn kho" icon={ArchiveX} tone="red" viewAll={{ href: "/products" }}>
      {body}
    </WidgetCard>
  );
}
