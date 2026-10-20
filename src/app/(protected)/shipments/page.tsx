"use client";

// Màn Giao hàng (C-9): tab "Chờ giao" (đơn đã đóng gói, giao cho vận chuyển) và tab "Lần giao" (theo dõi,
// chuyển Đang vận chuyển, đổi shipper, nhật trình, giao không thành). Trang giữ state chung và mở dialog.

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
    <Suspense>
      <ShipmentsScreen />
    </Suspense>
  );
}

function ShipmentsScreen() {
  // `?tab=shipments&status=FAILED` (link "Giao thất bại" trên dashboard) mở thẳng tab Lần giao đã lọc.
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "shipments" ? "shipments" : "ready";
  const initialStatus = shipmentStatusFromUrl(searchParams.get("status"));
  // Một khoá tải lại chung: thao tác ở một chỗ đổi dữ liệu ở cả hai tab (đơn rời "Chờ giao", lần giao hiện ở "Lần giao") và ở sheet.
  const [reloadKey, setReloadKey] = useState(0);
  const [handOverOrder, setHandOverOrder] = useState<HandOverReadyOrder | null>(null);
  const [openShipmentId, setOpenShipmentId] = useState<string | null>(null);
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
        description="Giao đơn đã đóng gói cho đơn vị vận chuyển / shipper và theo dõi từng lần giao."
        actions={
          <Button variant="outline" onClick={reload}>
            Tải lại
          </Button>
        }
      />

      <Tabs defaultValue={initialTab}>
        <TabsList>
          <TabsTrigger value="ready">Chờ giao</TabsTrigger>
          <TabsTrigger value="shipments">Lần giao</TabsTrigger>
        </TabsList>
        <TabsContent value="ready" className="mt-4">
          <ReadyOrdersTab reloadKey={reloadKey} canHandOver={canHandOver} onHandOver={openHandOver} />
        </TabsContent>
        <TabsContent value="shipments" className="mt-4">
          <ShipmentsTab reloadKey={reloadKey} onOpen={openShipment} initialStatus={initialStatus} />
        </TabsContent>
      </Tabs>

      <HandOverDialog
        key={handOverOrder?.id ?? "none"}
        order={handOverOrder}
        onClose={() => setHandOverOrder(null)}
        onNeedsReload={() => {
          setHandOverOrder(null);
          reload();
        }}
      />
      <ShipmentDetailSheet
        key={openShipmentId ?? "none"}
        shipmentId={openShipmentId}
        reloadKey={reloadKey}
        onClose={() => setOpenShipmentId(null)}
        onChanged={reload}
      />
    </div>
  );
}
