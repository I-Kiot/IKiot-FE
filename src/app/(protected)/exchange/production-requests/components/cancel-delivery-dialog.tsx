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
import { Textarea } from "@/components/ui/textarea";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** "Rút lại phiếu giao" (xưởng) hay "Từ chối phiếu giao" (nơi nhận). */
  title: string;
  description: string;
  confirmLabel: string;
  /** Ném lỗi thì dialog giữ nguyên để sửa lý do. */
  onConfirm: (reason: string) => Promise<void>;
};

/** Huỷ một phiếu giao xưởng: bắt buộc lý do - là bản ghi duy nhất vì sao hàng không vào kho. */
export function CancelDeliveryDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  onConfirm,
}: Props) {
  const [reason, setReason] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  async function submit() {
    if (!reason.trim()) return;
    setSaving(true);
    try {
      await onConfirm(reason.trim());
      setReason("");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          <Label>Lý do</Label>
          <Textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Đóng
          </Button>
          <Button variant="destructive" onClick={submit} disabled={!reason.trim() || saving}>
            {saving ? "Đang huỷ..." : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
