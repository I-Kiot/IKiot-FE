"use client";

import * as React from "react";
import { toast } from "sonner";
import { MoneyInput } from "@/app/(protected)/exchange/shared/form-fields";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { getApiErrorBody } from "@/lib/api/error-codes";
import { orderJourneyApi } from "@/lib/api/order-journey";
import type { OrderDetail, RefundMethod } from "@/types/order-flow";
import { formatVND } from "../../shared/order-display";

type Props = {
  order: OrderDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCancelled: (order: OrderDetail) => void;
};

/**
 * Huỷ đơn trước khi hàng rời kho (`POST /orders/:id/cancel`). Người huỷ tự nhập số tiền hoàn, để 0 thì shop giữ lại tiền đã thu
 * (khách chủ động huỷ). Tiền hoàn ghi một dòng chi vào sổ thu chi; phần giữ lại đã có dòng thu từ lúc nhận tiền.
 */
export function CancelOrderDialog({ order, open, onOpenChange, onCancelled }: Props) {
  const held = order.paymentSummary.net;
  const [refund, setRefund] = React.useState(0);
  const [method, setMethod] = React.useState<RefundMethod>("CASH");
  const [reason, setReason] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const tooMuch = refund > held;

  async function submit() {
    if (tooMuch) return;
    setSaving(true);
    try {
      const result = await orderJourneyApi.cancel(order.id, {
        reason: reason.trim() || undefined,
        ...(held > 0 ? { refundAmount: refund } : {}),
        ...(refund > 0 ? { refundMethod: method } : {}),
      });
      toast.success(`Đã huỷ đơn ${order.code}`);
      if (result.openProductionRequests.length > 0) {
        toast.warning("Đơn còn yêu cầu sản xuất đang mở, cần xử lý riêng ở màn Yêu cầu sản xuất");
      }
      onCancelled(await orderJourneyApi.getById(order.id));
    } catch (error) {
      toast.error(getApiErrorBody(error)?.message ?? "Không huỷ được đơn, vui lòng thử lại");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Huỷ đơn {order.code}</DialogTitle>
          <DialogDescription>
            Hàng đã khoá cho đơn sẽ trả về kệ. Thao tác này không quay lại được.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          {held > 0 && (
            <>
              <div className="grid gap-2">
                <Label htmlFor="cancel-refund">Số tiền hoàn cho khách</Label>
                <MoneyInput id="cancel-refund" value={refund} onChange={setRefund} />
                <p className={tooMuch ? "text-sm text-destructive" : "text-sm text-muted-foreground"}>
                  {tooMuch
                    ? `Không được hoàn quá ${formatVND(held)} shop đang giữ.`
                    : `Shop đang giữ ${formatVND(held)}. Shop giữ lại ${formatVND(held - refund)}, để 0 nếu không hoàn.`}
                </p>
              </div>
              {refund > 0 && (
                <div className="grid gap-2">
                  <Label>Hoàn bằng</Label>
                  <RadioGroup
                    value={method}
                    onValueChange={(value) => setMethod(value as RefundMethod)}
                    className="flex gap-4"
                  >
                    <Label className="flex cursor-pointer items-center gap-2 font-normal">
                      <RadioGroupItem value="CASH" />
                      Tiền mặt
                    </Label>
                    <Label className="flex cursor-pointer items-center gap-2 font-normal">
                      <RadioGroupItem value="BANK_TRANSFER" />
                      Chuyển khoản
                    </Label>
                  </RadioGroup>
                </div>
              )}
            </>
          )}
          <div className="grid gap-2">
            <Label htmlFor="cancel-reason">Lý do huỷ</Label>
            <Textarea id="cancel-reason" rows={2} value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
            className="cursor-pointer"
          >
            Đóng
          </Button>
          <Button
            variant="destructive"
            onClick={() => void submit()}
            disabled={saving || tooMuch}
            className="cursor-pointer"
          >
            {saving ? "Đang huỷ..." : "Huỷ đơn"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
