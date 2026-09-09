"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAdjustments } from "./adjustments-provider";

export function AdjustmentsButtonGroup() {
  const { setOpen } = useAdjustments();
  return (
    <Button className="cursor-pointer" onClick={() => setOpen("create")}>
      <Plus className="mr-2 size-4" />
      Tạo điều chỉnh
    </Button>
  );
}
