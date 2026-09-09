"use client";

import { useAdjustments } from "./adjustments-provider";
import { AdjustmentsCreateDialog } from "./adjustments-create-dialog";

export function AdjustmentsDialogs() {
  const { open, setOpen } = useAdjustments();

  return (
    <AdjustmentsCreateDialog
      open={open === "create"}
      onOpenChange={(value) => setOpen(value ? "create" : null)}
    />
  );
}
