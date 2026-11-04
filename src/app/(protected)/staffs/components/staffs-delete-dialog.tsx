"use client";

import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
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

type StaffsDeleteDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentRow: Staff | null;
};

/**
 * Xóa nhân viên. Route `DELETE /users/:id` không nhận body. Backend từ chối khi tài khoản còn điều hành chi nhánh/kho và nêu lý do; toast hiển thị lý do đó.
 */
export function StaffsDeleteDialog({
  open,
  onOpenChange,
  currentRow,
}: StaffsDeleteDialogProps) {
  const { handleDelete } = useStaffs();
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
      await handleDelete(currentRow.id);
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
          <DialogTitle>Xóa nhân viên</DialogTitle>
          <DialogDescription>
            Bạn có chắc muốn xóa nhân viên{" "}
            <strong className="text-foreground">
              {currentRow?.fullName ?? ""}
            </strong>{" "}
            ({currentRow?.roleName ?? "-"})? Hồ sơ được giữ lại nhưng thông tin
            cá nhân sẽ bị xóa và không khôi phục được.
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
            <Trash2 className="mr-2 size-4" />
            {isSubmitting ? "Đang xử lý..." : "Xóa nhân viên"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
