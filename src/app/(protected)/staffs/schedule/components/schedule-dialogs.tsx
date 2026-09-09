"use client";

import { ScheduleDeleteDialog } from "./schedule-delete-dialog";
import { ScheduleMutateDialog } from "./schedule-mutate-dialog";
import { ShiftTemplateDialog } from "./shift-template-dialog";
import { useSchedule } from "./schedule-provider";

export function ScheduleDialogs() {
  const { open, setOpen, currentRow, setCurrentRow } = useSchedule();

  return (
    <>
      <ScheduleMutateDialog
        open={open === "add"}
        onOpenChange={(value) => {
          if (!value) setOpen(null);
        }}
        mode="add"
      />
      <ScheduleMutateDialog
        open={open === "edit"}
        onOpenChange={(value) => {
          if (!value) {
            setOpen(null);
            setCurrentRow(null);
          }
        }}
        mode="edit"
        currentRow={currentRow}
      />
      <ScheduleDeleteDialog
        open={open === "delete"}
        onOpenChange={(value) => {
          if (!value) {
            setOpen(null);
            setCurrentRow(null);
          }
        }}
        currentRow={currentRow}
      />
      <ShiftTemplateDialog
        open={open === "shiftTemplate"}
        onOpenChange={(value) => {
          if (!value) setOpen(null);
        }}
      />
    </>
  );
}
