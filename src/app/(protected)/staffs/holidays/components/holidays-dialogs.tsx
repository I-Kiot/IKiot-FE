"use client";

import { HolidaysMutateDialog } from "./holidays-mutate-dialog";
import { useHolidays } from "./holidays-provider";

export function HolidaysDialogs() {
  const { open, setOpen, currentRow, setCurrentRow } = useHolidays();

  function closeDialog() {
    setOpen(null);
    setCurrentRow(null);
  }

  return (
    <>
      <HolidaysMutateDialog
        key="holiday-add"
        open={open === "add"}
        onOpenChange={(value) => {
          if (!value) closeDialog();
        }}
      />
      {currentRow && (
        <HolidaysMutateDialog
          key={`holiday-edit-${currentRow.id}`}
          open={open === "edit"}
          onOpenChange={(value) => {
            if (!value) closeDialog();
          }}
          currentRow={currentRow}
        />
      )}
    </>
  );
}
