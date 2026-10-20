"use client";

// Dashboard tổng quan (thiết kế lại 2026-10-20): KPI, biểu đồ doanh thu, tình trạng đơn, cảnh báo
// tồn kho, sản phẩm bán chạy / chậm, đơn gần đây, thao tác nhanh, thông báo, hiệu suất cửa hàng.
// Các phân tích sâu hơn nằm ở /reports.

import Link from "next/link";
import { Warehouse } from "lucide-react";
import { allows } from "@/components/sidebar/constants/role-permissions";
import { getSessionRole } from "@/lib/auth";
import { OverviewProvider, useOverview } from "./components/overview-provider";
import { DashboardHeader } from "./components/dashboard-header";
import { KpiCards } from "./components/kpi-cards";
import { RevenueChart } from "./components/revenue-chart";
import { OrderPipelineCard } from "./components/order-pipeline-card";
import { StockAlertsCard } from "./components/stock-alerts-card";
import { ProductPerformanceCard } from "./components/product-performance-card";
import { RecentOrdersCard } from "./components/recent-orders-card";
import { QuickActionsCard } from "./components/quick-actions-card";
import { NotificationsCard } from "./components/notifications-card";
import { StorePerformanceCard } from "./components/store-performance-card";

/** Đang xem một kho: kho không bán hàng, nên chỉ còn tồn kho và các lối tắt. */
function WarehouseLayout() {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <div className="flex items-start gap-3 rounded-lg border border-dashed bg-muted/40 p-4 text-sm text-muted-foreground">
          <Warehouse className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>
            Bạn đang xem một <span className="font-medium text-foreground">kho</span>. Kho không phát sinh doanh thu bán
            hàng, nên dashboard chỉ hiện tồn kho. Dòng tiền nhập hàng xem ở{" "}
            <Link href="/reports" className="font-medium text-foreground underline underline-offset-4">
              Báo cáo
            </Link>
            .
          </span>
        </div>
        <StockAlertsCard />
      </div>
      <div className="space-y-6">
        <QuickActionsCard />
        <NotificationsCard />
      </div>
    </div>
  );
}

function SalesLayout() {
  const canSeeOrders = allows(getSessionRole(), "orders", "read");

  return (
    <div className="space-y-6">
      <KpiCards />

      {/* Hàng 2: xu hướng (2/3) + lối tắt (1/3). */}
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <RevenueChart />
        </div>
        <QuickActionsCard />
      </div>

      {/* Hàng 3: ba thẻ vận hành (2/3) + thông báo (1/3). */}
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="grid gap-6 md:grid-cols-2 xl:col-span-2 2xl:grid-cols-3">
          <OrderPipelineCard />
          <StockAlertsCard />
          <div className="md:col-span-2 2xl:col-span-1">
            <ProductPerformanceCard />
          </div>
        </div>
        <NotificationsCard />
      </div>

      {/* Hàng 4: đơn gần đây (2/3) + hiệu suất (1/3). Không có quyền xem đơn thì bảng nhường chỗ. */}
      <div className="grid gap-6 xl:grid-cols-3">
        {canSeeOrders && (
          <div className="min-w-0 xl:col-span-2">
            <RecentOrdersCard />
          </div>
        )}
        <StorePerformanceCard />
      </div>
    </div>
  );
}

function DashboardBody() {
  const { isWarehouse } = useOverview();
  return isWarehouse ? <WarehouseLayout /> : <SalesLayout />;
}

export default function DashboardPage() {
  return (
    <OverviewProvider>
      <div className="@container/main flex-1 space-y-6 px-4 pb-8 lg:px-6">
        <DashboardHeader />
        <DashboardBody />
      </div>
    </OverviewProvider>
  );
}
