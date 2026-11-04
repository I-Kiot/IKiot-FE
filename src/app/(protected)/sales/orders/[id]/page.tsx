"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { FileQuestion } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { allows } from "@/components/sidebar/constants/role-permissions";
import { getApiErrorBody, messageForCode } from "@/lib/api/error-codes";
import { getSessionRole } from "@/lib/auth";
import { orderJourneyApi } from "@/lib/api/order-journey";
import type { OrderDetail } from "@/types/order-flow";
import {
  orderStatusDisplay,
  priorityDisplay,
  stockDisplay,
  worstStock,
} from "../shared/order-display";
import { OrderActions } from "./components/order-actions";
import { OrderDeliveryCard } from "./components/order-delivery-card";
import { OrderInfoCard } from "./components/order-info-card";
import { OrderJourneyActions } from "./components/order-journey-actions";
import { OrderJourneySteps } from "./components/order-journey-steps";
import { OrderLinesCard } from "./components/order-lines-card";
import { OrderPaymentCard } from "./components/order-payment-card";

type LoadState =
  | { id: string; kind: "loaded"; order: OrderDetail }
  | { id: string; kind: "error"; message: string };

const BREADCRUMBS = [
  { label: "Trang chủ", href: "/dashboard" },
  { label: "Đơn hàng" },
  { label: "Danh sách đơn", href: "/sales/orders" },
];

function errorMessage(error: unknown): string {
  return messageForCode(getApiErrorBody(error)?.code) ?? "Không tải được đơn hàng";
}

/** Chi tiết đơn (`GET /orders/:id`, contract §2). Nút sửa nằm ở header; các bước hành trình nằm dưới thanh bước (`OrderJourneyActions`). */
export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;
  const canView = allows(getSessionRole(), "orders", "read");
  const [state, setState] = useState<LoadState | null>(null);
  // Tăng sau mỗi bước hành trình: các route đó trả về fulfillment/shipment chứ không phải đơn.
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!canView || !id) return;
    // Lần tải mới huỷ lần này, nên kết quả cũ về muộn không đè kết quả mới.
    let cancelled = false;
    orderJourneyApi
      .getById(id)
      .then((order) => {
        if (!cancelled) setState({ id, kind: "loaded", order });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        // Đọc lại lỗi sau một bước vẫn giữ đơn (và sheet đang mở) trên màn; chỉ lần tải đầu không có gì để hiện mới thành trang lỗi.
        if (reloadKey > 0) toast.error("Không tải lại được đơn hàng, vui lòng tải lại trang");
        setState((previous) => {
          if (previous?.id === id && previous.kind === "loaded") return previous;
          return { id, kind: "error", message: errorMessage(error) };
        });
      });
    return () => {
      cancelled = true;
    };
  }, [id, canView, reloadKey]);

  const goBack = () => router.push("/sales/orders");
  // Kết quả của id khác (vừa chuyển sang đơn khác) coi như vẫn đang tải.
  const current = state?.id === id ? state : null;

  if (!canView || current?.kind === "error") {
    return (
      <div className="flex flex-col gap-6 px-4 lg:px-6">
        <PageHeader breadcrumbs={BREADCRUMBS} title="Chi tiết đơn" onBack={goBack} />
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <FileQuestion className="size-10 text-muted-foreground" />
            <p className="font-medium">
              {current?.kind === "error"
                ? current.message
                : "Tài khoản của bạn không có quyền xem đơn hàng"}
            </p>
            <Button variant="outline" onClick={goBack} className="cursor-pointer">
              Về danh sách đơn
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!current) {
    return (
      <div className="flex flex-col gap-6 px-4 lg:px-6">
        <PageHeader breadcrumbs={BREADCRUMBS} title="Chi tiết đơn" onBack={goBack} />
        <Skeleton className="h-24 w-full" />
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-80 lg:col-span-2" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  const { order } = current;
  const status = orderStatusDisplay(order.status, order.latestShipmentStatus);
  const priority = priorityDisplay(order.priority);
  const summary = worstStock(order.items);
  const stock = summary ? stockDisplay(summary) : null;
  const replaceOrder = (updated: OrderDetail) => setState({ id, kind: "loaded", order: updated });

  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      <PageHeader
        breadcrumbs={[...BREADCRUMBS, { label: order.code }]}
        title={`Đơn ${order.code}`}
        titleExtra={
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={status.variant}>{status.label}</Badge>
            <Badge variant={priority.variant}>Ưu tiên: {priority.label}</Badge>
            {stock && <Badge variant={stock.variant}>{stock.label}</Badge>}
          </div>
        }
        onBack={goBack}
        actions={
          <OrderActions order={order} onChanged={replaceOrder} />
        }
      />

      <Card>
        <CardContent className="space-y-4">
          <OrderJourneySteps order={order} />      
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <OrderLinesCard items={order.items} />
          <OrderPaymentCard order={order} />
             {/* Luôn mount dù không có nút nào: giữ sheet giao hàng mở qua lần tải lại sau khi giao. */}
          <OrderJourneyActions
            order={order}
            onChanged={replaceOrder}
            onNeedsReload={() => setReloadKey((key) => key + 1)}
          />
        </div>
        <div className="space-y-6">
          <OrderInfoCard order={order} />
          <OrderDeliveryCard order={order} />
        </div>
      </div>
    </div>
  );
}
