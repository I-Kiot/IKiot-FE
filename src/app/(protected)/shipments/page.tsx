"use client";

// Màn Giao hàng: tab chờ vận chuyển và tab theo dõi.

import { Suspense, useCallback, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SHIPMENT_STATUS_LABELS, type HandOverReadyOrder, type ShipmentStatus, type ShipmentSummary } from "@/types/order-flow";
import { HandOverDialog } from "./components/hand-over-dialog";
import { ReadyOrdersTab } from "./components/ready-orders-tab";
import { ShipmentDetailSheet } from "./components/shipment-detail-sheet";
import { ShipmentsTab } from "./components/shipments-tab";
import { shipmentActions } from "./components/shipment-ui";

/** Trạng thái lấy từ URL; giá trị lạ coi như không lọc. */
function shipmentStatusFromUrl(value: string | null): ShipmentStatus | undefined {
  return (Object.keys(SHIPMENT_STATUS_LABELS) as ShipmentStatus[]).find((status) => status === value);
}

/** Màn Giao hàng. Bọc Suspense vì đọc `useSearchParams` - Next bắt buộc khi build. */
export default function ShipmentsPage() {
  return (
    <Suspense fallback={null}>
      <ShipmentsScreen />
    </Suspense>
  );
}

function ShipmentsScreen() {
  // Mở tab và chi tiết theo URL.
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "shipments" ? "shipments" : "ready";
  const initialStatus = shipmentStatusFromUrl(searchParams.get("status"));
  // Khoá tải lại chung cho hai tab và sheet.
  const [reloadKey, setReloadKey] = useState(0);
  const [handOverOrder, setHandOverOrder] = useState<HandOverReadyOrder | null>(null);
  const [openShipmentId, setOpenShipmentId] = useState<string | null>(searchParams.get("open"));
  const { canHandOver } = shipmentActions();

  const reload = useCallback(() => setReloadKey((key) => key + 1), []);
  // Ổn định để cột của bảng không phải dựng lại mỗi lần render.
  const openHandOver = useCallback((order: HandOverReadyOrder) => setHandOverOrder(order), []);
  const openShipment = useCallback((shipment: ShipmentSummary) => setOpenShipmentId(shipment.id), []);

  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      <PageHeader
        breadcrumbs={[{ label: "Trang chủ", href: "/dashboard" }, { label: "Vận hành" }, { label: "Giao hàng" }]}
        title="Giao hàng"
        description="Giao đơn đã đóng gói cho shipper và theo dõi từng lần giao."
        actions={
          <Button variant="outline" onClick={reload}>
            Tải lại
          </Button>
        }
      />

      <Tabs defaultValue={initialTab}>
        <TabsList>
          <TabsTrigger value="ready">Chờ vận chuyển</TabsTrigger>
          <TabsTrigger value="shipments">Theo dõi đơn hàng</TabsTrigger>
        </TabsList>
        <TabsContent value="ready" className="mt-4">
          <ReadyOrdersTab reloadKey={reloadKey} canHandOver={canHandOver} onHandOver={openHandOver} />
        </TabsContent>
        <TabsContent value="shipments" className="mt-4">
          <ShipmentsTab reloadKey={reloadKey} onOpen={openShipment} initialStatus={initialStatus} />
        </TabsContent>
      </Tabs>

      <HandOverDialog
        key={`hand-over-${handOverOrder?.id ?? "none"}`}
        order={handOverOrder}
        onClose={() => setHandOverOrder(null)}
        onNeedsReload={() => {
          setHandOverOrder(null);
          reload();
        }}
      />
      <ShipmentDetailSheet
        key={`shipment-${openShipmentId ?? "none"}`}
        shipmentId={openShipmentId}
        reloadKey={reloadKey}
        onClose={() => setOpenShipmentId(null)}
        onChanged={reload}
      />
    </div>
  );
}
