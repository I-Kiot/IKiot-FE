"use client";

// Màn "Đơn giao của tôi" (C-7): các lần giao chưa kết thúc mà mình là shipper, kèm số tiền còn phải thu.
// Bấm một đơn để mở chi tiết: đang đi giao, đã giao (ảnh + thu tiền), giao không thành. Dùng được trên điện thoại.

import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { shipmentApi } from "@/lib/api/shipment";
import type { ShipmentSummary } from "@/types/order-flow";
import { formatVND, ShipmentStatusBadge } from "../shipments/components/shipment-ui";
import { DeliverySheet } from "./components/delivery-sheet";

type MineState = { status: "loading" } | { status: "error" } | { status: "ready"; shipments: ShipmentSummary[] };

/** Một đơn trong danh sách: mã, người nhận, địa chỉ, giờ hẹn, số còn phải thu. */
function DeliveryCard({ shipment, onOpen }: { shipment: ShipmentSummary; onOpen: () => void }) {
  return (
    <Card className="cursor-pointer py-4 transition-colors hover:bg-muted/40" onClick={onOpen}>
      <CardContent className="space-y-2 px-4">
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium">{shipment.order.code}</span>
          <ShipmentStatusBadge status={shipment.status} />
        </div>
        <p className="text-sm">
          {shipment.recipientName ?? shipment.order.customerName}
          {shipment.recipientPhone && <span className="text-muted-foreground"> · {shipment.recipientPhone}</span>}
        </p>
        {shipment.deliveryAddress && <p className="text-sm text-muted-foreground">{shipment.deliveryAddress}</p>}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {[shipment.scheduledDate?.slice(0, 10), shipment.scheduledSlot].filter(Boolean).join(" · ") ||
              "Chưa hẹn giờ"}
          </span>
          <span className="font-semibold">Thu {formatVND(shipment.order.amountDue)}</span>
        </div>
      </CardContent>
    </Card>
  );
}

/** Màn đơn giao của tôi. */
export default function ShipperPage() {
  const [state, setState] = useState<MineState>({ status: "loading" });
  const [reloadKey, setReloadKey] = useState(0);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    // Response cũ về sau (bấm "Tải lại" liên tiếp) thì bỏ. Mỗi nhánh chỉ một setter (lint cấm setState trong useEffect).
    let cancelled = false;
    shipmentApi.getMine().then(
      (shipments) => {
        if (!cancelled) setState({ status: "ready", shipments });
      },
      () => {
        if (!cancelled) setState({ status: "error" });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const reload = useCallback(() => setReloadKey((key) => key + 1), []);

  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      <PageHeader
        breadcrumbs={[{ label: "Trang chủ", href: "/dashboard" }, { label: "Đơn giao của tôi" }]}
        title="Đơn giao của tôi"
        description="Các đơn bạn đang giao, kèm số tiền còn phải thu."
        actions={
          <Button variant="outline" onClick={reload}>
            Tải lại
          </Button>
        }
      />

      {state.status === "loading" && <p className="text-center text-muted-foreground">Đang tải...</p>}
      {state.status === "error" && (
        <p className="text-center text-muted-foreground">Không tải được danh sách - bấm Tải lại để thử lại</p>
      )}
      {state.status === "ready" && state.shipments.length === 0 && (
        <p className="text-center text-muted-foreground">Bạn không có đơn nào cần giao</p>
      )}
      {state.status === "ready" && state.shipments.length > 0 && (
        <div className="grid gap-3 md:grid-cols-2">
          {state.shipments.map((shipment) => (
            <DeliveryCard key={shipment.id} shipment={shipment} onOpen={() => setOpenId(shipment.id)} />
          ))}
        </div>
      )}

      <DeliverySheet key={openId ?? "none"} shipmentId={openId} onClose={() => setOpenId(null)} onChanged={reload} />
    </div>
  );
}
