"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { staffApi } from "@/lib/api/staff";
import { parseLocationKey } from "@/lib/location-key";
import { branchApi } from "@/lib/api/branch";
import { warehouseApi } from "@/lib/api/warehouse";
import { paySheetApi } from "@/lib/api/paysheet";
import { getSessionRole } from "@/lib/auth";
import { useAuthStore } from "@/store/auth-store";
import {
  getApiErrorMessage,
} from "@/lib/api/staff-mapper";
import { canViewStaff } from "@/components/sidebar/constants/role-permissions";
import type {
  CreateStaffAccountPayload,
  CreateStaffPayload,
  Staff,
  StaffListQuery,
  StaffRoleOption,
  StaffStatus,
  UpdateStaffPayload,
} from "@/types/staff";

type StaffsDialogType =
  | "add"
  | "edit"
  | "delete"
  | "deactivate"
  | "activate"
  | "password"
  | "leaveBalance";

const DEFAULT_LIST_QUERY: StaffListQuery = {
  page: 1,
  limit: 10,
  search: "",
  roleId: "all",
  status: "all",
  branchId: "all",
  warehouseId: "all",
};

type StaffsContextType = {
  staffs: Staff[];
  isInitialLoading: boolean;
  isFetching: boolean;
  total: number;
  totalPages: number;
  listQuery: StaffListQuery;
  keywordInput: string;
  setKeywordInput: (value: string) => void;
  setListQuery: React.Dispatch<React.SetStateAction<StaffListQuery>>;
  roleOptions: StaffRoleOption[];
  branchOptions: { value: string; label: string }[];
  warehouseOptions: { value: string; label: string }[];
  warehouseOptionsFailed: boolean;
  /** The global branch/warehouse switcher's current key ("all" | "branch-<id>" | "warehouse-<id>") - takes precedence over the manual filters below. */
  locationKey: string;
  open: StaffsDialogType | null;
  setOpen: (value: StaffsDialogType | null) => void;
  currentRow: Staff | null;
  setCurrentRow: React.Dispatch<React.SetStateAction<Staff | null>>;
  fetchStaffs: () => Promise<void>;
  handleAdd: (payload: CreateStaffPayload) => Promise<void>;
  handleEdit: (id: string, payload: UpdateStaffPayload) => Promise<void>;
  handleDelete: (
    id: string,
    replacementManagerId?: string,
  ) => Promise<void>;
  handleDeactivate: (
    id: string,
    replacementManagerId?: string,
  ) => Promise<void>;
  handleActivate: (id: string, payload: CreateStaffAccountPayload) => Promise<void>;
  handleUpdatePassword: (
    id: string,
    payload: CreateStaffAccountPayload,
  ) => Promise<void>;
  updateRoleFilter: (roleId: string | "all") => void;
  updateStatusFilter: (status: StaffStatus | "all") => void;
  updateBranchFilter: (branchId: string) => void;
  updateWarehouseFilter: (warehouseId: string) => void;
  updatePage: (page: number) => void;
  updatePageSize: (limit: number) => void;
  assignManagerOpen: boolean;
  assignManagerBranchId?: string;
  assignManagerBranchName?: string;
  openAssignBranchManager: (branchId?: string, branchName?: string) => void;
  closeAssignBranchManager: () => void;
  assignWarehouseManagerOpen: boolean;
  assignManagerWarehouseId?: string;
  assignManagerWarehouseName?: string;
  openAssignWarehouseManager: (
    warehouseId?: string,
    warehouseName?: string,
  ) => void;
  closeAssignWarehouseManager: () => void;
};

const StaffsContext = React.createContext<StaffsContextType | null>(null);

/**
 * Empty, and that is the correct default.
 *
 * This used to hold the three roles the old backend had built in. Sending one of those
 * names as a `roleId` would now be rejected - a role is a row this shop created, and a
 * brand-new tenant has none until somebody defines them. Falling back to a made-up list
 * would turn "you have not set up roles yet" into a 400 at the end of the hiring form.
 */
const DEFAULT_ROLE_OPTIONS: StaffRoleOption[] = [];

type StaffsProviderProps = {
  children: React.ReactNode;
  enabled?: boolean;
};

export function StaffsProvider({
  children,
  enabled = true,
}: StaffsProviderProps) {
  const canFetch = enabled && canViewStaff(getSessionRole());

  const [staffs, setStaffs] = useState<Staff[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(canFetch);
  const [isFetching, setIsFetching] = useState(false);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [listQuery, setListQuery] = useState<StaffListQuery>(DEFAULT_LIST_QUERY);
  const [keywordInput, setKeywordInput] = useState("");
  const [roleOptions, setRoleOptions] = useState<StaffRoleOption[]>(
    DEFAULT_ROLE_OPTIONS,
  );
  const [branchOptions, setBranchOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [warehouseOptions, setWarehouseOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [warehouseOptionsFailed, setWarehouseOptionsFailed] = useState(false);
  const [open, setOpen] = useState<StaffsDialogType | null>(null);
  const [currentRow, setCurrentRow] = useState<Staff | null>(null);
  const [assignManagerOpen, setAssignManagerOpen] = useState(false);
  const [assignManagerBranchId, setAssignManagerBranchId] = useState<
    string | undefined
  >();
  const [assignManagerBranchName, setAssignManagerBranchName] = useState<
    string | undefined
  >();
  const [assignWarehouseManagerOpen, setAssignWarehouseManagerOpen] =
    useState(false);
  const [assignManagerWarehouseId, setAssignManagerWarehouseId] = useState<
    string | undefined
  >();
  const [assignManagerWarehouseName, setAssignManagerWarehouseName] = useState<
    string | undefined
  >();
  const locationKey = useAuthStore((state) => state.locationKey);
  const paySheetNameByIdRef = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    // if (!canFetch) {
    //   setIsInitialLoading(false);
    //   return;
    // }

    const timer = setTimeout(() => {
      setListQuery((prev) => {
        if (prev.search === keywordInput) return prev;
        return { ...prev, search: keywordInput, page: 1 };
      });
    }, 400);

    return () => clearTimeout(timer);
  }, [keywordInput, canFetch]);

  useEffect(() => {
    if (!canFetch) return;

    async function loadFilterOptions() {
      try {
        const response = await branchApi.getList({ limit: 100 });
        setBranchOptions(
          (response.data ?? []).map((branch) => ({
            value: branch.id,
            label: branch.name,
          })),
        );
      } catch {
        setBranchOptions([]);
      }

      try {
        const response = await warehouseApi.getList({ limit: 100 });
        setWarehouseOptions(
          (response.data ?? []).map((warehouse) => ({
            value: warehouse.id,
            label: warehouse.name,
          })),
        );
        setWarehouseOptionsFailed(false);
      } catch {
        setWarehouseOptions([]);
        setWarehouseOptionsFailed(true);
      }
    }

    loadFilterOptions();
  }, [canFetch]);

  useEffect(() => {
    if (!canFetch) return;
    let cancelled = false;
    void paySheetApi
      .getAllForOptions()
      .then((options) => {
        if (cancelled) return;
        paySheetNameByIdRef.current = new Map(
          options.map((option) => [option.value, option.label]),
        );
        // Refresh labels nếu staff list đã load trước.
        setStaffs((prev) =>
          prev.map((staff) => {
            if (!staff.paySheetId) return staff;
            const name = paySheetNameByIdRef.current.get(staff.paySheetId);
            if (!name || staff.paySheetName === name) return staff;
            return { ...staff, paySheetName: name };
          }),
        );
      })
      .catch(() => {
        // Không chặn list nhân viên nếu thiếu quyền paysheets.
      });
    return () => {
      cancelled = true;
    };
  }, [canFetch]);

  const fetchStaffs = useCallback(async () => {
    if (!canFetch) return;

    setIsFetching(true);
    try {
      // The global branch/warehouse switcher takes precedence over the page's own
      // filter dropdowns - same reactive scoping products/checkout apply via
      // locationKey - so switching branch immediately scopes the staff list.
      const scope = parseLocationKey(locationKey);
      const branchId =
        scope?.locationType === "branch"
          ? scope.locationId
          : listQuery.branchId === "all"
            ? undefined
            : listQuery.branchId;
      const warehouseId =
        scope?.locationType === "warehouse"
          ? scope.locationId
          : listQuery.warehouseId === "all"
            ? undefined
            : listQuery.warehouseId;

      const response = await staffApi.getList({
        page: listQuery.page,
        limit: listQuery.limit,
        search: listQuery.search || undefined,
        roleId: listQuery.roleId === "all" ? undefined : listQuery.roleId,
        status: listQuery.status === "all" ? undefined : listQuery.status,
        branchId,
        warehouseId,
      });
      const withPaySheetNames = response.data.map((staff) => {
        if (!staff.paySheetId) return staff;
        if (staff.paySheetName) return staff;
        const name = paySheetNameByIdRef.current.get(staff.paySheetId);
        return name ? { ...staff, paySheetName: name } : staff;
      });
      setStaffs(withPaySheetNames);
      setTotal(response.total);
      setTotalPages(response.totalPages);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
      setStaffs([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setIsFetching(false);
      setIsInitialLoading(false);
    }
  }, [listQuery, canFetch, locationKey]);

  const fetchRoles = useCallback(async () => {
    if (!canFetch) return;

    try {
      const roles = await staffApi.getRoles();
      if (roles.length > 0) {
        // `getRoles` already returns { value: role id, label: role name }.
        setRoleOptions(roles);
      }
    } catch {
      setRoleOptions(DEFAULT_ROLE_OPTIONS);
    }
  }, [canFetch]);

useEffect(() => {
  const loadData = async () => {
    setIsFetching(true);

    try {
      await Promise.all([
        fetchStaffs(),
        fetchRoles(),
      ]);
    } catch (error) {
      console.error(error);
      toast.error("Không thể tải dữ liệu");
    } finally {
      setIsFetching(false);
    }
  };

  loadData();
}, [fetchStaffs, fetchRoles]);

  function updateRoleFilter(roleId: string | "all") {
    setListQuery((prev) => ({ ...prev, roleId, page: 1 }));
  }

  function updateStatusFilter(status: StaffStatus | "all") {
    setListQuery((prev) => ({ ...prev, status, page: 1 }));
  }

  function updateBranchFilter(branchId: string) {
    setListQuery((prev) => ({ ...prev, branchId, page: 1 }));
  }

  function updateWarehouseFilter(warehouseId: string) {
    setListQuery((prev) => ({ ...prev, warehouseId, page: 1 }));
  }

  function updatePage(page: number) {
    setListQuery((prev) => ({ ...prev, page }));
  }

  function updatePageSize(limit: number) {
    setListQuery((prev) => ({ ...prev, limit, page: 1 }));
  }

  async function handleAdd(payload: CreateStaffPayload) {
    try {
      const created = await staffApi.create(payload);

      if (payload.newPassword && payload.reEnterPassword) {
        try {
          await staffApi.createAccount(created.id, {
            newPassword: payload.newPassword,
            reEnterPassword: payload.reEnterPassword,
          });
          toast.success("Đã thêm nhân viên");
        } catch {
          toast.warning(
            "Đã tạo nhân viên nhưng chưa kích hoạt tài khoản. Bạn có thể kích hoạt sau.",
          );
        }
      } else {
        toast.success("Đã thêm nhân viên");
      }

      await fetchStaffs();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
      throw error;
    }
  }

  async function handleEdit(id: string, payload: UpdateStaffPayload) {
    try {
      await staffApi.update(id, payload);
      toast.success("Đã cập nhật nhân viên");
      await fetchStaffs();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
      throw error;
    }
  }

  async function handleDelete(id: string) {
    try {
      await staffApi.remove(id);
      setStaffs((prev) => prev.filter((staff) => staff.id !== id));
      setTotal((prev) => Math.max(0, prev - 1));
      toast.success("Đã xóa nhân viên");
      await fetchStaffs();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
      throw error;
    }
  }

  async function handleDeactivate(id: string) {
    try {
      await staffApi.deactivateAccount(id);
      toast.success("Đã khóa tài khoản nhân viên");
      await fetchStaffs();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
      throw error;
    }
  }

  async function handleActivate(
    id: string,
    payload: CreateStaffAccountPayload,
  ) {
    try {
      await staffApi.createAccount(id, payload);
      toast.success("Đã kích hoạt tài khoản nhân viên");
      await fetchStaffs();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
      throw error;
    }
  }

  async function handleUpdatePassword(
    id: string,
    payload: CreateStaffAccountPayload,
  ) {
    try {
      await staffApi.updatePassword(id, payload);
      toast.success("Đã đổi mật khẩu");
      await fetchStaffs();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
      throw error;
    }
  }

  function openAssignBranchManager(branchId?: string, branchName?: string) {
    setAssignManagerBranchId(branchId);
    setAssignManagerBranchName(branchName);
    setAssignManagerOpen(true);
  }

  function closeAssignBranchManager() {
    setAssignManagerOpen(false);
    setAssignManagerBranchId(undefined);
    setAssignManagerBranchName(undefined);
  }

  function openAssignWarehouseManager(
    warehouseId?: string,
    warehouseName?: string,
  ) {
    setAssignManagerWarehouseId(warehouseId);
    setAssignManagerWarehouseName(warehouseName);
    setAssignWarehouseManagerOpen(true);
  }

  function closeAssignWarehouseManager() {
    setAssignWarehouseManagerOpen(false);
    setAssignManagerWarehouseId(undefined);
    setAssignManagerWarehouseName(undefined);
  }

  return (
    <StaffsContext.Provider
      value={{
        staffs,
        isInitialLoading,
        isFetching,
        total,
        totalPages,
        listQuery,
        keywordInput,
        setKeywordInput,
        setListQuery,
        roleOptions,
        branchOptions,
        warehouseOptions,
        warehouseOptionsFailed,
        locationKey,
        open,
        setOpen,
        currentRow,
        setCurrentRow,
        fetchStaffs,
        handleAdd,
        handleEdit,
        handleDelete,
        handleDeactivate,
        handleActivate,
        handleUpdatePassword,
        updateRoleFilter,
        updateStatusFilter,
        updateBranchFilter,
        updateWarehouseFilter,
        updatePage,
        updatePageSize,
        assignManagerOpen,
        assignManagerBranchId,
        assignManagerBranchName,
        openAssignBranchManager,
        closeAssignBranchManager,
        assignWarehouseManagerOpen,
        assignManagerWarehouseId,
        assignManagerWarehouseName,
        openAssignWarehouseManager,
        closeAssignWarehouseManager,
      }}
    >
      {children}
    </StaffsContext.Provider>
  );
}

export function useStaffs() {
  const ctx = React.useContext(StaffsContext);
  if (!ctx) throw new Error("useStaffs must be used within <StaffsProvider>");
  return ctx;
}
