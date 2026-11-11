"use client";

import * as React from "react";
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
import {
  RefundFields,
  emptyRefundDraft,
  refundDraftError,
  refundInputOf,
  type RefundDraft,
} from "@/components/order-refund-fields";
import type { RefundInput } from "@/types/order-flow";
import { formatVND } from "../../shared/order-display";

type Props = {
  /** Số shop đang giữ của đơn (`paymentSummary.net`): trần của khoản hoàn. */
  held: number;
  onClose: () => void;
  /** Gọi BE; dialog khoá nút cho tới khi promise xong. Nơi gọi tự báo lỗi / tải lại. */
  onConfirm: (note: string | undefined, refund: RefundInput | undefined) => Promise<void>;
};

/**
 * Xác nhận hàng của lần giao thất bại đã về shop (`POST /order-returns/confirm-failed-delivery`). Đơn đang giữ tiền thì
 * có thể hoàn luôn (không bắt buộc): chọn "Chưa hoàn" thì tiền vẫn do shop giữ và hoàn sau ở bước khác.
 */
export function ConfirmReturnedDialog({ held, onClose, onConfirm }: Props) {
  const [note, setNote] = React.useState("");
  const [refundNow, setRefundNow] = React.useState(false);
  const [draft, setDraft] = React.useState<RefundDraft>(() => emptyRefundDraft(held));
  const [submitting, setSubmitting] = React.useState(false);
  const invalid = refundNow && refundDraftError(draft, held) !== null;

  const submit = () => {
    if (submitting || invalid) return;
    setSubmitting(true);
    onConfirm(note.trim() || undefined, refundNow ? refundInputOf(draft) : undefined).finally(() =>
      setSubmitting(false),
    );
  };

  return (
    <Dialog open onOpenChange={(next) => !next && !submitting && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Xác nhận hàng đã hoàn về shop</DialogTitle>
          <DialogDescription>
            Hàng của lần giao thất bại đã về tới shop. Tồn kho được cộng lại, đơn chuyển sang Hoàn trả và không giao lại
            được nữa.
          </DialogDescription>
        </DialogHeader>
        {held > 0 && (
          <div className="grid gap-3">
            <p className="text-sm">
              Shop đang giữ <strong>{formatVND(held)}</strong> của khách. Hoàn ngay bây giờ?
            </p>
            <RadioGroup
              value={refundNow ? "now" : "later"}
              onValueChange={(value) => setRefundNow(value === "now")}
              className="grid gap-2"
            >
              <Label className="flex cursor-pointer items-center gap-2 font-normal">
                <RadioGroupItem value="later" />
                Chưa hoàn (tiền vẫn do shop giữ)
              </Label>
              <Label className="flex cursor-pointer items-center gap-2 font-normal">
                <RadioGroupItem value="now" />
                Hoàn tiền / quyết định số hoàn ngay
              </Label>
            </RadioGroup>
            {refundNow && (
              <RefundFields
                idPrefix="failed-refund"
                draft={draft}
                onChange={setDraft}
                max={held}
                disabled={submitting}
              />
            )}
          </div>
        )}
        <Textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} placeholder="Ghi chú" />
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Huỷ
          </Button>
          <Button onClick={submit} disabled={submitting || invalid}>
            {submitting ? "Đang xử lý..." : "Hàng đã về shop"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
