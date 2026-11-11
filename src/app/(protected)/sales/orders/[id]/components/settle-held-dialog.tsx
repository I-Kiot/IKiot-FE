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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  onSettled: (order: OrderDetail) => void;
};

type Mode = "choose" | "refund" | "keep";

/**
 * Quyết định tiền shop đang giữ treo của đơn đã kết thúc (`POST /orders/:id/settle-held`, quyền `returns:inspect`):
 * hoàn cho khách (tối đa bằng số treo, phần còn lại vẫn treo) hoặc giữ lại toàn bộ làm thu nhập khác (không hoàn tác được nên có bước xác nhận).
 */
export function SettleHeldDialog({ order, open, onOpenChange, onSettled }: Props) {
  const held = order.paymentSummary.heldUndecided;
  const [mode, setMode] = React.useState<Mode>("choose");
  const [draft, setDraft] = React.useState<RefundDraft>(() => emptyRefundDraft(held));
  const [keepNote, setKeepNote] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const refundInvalid = draft.amount <= 0 || refundDraftError(draft, held) !== null;

  async function run(call: () => Promise<OrderDetail>, success: string) {
    setSaving(true);
    try {
      const updated = await call();
      toast.success(success);
      onSettled(updated);
    } catch (error) {
      toast.error(getApiErrorBody(error)?.message ?? "Không xử lý được, vui lòng thử lại");
    } finally {
      setSaving(false);
    }
  }

  const refund = () =>
    run(
      () =>
        orderJourneyApi.settleHeld(order.id, {
          action: "REFUND",
          amount: Math.round(draft.amount),
          method: draft.method,
          note: draft.note.trim() || undefined,
        }),
      `Đã hoàn ${formatVND(Math.round(draft.amount))} cho khách`,
    );

  const keep = () =>
    run(
      () => orderJourneyApi.settleHeld(order.id, { action: "KEEP", note: keepNote.trim() || undefined }),
      `Đã ghi ${formatVND(held)} vào thu nhập khác`,
    );

  return (
    <Dialog open={open} onOpenChange={(next) => !saving && onOpenChange(next)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Tiền giữ treo - đơn {order.code}</DialogTitle>
          <DialogDescription>
            Shop đang giữ {formatVND(held)} của khách mà chưa quyết định. Hoàn lại cho khách, hoặc giữ lại và ghi vào
            thu nhập khác.
          </DialogDescription>
        </DialogHeader>

        {mode === "choose" && (
          <div className="grid gap-2">
            <Button className="cursor-pointer" onClick={() => setMode("refund")}>
              Hoàn tiền
            </Button>
            <Button variant="outline" className="cursor-pointer" onClick={() => setMode("keep")}>
              Giữ lại (ghi thu nhập khác)
            </Button>
          </div>
        )}

        {mode === "refund" && (
          <>
            <RefundFields
              idPrefix="settle-held-refund"
              draft={draft}
              onChange={setDraft}
              max={held}
              held={held}
              allowKeep={false}
              disabled={saving}
            />
            <p className="text-sm text-muted-foreground">
              Hoàn một phần thì phần còn lại vẫn treo, quyết định sau.
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setMode("choose")} disabled={saving} className="cursor-pointer">
                Quay lại
              </Button>
              <Button onClick={() => void refund()} disabled={refundInvalid || saving} className="cursor-pointer">
                {saving ? "Đang hoàn..." : "Hoàn tiền"}
              </Button>
            </DialogFooter>
          </>
        )}

        {mode === "keep" && (
          <>
            <div className="grid gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
              <p>
                Giữ lại <strong>{formatVND(held)}</strong> làm thu nhập khác, tính vào doanh thu ngày hôm nay. Sau đó
                không hoàn lại cho khách qua đơn này được nữa.
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="settle-held-keep-note">Ghi chú (không bắt buộc)</Label>
              <Textarea
                id="settle-held-keep-note"
                rows={2}
                maxLength={500}
                value={keepNote}
                disabled={saving}
                onChange={(e) => setKeepNote(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setMode("choose")} disabled={saving} className="cursor-pointer">
                Quay lại
              </Button>
              <Button onClick={() => void keep()} disabled={saving} className="cursor-pointer">
                {saving ? "Đang ghi..." : "Xác nhận giữ lại"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
