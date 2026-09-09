"use client";

import { useImports } from "./imports-provider";
import { ImportsCreateDialog } from "./imports-create-dialog";

export function ImportsDialogs() {
  const { open, setOpen } = useImports();

  return (
    <ImportsCreateDialog
      open={open === "create"}
      onOpenChange={(value) => setOpen(value ? "create" : null)}
    />
  );
}
