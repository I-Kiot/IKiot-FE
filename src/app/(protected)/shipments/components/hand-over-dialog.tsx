"use client";

// Dialog giao cho vận chuyển.

import { useState } from "react";
import { PAST_DATE_MESSAGE, isPastDate, todayIso } from "@/lib/date-input";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { shipmentApi } from "@/lib/api/shipment";
import type { HandOverReadyOrder } from "@/types/order-flow";
import { DriverSelect } from "./driver-dialogs";
import { reportShipmentError } from "./shipment-ui";
import { useLiveHold } from "@/hooks/use-live-refresh";
import { LiveChangeBanner } from "@/components/live-change-banner";

interface HandOverDialogProps {
  /** Đơn đang giao; `null` = dialog đóng. */
  order: HandOverReadyOrder | null;
  onClose: () => void;
  /** Danh sách đã cũ: giao xong, hoặc đơn vừa đổi trạng thái ở nơi khác. */
  onNeedsReload: () => void;
}

/** Trang cha đặt `key={order.id}` nên mỗi đơn mở ra là một form mới. */
export function HandOverDialog({ order, onClose, onNeedsReload }: HandOverDialogProps) {
  const { pending: livePending } = useLiveHold(order !== null, [order?.id]);
  const [driverId, setDriverId] = useState("");
  // Ngày hẹn đã có sẵn trên đơn thì lấy luôn và khoá; chưa có mới cho chọn.
  const orderDate = order?.requestedDeliveryDate?.slice(0, 10) ?? "";
  const dateLocked = !!orderDate;
  const [pickedDate, setScheduledDate] = useState("");
  const scheduledDate = dateLocked ? orderDate : pickedDate;
  const [slotFrom, setSlotFrom] = useState("");
  const [slotTo, setSlotTo] = useState("");
  const [requiresInstallation, setRequiresInstallation] = useState(false);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const missingDriver = !driverId;
  // Khung giờ lưu dạng "HH:mm-HH:mm"; chỉ chọn một đầu thì lưu đầu đó.
  const scheduledSlot = slotFrom && slotTo ? `${slotFrom}-${slotTo}` : slotFrom || slotTo;
  const dateInvalid = !dateLocked && isPastDate(scheduledDate);
  const slotInvalid = !!slotFrom && !!slotTo && slotTo <= slotFrom;

  const submit = () => {
    // Khoá nút trong lúc gọi: bấm đúp không gửi hai request.
    if (!order || submitting || missingDriver || slotInvalid || dateInvalid) return;
    setSubmitting(true);
    shipmentApi
      .create({
        orderId: order.id,
        carrierType: "INTERNAL",
        driverId,
        scheduledDate: scheduledDate || undefined,
        scheduledSlot: scheduledSlot || undefined,
        requiresInstallation,
        // Phí giao lấy từ đơn (mục Thanh toán), không nhập lại ở đây.
        shippingCost: order.shippingFee > 0 ? order.shippingFee : undefined,
        note: note.trim() || undefined,
      })
      .then(() => {
        // Mới chỉ gán người giao: họ còn phải tới kho lấy hàng và tự xác nhận (chốt 2026-10-15).
        toast.success(`Đã gán shipper cho đơn ${order.code} - chờ shipper xác nhận đã lấy hàng`);
        onNeedsReload();
      })
      .catch((error: unknown) => {
        // Đơn vừa bị người khác giao / huỷ: đóng dialog và tải lại; lỗi khác giữ form để sửa.
        if (reportShipmentError(error, "Giao cho vận chuyển thất bại, vui lòng thử lại")) onNeedsReload();
      })
      .finally(() => setSubmitting(false));
  };

  return (
    <Dialog open={order !== null} onOpenChange={(open) => !open && !submitting && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <LiveChangeBanner event={livePending} onReload={onClose} />
        <DialogHeader>
          <DialogTitle>Giao đơn {order?.code} cho vận chuyển</DialogTitle>
          <DialogDescription>
            Gán shipper cho đơn. Đơn chuyển sang đã lấy hàng khi shipper tới kho lấy hàng và bấm xác nhận. Tồn kho chưa bị trừ - chỉ trừ khi chuyển sang Đang vận chuyển.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {order && (
            <div className="space-y-2">
              <Label>Shipper</Label>
              <DriverSelect orderId={order.id} value={driverId} onChange={setDriverId} disabled={submitting} />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Ngày hẹn giao</Label>
              <Input
                type="date"
                min={todayIso()}
                value={scheduledDate}
                disabled={dateLocked}
                onChange={(e) => setScheduledDate(e.target.value)}
              />
              {dateLocked && <p className="text-xs text-muted-foreground">Lấy từ ngày hẹn giao của đơn hàng</p>}
              {dateInvalid && <p className="text-xs text-destructive">{PAST_DATE_MESSAGE}</p>}
            </div>
            <div className="space-y-2">
              <Label>Khung giờ</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="time"
                  aria-label="Từ giờ"
                  value={slotFrom}
                  onChange={(e) => setSlotFrom(e.target.value)}
                />
                <span className="text-muted-foreground">-</span>
                <Input
                  type="time"
                  aria-label="Đến giờ"
                  value={slotTo}
                  min={slotFrom || undefined}
                  onChange={(e) => setSlotTo(e.target.value)}
                />
              </div>
              {slotInvalid && <p className="text-xs text-destructive">Giờ kết thúc phải sau giờ bắt đầu</p>}
            </div>
          </div>

          <Label className="flex items-center gap-2 font-normal">
            <Checkbox
              checked={requiresInstallation}
              onCheckedChange={(checked) => setRequiresInstallation(checked === true)}
            />
            Cần lắp đặt tại nhà khách
          </Label>

          <Textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} placeholder="Ghi chú" />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Huỷ
          </Button>
          <Button onClick={submit} disabled={submitting || missingDriver || slotInvalid || dateInvalid}>
            {submitting ? "Đang xử lý..." : "Giao cho shipper"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
