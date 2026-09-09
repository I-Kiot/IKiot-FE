"use client";

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
import type { WorkingSchedule } from "@/types/working-schedule";
import { isScheduleLocked } from "@/app/(protected)/staffs/shared/schedule-utils";
import { useSchedule } from "./schedule-provider";

export function ScheduleDeleteDialog({
  open,
  onOpenChange,
  currentRow,
}: {
  open: boolean;
  onOpenChange: (value: boolean) => void;
  currentRow: WorkingSchedule | null;
}) {
  const { handleDelete } = useSchedule();
  const isLocked = currentRow ? isScheduleLocked(currentRow.status) : false;
  const multiAssignee = (currentRow?.assignees.length ?? 0) > 1;

  async function onConfirm() {
    if (!currentRow || isLocked) return;
    try {
      await handleDelete(currentRow.id);
      onOpenChange(false);
    } catch {
      // Toast handled in provider
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Xóa lịch làm</DialogTitle>
          <DialogDescription>
            {isLocked ? (
              "Lịch đã hoàn thành - không thể xóa theo quy tắc hệ thống."
            ) : (
              <>
                Bạn có chắc muốn xóa ca làm{" "}
                <strong className="text-foreground">
                  {currentRow?.shiftName !== "-"
                    ? currentRow?.shiftName
                    : currentRow?.staffName ?? ""}
                </strong>
                {multiAssignee ? (
                  <>
                    ? Toàn bộ ca sẽ bị xóa cho{" "}
                    <strong className="text-foreground">
                      {currentRow?.assignees.length} nhân viên
                    </strong>{" "}
                    được phân cùng lịch này.
                  </>
                ) : (
                  "? Hành động này không thể hoàn tác."
                )}
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            className="cursor-pointer"
            onClick={() => onOpenChange(false)}
          >
            {isLocked ? "Đóng" : "Hủy"}
          </Button>
          {!isLocked && (
          <Button
            variant="destructive"
            className="cursor-pointer"
            onClick={onConfirm}
          >
            <Trash2 className="mr-2 size-4" />
            Xóa
          </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
