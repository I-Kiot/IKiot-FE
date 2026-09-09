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
 * Xóa nhân viên.
 *
 * This dialog used to ask for a replacement manager first, because the old backend took a
 * `replacementManagerId` and swapped the outgoing manager out in the same call. That flow
 * is gone: running a location is `Branch.managerId` / `Warehouse.managerId`, appointed
 * through its own endpoint, and `DELETE /users/:id` now takes **no body** - anything sent
 * would be dropped silently.
 *
 * So the check moved to where it is actually enforced. The backend refuses while the
 * account still runs a location or is named as the handover contact on a leave request in
 * force, and says which; that message is what the toast shows.
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
      // The provider toasts the backend's reason - including "reassign the branch this
      // person runs first", which is the case this dialog used to try to handle itself.
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
