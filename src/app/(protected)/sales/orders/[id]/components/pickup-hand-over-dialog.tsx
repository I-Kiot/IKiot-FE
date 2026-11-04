"use client";

import * as React from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getApiErrorBody } from "@/lib/api/error-codes";
import { orderJourneyApi } from "@/lib/api/order-journey";
import type { OrderDetail } from "@/types/order-flow";

type Props = {
  order: OrderDetail;
  onClose: () => void;
  onHandedOver: (order: OrderDetail) => void;
};

/**
 * Giao hàng cho khách tại quầy (`POST /orders/:id/pickup/hand-over`): trừ tồn kho đúng số hàng đã khoá lúc đóng đơn,
 * đơn hoàn thành và xuất hoá đơn. Không quay lại được.
 */
export function PickupHandOverDialog({ order, onClose, onHandedOver }: Props) {
  const [receiverName, setReceiverName] = React.useState(order.recipientName ?? "");
  const [note, setNote] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const submit = async () => {
    setSaving(true);
    try {
      const updated = await orderJourneyApi.pickupHandOver(order.id, {
        receiverName: receiverName.trim() || undefined,
        note: note.trim() || undefined,
      });
      toast.success(`Đơn ${order.code} đã giao cho khách`);
      onHandedOver(updated);
    } catch (error) {
      toast.error(getApiErrorBody(error)?.message ?? "Không giao được hàng, vui lòng thử lại");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Giao hàng cho khách</DialogTitle>
          <DialogDescription>
            Đơn {order.code} đã thu đủ tiền. Thao tác này trừ tồn kho, hoàn thành đơn và xuất hoá đơn, không quay lại
            được.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="pickup-receiver">Người nhận hàng</Label>
            <Input
              id="pickup-receiver"
              value={receiverName}
              onChange={(e) => setReceiverName(e.target.value)}
              maxLength={200}
              placeholder="Để trống nếu là người đặt đơn"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="pickup-note">Ghi chú (không bắt buộc)</Label>
            <Textarea id="pickup-note" value={note} onChange={(e) => setNote(e.target.value)} rows={2} maxLength={500} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="cursor-pointer">
            Huỷ
          </Button>
          <Button onClick={() => void submit()} disabled={saving} className="cursor-pointer">
            {saving ? "Đang xử lý..." : "Xác nhận đã giao"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
