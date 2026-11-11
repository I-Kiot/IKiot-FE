"use client";

import { MoneyInput } from "@/app/(protected)/exchange/shared/form-fields";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { formatVND } from "@/lib/stats-format";
import type { RefundInput, RefundMethod } from "@/types/order-flow";

/** Nhập liệu hoàn tiền cho khách: số tiền, hình thức, ghi chú. Dùng ở kiểm hàng hoàn, hàng giao thất bại về shop, hoàn tiền trả dư. */
export interface RefundDraft {
  amount: number;
  method: RefundMethod;
  note: string;
}

export function emptyRefundDraft(amount = 0): RefundDraft {
  return { amount, method: "BANK_TRANSFER", note: "" };
}

/** Lỗi nhập (null = hợp lệ). `max` là số tối đa hoàn được. */
export function refundDraftError(draft: RefundDraft, max: number): string | null {
  if (!Number.isFinite(draft.amount) || draft.amount < 0) return "Số tiền hoàn không hợp lệ";
  if (draft.amount > max) return `Không được hoàn quá ${formatVND(max)}`;
  return null;
}

/** Phần `refund` gửi lên BE: amount 0 thì không cần hình thức. */
export function refundInputOf(draft: RefundDraft): RefundInput {
  const note = draft.note.trim();
  return {
    amount: Math.round(draft.amount),
    ...(draft.amount > 0 ? { method: draft.method } : {}),
    ...(note ? { note } : {}),
  };
}

interface RefundFieldsProps {
  draft: RefundDraft;
  onChange: (next: RefundDraft) => void;
  /** Số tối đa hoàn được (shop đang giữ). */
  max: number;
  /** Số hệ thống gợi ý (nếu có): hiện nút điền nhanh. */
  suggested?: number;
  /** Tiền đang giữ hiển thị trong chú thích; mặc định bằng `max`. */
  held?: number;
  /** Cho phép nhập 0 (shop giữ lại tiền). Hoàn tiền trả dư thì không. */
  allowKeep?: boolean;
  idPrefix: string;
  disabled?: boolean;
}

export function RefundFields({
  draft,
  onChange,
  max,
  suggested,
  held,
  allowKeep = true,
  idPrefix,
  disabled,
}: RefundFieldsProps) {
  const error = refundDraftError(draft, max);
  const set = (patch: Partial<RefundDraft>) => onChange({ ...draft, ...patch });
  return (
    <div className="grid gap-3 rounded-md border p-3">
      <div className="grid gap-2">
        <Label htmlFor={`${idPrefix}-amount`}>Số tiền hoàn cho khách</Label>
        <MoneyInput
          id={`${idPrefix}-amount`}
          value={draft.amount}
          onChange={(amount) => set({ amount })}
          disabled={disabled}
        />
        <div className="flex flex-wrap gap-2">
          {typeof suggested === "number" && suggested > 0 && suggested <= max && (
            <Button
              type="button"
              size="sm"
              variant={draft.amount === suggested ? "default" : "outline"}
              disabled={disabled}
              onClick={() => set({ amount: suggested })}
            >
              Theo gợi ý {formatVND(suggested)}
            </Button>
          )}
          {max > 0 && (
            <Button
              type="button"
              size="sm"
              variant={draft.amount === max && draft.amount !== suggested ? "default" : "outline"}
              disabled={disabled}
              onClick={() => set({ amount: max })}
            >
              Hoàn tối đa {formatVND(max)}
            </Button>
          )}
          {allowKeep && (
            <Button
              type="button"
              size="sm"
              variant={draft.amount === 0 ? "default" : "outline"}
              disabled={disabled}
              onClick={() => set({ amount: 0 })}
            >
              Giữ lại tiền (hoàn 0đ)
            </Button>
          )}
        </div>
        <p className={error ? "text-sm text-destructive" : "text-sm text-muted-foreground"}>
          {error ??
            `Shop đang giữ ${formatVND(held ?? max)}, hoàn tối đa ${formatVND(max)}.${
              allowKeep ? ` Shop giữ lại ${formatVND(Math.max(0, (held ?? max) - draft.amount))}; 0 = không hoàn.` : ""
            }`}
        </p>
      </div>
      {draft.amount > 0 && (
        <div className="grid gap-2">
          <Label>Hoàn bằng</Label>
          <RadioGroup
            value={draft.method}
            onValueChange={(value) => set({ method: value as RefundMethod })}
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
      <div className="grid gap-2">
        <Label htmlFor={`${idPrefix}-note`}>Ghi chú hoàn tiền (không bắt buộc)</Label>
        <Textarea
          id={`${idPrefix}-note`}
          rows={2}
          maxLength={500}
          value={draft.note}
          disabled={disabled}
          onChange={(e) => set({ note: e.target.value })}
        />
      </div>
    </div>
  );
}
