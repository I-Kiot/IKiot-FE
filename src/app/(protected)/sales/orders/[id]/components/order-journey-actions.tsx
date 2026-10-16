"use client";

// Hàng thao tác hành trình, đặt dưới thanh các bước trên chi tiết đơn: trái là trạng thái đang chờ, phải là nút
// bước kế tiếp - Đóng đơn, giao cho vận chuyển, xác nhận shipper đã lấy hàng, bắt đầu vận chuyển, giao hàng, mở
// lại mã QR, xác nhận đã nhận tiền từ shipper. Dùng lại đúng dialog / sheet của /fulfillments, /shipments, /shipper.

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Banknote, PackageCheck, QrCode, Truck, Send, MapPinCheck, PackageOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { allows } from "@/components/sidebar/constants/role-permissions";
import { getCachedUser, getSessionRole } from "@/lib/auth";
import { orderJourneyApi } from "@/lib/api/order-journey";
import { shipmentApi } from "@/lib/api/shipment";
import type { OrderDetail } from "@/types/order-flow";
import { PackOrderDialog } from "../../../../fulfillments/components/pack-order-dialog";
import { HandOverDialog } from "../../../../shipments/components/hand-over-dialog";
import { ShipmentNoteDialog } from "../../../../shipments/components/shipment-detail-sheet";
import { reportShipmentError } from "../../../../shipments/components/shipment-ui";
import { DeliverySheet } from "../../../../shipper/components/delivery-sheet";
import { ConfirmRemittanceDialog } from "./confirm-remittance-dialog";

/** Dialog bước nào đang mở. Sheet giao hàng giữ riêng (xem `sheetShipmentId`). */
type OpenStep = "pack" | "handOver" | "pickUp" | "ship" | "remittance" | null;

type OrderShipment = OrderDetail["shipments"][number];

/** Nút bước kế tiếp: giãn hết bề ngang trên điện thoại cho dễ bấm, gọn lại từ màn sm trở lên. */
const STEP_BUTTON_CLASS = "w-full cursor-pointer sm:w-auto";

/** Lần giao đã gán shipper của shop, shipper chưa xác nhận lấy hàng (đơn vẫn PACKED). */
function shipmentAwaitingPickUp(order: OrderDetail): OrderShipment | undefined {
  return order.shipments.find((shipment) => shipment.status === "CREATED");
}

/** Lần giao của shipper nội bộ đang trên đường: chỉ lúc này mới xác nhận giao được. */
function shipmentOnTheRoad(order: OrderDetail): OrderShipment | undefined {
  return order.shipments.find(
    (shipment) =>
      shipment.carrierType === "INTERNAL" &&
      (shipment.status === "IN_TRANSIT" || shipment.status === "OUT_FOR_DELIVERY"),
  );
}

/** Lần giao nội bộ đã giao xong: nơi giữ khoản thu QR để mở lại mã. */
function deliveredShipment(order: OrderDetail): OrderShipment | undefined {
  return order.shipments.find(
    (shipment) => shipment.carrierType === "INTERNAL" && shipment.status === "DELIVERED",
  );
}

/**
 * Chỉ để ẩn nút chắc chắn bị từ chối - luật thật là `assertOrderStepAccess` / `deliveryActorAccess` của
 * BE, sai thì BE trả `ORDER_STEP_DENIED`. Người phụ trách đơn làm được mọi bước mà không cần quyền, trừ "Bắt đầu vận chuyển" (xem `ASSIGNEE_MAY_SHIP`).
 */
/**
 * Người phụ trách có được bấm "Đã giao cho ĐVVC" (trừ tồn kho) mà không cần `orders:ship` không. Tắt từ
 * 2026-10-16, chờ khách xác nhận; bật lại thì đổi cùng lúc `ASSIGNEE_MAY_SHIP` ở BE (`order-handler.ts`).
 */
const ASSIGNEE_MAY_SHIP = false;

function stepPermissions(order: OrderDetail) {
  const role = getSessionRole();
  const userId = getCachedUser()?.id;
  const isOwner = role === "TENANT_OWNER" || role === "ADMIN";
  const isAssignee = userId !== undefined && order.assignee?.id === userId;

  // Xác nhận lấy hàng / giao / thu tiền: chỉ shipper của lần giao, người phụ trách, hoặc chủ shop - không có "giữ quyền".
  const canActOnDelivery = (shipment: OrderShipment | undefined) => {
    if (!shipment) return false;
    const isDriver = userId !== undefined && shipment.driver?.id === userId;
    return isOwner || isAssignee || isDriver;
  };

  return {
    canPack: isAssignee || allows(role, "orders", "pack"),
    canHandOver: isAssignee || allows(role, "shipments", "create"),
    canShip: (ASSIGNEE_MAY_SHIP && isAssignee) || allows(role, "orders", "ship"),
    canConfirmCash: allows(role, "orders", "confirm_cash"),
    canActOnDelivery,
  };
}

interface OrderJourneyActionsProps {
  order: OrderDetail;
  /** Bước trả về chính đơn (xác nhận đã nhận tiền): trang thay đơn ngay, không cần đọc lại. */
  onChanged: (order: OrderDetail) => void;
  /** Một bước vừa xong, hoặc đơn vừa đổi ở nơi khác - trang đọc lại đơn. */
  onNeedsReload: () => void;
}

/**
 * Trang phải luôn mount component này, kể cả khi không có nút nào: sheet giao hàng sống ở đây, và giao bằng
 * QR xong thì đơn sang RECEIVED rồi COMPLETED - lúc đó không còn nút, nhưng sheet vẫn phải ở lại.
 */
export function OrderJourneyActions({ order, onChanged, onNeedsReload }: OrderJourneyActionsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const wantsRemittance = useSearchParams().get("confirmCash") === "1";
  const permissions = stepPermissions(order);
  const awaitingCash =
    order.status === "RECEIVED" &&
    order.collection?.cashRemittanceStatus === "PENDING" &&
    permissions.canConfirmCash;

  // Thông báo "Shipper đang giữ tiền mặt" dẫn tới đây kèm ?confirmCash=1: mở dialog ngay, nếu đơn thật sự
  // đang chờ tiền.
  const [openStep, setOpenStep] = React.useState<OpenStep>(() =>
    wantsRemittance && awaitingCash ? "remittance" : null,
  );
  // Đang ở sẵn đơn này khi bấm thông báo thì không có gì mount lại: bắt cờ vừa xuất hiện ngay trong lúc
  // render (không dùng effect).
  const [seenFlag, setSeenFlag] = React.useState(wantsRemittance);
  if (wantsRemittance !== seenFlag) {
    setSeenFlag(wantsRemittance);
    if (wantsRemittance && awaitingCash) setOpenStep("remittance");
  }
  // Sheet giao hàng mở theo id lưu ở đây, KHÔNG theo điều kiện hiện nút: giao bằng QR xong thì đơn sang
  // RECEIVED (nút "Giao hàng" biến mất) đúng lúc khách cần quét mã - sheet phải ở lại tới khi người dùng đóng.
  const [sheetShipmentId, setSheetShipmentId] = React.useState<string | null>(null);

  // Đơn bán tại quầy không đi theo hành trình.
  if (order.fulfillmentType === "TAKEAWAY") return null;

  const awaitingPickUp = shipmentAwaitingPickUp(order);
  const onTheRoad = shipmentOnTheRoad(order);
  const delivered = deliveredShipment(order);

  const showPack = order.status === "CONFIRMED" && permissions.canPack;
  // Đã gán shipper thì không giao lần nữa; chờ shipper (hoặc người bấm hộ) xác nhận đã lấy hàng.
  const showHandOver =
    order.status === "PACKED" && !awaitingPickUp && permissions.canHandOver;
  const showAwaitingPickUp = order.status === "PACKED" && awaitingPickUp !== undefined;
  const showPickUp = showAwaitingPickUp && permissions.canActOnDelivery(awaitingPickUp);
  const showShip = order.status === "PICKED_UP" && permissions.canShip;
  // Không có nút thì nói vì sao đơn đứng ở đây - kể cả người phụ trách (ASSIGNEE_MAY_SHIP tắt).
  const showAwaitingShip = order.status === "PICKED_UP" && !permissions.canShip;
  const showDeliver =
    order.status === "SHIPPING" && permissions.canActOnDelivery(onTheRoad);
  const showQr =
    order.status === "RECEIVED" &&
    order.collection?.method === "BANK_TRANSFER_QR" &&
    permissions.canActOnDelivery(delivered);

  const hasButton =
    showPack || showHandOver || showPickUp || showShip || showDeliver || showQr || awaitingCash;
  const hasRow = hasButton || showAwaitingPickUp || showAwaitingShip;

  /** Đóng dialog; bỏ cờ ?confirmCash để tải lại trang hay lần xác nhận sau không tự mở lại dialog. */
  const closeStep = () => {
    setOpenStep(null);
    if (wantsRemittance) router.replace(pathname, { scroll: false });
  };

  /** Dialog báo xong (hoặc dữ liệu đã cũ): đóng dialog, đọc lại đơn. */
  const closeAndReload = () => {
    closeStep();
    onNeedsReload();
  };

  /** "Xác nhận đã lấy hàng" (bấm hộ shipper): thành công → báo, đóng, đọc lại; dữ liệu đã cũ → cũng đóng và đọc lại. */
  const pickUp = (shipmentId: string, note: string | undefined) =>
    shipmentApi.pickUp(shipmentId, note).then(
      () => {
        toast.success(`Đơn ${order.code} đã được shipper lấy hàng`);
        closeAndReload();
      },
      (error: unknown) => {
        if (reportShipmentError(error, "Xác nhận lấy hàng thất bại, vui lòng thử lại")) {
          closeAndReload();
        }
      },
    );

  /** "Bắt đầu vận chuyển": thành công → báo, đóng, đọc lại; đơn đã đổi ở nơi khác → cũng đóng và đọc lại. */
  const ship = (note: string | undefined) =>
    orderJourneyApi.ship(order.id, note).then(
      () => {
        toast.success(`Đơn ${order.code} đang vận chuyển`);
        closeAndReload();
      },
      (error: unknown) => {
        if (reportShipmentError(error, "Chuyển Đang vận chuyển thất bại, vui lòng thử lại")) {
          closeAndReload();
        }
      },
    );

  return (
    <>
      {hasRow && (
        <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center">
          {/* Trái: trạng thái đang chờ - để đọc, không bấm được. */}
          {showAwaitingPickUp && awaitingPickUp && (
            <Badge variant="info" className="self-start sm:self-auto">
              Chờ {awaitingPickUp.driver?.name ?? "shipper"} lấy hàng
            </Badge>
          )}
          {showAwaitingShip && (
            <Badge variant="info" className="self-start sm:self-auto">
              Chờ người có quyền &quot;Bắt đầu vận chuyển&quot; tại kho xuất xác nhận (bước trừ tồn kho)
            </Badge>
          )}
          {/* Phải: nút bước kế tiếp, ở cuối chiều đọc của thanh các bước - như nút xác nhận ở chân mọi dialog. */}
          {hasButton && (
            <div className="flex flex-col gap-2 sm:ml-auto sm:flex-row">
              {showPack && (
                <Button onClick={() => setOpenStep("pack")} className={STEP_BUTTON_CLASS}>
                  <PackageCheck className="size-4" />
                  Đóng đơn
                </Button>
              )}
              {showHandOver && (
                <Button onClick={() => setOpenStep("handOver")} className={STEP_BUTTON_CLASS}>
                  <Send className="size-4" />
                  Giao cho ĐVVC
                </Button>
              )}
              {showPickUp && (
                <Button onClick={() => setOpenStep("pickUp")} className={STEP_BUTTON_CLASS}>
                  <PackageOpen className="size-4" />
                  Xác nhận đã lấy hàng
                </Button>
              )}
              {showShip && (
                <Button onClick={() => setOpenStep("ship")} className={STEP_BUTTON_CLASS}>
                  <Truck className="size-4" />
                  Bắt đầu vận chuyển
                </Button>
              )}
              {showDeliver && onTheRoad && (
                <Button onClick={() => setSheetShipmentId(onTheRoad.id)} className={STEP_BUTTON_CLASS}>
                  <MapPinCheck className="size-4" />
                  Giao hàng
                </Button>
              )}
              {showQr && delivered && (
                <Button onClick={() => setSheetShipmentId(delivered.id)} className={STEP_BUTTON_CLASS}>
                  <QrCode className="size-4" />
                  Mã QR thanh toán
                </Button>
              )}
              {awaitingCash && (
                <Button onClick={() => setOpenStep("remittance")} className={STEP_BUTTON_CLASS}>
                  <Banknote className="size-4" />
                  Xác nhận đã nhận tiền
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Mỗi lần mở là một dialog mới, ghi chú / lỗi của lần trước không còn. */}
      {openStep === "pack" && (
        <PackOrderDialog order={order} onClose={closeStep} onNeedsReload={closeAndReload} />
      )}
      {openStep === "handOver" && (
        <HandOverDialog order={order} onClose={closeStep} onNeedsReload={closeAndReload} />
      )}
      {openStep === "pickUp" && awaitingPickUp && (
        <ShipmentNoteDialog
          open
          title="Xác nhận đã lấy hàng"
          description={`Xác nhận ${awaitingPickUp.driver?.name ?? "shipper"} đã nhận đủ hàng của đơn tại kho. Đơn chuyển sang ĐVVC đã lấy hàng; tồn kho chưa bị trừ.`}
          confirmLabel="Đã lấy hàng"
          onClose={closeStep}
          onConfirm={(note) => pickUp(awaitingPickUp.id, note)}
        />
      )}
      {openStep === "ship" && (
        <ShipmentNoteDialog
          open
          title="Chuyển sang Đang vận chuyển"
          description="Thao tác này trừ tồn kho đúng số hàng đã khoá lúc Đóng đơn và không quay lại được."
          confirmLabel="Xác nhận"
          onClose={closeStep}
          onConfirm={ship}
        />
      )}
      {openStep === "remittance" && (
        <ConfirmRemittanceDialog
          order={order}
          open
          onOpenChange={closeStep}
          onConfirmed={(updated) => {
            closeStep();
            onChanged(updated);
          }}
        />
      )}
      {sheetShipmentId !== null && (
        <DeliverySheet
          key={sheetShipmentId}
          shipmentId={sheetShipmentId}
          onClose={() => setSheetShipmentId(null)}
          onChanged={onNeedsReload}
        />
      )}
    </>
  );
}
