"use client";

// Màn "Đơn giao của tôi" (C-7): các lần giao chưa kết thúc mà mình là shipper, kèm số tiền còn phải thu.
// Tab "Đang giao" lọc được như tab "Lịch sử giao" (`CurrentDeliveries`).
// Bấm một đơn để mở chi tiết: đang đi giao, đã giao (ảnh + thu tiền), giao không thành. Dùng được trên điện thoại.

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { shipmentApi } from "@/lib/api/shipment";
import { useLiveTick } from "@/hooks/use-live-refresh";
import { CHANGE_RESOURCES } from "@/types/change-feed";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DeliverySheet } from "./components/delivery-sheet";
import { DeliveryHistory } from "./components/delivery-history";
import { CurrentDeliveries, type MineState } from "./components/current-deliveries";

const LIVE_RESOURCES = [CHANGE_RESOURCES.SHIPMENTS, CHANGE_RESOURCES.ORDERS] as const;

/** Màn đơn giao của tôi. `?tab=history&open=<id>` / `?open=<id>` là đích của đường dẫn trong thông báo. */
function ShipperScreen() {
  const params = useSearchParams();
  const initialTab = params.get("tab") === "history" ? "history" : "current";
  const openParam = params.get("open");
  const [state, setState] = useState<MineState>({ status: "loading" });
  const [reloadKey, setReloadKey] = useState(0);
  // Drawer của tab "Đang giao"; tab lịch sử tự giữ drawer của nó.
  const [openId, setOpenId] = useState<string | null>(initialTab === "current" ? openParam : null);

  // Người khác đổi lần giao / đơn của tôi: tải lại nền, giữ danh sách đang hiện.
  const visibleIds = state.status === "ready" ? state.shipments.flatMap((s) => [s.id, s.order.id]) : [];
  const liveTick = useLiveTick({ resources: LIVE_RESOURCES, visibleIds });

  useEffect(() => {
    // Response cũ về sau (bấm "Tải lại" liên tiếp) thì bỏ. Mỗi nhánh chỉ một setter (lint cấm setState trong useEffect).
    let cancelled = false;
    shipmentApi.getMine().then(
      (shipments) => {
        if (!cancelled) setState({ status: "ready", shipments });
      },
      () => {
        if (!cancelled) setState((previous) => (previous.status === "ready" ? previous : { status: "error" }));
      },
    );
    return () => {
      cancelled = true;
    };
  }, [reloadKey, liveTick]);

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

      <Tabs defaultValue={initialTab} className="w-full">
        <TabsList>
          <TabsTrigger value="current">Đang giao</TabsTrigger>
          <TabsTrigger value="history">Lịch sử giao</TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="outline-none">
          <CurrentDeliveries state={state} onOpen={setOpenId} />
        </TabsContent>

        <TabsContent value="history" className="outline-none">
          <DeliveryHistory initialOpenId={initialTab === "history" ? openParam : null} />
        </TabsContent>
      </Tabs>

      <DeliverySheet key={openId ?? "none"} shipmentId={openId} onClose={() => setOpenId(null)} onChanged={reload} />
    </div>
  );
}

export default function ShipperPage() {
  return (
    <Suspense fallback={null}>
      <ShipperScreen />
    </Suspense>
  );
}
