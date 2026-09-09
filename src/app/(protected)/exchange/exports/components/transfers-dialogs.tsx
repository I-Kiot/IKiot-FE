"use client";

import { useTransfers } from "./transfers-provider";
import { TransfersCreateDialog } from "./transfers-create-dialog";

export function TransfersDialogs() {
  const { open, setOpen } = useTransfers();

  return (
    <TransfersCreateDialog
      open={open === "create"}
      onOpenChange={(value) => setOpen(value ? "create" : null)}
    />
  );
}
