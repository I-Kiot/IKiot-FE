"use client";

// Sản phẩm bán chạy (top 5 theo số lượng hoặc doanh thu) và bán chậm (còn trên kệ nhưng bán ít nhất)
// trong kỳ đang chọn - để quyết định nhập thêm gì, dừng nhập gì.

import { useCallback, useState, type ReactNode } from "react";
import { Flame } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { statsApi } from "@/lib/api/stats";
import { formatCompactVND, formatNumber, formatVND } from "@/lib/stats-format";
import { useAsyncData } from "../hooks/use-async-data";
import { useOverview } from "./overview-provider";
import { WidgetCard, WidgetMessage } from "./widget-card";

type View = "top-quantity" | "top-revenue" | "slow";

const LIST_LIMIT = 5;

/** Một dòng hiển thị chung cho cả ba chế độ xem. */
interface ProductRow {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  /** 0–1, độ dài thanh so với dòng đầu; null với hàng bán chậm (thanh không có nghĩa). */
  share: number | null;
}

export function ProductPerformanceCard() {
  const { resolved, branchId } = useOverview();
  const [view, setView] = useState<View>("top-quantity");

  const load = useCallback(async (): Promise<ProductRow[]> => {
    const range = { fromDate: resolved.fromDate, toDate: resolved.toParam, branchId };
    if (view === "slow") {
      const { products } = await statsApi.getSlowProducts({ ...range, limit: LIST_LIMIT });
      return products.map((product) => ({
        id: product.productItemId,
        name: product.productName,
        primary: `Bán ${formatNumber(product.quantity)}`,
        secondary: `Còn ${formatNumber(product.shelf)} trên kệ`,
        share: null,
      }));
    }
    const sortBy = view === "top-revenue" ? "revenue" : "quantity";
    const { products } = await statsApi.getTopProducts({ ...range, sortBy, limit: LIST_LIMIT });
    const leader = products[0]?.[sortBy] ?? 0;
    return products.map((product) => ({
      id: product.productItemId,
      name: product.productName,
      primary: sortBy === "revenue" ? formatCompactVND(product.revenue) : `${formatNumber(product.quantity)} đã bán`,
      secondary: sortBy === "revenue" ? `${formatNumber(product.quantity)} đã bán` : formatVND(product.revenue),
      share: leader > 0 ? product[sortBy] / leader : 0,
    }));
  }, [resolved, branchId, view]);
  const { data, isLoading, failed } = useAsyncData(load);

  let body: ReactNode;
  if (!data && isLoading) {
    body = (
      <div className="space-y-3">
        {Array.from({ length: LIST_LIMIT }).map((_, index) => (
          <Skeleton key={index} className="h-10 w-full" />
        ))}
      </div>
    );
  } else if (!data || failed) {
    body = <WidgetMessage>Không tải được danh sách sản phẩm.</WidgetMessage>;
  } else if (data.length === 0) {
    body = (
      <WidgetMessage>
        {view === "slow" ? "Không có hàng tồn nào bán chậm trong kỳ này." : "Chưa có sản phẩm nào bán được trong kỳ này."}
      </WidgetMessage>
    );
  } else {
    body = (
      <ol className={`space-y-3 transition-opacity ${isLoading ? "opacity-60" : ""}`}>
        {data.map((row, index) => (
          <li key={row.id} className="flex items-center gap-3">
            <span
              className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold tabular-nums ${
                index === 0 && view !== "slow" ? "bg-orange-500 text-white" : "bg-muted text-muted-foreground"
              }`}
            >
              {index + 1}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <span className="truncate text-sm font-medium" title={row.name}>
                  {row.name}
                </span>
                <span className="shrink-0 text-sm font-semibold tabular-nums">{row.primary}</span>
              </div>
              {row.share !== null && (
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden>
                  <div className="h-full rounded-full bg-orange-500/70" style={{ width: `${Math.max(row.share * 100, 4)}%` }} />
                </div>
              )}
              <p className="mt-0.5 text-xs tabular-nums text-muted-foreground">{row.secondary}</p>
            </div>
          </li>
        ))}
      </ol>
    );
  }

  return (
    <WidgetCard title="Sản phẩm" icon={Flame} tone="orange">
      <Tabs value={view} onValueChange={(value) => setView(value as View)} className="mb-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="top-quantity" className="cursor-pointer text-xs">
            Bán chạy
          </TabsTrigger>
          <TabsTrigger value="top-revenue" className="cursor-pointer text-xs">
            Doanh thu
          </TabsTrigger>
          <TabsTrigger value="slow" className="cursor-pointer text-xs">
            Bán chậm
          </TabsTrigger>
        </TabsList>
      </Tabs>
      {body}
    </WidgetCard>
  );
}
