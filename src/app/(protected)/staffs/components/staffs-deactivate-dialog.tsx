"use client";

import { useEffect, useState } from "react";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Staff } from "@/types/staff";
import { useStaffs } from "./staffs-provider";

type StaffsDeactivateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentRow: Staff | null;
};

/**
 * Khóa tài khoản. Route `PATCH /users/:id/account/deactivate` không nhận body. Backend từ chối khi tài khoản còn điều hành chi nhánh/kho và nêu lý do; toast hiển thị lý do đó.
 */
export function StaffsDeactivateDialog({
  open,
  onOpenChange,
  currentRow,
}: StaffsDeactivateDialogProps) {
  const { handleDeactivate } = useStaffs();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) setIsSubmitting(false);
  }, [open, currentRow?.id]);

  function handleOpenChange(value: boolean) {
    if (!isSubmitting) onOpenChange(value);
  }

  async function onConfirm() {
    if (!currentRow || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await handleDeactivate(currentRow.id);
      onOpenChange(false);
    } catch {
      // Provider đã toast lý do từ backend (ví dụ: phải bàn giao chi nhánh trước).
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Khóa tài khoản</DialogTitle>
          <DialogDescription>
            Bạn có chắc muốn khóa tài khoản của{" "}
            <strong className="text-foreground">
              {currentRow?.fullName ?? ""}
            </strong>{" "}
            ({currentRow?.roleName ?? "-"})? Nhân viên sẽ không đăng nhập được
            cho đến khi được kích hoạt lại.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            className="cursor-pointer"
            disabled={isSubmitting}
            onClick={() => handleOpenChange(false)}
          >
            Hủy
          </Button>
          <Button
            variant="destructive"
            className="cursor-pointer"
            disabled={isSubmitting}
            onClick={onConfirm}
          >
            <Lock className="mr-2 size-4" />
            {isSubmitting ? "Đang xử lý..." : "Khóa tài khoản"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
