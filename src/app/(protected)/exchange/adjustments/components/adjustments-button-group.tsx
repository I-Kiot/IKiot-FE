"use client";

import { Plus } from "lucide-react";
import { PermissionButton } from "@/components/permission-button";
import { allows } from "@/components/sidebar/constants/role-permissions";
import { getSessionRole } from "@/lib/auth";
import { useAdjustments } from "./adjustments-provider";

export function AdjustmentsButtonGroup() {
  const { setOpen } = useAdjustments();
  return (
    <PermissionButton
      allowed={allows(getSessionRole(), "stock_movement", "create")}
      permission="stock_movement:create"
      className="cursor-pointer"
      onClick={() => setOpen("create")}
    >
      <Plus className="mr-2 size-4" />
      Tạo điều chỉnh
    </PermissionButton>
  );
}
