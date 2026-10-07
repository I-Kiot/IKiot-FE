"use client";

// Dialog "Giao cho vận chuyển": ghi nhận ĐVVC / shipper đã lấy hàng cho một đơn đã đóng gói (POST /shipments).

import { useState } from "react";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { shipmentApi } from "@/lib/api/shipment";
import type { CarrierType, HandOverReadyOrder } from "@/types/order-flow";
import { DriverSelect } from "./driver-dialogs";
import { reportShipmentError } from "./shipment-ui";

interface HandOverDialogProps {
  /** Đơn đang giao; `null` = dialog đóng. */
  order: HandOverReadyOrder | null;
  onClose: () => void;
  /** Danh sách đã cũ: giao xong, hoặc đơn vừa đổi trạng thái ở nơi khác. */
  onNeedsReload: () => void;
}

/** Trang cha đặt `key={order.id}` nên mỗi đơn mở ra là một form mới. */
export function HandOverDialog({ order, onClose, onNeedsReload }: HandOverDialogProps) {
  const [carrierType, setCarrierType] = useState<CarrierType>("INTERNAL");
  const [driverId, setDriverId] = useState("");
  const [carrierName, setCarrierName] = useState("");
  const [trackingCode, setTrackingCode] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [slotFrom, setSlotFrom] = useState("");
  const [slotTo, setSlotTo] = useState("");
  const [requiresInstallation, setRequiresInstallation] = useState(false);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const internal = carrierType === "INTERNAL";
  const missingDriver = internal && !driverId;
  // Khung giờ lưu dạng "HH:mm-HH:mm"; chỉ chọn một đầu thì lưu đầu đó.
  const scheduledSlot = slotFrom && slotTo ? `${slotFrom}-${slotTo}` : slotFrom || slotTo;
  const slotInvalid = !!slotFrom && !!slotTo && slotTo <= slotFrom;

  const submit = () => {
    // Khoá nút trong lúc gọi: bấm đúp không gửi hai request.
    if (!order || submitting || missingDriver || slotInvalid) return;
    setSubmitting(true);
    shipmentApi
      .create({
        orderId: order.id,
        carrierType,
        driverId: internal ? driverId : undefined,
        carrierName: internal ? undefined : carrierName.trim() || undefined,
        trackingCode: internal ? undefined : trackingCode.trim() || undefined,
        scheduledDate: scheduledDate || undefined,
        scheduledSlot: scheduledSlot || undefined,
        requiresInstallation,
        // Phí giao lấy từ đơn (mục Thanh toán), không nhập lại ở đây.
        shippingCost: order.shippingFee > 0 ? order.shippingFee : undefined,
        note: note.trim() || undefined,
      })
      .then(() => {
        toast.success(`Đã giao đơn ${order.code} cho vận chuyển`);
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
        <DialogHeader>
          <DialogTitle>Giao đơn {order?.code} cho vận chuyển</DialogTitle>
          <DialogDescription>
            Ghi nhận đơn vị vận chuyển / shipper đã lấy hàng. Tồn kho chưa bị trừ - chỉ trừ khi chuyển sang Đang
            vận chuyển.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <RadioGroup
            value={carrierType}
            onValueChange={(value) => setCarrierType(value as CarrierType)}
            className="flex gap-6"
          >
            <Label className="flex items-center gap-2 font-normal">
              <RadioGroupItem value="INTERNAL" /> Shipper của shop
            </Label>
            <Label className="flex items-center gap-2 font-normal">
              <RadioGroupItem value="EXTERNAL" /> Đơn vị vận chuyển
            </Label>
          </RadioGroup>

          {internal && order ? (
            <div className="space-y-2">
              <Label>Shipper</Label>
              <DriverSelect orderId={order.id} value={driverId} onChange={setDriverId} disabled={submitting} />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Tên đơn vị</Label>
                <Input value={carrierName} onChange={(e) => setCarrierName(e.target.value)} maxLength={100} />
              </div>
              <div className="space-y-2">
                <Label>Mã vận đơn</Label>
                <Input value={trackingCode} onChange={(e) => setTrackingCode(e.target.value)} maxLength={100} />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Ngày hẹn giao</Label>
              <Input type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} />
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
          <Button onClick={submit} disabled={submitting || missingDriver || slotInvalid}>
            {submitting ? "Đang xử lý..." : "Xác nhận đã giao"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
