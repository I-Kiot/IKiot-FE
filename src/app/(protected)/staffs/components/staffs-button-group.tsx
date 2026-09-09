"use client";

import { Plus, UserCog, Warehouse } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSessionRole } from "@/lib/auth";
import {
  canAssignBranchManager,
  canAssignWarehouseManager,
  canCreateStaff,
} from "@/components/sidebar/constants/role-permissions";
import { useStaffs } from "./staffs-provider";

export function StaffsButtonGroup() {
  const {
    setOpen,
    openAssignBranchManager,
    openAssignWarehouseManager,
  } = useStaffs();
  const userRole = getSessionRole();
  const canCreate = canCreateStaff(userRole);
  const canAssignBranch = canAssignBranchManager(userRole);
  const canAssignWarehouse = canAssignWarehouseManager(userRole);

  if (!canCreate && !canAssignBranch && !canAssignWarehouse) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {canAssignBranch && (
        <Button
          size="sm"
          variant="outline"
          className="cursor-pointer"
          onClick={() => openAssignBranchManager()}
        >
          <UserCog className="mr-2 size-4" />
          Đổi quản lý chi nhánh
        </Button>
      )}
      {canAssignWarehouse && (
        <Button
          size="sm"
          variant="outline"
          className="cursor-pointer"
          onClick={() => openAssignWarehouseManager()}
        >
          <Warehouse className="mr-2 size-4" />
          Đổi quản lý kho
        </Button>
      )}
      {canCreate && (
        <Button
          size="sm"
          className="cursor-pointer"
          onClick={() => setOpen("add")}
        >
          <Plus className="mr-2 size-4" />
          Thêm nhân viên
        </Button>
      )}
    </div>
  );
}
