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
import {
  RefundFields,
  emptyRefundDraft,
  refundDraftError,
  type RefundDraft,
} from "@/components/order-refund-fields";
import { getApiErrorBody } from "@/lib/api/error-codes";
import { orderJourneyApi } from "@/lib/api/order-journey";
import type { OrderDetail } from "@/types/order-flow";
import { formatVND } from "../../shared/order-display";

type Props = {
  order: OrderDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRefunded: (order: OrderDetail) => void;
};

/** Hoàn phần khách trả dư của đơn đã chốt (`POST /orders/:id/refund-excess`). Tối đa bằng `paymentSummary.overpaidBy`. */
export function RefundExcessDialog({ order, open, onOpenChange, onRefunded }: Props) {
  const excess = order.paymentSummary.overpaidBy;
  const [draft, setDraft] = React.useState<RefundDraft>(() => emptyRefundDraft(excess));
  const [saving, setSaving] = React.useState(false);
  const invalid = draft.amount <= 0 || refundDraftError(draft, excess) !== null;

  async function submit() {
    if (invalid) return;
    setSaving(true);
    try {
      const updated = await orderJourneyApi.refundExcess(order.id, {
        amount: Math.round(draft.amount),
        method: draft.method,
        note: draft.note.trim() || undefined,
      });
      toast.success(`Đã hoàn ${formatVND(Math.round(draft.amount))} cho khách`);
      onRefunded(updated);
    } catch (error) {
      toast.error(getApiErrorBody(error)?.message ?? "Không hoàn được tiền, vui lòng thử lại");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !saving && onOpenChange(next)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Hoàn tiền trả dư - đơn {order.code}</DialogTitle>
          <DialogDescription>
            Khách đã trả dư {formatVND(excess)} so với tổng đơn. Hoàn lại cho khách bằng tiền mặt (lấy từ quỹ của chi
            nhánh bán đơn) hoặc chuyển khoản.
          </DialogDescription>
        </DialogHeader>
        <RefundFields
          idPrefix="excess-refund"
          draft={draft}
          onChange={setDraft}
          max={excess}
          held={excess}
          allowKeep={false}
          disabled={saving}
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving} className="cursor-pointer">
            Đóng
          </Button>
          <Button onClick={() => void submit()} disabled={invalid || saving} className="cursor-pointer">
            {saving ? "Đang hoàn..." : "Hoàn tiền"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
