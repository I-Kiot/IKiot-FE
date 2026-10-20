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

/**
 * Từ xl trở lên cả dashboard vừa một màn hình (2026-10-20): khung cao bằng phần còn lại của màn
 * hình, các thẻ chia nhau chiều cao và tự cuộn bên trong. Màn hẹp hơn thì xếp chồng và cuộn trang
 * như cũ. Đơn gần đây là một tab của thẻ doanh thu thay vì một hàng riêng.
 */
function SalesLayout() {
  const canSeeOrders = allows(getSessionRole(), "orders", "read");

  return (
    <div className="flex flex-col gap-4 xl:min-h-0 xl:flex-1">
      <KpiCards />

      <div className="grid gap-4 xl:min-h-0 xl:flex-1 xl:grid-cols-3 xl:grid-rows-[minmax(0,1fr)]">
        {/* Trái (2/3): xu hướng ở trên, ba thẻ vận hành ở dưới. */}
        <div className="flex min-w-0 flex-col gap-4 xl:col-span-2 xl:min-h-0">
          <div className="h-[340px] min-w-0 xl:h-auto xl:min-h-0 xl:flex-[4]">
            <RevenueChart showOrdersTab={canSeeOrders} />
          </div>
          <div className="grid gap-4 md:grid-cols-3 xl:min-h-0 xl:flex-[3] *:min-h-0">
            <OrderPipelineCard />
            <StockAlertsCard />
            <ProductPerformanceCard />
          </div>
        </div>

        {/* Phải (1/3): lối tắt, hiệu suất, thông báo lấp phần còn lại. */}
        <div className="flex min-w-0 flex-col gap-4 xl:min-h-0">
          <QuickActionsCard />
          <StorePerformanceCard />
          <div className="flex min-h-0 flex-col xl:flex-1 *:flex-1">
            <NotificationsCard />
          </div>
        </div>
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
      {/* xl: cao bằng màn hình trừ header (3rem là py-6 của khung ngoài), giống trang chat. */}
      <div className="@container/main flex flex-1 flex-col gap-4 px-4 pb-8 lg:px-6 xl:h-[calc(100dvh-var(--header-height)-3rem)] xl:flex-none xl:overflow-y-auto xl:pb-0">
        <DashboardHeader />
        <DashboardBody />
      </div>
    </OverviewProvider>
  );
}
