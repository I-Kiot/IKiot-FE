"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
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
import { formatVND } from "@/lib/stats-format";
import {
  SEPAY_RESOLUTION_LABELS,
  type SepayResolution,
  type SepayTransaction,
} from "@/types/sepay-transaction";

const HINTS: Record<SepayResolution, string> = {
  REFUNDED_MANUALLY:
    "Bạn đã tự chuyển trả tiền cho khách ngoài hệ thống: sổ thu chi ghi thêm một khoản chi tương ứng. Chỉ dùng được với tiền chưa gắn đơn; phần khách trả dư của đơn đã chốt thì hoàn tại đơn đó.",
  MATCHED_MANUALLY: "Bạn đã đối chiếu khoản này với đơn hoặc khoản thu tương ứng. Không ghi thêm gì vào sổ.",
  IGNORED: "Không cần xử lý, ví dụ khách chuyển nhầm và đã báo ngân hàng.",
};

/** Chọn cách xử lý một giao dịch SePay chưa chốt, kèm ghi chú. */
export function ResolveDialog({
  transaction,
  onClose,
  onResolve,
}: {
  transaction: SepayTransaction;
  onClose: () => void;
  onResolve: (resolution: SepayResolution, note: string) => Promise<boolean>;
}) {
  const [resolution, setResolution] = useState<SepayResolution>("MATCHED_MANUALLY");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setSaving(true);
    const ok = await onResolve(resolution, note);
    setSaving(false);
    if (ok) onClose();
  };

  return (
    <Dialog open onOpenChange={(open) => !open && !saving && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Xử lý giao dịch {formatVND(transaction.amount)}</DialogTitle>
          <DialogDescription>
            Đánh dấu một lần, không sửa lại được. Số tiền và kết cục của giao dịch không bao giờ bị đổi.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <RadioGroup value={resolution} onValueChange={(value) => setResolution(value as SepayResolution)}>
            {(Object.keys(SEPAY_RESOLUTION_LABELS) as SepayResolution[]).map((key) => (
              <Label key={key} className="flex cursor-pointer items-center gap-2 font-normal">
                <RadioGroupItem value={key} />
                {SEPAY_RESOLUTION_LABELS[key]}
              </Label>
            ))}
          </RadioGroup>
          <p className="text-xs text-muted-foreground">{HINTS[resolution]}</p>
          <div className="grid gap-2">
            <Label htmlFor="sepay-resolve-note">Ghi chú (không bắt buộc)</Label>
            <Textarea
              id="sepay-resolve-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="vd. Đã chuyển lại 500.000đ cho khách lúc 14:30"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" className="cursor-pointer" onClick={onClose} disabled={saving}>
            Huỷ
          </Button>
          <Button className="cursor-pointer" onClick={() => void submit()} disabled={saving}>
            {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
            Xác nhận
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
