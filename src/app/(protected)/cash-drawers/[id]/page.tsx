"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { CurrencySuffix } from "@/app/(protected)/exchange/shared/form-fields";
import { useParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { parseLocationKey } from "@/lib/location-key";
import { cashDrawerApi } from "@/lib/api/cash-drawer";
import { canFinalizeCashDrawer, canManageCashDrawer } from "@/components/sidebar/constants/role-permissions";
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
  AlertTriangle,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { ReopenDrawerDialog, vietnamToday } from "../_components/reopen-drawer-dialog";
import type {
  CashDrawerReconciliation,
  CashDrawerSession,
  CashDrawerUserRef,
  CashierOption,
} from "@/types/cash-drawer";
import { shortBusinessDate } from "@/components/cash-drawer/overdue-drawer-banner";

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

// Nhãn người trong phiên két.
const getUserFullName = (userRef?: CashDrawerUserRef | null, fallback = "Nhân viên") => {
  if (!userRef) return fallback;
  const first = userRef.profile?.firstName || "";
  const last = userRef.profile?.lastName || "";
  return (
    [last, first].filter(Boolean).join(" ").trim() ||
    userRef.phoneNumber ||
    userRef.email ||
    fallback
  );
};

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
  const [branchStaffs, setBranchStaffs] = useState<CashierOption[]>([]);

  // Dialog states for "Chốt két" (Manager)
  const [isCloseOpen, setIsCloseOpen] = useState(false);
  const [closeAmount, setCloseAmount] = useState<string>("");
  const [closeNote, setCloseNote] = useState<string>("");
  const [withdrawAmount, setWithdrawAmount] = useState<string>("");
  /** Số sổ của phiên (tiền đầu ca + thu − chi tiền mặt qua két); null khi chưa tải được. */
  const [reconciliation, setReconciliation] = useState<CashDrawerReconciliation | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReopenOpen, setIsReopenOpen] = useState(false);

  const prevLocationKeyRef = useRef<string | null>(null);

  // Ghi nhận locationKey ban đầu khi mount
  useEffect(() => {
    if (locationKey) {
      prevLocationKeyRef.current = locationKey;
    }
  }, []);

  const fetchSession = async () => {
    try {
      const data = await cashDrawerApi.getSessionById(id);
      setSession(data);
      // Màn "Hôm nay" dẫn tới đây với `?reopen=1` để mở luôn hộp thoại mở lại két.
      if (new URLSearchParams(window.location.search).get("reopen") === "1") {
        window.history.replaceState(null, "", window.location.pathname);
        if (data.status === "CLOSED") setIsReopenOpen(true);
      }
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

  // Số sổ cho form chốt và dòng chốt két; tải lại mỗi khi phiên đổi. Lỗi chỉ làm mất phần so sánh.
  useEffect(() => {
    if (!session) return;
    let stale = false;
    cashDrawerApi
      .getReconciliation(session.id)
      .then((data) => {
        if (!stale) setReconciliation(data);
      })
      .catch(() => {
        if (!stale) setReconciliation(null);
      });
    return () => {
      stale = true;
    };
  }, [session]);

  // Lắng nghe thay đổi từ bộ chọn chi nhánh toàn cục
  useEffect(() => {
    if (!user || user.role !== "TENANT_OWNER" || !session) return;
    if (!prevLocationKeyRef.current) {
      prevLocationKeyRef.current = locationKey;
      return;
    }

    // Chỉ xử lý khi locationKey đổi qua bộ chọn toàn cục
    if (prevLocationKeyRef.current === locationKey) return;

    const parsed = parseLocationKey(locationKey);
    const currentSessionBranchId = session.branchId;

    // Switched to Tổng Branch ("all")
    if (locationKey === "all") {
      router.push("/cash-drawers");
      return;
    }

    // Chuyển sang kho
    if (locationKey?.startsWith("warehouse") || parsed?.locationType === "WAREHOUSE") {
      prevLocationKeyRef.current = locationKey;
      return; // Không làm gì, để màn cảnh báo kho bên dưới hiển thị
    }

    // Chuyển sang chi nhánh khác
    if (parsed && parsed.locationType === "BRANCH" && parsed.locationId !== currentSessionBranchId) {
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

  // Người nhận bàn giao, qua route riêng của két.
  useEffect(() => {
    // Két quá hạn không bàn giao được (BE trả CASH_DRAWER_OVERDUE), nên không tải danh sách.
    if (!isReportOpen || !session || session.overdue) return;
    let stale = false;
    cashDrawerApi
      .getHandoverCandidates(session.id)
      .then((list) => {
        if (!stale) setBranchStaffs(list);
      })
      .catch((error) => {
        console.error(error);
        toast.error("Không thể tải danh sách nhân viên nhận bàn giao");
      });
    return () => {
      stale = true;
    };
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
    setWithdrawAmount("");
    setIsCloseOpen(true);
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseInt(reportAmount.replace(/\D/g, ""), 10);
    if (isNaN(amount) || amount < 0) {
      toast.error("Số tiền báo cáo không hợp lệ");
      return;
    }

    setIsSubmitting(true);
    try {
      // Gửi START trước END nếu chưa nhận ca.
      if (!hasStartedShift) {
        await cashDrawerApi.submitShiftLog(id, {
          type: "START",
          amount: staffHandoverAmount,
        });
      }
      await cashDrawerApi.submitShiftLog(id, {
        type: "END",
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

  const handleSubmitClose = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseInt(closeAmount.replace(/\D/g, ""), 10);
    if (isNaN(amount) || amount < 0) {
      toast.error("Số tiền chốt két không hợp lệ");
      return;
    }
    const withdraw = parseInt(withdrawAmount.replace(/\D/g, "") || "0", 10);
    if (withdraw > amount) {
      toast.error("Số tiền rút về không được lớn hơn số tiền đếm được trong két");
      return;
    }

    setIsSubmitting(true);
    try {
      await cashDrawerApi.finalizeSession(id, {
        finalAmount: amount,
        withdrawAmount: withdraw,
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

  // Ai có quyền mở hoặc chốt két thấy khu quản lý; nút chốt cần `finalize`.
  const canFinalize = canFinalizeCashDrawer(user?.role);
  const isManager = canManageCashDrawer(user?.role) || canFinalize;
  const branchName = session?.branch?.name ?? "Chi nhánh";
  const currentStaffName = session ? getUserFullName(session.currentStaff) : "";
  const openedByName = session ? getUserFullName(session.openedBy, "Quản lý") : "";
  const isOpen = session ? session.status === "OPEN" : false;

  // Ứng viên ca kế tiếp (loại người đang giữ két)
  const nextStaffCandidates = useMemo(() => {
    if (!session) return [];
    return branchStaffs.filter((s) => s.id !== session.currentStaffId);
  }, [branchStaffs, session]);

  /** Két vừa mở lại sau lần trả cuối: người được giao phải nhận ca lại, lần trả đó không còn tính để chốt. */
  const reopenedAfterLastLog = useMemo(() => {
    if (!session?.lastReopenedAt) return false;
    const lastLog = session.shiftLogs.at(-1);
    return !!lastLog && new Date(session.lastReopenedAt).getTime() > new Date(lastLog.loggedAt).getTime();
  }, [session]);

  // Thông tin bàn giao cho nhân viên
  const staffHandoverAmount = useMemo(() => {
    if (!session || !user) return 0;
    // Mở lại: nhận đúng số đã đếm lúc trả két lần trước.
    if (reopenedAfterLastLog) return session.shiftLogs.at(-1)?.amount ?? session.openingAmount;
    if (session.shiftLogs && session.shiftLogs.length > 0) {
      const lastLogIdx = session.shiftLogs.findIndex(
        (log) => log.nextStaffId === user.id
      );
      if (lastLogIdx !== -1) {
        return session.shiftLogs[lastLogIdx].amount;
      }
    }
    return session.openingAmount;
  }, [session, user, reopenedAfterLastLog]);

  const staffHandoverFrom = useMemo(() => {
    if (!session || !user) return "N/A";
    if (reopenedAfterLastLog) return getUserFullName(session.lastReopenedBy, "Quản lý");
    if (session.shiftLogs && session.shiftLogs.length > 0) {
      const lastLogIdx = session.shiftLogs.findIndex(
        (log) => log.nextStaffId === user.id
      );
      if (lastLogIdx !== -1) {
        return getUserFullName(session.shiftLogs[lastLogIdx].staff);
      }
    }
    return getUserFullName(session.openedBy, "Quản lý");
  }, [session, user, reopenedAfterLastLog]);

  const staffHandoverTime = useMemo(() => {
    if (!session || !user) return "";
    if (reopenedAfterLastLog && session.lastReopenedAt) return session.lastReopenedAt;
    if (session.shiftLogs && session.shiftLogs.length > 0) {
      const lastLogIdx = session.shiftLogs.findIndex(
        (log) => log.nextStaffId === user.id
      );
      if (lastLogIdx !== -1) {
        return session.shiftLogs[lastLogIdx].loggedAt;
      }
    }
    return session.createdAt;
  }, [session, user, reopenedAfterLastLog]);

  const isCurrentKeeper = useMemo(() => {
    if (!session || !user) return false;
    return session.currentStaffId === user.id;
  }, [session, user]);

  // Người giữ két đã gửi log START chưa; server chỉ nhận END sau START.
  const hasStartedShift = useMemo(() => {
    if (!session || !user) return false;
    const lastLog = session.shiftLogs.at(-1);
    return lastLog?.type === "START" && lastLog.staffId === user.id;
  }, [session, user]);

  // Đã bàn giao cho quản lý thì ẩn nút ca.
  const awaitingFinalize = useMemo(() => {
    if (!session) return false;
    const lastLog = session.shiftLogs.at(-1);
    return (
      lastLog?.type === "END" &&
      lastLog.staffId === session.currentStaffId &&
      !lastLog.nextStaffId &&
      !reopenedAfterLastLog
    );
  }, [session, reopenedAfterLastLog]);

  // Chỉ phiên của ngày giao dịch hôm nay mở lại được (BE kiểm lại).
  const canReopen =
    !!session &&
    session.status === "CLOSED" &&
    session.businessDate.slice(0, 10) === vietnamToday() &&
    canFinalizeCashDrawer(user?.role);

  // "Nhận ca": gửi log START với số tiền đã bàn giao.
  const handleStartShift = async () => {
    setIsSubmitting(true);
    try {
      await cashDrawerApi.submitShiftLog(id, {
        type: "START",
        amount: staffHandoverAmount,
      });
      toast.success("Đã nhận két, bắt đầu ca làm việc");
      fetchSession();
    } catch (error) {
      console.error(error);
      const message = (error as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      toast.error(message || "Không thể bắt đầu ca");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Breadcrumb động: branch/staff là Trang chủ > Két tiền; tenant là Trang chủ > Két tiền > Chi tiết
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
  const isWarehouse = locationKey?.startsWith("warehouse") || parsedLocation?.locationType === "WAREHOUSE";

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

            {session.overdue && <OverdueNotice businessDate={session.businessDate} />}

            <div className="space-y-6">
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

              <HandoverTimeline session={session} isOpen={isOpen} openedByName={openedByName} reconciliation={reconciliation} />

              {canReopen && (
                <div className="pt-6 border-t mt-6 flex flex-wrap items-center gap-3">
                  <Button variant="outline" className="font-semibold" onClick={() => setIsReopenOpen(true)}>
                    <RotateCcw className="h-4 w-4 me-2" /> Mở lại két (chốt nhầm)
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    Gỡ kết quả chốt hôm nay để bán tiếp; chốt lại sẽ ghi sổ quỹ theo số đếm mới.
                  </span>
                </div>
              )}

              {isOpen && (
                <div className="pt-6 border-t mt-6 flex flex-wrap items-center gap-3">
                  {/* Chỉ hiện khi chốt được. */}
                  {awaitingFinalize && canFinalize && (
                    <Button
                      variant="destructive"
                      className="font-semibold shadow-md shadow-destructive/20 hover:scale-[1.01] transition active:scale-[0.99] cursor-pointer"
                      onClick={handleOpenClose}
                    >
                      <Lock className="h-4 w-4 me-2" /> CHỐT KÉT CUỐI NGÀY
                    </Button>
                  )}
                  {!awaitingFinalize && (
                    <span className="text-xs text-muted-foreground">
                      Chờ {currentStaffName} báo cáo cuối ca trước khi chốt két.
                    </span>
                  )}
                  {awaitingFinalize && !canFinalize && (
                    <span className="text-xs text-muted-foreground">
                      Két đang chờ người có quyền chốt két đếm tiền và chốt.
                    </span>
                  )}

                  {isCurrentKeeper && !hasStartedShift && !awaitingFinalize && (
                    <Button
                      variant="outline"
                      className="font-semibold border-primary text-primary hover:bg-primary/5 hover:scale-[1.01] transition active:scale-[0.99] cursor-pointer"
                      onClick={handleStartShift}
                      disabled={isSubmitting}
                    >
                      <CheckCircle className="h-4 w-4 me-2" /> NHẬN CA (BẮT ĐẦU)
                    </Button>
                  )}
                  {isCurrentKeeper && hasStartedShift && (
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

            {session.overdue && <OverdueNotice businessDate={session.businessDate} />}

            <div className="space-y-6">
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

              <HandoverTimeline session={session} isOpen={isOpen} openedByName={openedByName} reconciliation={reconciliation} />

              {isOpen && isCurrentKeeper && awaitingFinalize ? (
                <div className="text-center text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg p-4 font-medium">
                  Bạn đã báo cáo cuối ca. Két đang chờ quản lý chốt.
                </div>
              ) : isOpen && isCurrentKeeper ? (
                <div className="pt-6 border-t mt-6 flex flex-col sm:flex-row gap-3">
                  {!hasStartedShift ? (
                    <Button
                      size="lg"
                      className="w-full sm:w-auto font-semibold shadow-md shadow-primary/20 hover:scale-[1.01] transition active:scale-[0.99] cursor-pointer"
                      onClick={handleStartShift}
                      disabled={isSubmitting}
                    >
                      <CheckCircle className="h-4 w-4 me-2" /> NHẬN CA (BẮT ĐẦU)
                    </Button>
                  ) : (
                    <Button
                      size="lg"
                      className="w-full sm:w-auto font-semibold shadow-md shadow-primary/20 hover:scale-[1.01] transition active:scale-[0.99] cursor-pointer"
                      onClick={handleOpenReport}
                    >
                      <CheckCircle className="h-4 w-4 me-2" /> BÁO CÁO BÀN GIAO CUỐI CA
                    </Button>
                  )}
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
                <div className="relative">
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
                  className="pr-8 text-lg font-semibold tracking-wide"
                />
                  <CurrencySuffix className="text-base" />
                </div>
              </div>

              {session?.overdue ? (
                <p className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-muted-foreground">
                  Két còn mở từ ngày trước nên không bàn giao được. Báo cáo này kết thúc ca để quản lý chốt két.
                </p>
              ) : (
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
                        {staff.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Bỏ trống/không chọn nếu đây là ca cuối cùng trong ngày và quản lý sẽ chốt két trực tiếp.
                </p>
              </div>
              )}

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
                <div className="relative">
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
                  <CurrencySuffix className="text-base" />
                </div>
                <CloseVarianceNote
                  expected={reconciliation?.expectedClosing ?? null}
                  counted={closeAmount === "" ? null : parseInt(closeAmount, 10)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="withdrawAmount" className="font-semibold">
                  Số tiền chủ rút về (VND)
                </Label>
                <div className="relative">
                  <Input
                    id="withdrawAmount"
                    type="text"
                    value={withdrawAmount === "" ? "" : parseInt(withdrawAmount, 10).toLocaleString("vi-VN")}
                    onChange={(e) => setWithdrawAmount(e.target.value.replace(/\D/g, ""))}
                    placeholder="0"
                    className="text-lg font-semibold tracking-wide"
                  />
                  <CurrencySuffix className="text-base" />
                </div>
                {(() => {
                  const counted = parseInt(closeAmount || "0", 10) || 0;
                  const withdraw = parseInt(withdrawAmount || "0", 10) || 0;
                  const kept = counted - withdraw;
                  return (
                    <p className={`text-xs ${kept < 0 ? "font-medium text-red-600" : "text-muted-foreground"}`}>
                      {kept < 0
                        ? "Không rút được nhiều hơn số đếm được."
                        : `Để lại trong két làm tiền lẻ cho ca sau: ${formatCurrency(kept)}. Tiền chủ rút ghi là chuyển quỹ Két → Chủ, không tính là chi.`}
                    </p>
                  );
                })()}
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

      {session && (
        <ReopenDrawerDialog
          open={isReopenOpen}
          onOpenChange={setIsReopenOpen}
          sessionId={session.id}
          branchId={session.branchId}
          defaultStaffId={session.currentStaffId}
          onReopened={fetchSession}
        />
      )}
    </div>
  );
}

/** Chi tiết phiên két: mở, nhận ca, báo cáo cuối ca, chốt. */
function HandoverTimeline({
  session,
  isOpen,
  openedByName,
  reconciliation,
}: {
  session: CashDrawerSession;
  isOpen: boolean;
  openedByName: string;
  reconciliation: CashDrawerReconciliation | null;
}) {
  // Lần mở lại (nếu có) chen giữa các lần giao ca theo thời gian.
  const reopenAt = session.lastReopenedAt ? new Date(session.lastReopenedAt).getTime() : null;
  const logsBefore = session.shiftLogs.filter((log) => reopenAt === null || new Date(log.loggedAt).getTime() <= reopenAt);
  const logsAfter = session.shiftLogs.filter((log) => reopenAt !== null && new Date(log.loggedAt).getTime() > reopenAt);
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-extrabold text-foreground flex items-center gap-1.5 uppercase tracking-wider">
        <History className="h-4 w-4 text-muted-foreground" /> Lịch sử bàn giao ca
      </h3>
      <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[2px] before:bg-muted">
        <div className="relative">
          <div className="absolute -left-6 top-1.5 w-3 h-3 rounded-full border-2 border-primary bg-background ring-4 ring-primary/10" />
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-primary">
                {formatTime(session.createdAt)}
              </span>
              <span className="text-xs text-muted-foreground font-medium">
                {openedByName} mở két
              </span>
            </div>
            <div className="text-sm font-semibold text-foreground mt-0.5">
              {formatCurrency(session.openingAmount)} →{" "}
              {getUserFullName(
                session.shiftLogs[0]?.staff ?? session.currentStaff
              )}
            </div>
          </div>
        </div>

        {logsBefore.map((log, idx) => (
          <div key={log.id || idx} className="relative">
            <div className="absolute -left-6 top-1.5 w-3 h-3 rounded-full border-2 border-amber-500 bg-background ring-4 ring-amber-500/10" />
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-amber-500">
                  {formatTime(log.loggedAt)}
                </span>
                <span className="text-xs text-muted-foreground font-medium">
                  {getUserFullName(log.staff)}{" "}
                  {log.type === "START" ? "nhận két" : "báo cáo cuối ca"}
                </span>
              </div>
              <div className="text-sm font-semibold text-foreground mt-0.5 flex flex-wrap items-center gap-1.5">
                <span>{formatCurrency(log.amount)}</span>
                {log.nextStaffId && (
                  <>
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    <span>{getUserFullName(log.nextStaff)}</span>
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

        {session.lastReopenedAt && (
          <div className="relative">
            <div className="absolute -left-6 top-1.5 w-3 h-3 rounded-full border-2 border-sky-500 bg-background ring-4 ring-sky-500/10" />
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-sky-600">{formatTime(session.lastReopenedAt)}</span>
                <span className="text-xs text-muted-foreground font-medium">
                  {getUserFullName(session.lastReopenedBy, "Quản lý")} mở lại két
                  {(session.reopenCount ?? 0) > 1 ? ` (lần ${session.reopenCount})` : ""} →{" "}
                  {getUserFullName(session.currentStaff)}
                </span>
              </div>
              {session.lastReopenReason && (
                <div className="text-xs text-muted-foreground bg-sky-500/5 border border-sky-500/10 rounded px-2.5 py-1 mt-1">
                  Lý do: {session.lastReopenReason}
                </div>
              )}
            </div>
          </div>
        )}

        {logsAfter.map((log, idx) => (
          <div key={log.id || idx} className="relative">
            <div className="absolute -left-6 top-1.5 w-3 h-3 rounded-full border-2 border-amber-500 bg-background ring-4 ring-amber-500/10" />
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-amber-500">
                  {formatTime(log.loggedAt)}
                </span>
                <span className="text-xs text-muted-foreground font-medium">
                  {getUserFullName(log.staff)}{" "}
                  {log.type === "START" ? "nhận két" : "báo cáo cuối ca"}
                </span>
              </div>
              <div className="text-sm font-semibold text-foreground mt-0.5 flex flex-wrap items-center gap-1.5">
                <span>{formatCurrency(log.amount)}</span>
                {log.nextStaffId && (
                  <>
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    <span>{getUserFullName(log.nextStaff)}</span>
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

        {!isOpen && session.finalLog && (
          <div className="relative">
            <div className="absolute -left-6 top-1.5 w-3 h-3 rounded-full border-2 border-destructive bg-background ring-4 ring-destructive/10" />
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-destructive">
                  {session.updatedAt ? formatTime(session.updatedAt) : ""}
                </span>
                <span className="text-xs text-muted-foreground font-medium">
                  {getUserFullName(session.finalLog.manager, "Quản lý")} chốt két
                </span>
              </div>
              <div className="text-sm font-extrabold text-destructive mt-0.5">
                Tổng kết: {formatCurrency(session.finalLog.amount)}
              </div>
              {reconciliation?.variance != null && reconciliation.variance !== 0 && (
                <div
                  className={`text-xs font-medium ${
                    reconciliation.variance < 0 ? "text-red-600" : "text-green-600"
                  }`}
                >
                  {reconciliation.variance < 0 ? "Thiếu két" : "Thừa két"}{" "}
                  {formatCurrency(Math.abs(reconciliation.variance))} so với sổ (
                  {formatCurrency(reconciliation.expectedClosing)})
                </div>
              )}
              {session.finalLog.withdrawnAmount != null && (
                <div className="text-xs text-muted-foreground">
                  Chủ rút về {formatCurrency(session.finalLog.withdrawnAmount)} · Để lại trong két{" "}
                  {formatCurrency(session.finalLog.keptAmount ?? 0)}
                </div>
              )}
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
  );
}

/** So số đếm với sổ ngay khi nhập: thừa / thiếu sẽ được ghi vào sổ quỹ lúc chốt. */
function CloseVarianceNote({ expected, counted }: { expected: number | null; counted: number | null }) {
  if (expected === null) return null;
  const variance = counted === null || isNaN(counted) ? null : counted - expected;
  return (
    <p className="text-xs text-muted-foreground">
      Theo sổ, két phải có <span className="font-medium text-foreground">{formatCurrency(expected)}</span>.
      {variance !== null && variance !== 0 && (
        <span className={`ml-1 font-medium ${variance < 0 ? "text-red-600" : "text-green-600"}`}>
          {variance < 0 ? "Thiếu" : "Thừa"} {formatCurrency(Math.abs(variance))}, sẽ ghi vào sổ quỹ là{" "}
          {variance < 0 ? "thiếu két" : "thừa két"}.
        </span>
      )}
      {variance === 0 && <span className="ml-1 font-medium text-green-600">Khớp sổ.</span>}
    </p>
  );
}

function OverdueNotice({ businessDate }: { businessDate: string }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm"
    >
      <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" />
      <div>
        <p className="font-semibold text-foreground">
          Két ngày {shortBusinessDate(businessDate)} chưa chốt
        </p>
        <p className="text-muted-foreground">
          Két này còn mở từ ngày trước nên không bàn giao được nữa. Người đang giữ két báo cáo cuối ca
          (không bàn giao), sau đó quản lý đếm tiền và chốt két. Chưa chốt thì chi nhánh không mở được két mới.
        </p>
      </div>
    </div>
  );
}
