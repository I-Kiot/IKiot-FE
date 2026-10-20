"use client";

// 5 đơn mới nhất: mã, khách, thời gian đặt, tổng tiền, trạng thái đơn và thanh toán.
// Bấm một dòng để mở chi tiết đơn - ở đó mới có các thao tác tiếp theo, theo quyền của người xem.

import { useCallback, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { orderJourneyApi } from "@/lib/api/order-journey";
import { formatDateTime, formatVND, orderStatusDisplay, paymentStatusDisplay } from "../../sales/orders/shared/order-display";
import { useAsyncData } from "../hooks/use-async-data";
import { useOverview } from "./overview-provider";
import { WidgetMessage } from "./widget-card";

const RECENT_LIMIT = 5;

/** Bảng đơn gần đây, nằm trong tab "Đơn hàng gần đây" của thẻ doanh thu (link "Xem tất cả" ở header thẻ đó). */
export function RecentOrdersTable() {
  const router = useRouter();
  const { branchId, liveVersion } = useOverview();
  const load = useCallback(
    // Bỏ đơn bán tại quầy, như trang Đơn hàng: chúng nằm ngoài hành trình đơn nên trang chi tiết không dành cho chúng.
    () => orderJourneyApi.getList({ page: 1, limit: RECENT_LIMIT, sort: "createdAt", branchId, excludePos: true }),
    [branchId],
  );
  const { data, isLoading, failed } = useAsyncData(load, liveVersion);

  const openOrder = (id: string) => router.push(`/sales/orders/${id}`);

  let body: ReactNode;
  if (!data && isLoading) {
    body = (
      <div className="space-y-2">
        {Array.from({ length: RECENT_LIMIT }).map((_, index) => (
          <Skeleton key={index} className="h-10 w-full" />
        ))}
      </div>
    );
  } else if (!data || failed) {
    body = <WidgetMessage>Không tải được đơn hàng gần đây.</WidgetMessage>;
  } else if (data.data.length === 0) {
    body = <WidgetMessage>Chưa có đơn hàng nào.</WidgetMessage>;
  } else {
    body = (
      <div className={`-mx-4 overflow-x-auto transition-opacity ${isLoading ? "opacity-60" : ""}`}>
        <Table className="min-w-[640px]">
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">Mã đơn</TableHead>
              <TableHead>Khách hàng</TableHead>
              <TableHead>Thời gian đặt</TableHead>
              <TableHead className="text-right">Tổng tiền</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="pr-4">Thanh toán</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.data.map((order) => {
              const status = orderStatusDisplay(order.status);
              const payment = paymentStatusDisplay(order.paymentStatus);
              return (
                <TableRow
                  key={order.id}
                  className="cursor-pointer"
                  tabIndex={0}
                  onClick={() => openOrder(order.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      openOrder(order.id);
                    }
                  }}
                  aria-label={`Mở đơn ${order.code}`}
                >
                  <TableCell className="pl-4 font-medium">{order.code}</TableCell>
                  <TableCell className="max-w-[180px] truncate">{order.customer.name}</TableCell>
                  <TableCell className="tabular-nums text-muted-foreground">{formatDateTime(order.createdAt)}</TableCell>
                  <TableCell className="text-right font-medium tabular-nums">{formatVND(order.grandTotal)}</TableCell>
                  <TableCell>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </TableCell>
                  <TableCell className="pr-4">
                    <Badge variant={payment.variant}>{payment.label}</Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    );
  }

  return body;
}
