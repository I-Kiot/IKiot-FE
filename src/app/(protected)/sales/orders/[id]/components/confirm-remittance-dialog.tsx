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
import { getApiErrorBody, remittanceGapOf } from "@/lib/api/error-codes";
import { orderJourneyApi } from "@/lib/api/order-journey";
import type { OrderDetail } from "@/types/order-flow";
import { formatDateTime, formatVND } from "../../shared/order-display";

type Props = {
  order: OrderDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmed: (order: OrderDetail) => void;
};

/**
 * D-9: the owner counts the cash a shipper collected on delivery and confirms all of it arrived
 * (`POST /orders/:id/confirm-remittance`, A-10) - the order goes RECEIVED → COMPLETED. A short
 * hand-over is refused by the server; the dialog shows how much is missing.
 */
export function ConfirmRemittanceDialog({ order, open, onOpenChange, onConfirmed }: Props) {
  const collected = order.collection?.amount ?? 0;
  const [amount, setAmount] = React.useState(String(collected));
  const [note, setNote] = React.useState("");
  const [gap, setGap] = React.useState<number | null>(null);
  const [saving, setSaving] = React.useState(false);

  const value = Number(amount);
  const valid = Number.isFinite(value) && value >= 0;

  async function submit() {
    if (!valid) return;
    setSaving(true);
    setGap(null);
    try {
      const updated = await orderJourneyApi.confirmRemittance(order.id, {
        amount: Math.round(value),
        note: note.trim() || undefined,
      });
      toast.success("Đã xác nhận nhận đủ tiền, đơn hoàn thành");
      onConfirmed(updated);
    } catch (error) {
      const mismatch = remittanceGapOf(error);
      if (mismatch) setGap(mismatch.difference);
      else toast.error(getApiErrorBody(error)?.message ?? "Không xác nhận được");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Xác nhận đã nhận tiền từ shipper</DialogTitle>
          <DialogDescription>
            {order.collection?.collectedBy?.name ?? "Shipper"} đã thu {formatVND(collected)} tiền mặt
            {order.collection?.collectedAt ? ` lúc ${formatDateTime(order.collection.collectedAt)}` : ""}.
            Chỉ xác nhận khi đã nhận đủ số này.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label>Số tiền đã nhận</Label>
            <Input
              type="number"
              min={0}
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setGap(null);
              }}
            />
            {gap !== null && (
              <p className="text-sm text-destructive">
                {gap < 0
                  ? `Còn thiếu ${formatVND(-gap)} so với số shipper đã thu. Chỉ xác nhận khi nhận đủ.`
                  : `Nhiều hơn ${formatVND(gap)} so với số shipper đã thu.`}
              </p>
            )}
          </div>
          <div className="grid gap-2">
            <Label>Ghi chú</Label>
            <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Huỷ
          </Button>
          <Button onClick={submit} disabled={!valid || saving}>
            {saving ? "Đang xác nhận..." : "Đã nhận đủ tiền"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
