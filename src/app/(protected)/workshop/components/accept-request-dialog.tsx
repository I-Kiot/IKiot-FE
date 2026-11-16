"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requestCode: string;
  /** Ném lỗi thì dialog giữ nguyên; thành công thì nơi gọi tự đóng. */
  onConfirm: () => Promise<void>;
};

/** Hỏi lại trước khi xưởng xác nhận đang làm một YCSX: từ lúc này shop không huỷ được yêu cầu nữa. */
export function AcceptRequestDialog({ open, onOpenChange, requestCode, onConfirm }: Props) {
  const [saving, setSaving] = useState(false);

  async function submit() {
    setSaving(true);
    try {
      await onConfirm();
    } catch {
      // Nơi gọi đã báo lỗi; giữ dialog để người dùng đọc lại trạng thái.
    } finally {
      setSaving(false);
    }
  }

  // Đang gửi thì không cho đóng, để người dùng không bấm lại khi chưa biết kết quả.
  function requestClose(next: boolean) {
    if (!next && saving) return;
    onOpenChange(next);
  }

  return (
    <Dialog open={open} onOpenChange={requestClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Xác nhận đang làm {requestCode}</DialogTitle>
          <DialogDescription>
            Xác nhận khi xưởng đã bắt tay vào làm. Từ lúc này shop không huỷ được yêu cầu; nếu cần
            dừng, xưởng bấm &quot;Huỷ yêu cầu&quot; và ghi lý do.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => requestClose(false)} disabled={saving}>
            Để sau
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? "Đang xác nhận..." : "Xác nhận đang làm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
