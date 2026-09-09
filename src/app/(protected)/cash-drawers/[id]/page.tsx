"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { parseLocationKey } from "@/lib/location-key";
import { cashDrawerApi } from "@/lib/api/cash-drawer";
import { staffApi } from "@/lib/api/staff";
import { canManageCashDrawer } from "@/components/sidebar/constants/role-permissions";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Store,
  User,
  History,
  Lock,
  ArrowRight,
  Loader2,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import type { CashDrawerSession } from "@/types/cash-drawer";
import type { Staff } from "@/types/staff";

export default function CashDrawerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, locationKey, setLocationKey } = useAuthStore();
  const id = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<CashDrawerSession | null>(null);

  // Dialog states for "Báo cáo cuối ca" (Staff or Keeper Manager)
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportAmount, setReportAmount] = useState<string>("");
  const [nextStaffId, setNextStaffId] = useState<string>("");
  const [reportNote, setReportNote] = useState<string>("");
  const [branchStaffs, setBranchStaffs] = useState<Staff[]>([]);

  // Dialog states for "Chốt két" (Manager)
  const [isCloseOpen, setIsCloseOpen] = useState(false);
  const [closeAmount, setCloseAmount] = useState<string>("");
  const [closeNote, setCloseNote] = useState<string>("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  const prevLocationKeyRef = useRef<string | null>(null);

  // Capture initial locationKey on mount
  useEffect(() => {
    if (locationKey) {
      prevLocationKeyRef.current = locationKey;
    }
  }, []);

  const fetchSession = async () => {
    try {
      const data = await cashDrawerApi.getSessionById(id);
      setSession(data);
    } catch (err: any) {
      console.error(err);
      toast.error("Không thể tải chi tiết phiên két tiền");
      router.push("/cash-drawers");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchSession();
    }
  }, [id]);

  // Listen for global branch switcher changes
  useEffect(() => {
    if (!user || user.role !== "TENANT_OWNER" || !session) return;
    if (!prevLocationKeyRef.current) {
      prevLocationKeyRef.current = locationKey;
      return;
    }

    // Only react if locationKey changed via the global selector
    if (prevLocationKeyRef.current === locationKey) return;

    const parsed = parseLocationKey(locationKey);
    const currentSessionBranchId =
      typeof session.branchId === "string"
        ? session.branchId
        : session.branchId?.id;

    // Switched to Tổng Branch ("all")
    if (locationKey === "all") {
      router.push("/cash-drawers");
      return;
    }

    // Switched to a warehouse
    if (locationKey?.startsWith("warehouse") || parsed?.locationType === "warehouse") {
      prevLocationKeyRef.current = locationKey;
      return; // Do nothing, let it render the warehouse warning screen below
    }

    // Switched to another branch
    if (parsed && parsed.locationType === "branch" && parsed.locationId !== currentSessionBranchId) {
      setIsLoading(true);
      cashDrawerApi
        .getCurrentSession(parsed.locationId)
        .then((newSession) => {
          if (newSession && newSession.id) {
            router.push(`/cash-drawers/${newSession.id}`);
          } else {
            router.push("/cash-drawers");
          }
        })
        .catch(() => {
          router.push("/cash-drawers");
        });
    }

    prevLocationKeyRef.current = locationKey;
  }, [locationKey, session, user, router]);

  // Load active staffs for next staff dropdown
  useEffect(() => {
    if (!isReportOpen || !session) return;

    const branchId =
      typeof session.branchId === "string"
        ? session.branchId
        : session.branchId?.id;
    if (!branchId) return;

    const fetchStaffs = async () => {
      try {
        const response = await staffApi.getList({
          branchId,
          status: "ACTIVE",
          limit: 100,
        });
        // No role filter any more: every /users row is already a staff account of this
        // tenant, and the backend checks the rest (active, posted at this branch) when
        // the drawer is opened or handed over.
        const filtered = response.data || [];
        setBranchStaffs(filtered);
      } catch (error) {
        console.error(error);
        toast.error("Không thể tải danh sách nhân viên");
      }
    };

    fetchStaffs();
  }, [isReportOpen, session]);

  const handleOpenReport = () => {
    setReportAmount("");
    setNextStaffId("");
    setReportNote("");
    setIsReportOpen(true);
  };

  const handleOpenClose = () => {
    setCloseAmount("");
    setCloseNote("");
    setIsCloseOpen(true);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(val);
  };

  const formatTime = (dateStr: string) => {
    return new Intl.DateTimeFormat("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Ho_Chi_Minh",
    }).format(new Date(dateStr));
  };

  const formatDate = (dateStr: string) => {
    return new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(dateStr));
  };

  const getUserFullName = (userRef: any) => {
    if (!userRef) return "N/A";
    if (typeof userRef === "string") return "Nhân viên";
    const profile = userRef.profile;
    const first = profile?.firstName || "";
    const last = profile?.lastName || "";
    return (
      [last, first].filter(Boolean).join(" ").trim() ||
      userRef.email ||
      "Nhân viên"
    );
  };

  // Submit Shift Report (Staff or Keeper Manager)
  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseInt(reportAmount.replace(/\D/g, ""), 10);
    if (isNaN(amount) || amount < 0) {
      toast.error("Số tiền báo cáo không hợp lệ");
      return;
    }

    setIsSubmitting(true);
    try {
      await cashDrawerApi.submitShiftLog(id, {
        amount,
        nextStaffId:
          nextStaffId && nextStaffId !== "none_clear" ? nextStaffId : undefined,
        note: reportNote || undefined,
      });
      toast.success("Báo cáo cuối ca thành công!");
      setIsReportOpen(false);
      fetchSession();
    } catch (error: any) {
      console.error(error);
      const msg = error?.response?.data?.message || "Không thể nộp báo cáo ca";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Finalization (Manager)
  const handleSubmitClose = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseInt(closeAmount.replace(/\D/g, ""), 10);
    if (isNaN(amount) || amount < 0) {
      toast.error("Số tiền chốt két không hợp lệ");
      return;
    }

    setIsSubmitting(true);
    try {
      await cashDrawerApi.finalizeSession(id, {
        finalAmount: amount,
        note: closeNote || undefined,
      });
      toast.success("Chốt két và đóng ca hôm nay thành công!");
      setIsCloseOpen(false);
      fetchSession();
    } catch (error: any) {
      console.error(error);
      const msg = error?.response?.data?.message || "Không thể chốt két";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Derived properties
  const isManager = canManageCashDrawer(user?.role);
  const branchName =
    session && typeof session.branchId !== "string"
      ? session.branchId.name
      : "Chi nhánh";
  const currentStaffName = session ? getUserFullName(session.currentStaffId) : "";
  const isOpen = session ? session.status === "OPEN" : false;

  // Next staff candidates (exclude current keeper)
  const nextStaffCandidates = useMemo(() => {
    if (!session) return [];
    const keeperId =
      typeof session.currentStaffId === "string"
        ? session.currentStaffId
        : session.currentStaffId?.id;
    return branchStaffs.filter((s) => s.id !== keeperId);
  }, [branchStaffs, session]);

  // Handover Info for Staff User
  const staffHandoverAmount = useMemo(() => {
    if (!session || !user) return 0;
    if (session.shiftLogs && session.shiftLogs.length > 0) {
      const lastLogIdx = session.shiftLogs.findIndex(
        (log) =>
          log.nextStaffId &&
          (typeof log.nextStaffId === "string"
            ? log.nextStaffId === user.id
            : log.nextStaffId.id === user.id)
      );
      if (lastLogIdx !== -1) {
        return session.shiftLogs[lastLogIdx].amount;
      }
    }
    return session.openingAmount;
  }, [session, user]);

  const staffHandoverFrom = useMemo(() => {
    if (!session || !user) return "N/A";
    if (session.shiftLogs && session.shiftLogs.length > 0) {
      const lastLogIdx = session.shiftLogs.findIndex(
        (log) =>
          log.nextStaffId &&
          (typeof log.nextStaffId === "string"
            ? log.nextStaffId === user.id
            : log.nextStaffId.id === user.id)
      );
      if (lastLogIdx !== -1) {
        return getUserFullName(session.shiftLogs[lastLogIdx].staffId);
      }
    }
    return getUserFullName(session.openedBy);
  }, [session, user]);

  const staffHandoverTime = useMemo(() => {
    if (!session || !user) return "";
    if (session.shiftLogs && session.shiftLogs.length > 0) {
      const lastLogIdx = session.shiftLogs.findIndex(
        (log) =>
          log.nextStaffId &&
          (typeof log.nextStaffId === "string"
            ? log.nextStaffId === user.id
            : log.nextStaffId.id === user.id)
      );
      if (lastLogIdx !== -1) {
        return session.shiftLogs[lastLogIdx].loggedAt;
      }
    }
    return session.createdAt;
  }, [session, user]);

  const isCurrentKeeper = useMemo(() => {
    if (!session || !user) return false;
    const keeperId =
      typeof session.currentStaffId === "string"
        ? session.currentStaffId
        : session.currentStaffId?.id;
    return keeperId === user.id;
  }, [session, user]);

  // Determine dynamic breadcrumbs:
  // For branch/staff: Trang chủ > Két tiền
  // For tenant: Trang chủ > Két tiền > Chi tiết
  const breadcrumbs = useMemo(() => {
    if (user?.role === "TENANT_OWNER") {
      return [
        { label: "Trang chủ", href: "/dashboard" },
        { label: "Két tiền", href: "/cash-drawers" },
        { label: "Chi tiết" },
      ];
    }
    return [
      { label: "Trang chủ", href: "/dashboard" },
      { label: "Két tiền" },
    ];
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Đang tải chi tiết két tiền...</p>
      </div>
    );
  }

  const parsedLocation = parseLocationKey(locationKey);
  const isWarehouse = locationKey?.startsWith("warehouse") || parsedLocation?.locationType === "warehouse";

  if (isWarehouse) {
    return (
      <div className="flex flex-col gap-6 px-4 lg:px-6">
        <PageHeader
          breadcrumbs={[
            { label: "Trang chủ", href: "/dashboard" },
            { label: "Két tiền" },
          ]}
          title="Két tiền"
          description="Kho tổng không hỗ trợ giao dịch két tiền"
        />

        <div className="mx-auto max-w-md w-full flex flex-col items-center justify-center text-center py-16 px-4">
          <div className="w-16 h-16 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mb-4">
            <AlertCircle className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-bold text-foreground">Kho tổng không có két tiền</h3>
          <p className="text-sm text-muted-foreground mt-2 max-w-xs mb-8">
            Giao dịch két tiền chỉ khả dụng tại các chi nhánh cụ thể. Vui lòng chọn một chi nhánh hoặc quay lại.
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

  if (!session) return null;

  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      <PageHeader breadcrumbs={breadcrumbs} />

      <div className="w-full">
        {/* Render Manager View */}
        {isManager ? (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b gap-4">
              <div className="space-y-1">
                <div className="text-xs uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-1.5">
                  <Store className="h-3.5 w-3.5" /> Chi nhánh {branchName}
                </div>
                <h2 className="text-2xl font-black text-foreground">
                  {formatDate(session.createdAt)}
                </h2>
              </div>
              <Badge
                variant={isOpen ? "success" : "secondary"}
                className={`text-xs font-semibold px-2.5 py-1 w-fit ${
                  isOpen
                    ? "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/10 border-emerald-500/20"
                    : "bg-neutral-100 text-neutral-500 border-neutral-200"
                }`}
              >
                {isOpen ? "ĐANG MỞ" : "ĐÃ CHỐT KÉT"}
              </Badge>
            </div>

            <div className="space-y-6">
              {/* Cash statistics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-6 border-b">
                <div className="space-y-1.5 bg-muted/45 rounded-xl p-4 border">
                  <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1">
                    <DollarSign className="h-3.5 w-3.5 text-primary" /> Tiền đầu ngày
                  </span>
                  <div className="text-xl font-extrabold text-foreground">
                    {formatCurrency(session.openingAmount)}
                  </div>
                </div>
                <div className="space-y-1.5 bg-muted/45 rounded-xl p-4 border">
                  <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1">
                    <User className="h-3.5 w-3.5 text-primary" /> Người đang giữ két
                  </span>
                  <div className="text-lg font-bold text-foreground">
                    {currentStaffName}
                  </div>
                </div>
              </div>

              {/* Handover Timeline */}
              <div className="space-y-4">
                <h3 className="text-sm font-extrabold text-foreground flex items-center gap-1.5 uppercase tracking-wider">
                  <History className="h-4 w-4 text-muted-foreground" /> Lịch sử bàn giao ca
                </h3>
                <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[2px] before:bg-muted">
                  {/* Opening log entry */}
                  <div className="relative">
                    <div className="absolute -left-6 top-1.5 w-3 h-3 rounded-full border-2 border-primary bg-background ring-4 ring-primary/10" />
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-primary">
                          {formatTime(session.createdAt)}
                        </span>
                        <span className="text-xs text-muted-foreground font-medium">
                          Manager mở két
                        </span>
                      </div>
                      <div className="text-sm font-semibold text-foreground mt-0.5">
                        {formatCurrency(session.openingAmount)} →{" "}
                        {getUserFullName(
                          session.shiftLogs[0]?.staffId ||
                            session.currentStaffId
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Shift logs list */}
                  {session.shiftLogs.map((log, idx) => (
                    <div key={log.id || idx} className="relative">
                      <div className="absolute -left-6 top-1.5 w-3 h-3 rounded-full border-2 border-amber-500 bg-background ring-4 ring-amber-500/10" />
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-amber-500">
                            {formatTime(log.loggedAt)}
                          </span>
                          <span className="text-xs text-muted-foreground font-medium">
                            {getUserFullName(log.staffId)} báo cáo
                          </span>
                        </div>
                        <div className="text-sm font-semibold text-foreground mt-0.5 flex flex-wrap items-center gap-1.5">
                          <span>{formatCurrency(log.amount)}</span>
                          {log.nextStaffId && (
                            <>
                              <ArrowRight className="h-3 w-3 text-muted-foreground" />
                              <span>{getUserFullName(log.nextStaffId)}</span>
                            </>
                          )}
                        </div>
                        {log.note && (
                          <div className="text-xs text-muted-foreground bg-amber-500/5 border border-amber-500/10 rounded px-2.5 py-1 mt-1">
                            Ghi chú: {log.note}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Closing final log entry */}
                  {!isOpen && session.finalLog && (
                    <div className="relative">
                      <div className="absolute -left-6 top-1.5 w-3 h-3 rounded-full border-2 border-destructive bg-background ring-4 ring-destructive/10" />
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-destructive">
                            {session.updatedAt ? formatTime(session.updatedAt) : ""}
                          </span>
                          <span className="text-xs text-muted-foreground font-medium">
                            Manager chốt két
                          </span>
                        </div>
                        <div className="text-sm font-extrabold text-destructive mt-0.5">
                          Tổng kết: {formatCurrency(session.finalLog.amount)}
                        </div>
                        {session.finalLog.note && (
                          <div className="text-xs text-muted-foreground bg-destructive/5 border border-destructive/10 rounded px-2.5 py-1 mt-1">
                            Ghi chú: {session.finalLog.note}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Close Cash Drawer */}
              {isOpen && (
                <div className="pt-6 border-t mt-6 flex items-center gap-3">
                  <Button
                    variant="destructive"
                    className="font-semibold shadow-md shadow-destructive/20 hover:scale-[1.01] transition active:scale-[0.99] cursor-pointer"
                    onClick={handleOpenClose}
                  >
                    <Lock className="h-4 w-4 me-2" /> CHỐT KÉT ĐẦU CUỐI NGÀY
                  </Button>

                  {isCurrentKeeper && (
                    <Button
                      variant="outline"
                      className="font-semibold border-primary text-primary hover:bg-primary/5 hover:scale-[1.01] transition active:scale-[0.99] cursor-pointer"
                      onClick={handleOpenReport}
                    >
                      <CheckCircle className="h-4 w-4 me-2" /> BÁO CÁO BÀN GIAO CUỐI CA
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Render Staff View */
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b gap-4">
              <div className="space-y-1">
                <h2 className="text-2xl font-black text-foreground">
                  Két tiền ca của bạn tại {branchName}
                </h2>
              </div>
              <Badge
                variant={isOpen ? "success" : "secondary"}
                className={`text-xs font-semibold px-2.5 py-1 w-fit ${
                  isOpen
                    ? "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/10 border-emerald-500/20"
                    : "bg-neutral-100 text-neutral-500 border-neutral-200"
                }`}
              >
                {isOpen ? "ĐANG MỞ" : "ĐÃ ĐÓNG"}
              </Badge>
            </div>

            <div className="space-y-6">
              {/* Handover summary details */}
              <div className="space-y-6">
                <div className="border border-muted rounded-xl p-6 flex flex-col items-center justify-center text-center bg-muted/20">
                  <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-2">
                    Tiền được bàn giao nhận ca
                  </span>
                  <div className="text-4xl font-black text-primary tracking-tight">
                    {formatCurrency(staffHandoverAmount)}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-muted/30 p-4 border rounded-xl">
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <User className="h-3.5 w-3.5 text-muted-foreground/75" /> Người bàn giao
                    </span>
                    <div className="text-sm font-bold text-foreground">
                      {staffHandoverFrom}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground/75" /> Lúc bàn giao
                    </span>
                    <div className="text-sm font-bold text-foreground">
                      {formatTime(staffHandoverTime)} ngày {formatDate(staffHandoverTime)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Button: Báo cáo cuối ca */}
              {isOpen && isCurrentKeeper ? (
                <div className="pt-6 border-t mt-6">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto font-semibold shadow-md shadow-primary/20 hover:scale-[1.01] transition active:scale-[0.99] cursor-pointer"
                    onClick={handleOpenReport}
                  >
                    <CheckCircle className="h-4 w-4 me-2" /> BÁO CÁO BÀN GIAO CUỐI CA
                  </Button>
                </div>
              ) : isOpen ? (
                <div className="text-center text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-4 font-medium">
                  Phiên giao dịch két vẫn đang mở, nhưng quyền quản lý két hiện đang thuộc về nhân viên khác ({currentStaffName}). Bạn đã nộp báo cáo ca này.
                </div>
              ) : (
                <div className="text-center text-xs text-neutral-500 bg-neutral-50 border border-neutral-200 rounded-lg p-4 font-medium">
                  Két tiền đã được quản lý chốt đóng ca. Phiên giao dịch hôm nay kết thúc.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Dialog Báo cáo cuối ca (Staff or Keeper Manager) */}
      <Dialog open={isReportOpen} onOpenChange={setIsReportOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleSubmitReport}>
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Báo cáo cuối ca</DialogTitle>
              <DialogDescription>
                Khai báo số tiền mặt kết dư trong ca làm việc và bàn giao két cho nhân viên kế ca.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-6">
              <div className="grid gap-2">
                <Label htmlFor="reportAmount" className="font-semibold">
                  Tổng tiền mặt trong két ca làm việc (VND)
                </Label>
                <Input
                  id="reportAmount"
                  type="text"
                  required
                  value={parseInt(reportAmount || "0", 10).toLocaleString("vi-VN")}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "");
                    setReportAmount(val || "0");
                  }}
                  placeholder="Nhập số tiền mặt hiện tại"
                  className="text-lg font-semibold tracking-wide"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="nextStaff" className="font-semibold">
                  Nhân viên nhận bàn giao ca tiếp theo
                </Label>
                <Select value={nextStaffId} onValueChange={setNextStaffId}>
                  <SelectTrigger id="nextStaff">
                    <SelectValue placeholder="Chọn nhân viên kế ca (Nếu có)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none_clear">
                      --- Không bàn giao (Kết ca kết thúc ngày) ---
                    </SelectItem>
                    {nextStaffCandidates.map((staff) => (
                      <SelectItem key={staff.id} value={staff.id}>
                        {staff.fullName} ({staff.roleName})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Bỏ trống/không chọn nếu đây là ca cuối cùng trong ngày và quản lý sẽ chốt két trực tiếp.
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="reportNote" className="font-semibold">
                  Ghi chú bàn giao
                </Label>
                <Textarea
                  id="reportNote"
                  value={reportNote}
                  onChange={(e) => setReportNote(e.target.value)}
                  placeholder="Ví dụ: Thiếu 50.000đ do thối nhầm khách..."
                  className="resize-none h-20"
                />
              </div>
            </div>

            <DialogFooter className="sm:justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
                onClick={() => setIsReportOpen(false)}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={isSubmitting} className="font-semibold">
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin me-2" /> Đang xử lý...
                  </>
                ) : (
                  "Nộp báo cáo"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Chốt két (Manager) */}
      <Dialog open={isCloseOpen} onOpenChange={setIsCloseOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleSubmitClose}>
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-destructive">
                Chốt két cuối ngày
              </DialogTitle>
              <DialogDescription>
                Xác nhận đóng két tiền và kiểm kê tổng số tiền thu hồi cuối ngày từ các ca làm việc.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-6">
              <div className="grid gap-2">
                <Label htmlFor="closeAmount" className="font-semibold">
                  Tổng tiền mặt thu hồi thực tế (VND)
                </Label>
                <Input
                  id="closeAmount"
                  type="text"
                  required
                  value={parseInt(closeAmount || "0", 10).toLocaleString("vi-VN")}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "");
                    setCloseAmount(val || "0");
                  }}
                  placeholder="Nhập số tiền chốt thu hồi"
                  className="text-lg font-semibold tracking-wide text-destructive"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="closeNote" className="font-semibold">
                  Ghi chú tổng kết ngày
                </Label>
                <Textarea
                  id="closeNote"
                  value={closeNote}
                  onChange={(e) => setCloseNote(e.target.value)}
                  placeholder="Nhập ghi chú chốt sổ két tiền hôm nay (Nếu có)..."
                  className="resize-none h-20"
                />
              </div>
            </div>

            <DialogFooter className="sm:justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
                onClick={() => setIsCloseOpen(false)}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={isSubmitting}
                className="font-semibold"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin me-2" /> Đang chốt két...
                  </>
                ) : (
                  "Xác nhận Chốt két"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
