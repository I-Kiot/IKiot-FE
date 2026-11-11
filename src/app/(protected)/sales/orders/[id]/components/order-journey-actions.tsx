"use client";

// Hàng thao tác hành trình, đặt dưới thanh các bước trên chi tiết đơn: trái là trạng thái đang chờ, phải là nút
// bước kế tiếp - Đóng đơn, giao cho vận chuyển, xác nhận shipper đã lấy hàng, bắt đầu vận chuyển, giao hàng, mở
// lại mã QR, xác nhận đã nhận tiền từ shipper. Dùng lại đúng dialog / sheet của /fulfillments, /shipments, /shipper.

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Banknote, HandHelping, PackageCheck, QrCode, Truck, Send, MapPinCheck, PackageOpen, Undo2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PermissionButton } from "@/components/permission-button";
import { allows } from "@/components/sidebar/constants/role-permissions";
import { getCachedUser, getSessionRole } from "@/lib/auth";
import { orderJourneyApi } from "@/lib/api/order-journey";
import { orderReturnApi } from "@/lib/api/order-return";
import { shipmentApi } from "@/lib/api/shipment";
import { isStorePickup } from "@/lib/order-pickup";
import { isDeliveryFailed, type OrderDetail } from "@/types/order-flow";
import { PackOrderDialog } from "../../../../fulfillments/components/pack-order-dialog";
import { HandOverDialog } from "../../../../shipments/components/hand-over-dialog";
import { ShipmentNoteDialog } from "../../../../shipments/components/shipment-detail-sheet";
import { reportShipmentError } from "../../../../shipments/components/shipment-ui";
import { DeliverySheet } from "../../../../shipper/components/delivery-sheet";
import { ConfirmReturnedDialog } from "./confirm-returned-dialog";
import { ConfirmRemittanceDialog } from "./confirm-remittance-dialog";
import { PickupCollectDialog } from "./pickup-collect-dialog";
import { PickupHandOverDialog } from "./pickup-hand-over-dialog";

/** Dialog bước nào đang mở. Sheet giao hàng giữ riêng (xem `sheetShipmentId`). */
type OpenStep =
  | "pack"
  | "handOver"
  | "pickUp"
  | "ship"
  | "remittance"
  | "confirmReturned"
  | "pickupCollect"
  | "pickupHandOver"
  | null;

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
      (shipment.status === "IN_TRANSIT" ||
        shipment.status === "OUT_FOR_DELIVERY" ||
        shipment.status === "FAILED"),
  );
}

/** Lần giao nội bộ đã giao xong: nơi giữ khoản thu QR để mở lại mã. */
function deliveredShipment(order: OrderDetail): OrderShipment | undefined {
  return order.shipments.find(
    (shipment) => shipment.carrierType === "INTERNAL" && shipment.status === "DELIVERED",
  );
}

/**
 * Nút hiện theo trạng thái đơn; các cờ này chỉ quyết định bấm được hay báo cần quyền. Luật thật ở BE (`assertOrderStepAccess`, `deliveryActorAccess`), sai thì trả `ORDER_STEP_DENIED`.
 * Người phụ trách làm được mọi bước không cần quyền, trừ "Bắt đầu vận chuyển" (xem `ASSIGNEE_MAY_SHIP`).
 */
/**
 * Người phụ trách bấm "Đã giao cho ĐVVC" (trừ tồn) không cần `orders:ship` khi cờ này bật. Đang tắt từ 2026-10-16 (chờ khách xác nhận); bật lại thì đổi cùng `ASSIGNEE_MAY_SHIP` ở BE (`order-handler.ts`).
 */
const ASSIGNEE_MAY_SHIP = false;

const WHO_STEP = "Chủ shop, người phụ trách đơn, hoặc nhân viên có quyền này tại kho xuất mới làm được.";
const WHO_SHIP = "Chủ shop, hoặc nhân viên có quyền này tại kho xuất, mới làm được. Người phụ trách đơn không tự bấm được bước này.";
const WHO_DELIVERY = "Chỉ shipper của lần giao, người phụ trách đơn hoặc chủ shop mới làm được.";
const WHO_RETURNED = "Chủ shop, người phụ trách đơn, hoặc người có quyền xem đơn mới làm được.";

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
    // Hàng của lần giao thất bại đã về shop: người phụ trách hoặc ai xem được đơn (BE: ORDER_RETURN_DENIED).
    canConfirmReturned: isAssignee || allows(role, "orders", "read"),
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
 * Luôn phải mount component này, kể cả khi không có nút: sheet giao hàng sống ở đây. Giao bằng QR xong đơn chuyển RECEIVED rồi COMPLETED (không còn nút), nhưng sheet vẫn phải ở lại.
 */
export function OrderJourneyActions({ order, onChanged, onNeedsReload }: OrderJourneyActionsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const wantsRemittance = useSearchParams().get("confirmCash") === "1";
  const permissions = stepPermissions(order);
  // Đơn RETURNED (giao xong rồi khách trả hàng) vẫn nhận tiền shipper nộp: tiền vào quỹ chủ, đơn giữ nguyên trạng thái Hoàn trả.
  const awaitingCash =
    (order.status === "RECEIVED" || order.status === "RETURNED") &&
    (order.collection?.cashRemittanceStatus === "PENDING" || order.paymentSummary.pendingRemittance > 0);
  // Link trong thông báo chỉ tự mở dialog cho người xác nhận được.
  const opensRemittance = wantsRemittance && awaitingCash && permissions.canConfirmCash;

  // Thông báo "Shipper đang giữ tiền mặt" dẫn tới đây kèm ?confirmCash=1: mở dialog ngay, nếu đơn thật sự
  // đang chờ tiền.
  const [openStep, setOpenStep] = React.useState<OpenStep>(() =>
    opensRemittance ? "remittance" : null,
  );
  // Đang ở sẵn đơn này khi bấm thông báo thì không có gì mount lại: bắt cờ vừa xuất hiện ngay trong lúc
  // render (không dùng effect).
  const [seenFlag, setSeenFlag] = React.useState(wantsRemittance);
  if (wantsRemittance !== seenFlag) {
    setSeenFlag(wantsRemittance);
    if (opensRemittance) setOpenStep("remittance");
  }
  // Sheet giao hàng mở theo id lưu ở đây, KHÔNG theo điều kiện hiện nút: giao bằng QR xong thì đơn sang
  // RECEIVED (nút "Giao hàng" biến mất) đúng lúc khách cần quét mã - sheet phải ở lại tới khi người dùng đóng.
  const [sheetShipmentId, setSheetShipmentId] = React.useState<string | null>(null);

  // Đơn bán tại quầy không đi theo hành trình.
  if (order.fulfillmentType === "TAKEAWAY") return null;

  const awaitingPickUp = shipmentAwaitingPickUp(order);
  const onTheRoad = shipmentOnTheRoad(order);
  const delivered = deliveredShipment(order);

  const showPack = order.status === "CONFIRMED";
  // Đã gán shipper thì không giao lần nữa; chờ shipper (hoặc người bấm hộ) xác nhận đã lấy hàng.
  // Đơn khách tới lấy không đi qua vận chuyển (xem `pickup` bên dưới).
  const pickup = isStorePickup(order);
  const showHandOver = order.status === "PACKED" && !pickup && !awaitingPickUp;
  const showAwaitingPickUp = order.status === "PACKED" && awaitingPickUp !== undefined;
  const showPickUp = showAwaitingPickUp;
  // Khách tới lấy: đang chờ khách ở quầy. Thu nốt tiền trước, đủ tiền mới giao hàng cho khách. Cùng nhóm quyền với bước trừ tồn.
  const pickupWaiting = pickup && order.status === "PACKED";
  const showPickupCollect = pickupWaiting && order.paymentStatus !== "PAID";
  const showPickupHandOver = pickupWaiting && order.paymentStatus === "PAID";
  const showShip = order.status === "PICKED_UP";
  const showDeliver = order.status === "SHIPPING" && onTheRoad !== undefined;
  const failedShipment = order.shipments.find((shipment) => shipment.status === "FAILED");
  const showConfirmReturned = isDeliveryFailed(order) && failedShipment !== undefined;
  const showQr =
    order.status === "RECEIVED" &&
    order.collection?.method === "BANK_TRANSFER_QR" &&
    delivered !== undefined;

  const hasButton =
    showPack ||
    showHandOver ||
    showPickUp ||
    showShip ||
    showPickupCollect ||
    showPickupHandOver ||
    showDeliver ||
    showQr ||
    showConfirmReturned ||
    awaitingCash;
  const hasRow = hasButton || showAwaitingPickUp || pickupWaiting;

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
          {pickupWaiting && (
            <Badge variant="info" className="self-start sm:self-auto">
              {order.paymentStatus === "PAID"
                ? "Đã thu đủ tiền, chờ giao hàng cho khách"
                : "Chờ khách tới lấy và thanh toán phần còn lại"}
            </Badge>
          )}
          {/* Phải: nút bước kế tiếp, ở cuối chiều đọc của thanh các bước - như nút xác nhận ở chân mọi dialog. */}
          {hasButton && (
            <div className="flex flex-col gap-2 sm:ml-auto sm:flex-row">
              {showPack && (
                <PermissionButton
                  allowed={permissions.canPack}
                  permission="orders:pack"
                  who={WHO_STEP}
                  onClick={() => setOpenStep("pack")}
                  className={STEP_BUTTON_CLASS}
                >
                  <PackageCheck className="size-4" />
                  Đóng đơn
                </PermissionButton>
              )}
              {showHandOver && (
                <PermissionButton
                  allowed={permissions.canHandOver}
                  permission="shipments:create"
                  who={WHO_STEP}
                  onClick={() => setOpenStep("handOver")}
                  className={STEP_BUTTON_CLASS}
                >
                  <Send className="size-4" />
                  Giao cho ĐVVC
                </PermissionButton>
              )}
              {showPickUp && (
                <PermissionButton
                  allowed={permissions.canActOnDelivery(awaitingPickUp)}
                  who={WHO_DELIVERY}
                  onClick={() => setOpenStep("pickUp")}
                  className={STEP_BUTTON_CLASS}
                >
                  <PackageOpen className="size-4" />
                  Xác nhận đã lấy hàng
                </PermissionButton>
              )}
              {showShip && (
                <PermissionButton
                  allowed={permissions.canShip}
                  permission="orders:ship"
                  who={WHO_SHIP}
                  onClick={() => setOpenStep("ship")}
                  className={STEP_BUTTON_CLASS}
                >
                  <Truck className="size-4" />
                  Bắt đầu vận chuyển
                </PermissionButton>
              )}
              {showPickupCollect && (
                <PermissionButton
                  allowed={permissions.canShip}
                  permission="orders:ship"
                  who={WHO_SHIP}
                  onClick={() => setOpenStep("pickupCollect")}
                  className={STEP_BUTTON_CLASS}
                >
                  <Banknote className="size-4" />
                  Thu tiền còn lại
                </PermissionButton>
              )}
              {showPickupHandOver && (
                <PermissionButton
                  allowed={permissions.canShip}
                  permission="orders:ship"
                  who={WHO_SHIP}
                  onClick={() => setOpenStep("pickupHandOver")}
                  className={STEP_BUTTON_CLASS}
                >
                  <HandHelping className="size-4" />
                  Giao hàng cho khách
                </PermissionButton>
              )}
              {showDeliver && onTheRoad && (
                <PermissionButton
                  allowed={permissions.canActOnDelivery(onTheRoad)}
                  who={WHO_DELIVERY}
                  onClick={() => setSheetShipmentId(onTheRoad.id)}
                  className={STEP_BUTTON_CLASS}
                >
                  <MapPinCheck className="size-4" />
                  Giao hàng
                </PermissionButton>
              )}
              {showConfirmReturned && (
                <PermissionButton
                  allowed={permissions.canConfirmReturned}
                  who={WHO_RETURNED}
                  variant="outline"
                  onClick={() => setOpenStep("confirmReturned")}
                  className={STEP_BUTTON_CLASS}
                >
                  <Undo2 className="size-4" />
                  Xác nhận hàng đã hoàn về shop
                </PermissionButton>
              )}
              {showQr && delivered && (
                <PermissionButton
                  allowed={permissions.canActOnDelivery(delivered)}
                  who={WHO_DELIVERY}
                  onClick={() => setSheetShipmentId(delivered.id)}
                  className={STEP_BUTTON_CLASS}
                >
                  <QrCode className="size-4" />
                  Mã QR thanh toán
                </PermissionButton>
              )}
              {awaitingCash && (
                <PermissionButton
                  allowed={permissions.canConfirmCash}
                  permission="orders:confirm_cash"
                  onClick={() => setOpenStep("remittance")}
                  className={STEP_BUTTON_CLASS}
                >
                  <Banknote className="size-4" />
                  Xác nhận đã nhận tiền
                </PermissionButton>
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
      {openStep === "pickupCollect" && (
        <PickupCollectDialog
          order={order}
          onClose={closeStep}
          onCollected={closeAndReload}
        />
      )}
      {openStep === "pickupHandOver" && (
        <PickupHandOverDialog
          order={order}
          onClose={closeStep}
          onHandedOver={closeAndReload}
        />
      )}
      {openStep === "confirmReturned" && failedShipment && (
        <ConfirmReturnedDialog
          held={order.paymentSummary.net}
          onClose={closeStep}
          onConfirm={(note, refund) =>
            orderReturnApi.confirmFailedDelivery(failedShipment.id, note, refund).then(
              () => {
                toast.success(`Đơn ${order.code} đã hoàn trả về shop`);
                closeAndReload();
              },
              (error: unknown) => {
                if (reportShipmentError(error, "Xác nhận hoàn hàng thất bại, vui lòng thử lại")) {
                  closeAndReload();
                }
              },
            )
          }
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
