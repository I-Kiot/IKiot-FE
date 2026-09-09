"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { parseLocationKey } from "@/lib/location-key";
import { cashDrawerApi } from "@/lib/api/cash-drawer";
import { staffApi } from "@/lib/api/staff";
import { branchApi } from "@/lib/api/branch";
import { canManageCashDrawer } from "@/components/sidebar/constants/role-permissions";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Landmark,
  Store,
  AlertCircle,
  Loader2,
  Plus,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import type { Staff } from "@/types/staff";
import type { Branch } from "@/types/branch";
import type { CashDrawerSession } from "@/types/cash-drawer";

const BREADCRUMBS = [
  { label: "Trang chủ", href: "/dashboard" },
  { label: "Két tiền", href: "/cash-drawers/today" },
  { label: "Hôm nay" },
];

export default function CashDrawersTodayPage() {
  const router = useRouter();
  const { user, locationKey, setLocationKey } = useAuthStore();

  const [isLoading, setIsLoading] = useState(true);
  const [activeBranchId, setActiveBranchId] = useState<string | null>(null);
  const [activeBranchName, setActiveBranchName] = useState<string>("");

  // Branch switcher for TENANT_OWNER
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchSessions, setBranchSessions] = useState<
    Record<string, { session: CashDrawerSession | null; isLoading: boolean }>
  >({});

  // Staffs for opening cash drawer
  const [branchStaffs, setBranchStaffs] = useState<Staff[]>([]);

  // Dialog State
  const [openBranchId, setOpenBranchId] = useState<string | null>(null);
  const [openBranchName, setOpenBranchName] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [openingAmount, setOpeningAmount] = useState<string>("1000000");
  const [selectedStaffId, setSelectedStaffId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isStaffLoading, setIsStaffLoading] = useState(false);

  // Load session status for each branch
  const loadBranchSessions = async (branchList: Branch[]) => {
    const initialMap: Record<
      string,
      { session: CashDrawerSession | null; isLoading: boolean }
    > = {};
    branchList.forEach((b) => {
      initialMap[b.id] = { session: null, isLoading: true };
    });
    setBranchSessions(initialMap);

    branchList.forEach(async (b) => {
      try {
        const sess = await cashDrawerApi.getCurrentSession(b.id);
        setBranchSessions((prev) => ({
          ...prev,
          [b.id]: { session: sess, isLoading: false },
        }));
      } catch {
        setBranchSessions((prev) => ({
          ...prev,
          [b.id]: { session: null, isLoading: false },
        }));
      }
    });
  };

  // 1. Resolve Active Branch
  useEffect(() => {
    if (!user) return;

    if (user.role === "TENANT_OWNER") {
      const parsed = parseLocationKey(locationKey);
      if (parsed && parsed.locationType === "branch") {
        setActiveBranchId(parsed.locationId);
        branchApi
          .getById(parsed.locationId)
          .then((b) => {
            if (b) setActiveBranchName(b.name);
          })
          .catch(() => setActiveBranchName("Chi nhánh"));
      } else {
        setActiveBranchId(null);
        setActiveBranchName("");
        setIsLoading(true);
        branchApi
          .getList({ limit: 100 })
          .then((res) => {
            const list = res.data || [];
            setBranches(list);
            loadBranchSessions(list);
          })
          .catch(() => toast.error("Không thể tải danh sách chi nhánh"))
          .finally(() => setIsLoading(false));
      }
    } else {
      // BRANCH_MANAGER or STAFF
      if (user.branchId) {
        setActiveBranchId(user.branchId);
        branchApi
          .getById(user.branchId)
          .then((b) => {
            if (b) setActiveBranchName(b.name);
          })
          .catch(() => setActiveBranchName("Chi nhánh"));
      }
    }
  }, [user, locationKey]);

  // Fetch current session for the resolved branch, redirect if active
  const fetchSession = async (branchId: string) => {
    try {
      const data = await cashDrawerApi.getCurrentSession(branchId);
      if (data && data.id) {
        router.push(`/cash-drawers/${data.id}`);
      } else {
        setIsLoading(false);
      }
    } catch (err: any) {
      if (err?.response?.status === 404) {
        setIsLoading(false);
      } else {
        console.error(err);
        toast.error("Không thể tải thông tin két tiền");
        setIsLoading(false);
      }
    }
  };

  // 2. Fetch Session & Staffs when active branch is set
  useEffect(() => {
    if (!activeBranchId) return;

    setIsLoading(true);
    fetchSession(activeBranchId);

    staffApi
      .getList({
        branchId: activeBranchId,
        status: "ACTIVE",
        limit: 100,
      })
      .then((res) => {
        const valid = res.data || [];
        setBranchStaffs(valid);
        const me = valid.find((s) => s.id === user?.id);
        if (me) {
          setSelectedStaffId(me.id);
        } else if (valid.length > 0) {
          setSelectedStaffId(valid[0].id);
        }
      })
      .catch((err) => {
        console.error(err);
        toast.error("Không thể tải danh sách nhân viên");
      });
  }, [activeBranchId, user]);

  const handleGridBranchClick = async (
    branchId: string,
    branchName: string,
  ) => {
    setOpenBranchId(branchId);
    setOpenBranchName(branchName);
    setSelectedStaffId("");
    setIsStaffLoading(true);

    try {
      const res = await staffApi.getList({
        branchId,
        status: "ACTIVE",
        limit: 100,
      });
      const valid = res.data || [];
      setBranchStaffs(valid);

      const me = valid.find((s) => s.id === user?.id);
      if (me) {
        setSelectedStaffId(me.id);
      } else if (valid.length > 0) {
        setSelectedStaffId(valid[0].id);
      }
      setIsDialogOpen(true);
    } catch (err) {
      console.error(err);
      toast.error("Không thể tải danh sách nhân viên của chi nhánh này");
    } finally {
      setIsStaffLoading(false);
    }
  };

  const handleOpenCashDrawer = async (e: React.FormEvent) => {
    e.preventDefault();
    const branchId = openBranchId || activeBranchId;
    if (!branchId) return;

    const amount = parseInt(openingAmount.replace(/\D/g, ""), 10);
    if (isNaN(amount) || amount < 0) {
      toast.error("Số tiền mở két không hợp lệ");
      return;
    }

    if (!selectedStaffId) {
      toast.error("Vui lòng chọn nhân viên nhận két");
      return;
    }

    setIsSubmitting(true);
    try {
      const data = await cashDrawerApi.openSession({
        branchId,
        openingAmount: amount,
        staffId: selectedStaffId,
      });
      toast.success("Đã mở két đầu ngày thành công!");
      setIsDialogOpen(false);
      setOpenBranchId(null);
      setOpenBranchName("");
      if (data && data.id) {
        router.push(`/cash-drawers/${data.id}`);
      }
    } catch (error: any) {
      console.error(error);
      const msg = error?.response?.data?.message || "Không thể mở két đầu ngày";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formattedToday = new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date());

  if (isLoading) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">
          Đang tải thông tin két tiền...
        </p>
      </div>
    );
  }

  const parsedKey = parseLocationKey(locationKey);
  const isWarehouse =
    locationKey?.startsWith("warehouse") ||
    parsedKey?.locationType === "warehouse";

  if (isWarehouse) {
    return (
      <div className="flex flex-col gap-6 px-4  lg:px-6">
        <PageHeader
          breadcrumbs={BREADCRUMBS}
          title="Hôm nay"
          description="Kho tổng không hỗ trợ giao dịch két tiền"
        />
        <div className="mx-auto max-w-md w-full flex flex-col items-center justify-center text-center py-16 px-4">
          <div className="w-16 h-16 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mb-4">
            <AlertCircle className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-bold text-foreground">
            Kho tổng không có két tiền
          </h3>
          <p className="text-sm text-muted-foreground mt-2 max-w-xs mb-8">
            Giao dịch két tiền chỉ khả dụng tại các chi nhánh cụ thể. Vui lòng
            chọn một chi nhánh hoặc quay lại.
          </p>
          <Button
            size="lg"
            variant="outline"
            className="w-full font-semibold cursor-pointer"
            onClick={() => setLocationKey("all")}
          >
            Quay lại
          </Button>
        </div>
      </div>
    );
  }

  // Branch Selector (Tenant Owner - "all" mode)
  if (!activeBranchId && user?.role === "TENANT_OWNER") {
    return (
      <div className="flex flex-col gap-6 px-4  lg:px-6">
        <PageHeader
          breadcrumbs={BREADCRUMBS}
          title="Hôm nay"
          description="Quản lý két tiền và lịch sử bàn giao ca làm việc"
        />

        <div className="mx-auto max-w-4xl w-full flex flex-col items-center justify-center text-center">
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 w-full">
            {branches.length === 0 ? (
              <div className="col-span-full py-8 text-center text-sm text-muted-foreground">
                Không tìm thấy chi nhánh nào hoạt động.
              </div>
            ) : (
              branches.map((branch) => {
                const state = branchSessions[branch.id];
                const sessionInfo = state?.session;
                const isSessionLoading = state?.isLoading;

                return (
                  <Button
                    key={branch.id}
                    variant="outline"
                    className="h-auto flex flex-col items-start gap-2 p-4 justify-between hover:border-primary hover:bg-primary/5 transition cursor-pointer"
                    disabled={openBranchId === branch.id && isStaffLoading}
                    onClick={() => {
                      if (sessionInfo && sessionInfo.id) {
                        router.push(`/cash-drawers/${sessionInfo.id}`);
                      } else {
                        handleGridBranchClick(branch.id, branch.name);
                      }
                    }}
                  >
                    <div className="w-full flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Store className="h-4 w-4 text-primary shrink-0" />
                        <span className="font-semibold text-sm text-left line-clamp-1">
                          {branch.name}
                        </span>
                      </div>
                      {isSessionLoading ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground shrink-0" />
                      ) : sessionInfo ? (
                        <Badge
                          variant="success"
                          className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] py-0 px-1.5 font-semibold shrink-0"
                        >
                          ĐANG MỞ
                        </Badge>
                      ) : (
                        <Badge
                          variant="secondary"
                          className="bg-neutral-100 text-neutral-500 border-neutral-200 text-[10px] py-0 px-1.5 font-semibold shrink-0"
                        >
                          CHƯA MỞ
                        </Badge>
                      )}
                    </div>
                    {branch.address && (
                      <span className="text-xs text-muted-foreground text-left line-clamp-2 mt-1">
                        {branch.address}
                      </span>
                    )}
                    <div className="w-full flex justify-end items-center text-xs text-primary font-medium mt-3 gap-1">
                      {sessionInfo ? (
                        <>
                          Xem chi tiết <ArrowRight className="h-3 w-3" />
                        </>
                      ) : openBranchId === branch.id && isStaffLoading ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin me-1 text-primary shrink-0" />{" "}
                          Đang tải...
                        </>
                      ) : (
                        <>
                          Mở két <ArrowRight className="h-3 w-3" />
                        </>
                      )}
                    </div>
                  </Button>
                );
              })
            )}
          </div>
        </div>

        {/* Dialog Mở két đầu ngày - must render inside this block */}
        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setOpenBranchId(null);
              setOpenBranchName("");
            }
          }}
        >
          <DialogContent className="sm:max-w-md">
            <form onSubmit={handleOpenCashDrawer}>
              <DialogHeader>
                <DialogTitle className="text-xl font-bold">
                  Mở két đầu ngày - {openBranchName}
                </DialogTitle>
                <DialogDescription>
                  Thiết lập số tiền bàn giao ban đầu và chọn nhân viên giữ két.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 ">
                <div className="grid gap-2">
                  <Label htmlFor="openingAmount" className="font-semibold">
                    Tiền mở két đầu ngày (VND)
                  </Label>
                  <Input
                    id="openingAmount"
                    type="text"
                    required
                    value={parseInt(openingAmount || "0", 10).toLocaleString(
                      "vi-VN",
                    )}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "");
                      setOpeningAmount(val || "0");
                    }}
                    placeholder="Nhập số tiền"
                    className="text-lg font-semibold tracking-wide"
                  />
                  <p className="text-xs text-muted-foreground">
                    Đây là số tiền mặt có sẵn trong két để thối lại tiền thừa
                    cho khách.
                  </p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="staff-grid" className="font-semibold">
                    Nhân viên nhận bàn giao ca đầu tiên
                  </Label>
                  {branchStaffs.length === 0 ? (
                    <div className="text-sm text-destructive font-medium border border-destructive/20 bg-destructive/5 rounded-md p-3">
                      Không có nhân viên hoạt động tại chi nhánh. Vui lòng gán
                      nhân viên trước.
                    </div>
                  ) : (
                    <Select
                      value={selectedStaffId}
                      onValueChange={setSelectedStaffId}
                    >
                      <SelectTrigger id="staff-grid">
                        <SelectValue placeholder="Chọn nhân viên" />
                      </SelectTrigger>
                      <SelectContent>
                        {branchStaffs.map((staff) => (
                          <SelectItem key={staff.id} value={staff.id}>
                            {staff.fullName} (
                            {staff.roleName}
                            )
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>

              <DialogFooter className="sm:justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSubmitting}
                  onClick={() => {
                    setIsDialogOpen(false);
                    setOpenBranchId(null);
                    setOpenBranchName("");
                  }}
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || branchStaffs.length === 0}
                  className="font-semibold"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin me-2" /> Đang xử
                      lý...
                    </>
                  ) : (
                    "Xác nhận mở két"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  const isManager = canManageCashDrawer(user?.role);

  return (
    <div className="flex flex-col gap-6 px-4  lg:px-6">
      <PageHeader
        breadcrumbs={BREADCRUMBS}
        title="Hôm nay"
        description={`Quản lý két tiền chi nhánh ${activeBranchName}`}
      />

      <div className="mx-auto max-w-md w-full flex flex-col items-center justify-center text-center py-12 px-4">
        <h1 className="text-3xl font-black text-foreground tracking-tight mb-2">
          {formattedToday}
        </h1>

        <div className="flex flex-col items-center justify-center py-8 w-full">
          {isManager ? (
            <>
              <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
                <Landmark className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-bold text-foreground">
                Hôm nay chưa mở két
              </h3>
              <p className="text-sm text-muted-foreground mt-2 max-w-xs mb-8">
                Vui lòng khai báo số tiền đầu ngày và giao két cho nhân viên giữ
                để bắt đầu ca bán hàng.
              </p>
              <Button
                size="lg"
                className="w-full font-semibold shadow-md shadow-primary/20 hover:scale-[1.01] transition active:scale-[0.99] cursor-pointer"
                onClick={() => setIsDialogOpen(true)}
              >
                <Plus className="h-4 w-4 me-2" /> Mở két đầu ngày
              </Button>
            </>
          ) : (
            <>
              <div className="w-16 h-16 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mb-4">
                <AlertCircle className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-bold text-foreground">
                Két chưa được mở
              </h3>
              <p className="text-sm text-muted-foreground mt-2 max-w-xs">
                Chi nhánh chưa mở két tiền cho hôm nay hoặc bạn chưa được bàn
                giao phiên giữ két nào. Vui lòng liên hệ Quản lý chi nhánh.
              </p>
            </>
          )}
        </div>
      </div>

      {/* Dialog Mở két đầu ngày */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleOpenCashDrawer}>
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">
                Mở két đầu ngày - {activeBranchName}
              </DialogTitle>
              <DialogDescription>
                Thiết lập số tiền bàn giao ban đầu và chọn nhân viên giữ két.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 ">
              <div className="grid gap-2">
                <Label htmlFor="openingAmount2" className="font-semibold">
                  Tiền mở két đầu ngày (VND)
                </Label>
                <Input
                  id="openingAmount2"
                  type="text"
                  required
                  value={parseInt(openingAmount || "0", 10).toLocaleString(
                    "vi-VN",
                  )}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "");
                    setOpeningAmount(val || "0");
                  }}
                  placeholder="Nhập số tiền"
                  className="text-lg font-semibold tracking-wide"
                />
                <p className="text-xs text-muted-foreground">
                  Đây là số tiền mặt có sẵn trong két để thối lại tiền thừa cho
                  khách.
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="staff2" className="font-semibold">
                  Nhân viên nhận bàn giao ca đầu tiên
                </Label>
                {branchStaffs.length === 0 ? (
                  <div className="text-sm text-destructive font-medium border border-destructive/20 bg-destructive/5 rounded-md p-3">
                    Không có nhân viên hoạt động tại chi nhánh. Vui lòng gán
                    nhân viên trước.
                  </div>
                ) : (
                  <Select
                    value={selectedStaffId}
                    onValueChange={setSelectedStaffId}
                  >
                    <SelectTrigger id="staff2">
                      <SelectValue placeholder="Chọn nhân viên" />
                    </SelectTrigger>
                    <SelectContent>
                      {branchStaffs.map((staff) => (
                        <SelectItem key={staff.id} value={staff.id}>
                          {staff.fullName} (
                          {staff.roleName}
                          )
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            <DialogFooter className="sm:justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
                onClick={() => setIsDialogOpen(false)}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || branchStaffs.length === 0}
                className="font-semibold"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin me-2" /> Đang xử
                    lý...
                  </>
                ) : (
                  "Xác nhận mở két"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
