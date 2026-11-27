"use client";

import { Plus, UserCog, Warehouse } from "lucide-react";
import { PermissionButton } from "@/components/permission-button";
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

  return (
    <div className="flex flex-wrap items-center gap-2">
      <PermissionButton
          allowed={canAssignBranch}
          permission="branches:assign_manager"
          size="sm"
          variant="outline"
          className="cursor-pointer"
          onClick={() => openAssignBranchManager()}
        >
          <UserCog className="mr-2 size-4" />
          Đổi quản lý chi nhánh
        </PermissionButton>
        <PermissionButton
          allowed={canAssignWarehouse}
          permission="warehouses:assign_manager"
          size="sm"
          variant="outline"
          className="cursor-pointer"
          onClick={() => openAssignWarehouseManager()}
        >
          <Warehouse className="mr-2 size-4" />
          Đổi quản lý kho
        </PermissionButton>
        <PermissionButton
          allowed={canCreate}
          permission="users:create"
          size="sm"
          className="cursor-pointer"
          onClick={() => setOpen("add")}
        >
          <Plus className="mr-2 size-4" />
          Thêm nhân viên
        </PermissionButton>
    </div>
  );
}
