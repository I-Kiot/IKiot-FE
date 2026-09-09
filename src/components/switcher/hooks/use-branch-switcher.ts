import * as React from "react";
import { useSidebar } from "@/components/ui/sidebar";
import { toast } from "sonner";
import { branchApi } from "@/lib/api/branch";
import { parseLocationKey } from "@/lib/location-key";
import { warehouseApi } from "@/lib/api/warehouse";
import type { Branch } from "@/types/branch";
import type { Warehouse as DWBWarehouse } from "@/types/warehouse";
import { getCachedUser } from "@/lib/auth";
import { type BranchFormValues } from "../branch-form-dialog";
import { type WarehouseFormValues } from "../warehouse-form-dialog";
import { useAuthStore } from "@/store/auth-store";

export type SwitcherItem = {
  id: string;
  name: string;
  address: string;
  type: "branch" | "warehouse";
  status?: string;
};

export function useBranchSwitcher() {
  const { isMobile } = useSidebar();
  const [dbBranches, setDbBranches] = React.useState<Branch[]>([]);
  const [dbWarehouses, setDbWarehouses] = React.useState<DWBWarehouse[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [activeItem, setActiveItem] = React.useState<SwitcherItem | null>(null);
  const [role, setRole] = React.useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [isWarehouseDialogOpen, setIsWarehouseDialogOpen] =
    React.useState(false);

  const locationKey = useAuthStore((state) => state.locationKey);
  const setLocationKey = useAuthStore((state) => state.setLocationKey);

  // Edit branch states
  const [editingBranch, setEditingBranch] = React.useState<Branch | null>(null);
  const [isEditBranchDialogOpen, setIsEditBranchDialogOpen] =
    React.useState(false);

  // Edit warehouse states
  const [editingWarehouse, setEditingWarehouse] =
    React.useState<DWBWarehouse | null>(null);
  const [isEditWarehouseDialogOpen, setIsEditWarehouseDialogOpen] =
    React.useState(false);

  // Delete confirmation states
  const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<{
    id: string;
    name: string;
    type: "branch" | "warehouse";
  } | null>(null);
  const [assignManagerBranch, setAssignManagerBranch] =
    React.useState<Branch | null>(null);
  const [isAssignManagerDialogOpen, setIsAssignManagerDialogOpen] =
    React.useState(false);

  const mapBranchToItem = React.useCallback(
    (b: Branch): SwitcherItem => ({
      id: b.id,
      name: b.name,
      address: b.address || "",
      type: "branch",
      status: b.status,
    }),
    [],
  );

  const mapWarehouseToItem = React.useCallback(
    (w: DWBWarehouse): SwitcherItem => ({
      id: w.id,
      name: w.name,
      address: w.address || "",
      type: "warehouse",
      status: w.status,
    }),
    [],
  );

  const fetchBranches = React.useCallback(async () => {
    try {
      const user = getCachedUser() as any;
      const userRole = user?.role || "";
      setRole(userRole);

      if (userRole === "TENANT_OWNER") {
        const [branchesResponse, warehousesResponse] = await Promise.all([
          branchApi.getList({ limit: 100 }),
          warehouseApi.getList({ limit: 100 }),
        ]);

        const fetchedBranches = branchesResponse.data || [];
        const fetchedWarehouses = warehousesResponse.data || [];

        setDbBranches(fetchedBranches);
        setDbWarehouses(fetchedWarehouses);
      } else {
        // Non-TENANT_OWNER user: fetch their specific assigned branch or warehouse to show name/address
        if (user?.branchId) {
          try {
            const branch = await branchApi.getById(user.branchId);
            if (branch) {
              setDbBranches([branch]);
            }
          } catch (e) {
            console.error("Failed to load user branch details", e);
          }
        } else if (user?.warehouseId) {
          try {
            const warehouse = await warehouseApi.getById(user.warehouseId);
            if (warehouse) {
              setDbWarehouses([warehouse]);
            }
          } catch (e) {
            console.error("Failed to load user warehouse details", e);
          }
        }
      }
    } catch (error) {
      toast.error("Không thể tải thông tin chi nhánh và kho hàng");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  React.useEffect(() => {
    const handleBranchesUpdated = () => {
      fetchBranches();
    };
    window.addEventListener("branches-updated", handleBranchesUpdated);
    return () => {
      window.removeEventListener("branches-updated", handleBranchesUpdated);
    };
  }, [fetchBranches]);

  // Synchronize activeItem with the global locationKey
  React.useEffect(() => {
    if (!locationKey) {
      setActiveItem(null);
      return;
    }

    if (locationKey === "all") {
      setActiveItem({
        id: "all-branches",
        name: "Tổng",
        address: "all",
        type: "branch",
      });
      return;
    }

    const parsed = parseLocationKey(locationKey);
    const type = parsed?.locationType;
    const id = parsed?.locationId ?? "";
    if (type === "branch") {
      const match = dbBranches.find((b) => b.id === id);
      if (match) {
        setActiveItem(mapBranchToItem(match));
      } else {
        setActiveItem({
          id,
          name: "Chi nhánh",
          address: "",
          type: "branch",
        });
      }
    } else if (type === "warehouse") {
      const match = dbWarehouses.find((w) => w.id === id);
      if (match) {
        setActiveItem(mapWarehouseToItem(match));
      } else {
        setActiveItem({
          id,
          name: "Kho hàng",
          address: "",
          type: "warehouse",
        });
      }
    }
  }, [locationKey, dbBranches, dbWarehouses, mapBranchToItem, mapWarehouseToItem]);

  const handleSelect = (item: SwitcherItem) => {
    if (item.status === "INACTIVE") {
      toast.warning(`Chi nhánh/kho hàng "${item.name}" đã bị ngừng hoạt động!`);
      return;
    }
    const key = item.id === "all-branches" ? "all" : `${item.type}-${item.id}`;
    setLocationKey(key);
    // Backward compatibility:
    localStorage.setItem("activeSwitcherItemId", item.id);
    localStorage.setItem("activeSwitcherItemType", item.type);
    toast.success(`Đã chuyển sang: ${item.name}`);
  };

  const handleCreateBranch = async (values: BranchFormValues) => {
    try {
      const payload = {
        name: values.name,
        phoneNumber: values.phoneNumber ? [values.phoneNumber] : ["0000000000"],
        address: values.address,
        email: values.email || undefined,
      };
      const newBranch = await branchApi.create(payload);
      toast.success(`Đã tạo chi nhánh "${newBranch.name}" thành công!`);
      setIsDialogOpen(false);
      await fetchBranches();
      window.dispatchEvent(new Event("branches-updated"));
    } catch (error: any) {
      const msg = error?.response?.data?.message || "Lỗi khi tạo chi nhánh";
      toast.error(msg);
    }
  };

  const handleEditBranch = async (values: BranchFormValues) => {
    if (!editingBranch) return;
    try {
      const payload = {
        name: values.name,
        phoneNumber: values.phoneNumber ? [values.phoneNumber] : ["0000000000"],
        address: values.address,
        email: values.email || undefined,
        status: values.status as any,
      };
      const updated = await branchApi.update(editingBranch.id, payload);
      toast.success(`Đã cập nhật chi nhánh "${updated.name}" thành công!`);
      setIsEditBranchDialogOpen(false);
      setEditingBranch(null);
      await fetchBranches();
      window.dispatchEvent(new Event("branches-updated"));
    } catch (error: any) {
      const msg =
        error?.response?.data?.message || "Lỗi khi cập nhật chi nhánh";
      toast.error(msg);
    }
  };

  const handleCreateWarehouse = async (values: WarehouseFormValues) => {
    try {
      const payload = {
        name: values.name,
        address: values.address,
        phoneNumber: [values.phoneNumber],
        ...(values.email ? { email: values.email } : {}),
      };
      const newWarehouse = await warehouseApi.create(payload);
      toast.success(`Đã tạo kho hàng "${newWarehouse.name}" thành công!`);
      setIsWarehouseDialogOpen(false);
      await fetchBranches();
      window.dispatchEvent(new Event("branches-updated"));
    } catch (error: any) {
      const msg = error?.response?.data?.message || "Lỗi khi tạo kho hàng";
      toast.error(msg);
    }
  };

  const handleEditWarehouse = async (values: WarehouseFormValues) => {
    if (!editingWarehouse) return;
    try {
      const payload = {
        name: values.name,
        address: values.address,
        phoneNumber: [values.phoneNumber],
        ...(values.email ? { email: values.email } : {}),
        status: values.status as any,
      };
      const updated = await warehouseApi.update(editingWarehouse.id, payload);
      toast.success(`Đã cập nhật kho hàng "${updated.name}" thành công!`);
      setIsEditWarehouseDialogOpen(false);
      setEditingWarehouse(null);
      await fetchBranches();
      window.dispatchEvent(new Event("branches-updated"));
    } catch (error: any) {
      const msg = error?.response?.data?.message || "Lỗi khi cập nhật kho hàng";
      toast.error(msg);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    const { id, name, type } = deleteTarget;
    try {
      if (type === "branch") {
        await branchApi.remove(id);
        toast.success(`Đã xóa chi nhánh "${name}" thành công!`);
      } else {
        await warehouseApi.remove(id);
        toast.success(`Đã xóa kho hàng "${name}" thành công!`);
      }

      if (activeItem && activeItem.id === id) {
        handleSelect({
          id: "all-branches",
          name: "Tổng",
          address: "all",
          type: "branch",
        });
      }
      await fetchBranches();
      window.dispatchEvent(new Event("branches-updated"));
    } catch (error: any) {
      const msg =
        error?.response?.data?.message ||
        `Lỗi khi xóa ${type === "branch" ? "chi nhánh" : "kho hàng"}`;
      toast.error(msg);
    } finally {
      setDeleteConfirmOpen(false);
      setDeleteTarget(null);
    }
  };

  const openAssignManagerDialog = (branch: Branch) => {
    setAssignManagerBranch(branch);
    setIsAssignManagerDialogOpen(true);
  };

  const closeAssignManagerDialog = () => {
    setIsAssignManagerDialogOpen(false);
    setAssignManagerBranch(null);
  };

  const handleAssignManagerSuccess = async () => {
    closeAssignManagerDialog();
    await fetchBranches();
  };

  return {
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
  };
}
