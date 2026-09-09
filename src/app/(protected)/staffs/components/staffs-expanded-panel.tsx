"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
  Building2,
  CalendarDays,
  CreditCard,
  FileText,
  KeyRound,
  Lock,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Trash2,
  User,
  UserCheck,
  UserCog,
  Warehouse,
  Wallet,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  formatStaffDate,
  formatStaffDateTime,
  getStaffInitials,
} from "@/app/(protected)/staffs/shared/staff-format";
import {
  STAFF_ROLE_BADGE_VARIANT,
  getStaffStatusDisplay,
} from "@/app/(protected)/staffs/shared/staff-status";
import { getSessionRole } from "@/lib/auth";
import {
  canAssignBranchManager,
  canAssignWarehouseManager,
  canDeleteStaff,
  canManageStaffAccount,
  canUpdateStaff,
} from "@/components/sidebar/constants/role-permissions";
import {
  canDeactivateStaffRow,
  canDeleteStaffRow,
} from "@/app/(protected)/staffs/shared/staff-manager-utils";
import {
  getStaffGenderLabel,
} from "@/lib/api/staff-mapper";
import { describeBasicPay, paySheetApi } from "@/lib/api/paysheet";
import { formatIdentificationId } from "@/app/(protected)/staffs/shared/identification-format";
import type { Staff } from "@/types/staff";
import type { PaySheetDetail } from "@/types/paysheet";
import { useStaffs } from "./staffs-provider";

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

export function StaffsExpandedPanel({
  staff,
  isExpanded,
  isLastRow,
}: {
  staff: Staff;
  isExpanded: boolean;
  isLastRow?: boolean;
}) {
  const { setOpen, setCurrentRow, openAssignBranchManager, openAssignWarehouseManager } =
    useStaffs();
  const userRole = getSessionRole();
  const [paySheetDetail, setPaySheetDetail] = useState<PaySheetDetail | null>(
    null,
  );
  const [paySheetLoading, setPaySheetLoading] = useState(false);

  const showDelete =
    canDeleteStaff(userRole) &&
    canDeleteStaffRow(userRole);
  const showEdit = canUpdateStaff(userRole);
  const showAccountActions = canManageStaffAccount(userRole);
  const showAssignBranchManager =
    canAssignBranchManager(userRole) && Boolean(staff.branchId);
  const showAssignWarehouseManager =
    canAssignWarehouseManager(userRole) && Boolean(staff.warehouseId);

  useEffect(() => {
    if (!isExpanded || !staff.paySheetId) {
      setPaySheetDetail(null);
      setPaySheetLoading(false);
      return;
    }

    let cancelled = false;
    setPaySheetLoading(true);
    void paySheetApi
      .getById(staff.paySheetId)
      .then((detail) => {
        if (!cancelled) setPaySheetDetail(detail);
      })
      .catch(() => {
        if (!cancelled) setPaySheetDetail(null);
      })
      .finally(() => {
        if (!cancelled) setPaySheetLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isExpanded, staff.paySheetId]);

  if (!isExpanded) return null;

  const status = getStaffStatusDisplay(staff.status);
  const role = { label: staff.roleName, variant: STAFF_ROLE_BADGE_VARIANT };
  const canActivate = showAccountActions && staff.status !== "ACTIVE";
  const canDeactivate =
    showAccountActions &&
    staff.status === "ACTIVE" &&
    canDeactivateStaffRow(userRole);
  const canChangePassword =
    showAccountActions && staff.status === "ACTIVE";

  const paySheetName =
    paySheetDetail?.name ||
    staff.paySheetName ||
    (staff.paySheetId
      ? `#${String(staff.paySheetId).slice(-6).toUpperCase()}`
      : null);
  const paySheetSummary = describeBasicPay(paySheetDetail?.basicPay);

  return (
    <div
      className={cn(
        "bg-background px-6 py-4 animate-in fade-in-0 duration-200",
        !isLastRow && "border-b",
      )}
    >
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Badge variant={status.variant}>{status.label}</Badge>
        <Badge variant={role.variant}>{role.label}</Badge>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <Avatar className="size-14">
          {staff.profile?.avatarUrl ? (
            <AvatarImage src={staff.profile.avatarUrl} alt={staff.fullName} />
          ) : null}
          <AvatarFallback>{getStaffInitials(staff.fullName)}</AvatarFallback>
        </Avatar>
        <div>
          <p className="text-xs text-muted-foreground">Ảnh đại diện</p>
          <p className="text-sm font-medium">{staff.fullName}</p>
        </div>
      </div>

      <div className="mb-4 rounded-lg border bg-muted/30 px-4 py-3">
        <div className="flex items-start gap-2">
          <Wallet className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <div className="min-w-0 flex-1 space-y-1">
            <p className="text-xs text-muted-foreground">Bảng lương</p>
            {paySheetLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-56" />
                <Skeleton className="h-3 w-40" />
              </div>
            ) : paySheetName ? (
              <>
                <p className="text-sm font-semibold break-words">
                  {paySheetName}
                </p>
                {paySheetSummary ? (
                  <p className="text-sm text-foreground/80">{paySheetSummary}</p>
                ) : null}
              </>
            ) : (
              <p className="text-sm font-medium text-muted-foreground">
                Chưa gán bảng lương
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-3 mb-4">
        <InfoItem
          icon={<User className="size-4" />}
          label="Họ và tên"
          value={staff.fullName}
        />
        <InfoItem
          icon={<Phone className="size-4" />}
          label="Số điện thoại"
          value={staff.phoneNumber}
        />
        <InfoItem
          icon={<Mail className="size-4" />}
          label="Email"
          value={staff.email || "Chưa có email"}
        />
        <InfoItem
          icon={<Building2 className="size-4" />}
          label="Chi nhánh"
          value={staff.branchName}
        />
        {staff.warehouseId && (
          <InfoItem
            icon={<Warehouse className="size-4" />}
            label="Kho"
            value={
              staff.warehouseName && staff.warehouseName !== "-"
                ? staff.warehouseName
                : "Kho hàng"
            }
          />
        )}
        <InfoItem
          icon={<CalendarDays className="size-4" />}
          label="Ngày vào làm"
          value={formatStaffDate(staff.joinedAt)}
        />
        {staff.leaveBalance && (
          <InfoItem
            icon={<CalendarDays className="size-4" />}
            label="Phép năm"
            value={`${staff.leaveBalance.remainingDays}/${staff.leaveBalance.annualLeaveDays} ngày`}
          />
        )}
        {staff.profile?.identificationId && (
          <InfoItem
            icon={<CreditCard className="size-4" />}
            label="CCCD"
            value={formatIdentificationId(staff.profile.identificationId)}
          />
        )}
        {staff.profile?.gender && (
          <InfoItem
            icon={<User className="size-4" />}
            label="Giới tính"
            value={getStaffGenderLabel(staff.profile.gender)}
          />
        )}
        {staff.profile?.dob && (
          <InfoItem
            icon={<CalendarDays className="size-4" />}
            label="Ngày sinh"
            value={formatStaffDate(staff.profile.dob)}
          />
        )}
        {staff.profile?.address && (
          <InfoItem
            icon={<MapPin className="size-4" />}
            label="Địa chỉ"
            value={staff.profile.address}
          />
        )}
        {staff.profile?.taxNumber && (
          <InfoItem
            icon={<CreditCard className="size-4" />}
            label="Mã số thuế"
            value={staff.profile.taxNumber}
          />
        )}
        {staff.accountNote && (
          <InfoItem
            icon={<FileText className="size-4" />}
            label="Ghi chú tài khoản"
            value={staff.accountNote}
          />
        )}
        <InfoItem
          icon={<CalendarDays className="size-4" />}
          label="Ngày tạo"
          value={formatStaffDateTime(staff.createdAt)}
        />
        <InfoItem
          icon={<CalendarDays className="size-4" />}
          label="Cập nhật lần cuối"
          value={formatStaffDateTime(staff.updatedAt)}
        />
        <InfoItem
          icon={<User className="size-4" />}
          label="Mã nhân viên"
          value={`#${staff.id.slice(-6).toUpperCase()}`}
        />
      </div>

      <Separator className="mt-4" />
      <div className="flex flex-wrap items-center justify-between gap-2 mt-3">
        {showDelete ? (
          <Button
            variant="destructive"
            size="sm"
            className="cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              setCurrentRow(staff);
              setOpen("delete");
            }}
          >
            <Trash2 className="mr-2 size-4" />
            Xóa nhân viên
          </Button>
        ) : (
          <div />
        )}

        <div className="flex flex-wrap items-center gap-2">
          {showAssignBranchManager && (
            <Button
              variant="outline"
              size="sm"
              className="cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                openAssignBranchManager(staff.branchId, staff.branchName);
              }}
            >
              <UserCog className="mr-2 size-4" />
              Thay quản lý chi nhánh
            </Button>
          )}
          {showAssignWarehouseManager && (
            <Button
              variant="outline"
              size="sm"
              className="cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                openAssignWarehouseManager(
                  staff.warehouseId,
                  staff.warehouseName,
                );
              }}
            >
              <Warehouse className="mr-2 size-4" />
              Thay quản lý kho
            </Button>
          )}
          {showAccountActions && canActivate && (
            <Button
              variant="outline"
              size="sm"
              className="cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                setCurrentRow(staff);
                setOpen("activate");
              }}
            >
              <UserCheck className="mr-2 size-4" />
              Kích hoạt tài khoản
            </Button>
          )}
          {showAccountActions && canDeactivate && (
            <Button
              variant="outline"
              size="sm"
              className="cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                setCurrentRow(staff);
                setOpen("deactivate");
              }}
            >
              <Lock className="mr-2 size-4" />
              Khóa tài khoản
            </Button>
          )}
          {showAccountActions && canChangePassword && (
            <Button
              variant="outline"
              size="sm"
              className="cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                setCurrentRow(staff);
                setOpen("password");
              }}
            >
              <KeyRound className="mr-2 size-4" />
              Đổi mật khẩu
            </Button>
          )}
          {showEdit && (
            <Button
              variant="outline"
              size="sm"
              className="cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                setCurrentRow(staff);
                setOpen("leaveBalance");
              }}
            >
              <CalendarDays className="mr-2 size-4" />
              {staff.leaveBalance ? "Sửa ngày phép" : "Tạo ngày phép"}
            </Button>
          )}
          {showEdit && (
            <Button
              size="sm"
              className="cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                setCurrentRow(staff);
                setOpen("edit");
              }}
            >
              <Pencil className="mr-2 size-4" />
              Chỉnh sửa
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
