"use client";

import * as React from "react";
import {
  ChevronsUpDown,
  Plus,
  Store,
  Warehouse,
  Edit2,
  Trash2,
  UserCog,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BranchFormDialog } from "./branch-form-dialog";
import { WarehouseFormDialog } from "./warehouse-form-dialog";
import { AssignBranchManagerDialog } from "@/components/branch/assign-branch-manager-dialog";
import { useBranchSwitcher } from "./hooks/use-branch-switcher";

export function BranchSwitcher() {
  const {
    isMobile,
    dbBranches,
    dbWarehouses,
    loading,
    activeItem,
    role,
    isDialogOpen,
    setIsDialogOpen,
    isWarehouseDialogOpen,
    setIsWarehouseDialogOpen,
    editingBranch,
    setEditingBranch,
    isEditBranchDialogOpen,
    setIsEditBranchDialogOpen,
    editingWarehouse,
    setEditingWarehouse,
    isEditWarehouseDialogOpen,
    setIsEditWarehouseDialogOpen,
    deleteConfirmOpen,
    setDeleteConfirmOpen,
    deleteTarget,
    setDeleteTarget,
    assignManagerBranch,
    isAssignManagerDialogOpen,
    closeAssignManagerDialog,
    mapBranchToItem,
    mapWarehouseToItem,
    handleSelect,
    handleCreateBranch,
    handleEditBranch,
    handleCreateWarehouse,
    handleEditWarehouse,
    handleConfirmDelete,
    openAssignManagerDialog,
    handleAssignManagerSuccess,
  } = useBranchSwitcher();

  if (loading || !activeItem) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" disabled>
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground animate-pulse" />
            <div className="space-y-1 flex-1 text-start">
              <div className="h-3 w-20 bg-muted animate-pulse rounded" />
              <div className="h-2 w-28 bg-muted animate-pulse rounded" />
            </div>
            <ChevronsUpDown className="ms-auto opacity-50" />
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  // Non-TENANT_OWNER user: Show static branch/warehouse info without dropdown trigger
  if (role !== "TENANT_OWNER") {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            size="lg"
            className="cursor-default hover:bg-transparent active:bg-transparent group"
          >
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
              {activeItem.type === "branch" ? (
                <Store className={activeItem.status === "INACTIVE" ? "size-4 text-destructive" : "size-4"} />
              ) : (
                <Warehouse className={activeItem.status === "INACTIVE" ? "size-4 text-destructive" : "size-4"} />
              )}
            </div>
            <div className="grid flex-1 text-start text-sm leading-tight">
              {activeItem.status === "INACTIVE" ? (
                <>
                  <span className="group-hover:hidden truncate font-semibold">
                    {activeItem.name}
                  </span>
                  <span className="hidden group-hover:inline truncate text-destructive font-semibold">
                    Ngừng hoạt động
                  </span>
                </>
              ) : (
                <span className="truncate font-semibold">{activeItem.name}</span>
              )}
              <span className="truncate text-xs">{activeItem.address}</span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  // TENANT_OWNER user: Show full interactive dropdown switcher
  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground group"
              >
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  {activeItem.type === "branch" ? (
                    <Store className={activeItem.status === "INACTIVE" ? "size-4 text-destructive" : "size-4"} />
                  ) : (
                    <Warehouse className={activeItem.status === "INACTIVE" ? "size-4 text-destructive" : "size-4"} />
                  )}
                </div>
                <div className="grid flex-1 text-start text-sm leading-tight">
                  {activeItem.status === "INACTIVE" ? (
                    <>
                      <span className="group-hover:hidden truncate font-semibold">
                        {activeItem.name}
                      </span>
                      <span className="hidden group-hover:inline truncate text-destructive font-semibold">
                        Ngừng hoạt động
                      </span>
                    </>
                  ) : (
                    <span className="truncate font-semibold">
                      {activeItem.name}
                    </span>
                  )}
                  <span className="truncate text-xs">{activeItem.address}</span>
                </div>
                <ChevronsUpDown className="ms-auto" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
              align="start"
              side={isMobile ? "bottom" : "right"}
              sideOffset={4}
            >
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                Chi nhánh
              </DropdownMenuLabel>
              <DropdownMenuItem
                key="all-branches"
                onClick={() =>
                  handleSelect({
                    id: "all-branches",
                    name: "Tổng",
                    address: "all",
                    type: "branch",
                  })
                }
                className="gap-2 p-2 cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <div className="flex size-6 items-center justify-center rounded-sm border">
                    <Store className="size-4 shrink-0" />
                  </div>
                  Tổng
                </div>
              </DropdownMenuItem>
              {dbBranches.map((item) => (
                <DropdownMenuItem
                  key={item.id}
                  onClick={() => handleSelect(mapBranchToItem(item))}
                  className="group gap-2 p-2 cursor-pointer flex items-center justify-between"
                >
                  <div className="flex items-center gap-2 max-w-[80%] min-w-0 flex-1">
                    <div className="flex size-6 items-center justify-center rounded-sm border shrink-0">
                      <Store className={item.status === "INACTIVE" ? "size-4 shrink-0 text-destructive" : "size-4 shrink-0"} />
                    </div>
                    {item.status === "INACTIVE" ? (
                      <>
                        <span className="group-hover:hidden truncate">
                          {item.name}
                        </span>
                        <span className="hidden group-hover:inline truncate text-destructive font-medium">
                          Ngừng hoạt động
                        </span>
                      </>
                    ) : (
                      <span className="truncate">{item.name}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    {item.status === "ACTIVE" && (
                      <button
                        title="Đổi quản lý chi nhánh"
                        className="hover:bg-sidebar-accent p-1 rounded cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          openAssignManagerDialog(item);
                        }}
                      >
                        <UserCog className="size-3" />
                      </button>
                    )}
                    <button
                      title="Sửa chi nhánh"
                      className="hover:bg-sidebar-accent p-1 rounded cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        setEditingBranch(item);
                        setIsEditBranchDialogOpen(true);
                      }}
                    >
                      <Edit2 className="size-3" />
                    </button>
                    <button
                      title="Xóa chi nhánh"
                      className="hover:bg-destructive hover:text-destructive-foreground p-1 rounded cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        setDeleteTarget({
                          id: item.id,
                          name: item.name,
                          type: "branch",
                        });
                        setDeleteConfirmOpen(true);
                      }}
                    >
                      <Trash2 className="size-3" />
                    </button>
                  </div>
                </DropdownMenuItem>
              ))}
              <DropdownMenuItem
                className="gap-2 p-2 cursor-pointer"
                onSelect={(e) => {
                  e.preventDefault();
                  setIsDialogOpen(true);
                }}
              >
                <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                  <Plus className="size-4" />
                </div>
                <div className="font-medium text-muted-foreground">
                  Thêm chi nhánh
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                Kho hàng
              </DropdownMenuLabel>
              {dbWarehouses.map((item) => (
                <DropdownMenuItem
                  key={item.id}
                  onClick={() => handleSelect(mapWarehouseToItem(item))}
                  className="group gap-2 p-2 cursor-pointer flex items-center justify-between"
                >
                  <div className="flex items-center gap-2 max-w-[80%] min-w-0 flex-1">
                    <div className="flex size-6 items-center justify-center rounded-sm border shrink-0">
                      <Warehouse className={item.status === "INACTIVE" ? "size-4 shrink-0 text-destructive" : "size-4 shrink-0"} />
                    </div>
                    {item.status === "INACTIVE" ? (
                      <>
                        <span className="group-hover:hidden truncate">
                          {item.name}
                        </span>
                        <span className="hidden group-hover:inline truncate text-destructive font-medium">
                          Ngừng hoạt động
                        </span>
                      </>
                    ) : (
                      <span className="truncate">{item.name}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button
                      title="Sửa kho hàng"
                      className="hover:bg-sidebar-accent p-1 rounded cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        setEditingWarehouse(item);
                        setIsEditWarehouseDialogOpen(true);
                      }}
                    >
                      <Edit2 className="size-3" />
                    </button>
                    <button
                      title="Xóa kho hàng"
                      className="hover:bg-destructive hover:text-destructive-foreground p-1 rounded cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        setDeleteTarget({
                          id: item.id,
                          name: item.name,
                          type: "warehouse",
                        });
                        setDeleteConfirmOpen(true);
                      }}
                    >
                      <Trash2 className="size-3" />
                    </button>
                  </div>
                </DropdownMenuItem>
              ))}
              <DropdownMenuItem
                className="gap-2 p-2 cursor-pointer"
                onSelect={(e) => {
                  e.preventDefault();
                  setIsWarehouseDialogOpen(true);
                }}
              >
                <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                  <Plus className="size-4" />
                </div>
                <div className="font-medium text-muted-foreground">
                  Thêm kho hàng
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      {/* Dialog for creating a new branch */}
      <BranchFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSubmit={handleCreateBranch}
      />

      {/* Dialog for editing a branch */}
      <BranchFormDialog
        open={isEditBranchDialogOpen}
        onOpenChange={setIsEditBranchDialogOpen}
        onSubmit={handleEditBranch}
        title="Cập nhật chi nhánh"
        defaultValues={
          editingBranch
            ? {
                name: editingBranch.name,
                status: editingBranch.status,
                address: editingBranch.address || "",
                phoneNumber: editingBranch.phoneNumber[0] || "",
                email: editingBranch.email || "",
              }
            : undefined
        }
      />

      <AssignBranchManagerDialog
        open={isAssignManagerDialogOpen}
        onOpenChange={(open) => {
          if (!open) closeAssignManagerDialog();
        }}
        initialBranchId={assignManagerBranch?.id}
        initialBranchName={assignManagerBranch?.name}
        onSuccess={handleAssignManagerSuccess}
      />

      {/* Dialog for creating a new warehouse */}
      <WarehouseFormDialog
        open={isWarehouseDialogOpen}
        onOpenChange={setIsWarehouseDialogOpen}
        onSubmit={handleCreateWarehouse}
      />

      {/* Dialog for editing a warehouse */}
      <WarehouseFormDialog
        open={isEditWarehouseDialogOpen}
        onOpenChange={setIsEditWarehouseDialogOpen}
        onSubmit={handleEditWarehouse}
        title="Cập nhật kho hàng"
        defaultValues={
          editingWarehouse
            ? {
                name: editingWarehouse.name,
                status: editingWarehouse.status,
                address: editingWarehouse.address || "",
              }
            : undefined
        }
      />

      {/* Confirmation Dialog for deletion */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Xác nhận xóa</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa{" "}
              {deleteTarget?.type === "branch" ? "chi nhánh" : "kho hàng"}{" "}
              <strong>"{deleteTarget?.name}"</strong> không? Hành động này không
              thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex sm:justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setDeleteConfirmOpen(false);
                setDeleteTarget(null);
              }}
            >
              Hủy
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirmDelete}
            >
              Xác nhận xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
