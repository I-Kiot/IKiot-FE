"use client";

import { useEffect, useState } from "react";
import {
  Building2,
  CalendarDays,
  CheckCircle,
  FileText,
  User,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  LEAVE_KIND_MAP,
  LEAVE_STATUS_MAP,
} from "@/app/(protected)/staffs/shared/leave-request-status";
import {
  canCancelOwnLeave,
  canReviewLeaveRequest,
  canReviewLeaveRequestTarget,
} from "@/components/sidebar/constants/role-permissions";
import { leaveRequestApi } from "@/lib/api/leave-request";
import { formatLeaveDate } from "@/lib/api/leave-request-mapper";
import { useAuth } from "@/hooks/use-auth";
import type { LeaveRequest } from "@/types/leave-request";
import { useLeaveRequests } from "./leave-requests-provider";

function InfoItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 text-muted-foreground">{icon}</span>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}

function isApproveDaysInvalid(
  paid: number,
  unpaid: number,
  totalDays: number,
): boolean {
  return (
    Number.isNaN(paid) ||
    Number.isNaN(unpaid) ||
    paid < 0 ||
    unpaid < 0 ||
    paid + unpaid <= 0 ||
    paid + unpaid > totalDays
  );
}

export function LeaveRequestsExpandedPanel({
  request,
  isLastRow,
}: {
  request: LeaveRequest;
  isLastRow?: boolean;
}) {
  const { user } = useAuth();
  const { handleApprove, handleReject, handleCancel, currentUserId } =
    useLeaveRequests();

  const [detail, setDetail] = useState<LeaveRequest | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [note, setNote] = useState("");
  const [rejectNote, setRejectNote] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [paidLeaveDays, setPaidLeaveDays] = useState(String(request.totalDays));
  const [unpaidLeaveDays, setUnpaidLeaveDays] = useState("0");

  const effective = detail ?? request;
  const sessionUserId = currentUserId ?? "";
  const isOwnRequest =
    !!sessionUserId &&
    !!request.userId &&
    String(request.userId) === String(sessionUserId);

  // The requester's role no longer decides who may approve - there is no hierarchy
  // between shop-defined roles. Holding `leaveRequests:approve`, and not being the
  // requester, is the whole rule.
  const canReview = canReviewLeaveRequestTarget(user?.role, {
    requestUserId: effective.userId,
    currentUserId: sessionUserId,
  });
  const canCancel =
    canCancelOwnLeave(user?.role) &&
    isOwnRequest &&
    (effective.status === "PENDING" || effective.status === "APPROVED");
  const isPending = effective.status === "PENDING";
  const showReviewActions = isPending && canReview && !isOwnRequest;

  // List BR thường thiếu role - chỉ fetch khi cần resolve quyền duyệt Staff.
  useEffect(() => {
    // Fetch the requester's role only when it is missing and this account may review.
    // It used to also demand BRANCH_MANAGER, which decided nothing once the reviewer
    // hierarchy went away.
    const needsRole =
      request.status === "PENDING" &&
      canReviewLeaveRequest(user?.role) &&
      !request.requesterRole &&
      !isOwnRequest;

    if (!needsRole) return;

    let cancelled = false;
    setDetailLoading(true);
    void leaveRequestApi
      .getById(request.id)
      .then((full) => {
        if (!cancelled) setDetail(full);
      })
      .catch(() => {
        if (!cancelled) setDetail(null);
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [
    request.id,
    request.status,
    request.requesterRole,
    request.userId,
    user?.role,
    isOwnRequest,
  ]);

  const status = LEAVE_STATUS_MAP[effective.status] ?? {
    label: effective.status,
    variant: "secondary" as const,
  };
  const kind = LEAVE_KIND_MAP[effective.kind] ?? {
    label: effective.kind,
    variant: "secondary" as const,
  };

  const paidNum = Number(paidLeaveDays);
  const unpaidNum = Number(unpaidLeaveDays);
  const approveInvalid = isApproveDaysInvalid(
    paidNum,
    unpaidNum,
    effective.totalDays,
  );

  const onApprove = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!showReviewActions || approveInvalid) return;
    setSubmitting(true);
    try {
      await handleApprove(effective.id, {
        paidLeaveDays: paidNum,
        unpaidLeaveDays: unpaidNum,
        reviewNote: note || undefined,
      });
      setNote("");
    } finally {
      setSubmitting(false);
    }
  };

  const onReject = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!showReviewActions || !rejectNote.trim()) return;
    setSubmitting(true);
    try {
      await handleReject(effective.id, rejectNote.trim());
      setRejectNote("");
      setShowRejectForm(false);
    } finally {
      setSubmitting(false);
    }
  };

  const onCancel = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setSubmitting(true);
    try {
      await handleCancel(effective.id);
    } finally {
      setSubmitting(false);
    }
  };

  if (detailLoading) {
    return (
      <div className={cn("bg-background px-6 py-4 space-y-4", !isLastRow && "border-b")}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-1.5">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-4 w-28" />
            </div>
          ))}
        </div>
        <Skeleton className="h-20 w-full rounded-md" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "bg-background px-6 py-4 animate-in fade-in-0 duration-200",
        !isLastRow && "border-b",
      )}
    >
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Badge variant={status.variant}>{status.label}</Badge>
        <Badge variant={kind.variant}>{kind.label}</Badge>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-3 mb-4">
        <InfoItem
          icon={<User className="size-4" />}
          label="Nhân viên"
          value={effective.staffName}
        />
        <InfoItem
          icon={<Building2 className="size-4" />}
          label="Đơn vị"
          value={effective.branchName}
        />
        <InfoItem
          icon={<CalendarDays className="size-4" />}
          label="Từ ngày"
          value={formatLeaveDate(effective.fromDate, true)}
        />
        <InfoItem
          icon={<CalendarDays className="size-4" />}
          label="Đến ngày"
          value={formatLeaveDate(effective.toDate, true)}
        />
        <InfoItem
          icon={<CalendarDays className="size-4" />}
          label="Số ngày nghỉ"
          value={`${effective.totalDays} ngày`}
        />
        <InfoItem
          icon={<CalendarDays className="size-4" />}
          label="Có lương / Không lương"
          value={`${effective.paidLeaveDays ?? 0} / ${effective.unpaidLeaveDays ?? 0}`}
        />
        <InfoItem
          icon={<CalendarDays className="size-4" />}
          label="Ngày tạo"
          value={formatLeaveDate(effective.createdAt, true)}
        />
        {effective.reviewedAt && (
          <InfoItem
            icon={<CalendarDays className="size-4" />}
            label="Ngày xử lý"
            value={formatLeaveDate(effective.reviewedAt, true)}
          />
        )}
        <InfoItem
          icon={<User className="size-4" />}
          label="Mã đơn"
          value={`#${effective.id.slice(-6).toUpperCase()}`}
        />
      </div>

      <div className="mb-4 rounded-lg bg-muted p-3 text-sm">
        <div className="flex items-start gap-2">
          <FileText className="mt-0.5 size-4 text-muted-foreground shrink-0" />
          <div>
            <span className="font-medium">Lý do: </span>
            {effective.reason}
          </div>
        </div>
      </div>

      {effective.reviewNote && (
        <div className="mb-4 rounded-lg border p-3 text-sm">
          <span className="font-medium">Ghi chú duyệt: </span>
          {effective.reviewNote}
        </div>
      )}

      {isPending && isOwnRequest && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100">
          {canReviewLeaveRequest(user?.role)
            ? "Đơn của bạn đang chờ người khác duyệt - không ai tự duyệt đơn của mình."
            : "Đơn của bạn đang chờ quản lý duyệt."}
        </div>
      )}

      {showReviewActions && !showRejectForm && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm">Ngày có lương *</Label>
              <Input
                type="number"
                min={0}
                value={paidLeaveDays}
                onChange={(e) => setPaidLeaveDays(e.target.value)}
                className="mt-1"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            <div>
              <Label className="text-sm">Ngày không lương *</Label>
              <Input
                type="number"
                min={0}
                value={unpaidLeaveDays}
                onChange={(e) => setUnpaidLeaveDays(e.target.value)}
                className="mt-1"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Tổng có lương + không lương phải &gt; 0 và ≤ {effective.totalDays}{" "}
            ngày xin nghỉ.
          </p>
          <div>
            <Label className="text-sm">Ghi chú duyệt (tuỳ chọn)</Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Nhập ghi chú..."
              className="mt-1 resize-none"
              rows={2}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="flex gap-3">
            <Button
              className="flex-1 cursor-pointer"
              onClick={onApprove}
              disabled={submitting || approveInvalid}
            >
              <CheckCircle className="mr-2 size-4" />
              Duyệt đơn
            </Button>
            <Button
              variant="outline"
              className="flex-1 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                setShowRejectForm(true);
              }}
              disabled={submitting}
            >
              <XCircle className="mr-2 size-4" />
              Từ chối
            </Button>
          </div>
        </div>
      )}

      {showReviewActions && showRejectForm && (
        <div className="space-y-3 rounded-lg border p-4">
          <h4 className="text-sm font-semibold">Từ chối đơn nghỉ phép</h4>
          <div>
            <Label className="text-sm">Ghi chú từ chối (bắt buộc)</Label>
            <Textarea
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              placeholder="Nhập lý do từ chối..."
              className="mt-1 resize-none"
              rows={2}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="destructive"
              className="flex-1 cursor-pointer"
              onClick={onReject}
              disabled={submitting || !rejectNote.trim()}
            >
              Xác nhận từ chối
            </Button>
            <Button
              variant="outline"
              className="cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                setShowRejectForm(false);
              }}
              disabled={submitting}
            >
              Huỷ
            </Button>
          </div>
        </div>
      )}

      {canCancel && (
        <div className="mt-3">
          <Button
            variant="outline"
            className="cursor-pointer"
            onClick={onCancel}
            disabled={submitting}
          >
            Hủy đơn của tôi
          </Button>
        </div>
      )}

      <Separator className="mt-4" />
    </div>
  );
}
