"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { toast } from "sonner";
import { leaveRequestApi } from "@/lib/api/leave-request";
import { staffApi } from "@/lib/api/staff";
import { workingScheduleApi } from "@/lib/api/schedule";
import { getApiErrorMessage } from "@/lib/api/staff-mapper";
import {
  canCreateEmergencyLeave,
  canCreatePersonalLeave,
} from "@/components/sidebar/constants/role-permissions";
import { useAuth } from "@/hooks/use-auth";
import { getSessionUserId } from "@/lib/auth";
import { useParams } from "next/navigation";
import type {
  ApproveLeavePayload,
  CreateEmergencyLeavePayload,
  CreatePersonalLeavePayload,
  LeaveBalance,
  LeaveListQuery,
  LeaveRequest,
  LeaveRequestStatus,
  LeaveStaffOption,
} from "@/types/leave-request";

export type LeaveRequestsDialogType = "personal" | "emergency";

const DEFAULT_LIST_QUERY: LeaveListQuery = {
  page: 1,
  limit: 10,
  status: "all",
  search: "",
};

type LeaveRequestsContextType = {
  leaveRequests: LeaveRequest[];
  isInitialLoading: boolean;
  isFetching: boolean;
  total: number;
  totalPages: number;
  listQuery: LeaveListQuery;
  balance: LeaveBalance | null;
  staffOptions: LeaveStaffOption[];
  handoverOptions: LeaveStaffOption[];
  currentUserId?: string;
  open: LeaveRequestsDialogType | null;
  setOpen: (value: LeaveRequestsDialogType | null) => void;
  handleCreatePersonal: (payload: CreatePersonalLeavePayload) => Promise<void>;
  handleCreateEmergency: (
    payload: CreateEmergencyLeavePayload,
    options?: { approveImmediately?: ApproveLeavePayload },
  ) => Promise<void>;
  handleApprove: (id: string, payload: ApproveLeavePayload) => Promise<void>;
  handleReject: (id: string, reviewNote: string) => Promise<void>;
  handleCancel: (id: string) => Promise<void>;
  updateStatusFilter: (status: LeaveRequestStatus | "all") => void;
  updateKeywordFilter: (search: string) => void;
  updatePage: (page: number) => void;
  updatePageSize: (limit: number) => void;
};

const LeaveRequestsContext =
  React.createContext<LeaveRequestsContextType | null>(null);

function isUserContextReady(
  role?: string | null,
  branchId?: string | null,
  warehouseId?: string | null,
): boolean {
  if (!role) return false;
  // "Do we know enough to load this screen." Anybody posted somewhere needs their posting
  // resolved first; an owner is posted nowhere and is ready immediately. Keyed on the role
  // names, this returned true for every staff account before their posting had loaded.
  if (branchId || warehouseId) return true;
  return role === "TENANT_OWNER" || role === "ADMIN";
}

export function LeaveRequestsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const role = user?.role;
  const branchId = user?.branchId;
  const warehouseId = user?.warehouseId;
  const currentUserId = getSessionUserId() ?? user?.id;

  const params = useParams();
  const targetId = params.id as string | undefined;

  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [listQuery, setListQuery] = useState<LeaveListQuery>(DEFAULT_LIST_QUERY);
  const [open, setOpen] = useState<LeaveRequestsDialogType | null>(null);
  const [balance, setBalance] = useState<LeaveBalance | null>(null);
  const [staffOptions, setStaffOptions] = useState<LeaveStaffOption[]>([]);
  const [handoverOptions, setHandoverOptions] = useState<LeaveStaffOption[]>(
    [],
  );

  const contextReady = isUserContextReady(role, branchId, warehouseId);

  useEffect(() => {
    if (!role) return;

    let cancelled = false;

    async function loadOptions() {
      const emergencyAllowed = canCreateEmergencyLeave(role);
      const personalAllowed = canCreatePersonalLeave(role);
      // Which option lists to fetch follows from where the person works, not from a role.
      const needsBranchStaff =
        (emergencyAllowed || personalAllowed) && !!branchId;
      const needsToStaff = emergencyAllowed && !branchId && !warehouseId;
      const needsWhHandover = personalAllowed && !!warehouseId;

      let activeStaff: Awaited<ReturnType<typeof staffApi.getAllForOptions>> =
        [];

      if (needsBranchStaff || needsToStaff) {
        try {
          const list = await staffApi.getAllForOptions();
          if (cancelled) return;
          activeStaff = list.filter((s) => s.status === "ACTIVE");
        } catch {
          if (!cancelled) {
            setStaffOptions([]);
            setHandoverOptions([]);
          }
          return;
        }
      }

      if (emergencyAllowed) {
        // The role filters here listed the three fixed roles the old backend had. Roles
        // are tenant-defined rows now and every /users row is already a staff account, so
        // what is left is the posting: a branch-scoped picker still wants that branch.
        const filtered = needsBranchStaff
          ? activeStaff.filter((s) => s.branchId === branchId)
          : activeStaff;
        if (!cancelled) {
          setStaffOptions(
            filtered.map((s) => ({
              value: s.id,
              label: s.fullName,
              role: s.roleName,
            })),
          );
        }
      } else if (!cancelled) {
        setStaffOptions([]);
      }

      if (needsBranchStaff) {
        if (!cancelled) {
          setHandoverOptions(
            activeStaff
              .filter(
                (s) => s.branchId === branchId && s.id !== currentUserId,
              )
              .map((s) => ({
                value: s.id,
                label: s.fullName,
                role: s.roleName,
              })),
          );
        }
      } else if (needsWhHandover) {
        try {
          const schedules = await workingScheduleApi.getList({
            page: 1,
            limit: 100,
          });
          if (cancelled) return;
          const unique = new Map<string, LeaveStaffOption>();
          for (const schedule of schedules.data) {
            for (const assignee of schedule.assignees) {
              if (
                !assignee.userId ||
                assignee.userId === currentUserId ||
                unique.has(assignee.userId)
              ) {
                continue;
              }
              unique.set(assignee.userId, {
                value: assignee.userId,
                label: assignee.staffName || assignee.userId,
                role: assignee.role,
              });
            }
          }
          setHandoverOptions(Array.from(unique.values()));
        } catch {
          if (!cancelled) setHandoverOptions([]);
        }
      } else if (!cancelled) {
        setHandoverOptions([]);
      }
    }

    void loadOptions();
    return () => {
      cancelled = true;
    };
  }, [role, branchId, warehouseId, currentUserId]);

  const fetchBalance = useCallback(async () => {
    if (!canCreatePersonalLeave(role)) {
      setBalance(null);
      return;
    }
    try {
      setBalance(await leaveRequestApi.getBalance());
    } catch {
      setBalance(null);
    }
  }, [role]);

  const fetchLeaveRequests = useCallback(async () => {
    if (!contextReady || !role) {
      setIsInitialLoading(false);
      return;
    }

    setIsFetching(true);
    try {
      const response = await leaveRequestApi.getListForUser(
        { role },
        {
          page: listQuery.page,
          limit: listQuery.limit,
          status: listQuery.status === "all" ? undefined : listQuery.status,
          search: listQuery.search || undefined,
        },
      );

      let data = response.data;
      if (targetId && !data.some((r) => r.id === targetId)) {
        try {
          const targetReq = await leaveRequestApi.getById(targetId);
          if (targetReq) {
            data = [targetReq, ...data];
          }
        } catch (err) {
          console.error("Failed to fetch target leave request:", err);
        }
      }

      setLeaveRequests(data);
      setTotal(response.total);
      setTotalPages(response.totalPages);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
      setLeaveRequests([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setIsFetching(false);
      setIsInitialLoading(false);
    }
  }, [
    contextReady,
    role,
    listQuery.page,
    listQuery.limit,
    listQuery.status,
    listQuery.search,
    targetId,
  ]);

  useEffect(() => {
    void fetchLeaveRequests();
  }, [fetchLeaveRequests]);

  useEffect(() => {
    void fetchBalance();
  }, [fetchBalance]);

  const refreshAfterMutation = useCallback(async () => {
    await Promise.all([fetchLeaveRequests(), fetchBalance()]);
  }, [fetchLeaveRequests, fetchBalance]);

  const handleCreatePersonal = useCallback(
    async (payload: CreatePersonalLeavePayload) => {
      try {
        await leaveRequestApi.createPersonal(payload);
        toast.success("Đã gửi đơn nghỉ phép");
        await refreshAfterMutation();
      } catch (error) {
        toast.error(getApiErrorMessage(error));
        throw error;
      }
    },
    [refreshAfterMutation],
  );

  const handleCreateEmergency = useCallback(
    async (
      payload: CreateEmergencyLeavePayload,
      options?: { approveImmediately?: ApproveLeavePayload },
    ) => {
      try {
        const created = await leaveRequestApi.createEmergency(payload);
        if (options?.approveImmediately) {
          await leaveRequestApi.approve(
            created.id,
            options.approveImmediately,
          );
          toast.success("Đã tạo và duyệt đơn nghỉ phép khẩn");
        } else {
          toast.success("Đã tạo đơn nghỉ phép khẩn (chờ duyệt)");
        }
        await refreshAfterMutation();
      } catch (error) {
        toast.error(getApiErrorMessage(error));
        throw error;
      }
    },
    [refreshAfterMutation],
  );

  const handleApprove = useCallback(
    async (id: string, payload: ApproveLeavePayload) => {
      try {
        await leaveRequestApi.approve(id, payload);
        toast.success("Đã duyệt đơn nghỉ phép");
        await refreshAfterMutation();
      } catch (error) {
        toast.error(getApiErrorMessage(error));
        throw error;
      }
    },
    [refreshAfterMutation],
  );

  const handleReject = useCallback(
    async (id: string, reviewNote: string) => {
      try {
        await leaveRequestApi.reject(id, reviewNote);
        toast.success("Đã từ chối đơn nghỉ phép");
        await fetchLeaveRequests();
      } catch (error) {
        toast.error(getApiErrorMessage(error));
        throw error;
      }
    },
    [fetchLeaveRequests],
  );

  const handleCancel = useCallback(
    async (id: string) => {
      try {
        await leaveRequestApi.cancel(id);
        toast.success("Đã hủy đơn nghỉ phép");
        await refreshAfterMutation();
      } catch (error) {
        toast.error(getApiErrorMessage(error));
        throw error;
      }
    },
    [refreshAfterMutation],
  );

  const updateStatusFilter = useCallback(
    (status: LeaveRequestStatus | "all") => {
      setListQuery((prev) => ({ ...prev, status, page: 1 }));
    },
    [],
  );

  const updateKeywordFilter = useCallback((search: string) => {
    setListQuery((prev) => ({ ...prev, search, page: 1 }));
  }, []);

  const updatePage = useCallback((page: number) => {
    setListQuery((prev) => ({ ...prev, page }));
  }, []);

  const updatePageSize = useCallback((limit: number) => {
    setListQuery((prev) => ({ ...prev, limit, page: 1 }));
  }, []);

  const value = useMemo(
    () => ({
      leaveRequests,
      isInitialLoading,
      isFetching,
      total,
      totalPages,
      listQuery,
      balance,
      staffOptions,
      handoverOptions,
      currentUserId,
      open,
      setOpen,
      handleCreatePersonal,
      handleCreateEmergency,
      handleApprove,
      handleReject,
      handleCancel,
      updateStatusFilter,
      updateKeywordFilter,
      updatePage,
      updatePageSize,
    }),
    [
      leaveRequests,
      isInitialLoading,
      isFetching,
      total,
      totalPages,
      listQuery,
      balance,
      staffOptions,
      handoverOptions,
      currentUserId,
      open,
      handleCreatePersonal,
      handleCreateEmergency,
      handleApprove,
      handleReject,
      handleCancel,
      updateStatusFilter,
      updateKeywordFilter,
      updatePage,
      updatePageSize,
    ],
  );

  return (
    <LeaveRequestsContext.Provider value={value}>
      {children}
    </LeaveRequestsContext.Provider>
  );
}

export function useLeaveRequests() {
  const ctx = React.useContext(LeaveRequestsContext);
  if (!ctx) {
    throw new Error(
      "useLeaveRequests must be used within <LeaveRequestsProvider>",
    );
  }
  return ctx;
}
