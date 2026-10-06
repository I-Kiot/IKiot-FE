"use client";

// Chi tiết một lần giao của shipper: người nhận, số tiền phải thu, nhật trình, và các nút theo trạng thái
// (đang đi giao, đã giao, giao không thành; sau khi giao bằng QR: mã QR, kiểm tra tiền về, đổi sang tiền mặt).

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { shipmentApi } from "@/lib/api/shipment";
import { personName, SHIPMENT_STATUS_LABELS, type Shipment, type ShipmentQrPayment } from "@/types/order-flow";
import { ShipmentNoteDialog } from "../../shipments/components/shipment-detail-sheet";
import {
  formatVND,
  isOnTheRoad,
  reportShipmentError,
  ShipmentStatusBadge,
} from "../../shipments/components/shipment-ui";
import { DeliverDialog } from "./deliver-dialog";

type DetailState = { status: "loading" } | { status: "error" } | { status: "ready"; shipment: Shipment };

/** Thao tác đang mở dialog. */
type OpenAction = "outForDelivery" | "deliver" | "fail" | "payCash" | null;

interface DeliverySheetProps {
  /** Lần giao đang mở; `null` = đóng. Trang đặt `key` theo id nên mỗi lần mở là state mới. */
  shipmentId: string | null;
  onClose: () => void;
  /** Có thao tác thành công, hoặc dữ liệu vừa đổi ở nơi khác – trang tải lại danh sách. */
  onChanged: () => void;
}

/** Chữ ở đầu sheet khi chưa có dữ liệu. */
function loadingText(state: DetailState): string {
  return state.status === "error" ? "Không tải được lần giao" : "Đang tải...";
}

/** Một dòng thông tin "nhãn: giá trị". */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[7rem_1fr] gap-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span>{children || "—"}</span>
    </div>
  );
}

/** Khung thu tiền QR: chờ tiền về thì hiện mã cho khách quét; đã về thì báo đã nhận. */
function QrPaymentPanel({
  payment,
  checking,
  onCheck,
  onPayCash,
}: {
  payment: ShipmentQrPayment;
  checking: boolean;
  onCheck: () => void;
  onPayCash: () => void;
}) {
  if (payment.status === "PAID") {
    return (
      <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">
        Đã nhận chuyển khoản {formatVND(payment.amount)} - đơn hoàn thành.
      </div>
    );
  }
  if (payment.status !== "PENDING") {
    return null;
  }
  return (
    <div className="space-y-3 rounded-md border p-3">
      <p className="text-sm font-medium">Khách quét mã để chuyển {formatVND(payment.amount)}</p>
      {payment.qrUrl && (
        // eslint-disable-next-line @next/next/no-img-element -- ảnh VietQR từ dịch vụ ngoài
        <img src={payment.qrUrl} alt="Mã QR chuyển khoản" className="mx-auto w-60 max-w-full" />
      )}
      <p className="text-center text-xs text-muted-foreground">Nội dung chuyển khoản: {payment.reference}</p>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={onCheck} disabled={checking}>
          {checking ? "Đang kiểm tra..." : "Kiểm tra tiền về"}
        </Button>
        <Button variant="outline" onClick={onPayCash}>
          Khách không chuyển - thu tiền mặt
        </Button>
      </div>
    </div>
  );
}

export function DeliverySheet({ shipmentId, onClose, onChanged }: DeliverySheetProps) {
  const [state, setState] = useState<DetailState>({ status: "loading" });
  const [action, setAction] = useState<OpenAction>(null);
  // Tải lại sheet sau một thao tác ghi; thao tác ghi còn báo trang tải lại danh sách.
  const [reloadKey, setReloadKey] = useState(0);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!shipmentId) return;
    let cancelled = false;
    shipmentApi.getById(shipmentId).then(
      (shipment) => {
        if (!cancelled) setState({ status: "ready", shipment });
      },
      () => {
        if (!cancelled) setState({ status: "error" });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [shipmentId, reloadKey]);

  const reloadSheet = () => setReloadKey((key) => key + 1);

  /** "Kiểm tra tiền về": đọc lại lần giao; tiền vẫn chưa về thì nói rõ để shipper chờ hoặc đổi sang tiền mặt. */
  const checkPayment = () => {
    if (!shipmentId || checking) return;
    setChecking(true);
    shipmentApi
      .getById(shipmentId)
      .then((fresh) => {
        setState({ status: "ready", shipment: fresh });
        if (fresh.payment?.status === "PENDING") {
          toast.info("Chưa thấy tiền về - đợi thêm hoặc thu tiền mặt");
        } else {
          onChanged();
        }
      })
      .catch(() => toast.error("Không tải được lần giao, vui lòng thử lại"))
      .finally(() => setChecking(false));
  };

  /** Thao tác ghi xong (hoặc dữ liệu đã cũ): đóng dialog, tải lại sheet và danh sách. */
  const afterWrite = () => {
    setAction(null);
    reloadSheet();
    onChanged();
  };

  /** Chạy một thao tác ghi: thành công → báo; dữ liệu cũ → cũng tải lại; lỗi khác → giữ dialog để thử lại. */
  const run = (call: () => Promise<unknown>, success: string, fallback: string) =>
    call().then(
      () => {
        toast.success(success);
        afterWrite();
      },
      (error: unknown) => {
        if (reportShipmentError(error, fallback)) afterWrite();
      },
    );

  const shipment = state.status === "ready" ? state.shipment : null;

  return (
    <Sheet open={shipmentId !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Đơn {shipment?.order.code ?? ""}</SheetTitle>
          <SheetDescription>
            {shipment ? <ShipmentStatusBadge status={shipment.status} /> : loadingText(state)}
          </SheetDescription>
        </SheetHeader>

        {shipment && (
          <div className="space-y-5 px-4 pb-6">
            <div className="space-y-2">
              <Field label="Người nhận">{shipment.recipientName}</Field>
              <Field label="Điện thoại">
                {shipment.recipientPhone && (
                  <a href={`tel:${shipment.recipientPhone}`} className="text-primary underline">
                    {shipment.recipientPhone}
                  </a>
                )}
              </Field>
              <Field label="Địa chỉ">{shipment.deliveryAddress}</Field>
              <Field label="Hẹn giao">
                {[shipment.scheduledDate?.slice(0, 10), shipment.scheduledSlot].filter(Boolean).join(" · ")}
              </Field>
              <Field label="Lắp đặt">{shipment.requiresInstallation ? "Có" : "Không"}</Field>
              <Field label="Còn phải thu">
                <span className="font-semibold">{formatVND(shipment.order.amountDue)}</span>
              </Field>
              <Field label="Ghi chú">{shipment.note}</Field>
            </div>

            {isOnTheRoad(shipment.status) && (
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => setAction("deliver")}>Đã giao</Button>
                <Button variant="outline" onClick={() => setAction("outForDelivery")}>
                  Đang đi giao
                </Button>
                <Button variant="destructive" onClick={() => setAction("fail")}>
                  Giao không thành
                </Button>
              </div>
            )}

            {shipment.payment && (
              <QrPaymentPanel
                payment={shipment.payment}
                checking={checking}
                onCheck={checkPayment}
                onPayCash={() => setAction("payCash")}
              />
            )}

            <Separator />

            <div className="space-y-3">
              <p className="text-sm font-medium">Nhật trình</p>
              <ol className="space-y-3 border-l pl-4">
                {shipment.events.map((event) => (
                  <li key={event.id} className="text-sm">
                    <p className="font-medium">{SHIPMENT_STATUS_LABELS[event.status]}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(event.occurredAt).toLocaleString("vi-VN")}
                      {event.createdBy && ` · ${personName(event.createdBy)}`}
                    </p>
                    {event.note && <p className="mt-1">{event.note}</p>}
                  </li>
                ))}
              </ol>
            </div>

            <DeliverDialog
              key={`deliver-${action === "deliver"}`}
              shipment={shipment}
              open={action === "deliver"}
              onClose={() => setAction(null)}
              onDelivered={(delivered) => {
                setAction(null);
                // Hiện ngay kết quả (có mã QR nếu thu QR), không chờ tải lại.
                setState({ status: "ready", shipment: delivered });
                onChanged();
              }}
              onNeedsReload={afterWrite}
            />
            <ShipmentNoteDialog
              key={`out-${action === "outForDelivery"}`}
              open={action === "outForDelivery"}
              title="Đang đi giao"
              description="Ghi nhật trình: bạn đang trên đường tới khách."
              confirmLabel="Ghi nhật trình"
              placeholder="vd. Còn 15 phút tới nơi"
              onClose={() => setAction(null)}
              onConfirm={(note) =>
                run(
                  () => shipmentApi.addEvent(shipment.id, { status: "OUT_FOR_DELIVERY", note }),
                  "Đã ghi nhật trình",
                  "Ghi nhật trình thất bại, vui lòng thử lại",
                )
              }
            />
            <ShipmentNoteDialog
              key={`fail-${action === "fail"}`}
              open={action === "fail"}
              title="Giao không thành"
              description="Đơn giữ trạng thái Đang vận chuyển; hàng quay về qua phiếu hoàn hàng. Người phụ trách đơn sẽ được báo."
              confirmLabel="Xác nhận giao không thành"
              placeholder="Lý do (bắt buộc), vd. khách không nghe máy"
              requireNote
              destructive
              onClose={() => setAction(null)}
              onConfirm={(note) =>
                run(
                  () => shipmentApi.fail(shipment.id, note ?? ""),
                  "Đã ghi nhận giao không thành",
                  "Báo giao không thành thất bại, vui lòng thử lại",
                )
              }
            />
            <ShipmentNoteDialog
              key={`cash-${action === "payCash"}`}
              open={action === "payCash"}
              title="Thu tiền mặt thay chuyển khoản"
              description={`Khách không chuyển khoản: huỷ mã QR và ghi bạn đã thu ${formatVND(
                shipment.payment?.amount ?? 0,
              )} tiền mặt. Bạn giữ tiền cho tới khi nộp lại cho chủ.`}
              confirmLabel="Đã thu tiền mặt"
              onClose={() => setAction(null)}
              onConfirm={(note) =>
                run(
                  () => shipmentApi.payCash(shipment.id, note),
                  "Đã ghi nhận thu tiền mặt",
                  "Ghi nhận tiền mặt thất bại, vui lòng thử lại",
                )
              }
            />
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
