"use client";

// Chi tiết một lần giao: người nhận, nhật trình, và các nút theo trạng thái (chuyển Đang vận chuyển, đổi
// shipper, đang đi giao, giao không thành) cùng dialog ghi chú của các nút đó.

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { orderJourneyApi } from "@/lib/api/order-journey";
import { shipmentApi } from "@/lib/api/shipment";
import { personName, SHIPMENT_STATUS_LABELS, type Shipment } from "@/types/order-flow";
import { ChangeDriverDialog } from "./driver-dialogs";
import {
  carrierLabel,
  formatVND,
  isFinished,
  isOnTheRoad,
  reportShipmentError,
  shipmentActions,
  ShipmentStatusBadge,
} from "./shipment-ui";

type DetailState = { status: "loading" } | { status: "error" } | { status: "ready"; shipment: Shipment };

/** Thao tác đang mở dialog. */
type OpenAction = "ship" | "outForDelivery" | "fail" | "changeDriver" | null;

interface ShipmentDetailSheetProps {
  /** Lần giao đang mở; `null` = đóng. Trang cha đặt `key` theo id nên mỗi lần mở là state mới. */
  shipmentId: string | null;
  reloadKey: number;
  onClose: () => void;
  /** Có thao tác thành công, hoặc dữ liệu vừa đổi ở nơi khác – tải lại cả hai tab và sheet. */
  onChanged: () => void;
}

// ─── Dialog ghi chú ─────────────────────────────────────────────────────────

interface ShipmentNoteDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  /** Bắt buộc ghi chú (vd. lý do giao không thành). */
  requireNote?: boolean;
  placeholder?: string;
  /** Nút xác nhận màu đỏ cho thao tác không quay lại được. */
  destructive?: boolean;
  onClose: () => void;
  /** Gọi BE; dialog khoá nút cho tới khi promise xong. Nơi gọi tự báo lỗi / tải lại. */
  onConfirm: (note: string | undefined) => Promise<void>;
}

/** Xác nhận một thao tác kèm ghi chú. Nơi gọi đặt `key` theo thao tác nên mỗi lần mở là ghi chú trống. */
function ShipmentNoteDialog({
  open,
  title,
  description,
  confirmLabel,
  requireNote = false,
  placeholder = "Ghi chú",
  destructive = false,
  onClose,
  onConfirm,
}: ShipmentNoteDialogProps) {
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const missingNote = requireNote && note.trim() === "";

  const submit = () => {
    // Khoá nút trong lúc gọi: bấm đúp không gửi hai request.
    if (submitting || missingNote) return;
    setSubmitting(true);
    onConfirm(note.trim() || undefined).finally(() => setSubmitting(false));
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && !submitting && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <Textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} placeholder={placeholder} />
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Huỷ
          </Button>
          <Button variant={destructive ? "destructive" : "default"} onClick={submit} disabled={submitting || missingNote}>
            {submitting ? "Đang xử lý..." : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Sheet ──────────────────────────────────────────────────────────────────

/** Chữ ở đầu sheet khi chưa có dữ liệu. */
function loadingText(state: DetailState): string {
  return state.status === "error" ? "Không tải được lần giao" : "Đang tải...";
}

/** Một dòng thông tin "nhãn: giá trị". */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[8rem_1fr] gap-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span>{children || "—"}</span>
    </div>
  );
}

export function ShipmentDetailSheet({ shipmentId, reloadKey, onClose, onChanged }: ShipmentDetailSheetProps) {
  const [state, setState] = useState<DetailState>({ status: "loading" });
  const [action, setAction] = useState<OpenAction>(null);

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

  /** Chạy một thao tác: thành công → báo, đóng dialog, tải lại; dữ liệu cũ → cũng đóng và tải lại; lỗi khác → giữ dialog. */
  const run = (call: () => Promise<unknown>, success: string, fallback: string) =>
    call().then(
      () => {
        toast.success(success);
        setAction(null);
        onChanged();
      },
      (error: unknown) => {
        if (reportShipmentError(error, fallback)) {
          setAction(null);
          onChanged();
        }
      },
    );

  const shipment = state.status === "ready" ? state.shipment : null;
  const allowed = shipmentActions(shipment);

  return (
    <Sheet open={shipmentId !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Lần giao {shipment ? `đơn ${shipment.order.code}` : ""}</SheetTitle>
          <SheetDescription>
            {shipment ? <ShipmentStatusBadge status={shipment.status} /> : loadingText(state)}
          </SheetDescription>
        </SheetHeader>

        {shipment && (
          <div className="space-y-5 px-4 pb-6">
            <div className="space-y-2">
              <Field label="Khách hàng">{shipment.order.customerName}</Field>
              <Field label="Người nhận">
                {[shipment.recipientName, shipment.recipientPhone].filter(Boolean).join(" · ")}
              </Field>
              <Field label="Địa chỉ">{shipment.deliveryAddress}</Field>
              <Field label="Giao bởi">{carrierLabel(shipment.carrierType, shipment.carrierName)}</Field>
              {shipment.carrierType === "INTERNAL" ? (
                <Field label="Shipper">{personName(shipment.driver)}</Field>
              ) : (
                <Field label="Mã vận đơn">{shipment.trackingCode}</Field>
              )}
              <Field label="Hẹn giao">
                {[shipment.scheduledDate?.slice(0, 10), shipment.scheduledSlot].filter(Boolean).join(" · ")}
              </Field>
              <Field label="Lắp đặt">{shipment.requiresInstallation ? "Có" : "Không"}</Field>
              <Field label="Còn phải thu">{formatVND(shipment.order.amountDue)}</Field>
              <Field label="Ghi chú">{shipment.note}</Field>
            </div>

            {!isFinished(shipment.status) && (
              <div className="flex flex-wrap gap-2">
                {shipment.status === "PICKED_UP" && allowed.canShip && (
                  <Button onClick={() => setAction("ship")}>Chuyển Đang vận chuyển</Button>
                )}
                {isOnTheRoad(shipment.status) && allowed.canTrack && (
                  <>
                    <Button variant="outline" onClick={() => setAction("outForDelivery")}>
                      Đang đi giao
                    </Button>
                    <Button variant="destructive" onClick={() => setAction("fail")}>
                      Giao không thành
                    </Button>
                  </>
                )}
                {shipment.carrierType === "INTERNAL" && allowed.canChangeDriver && (
                  <Button variant="outline" onClick={() => setAction("changeDriver")}>
                    Đổi shipper
                  </Button>
                )}
              </div>
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

            <ShipmentNoteDialog
              key={`ship-${action === "ship"}`}
              open={action === "ship"}
              title="Chuyển sang Đang vận chuyển"
              description="Thao tác này trừ tồn kho đúng số hàng đã khoá lúc đóng gói và không quay lại được."
              confirmLabel="Xác nhận"
              onClose={() => setAction(null)}
              onConfirm={(note) =>
                run(
                  () => orderJourneyApi.ship(shipment.order.id, note),
                  `Đơn ${shipment.order.code} đang vận chuyển`,
                  "Chuyển Đang vận chuyển thất bại, vui lòng thử lại",
                )
              }
            />
            <ShipmentNoteDialog
              key={`out-${action === "outForDelivery"}`}
              open={action === "outForDelivery"}
              title="Đang đi giao"
              description="Ghi nhật trình: shipper đang trên đường tới khách."
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
            <ChangeDriverDialog
              key={`driver-${action === "changeDriver"}`}
              shipment={shipment}
              open={action === "changeDriver"}
              onClose={() => setAction(null)}
              onNeedsReload={() => {
                setAction(null);
                onChanged();
              }}
            />
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
