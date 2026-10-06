"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { FileQuestion } from "lucide-react";
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
import { OrderDeliveryCard } from "./components/order-delivery-card";
import { OrderInfoCard } from "./components/order-info-card";
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

/** D-3: one order in full (`GET /orders/:id`, contract §2) - where it is in the journey, its lines and their stock, the money and the delivery. Read-only: the actions on it belong to their own tasks (C-6 pack, D-7 edit, D-9 confirm cash). */
export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;
  const canView = allows(getSessionRole(), "orders", "read");
  const [state, setState] = useState<LoadState | null>(null);

  useEffect(() => {
    if (!canView || !id) return;
    let cancelled = false;
    orderJourneyApi
      .getById(id)
      .then((order) => {
        if (!cancelled) setState({ id, kind: "loaded", order });
      })
      .catch((error: unknown) => {
        if (!cancelled) setState({ id, kind: "error", message: errorMessage(error) });
      });
    return () => {
      cancelled = true;
    };
  }, [id, canView]);

  const goBack = () => router.push("/sales/orders");
  // A result for another id (navigated between orders) counts as still loading.
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
  const status = orderStatusDisplay(order.status);
  const priority = priorityDisplay(order.priority);
  const summary = worstStock(order.items);
  const stock = summary ? stockDisplay(summary) : null;

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
      />

      <Card>
        <CardContent>
          <OrderJourneySteps order={order} />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <OrderLinesCard items={order.items} />
          <OrderPaymentCard order={order} />
        </div>
        <div className="space-y-6">
          <OrderInfoCard order={order} />
          <OrderDeliveryCard order={order} />
        </div>
      </div>
    </div>
  );
}
