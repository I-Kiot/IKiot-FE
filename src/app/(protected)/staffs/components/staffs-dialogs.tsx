"use client";

import { StaffsAccountDialog } from "./staffs-account-dialog";
import { AssignBranchManagerDialog } from "./assign-branch-manager-dialog";
import { AssignWarehouseManagerDialog } from "./assign-warehouse-manager-dialog";
import { StaffsDeactivateDialog } from "./staffs-deactivate-dialog";
import { StaffsDeleteDialog } from "./staffs-delete-dialog";
import { StaffsLeaveBalanceDialog } from "./staffs-leave-balance-dialog";
import { StaffsMutateDialog } from "./staffs-mutate-dialog";
import { useStaffs } from "./staffs-provider";

export function StaffsDialogs() {
  const {
    open,
    setOpen,
    currentRow,
    setCurrentRow,
    assignManagerOpen,
    assignManagerBranchId,
    assignManagerBranchName,
    closeAssignBranchManager,
    assignWarehouseManagerOpen,
    assignManagerWarehouseId,
    assignManagerWarehouseName,
    closeAssignWarehouseManager,
    fetchStaffs,
  } = useStaffs();

  function closeDialog() {
    setOpen(null);
    setCurrentRow(null);
  }

  return (
    <>
      <StaffsMutateDialog
        key="staff-add"
        open={open === "add"}
        onOpenChange={(value) => {
          if (!value) setOpen(null);
        }}
      />
      {currentRow && (
        <StaffsMutateDialog
          key={`staff-edit-${currentRow.id}`}
          open={open === "edit"}
          onOpenChange={(value) => {
            if (!value) closeDialog();
          }}
          currentRow={currentRow}
        />
      )}
      <StaffsDeleteDialog
        open={open === "delete"}
        onOpenChange={(value) => {
          if (!value) closeDialog();
        }}
        currentRow={currentRow}
      />
      <StaffsDeactivateDialog
        open={open === "deactivate"}
        onOpenChange={(value) => {
          if (!value) closeDialog();
        }}
        currentRow={currentRow}
      />
      <StaffsAccountDialog
        open={open === "activate"}
        onOpenChange={(value) => {
          if (!value) closeDialog();
        }}
        currentRow={currentRow}
        mode="activate"
      />
      <StaffsAccountDialog
        open={open === "password"}
        onOpenChange={(value) => {
          if (!value) closeDialog();
        }}
        currentRow={currentRow}
        mode="password"
      />
      <StaffsLeaveBalanceDialog
        open={open === "leaveBalance"}
        onOpenChange={(value) => {
          if (!value) closeDialog();
        }}
        currentRow={currentRow}
      />
      <AssignBranchManagerDialog
        open={assignManagerOpen}
        onOpenChange={(value) => {
          if (!value) closeAssignBranchManager();
        }}
        initialBranchId={assignManagerBranchId}
        initialBranchName={assignManagerBranchName}
        onSuccess={() => void fetchStaffs()}
      />
      <AssignWarehouseManagerDialog
        open={assignWarehouseManagerOpen}
        onOpenChange={(value) => {
          if (!value) closeAssignWarehouseManager();
        }}
        initialWarehouseId={assignManagerWarehouseId}
        initialWarehouseName={assignManagerWarehouseName}
        onSuccess={() => void fetchStaffs()}
      />
    </>
  );
}
