// [Table – Expanded Panel Supplier]
"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { Mail, MapPin, Banknote, Pencil, Phone, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { Supplier } from "@/types/supplier";
import { useSuppliers } from "../../_context/suppliers-provider";
import { getCachedUser } from "@/lib/auth";
import {
  canDeleteSupplier,
  canUpdateSupplier,
} from "@/components/sidebar/constants/role-permissions";

type SuppliersExpandedPanelProps = {
  supplier: Supplier;
  isExpanded: boolean;
  isLastRow?: boolean;
};

function formatVND(amount: number) {
  return amount.toLocaleString("vi-VN") + " ₫";
}

export function SuppliersExpandedPanel({
  supplier,
  isExpanded,
  isLastRow,
}: SuppliersExpandedPanelProps) {
  const { setOpen, setCurrentRow } = useSuppliers();
  const [loading, setLoading] = useState(false);
  const wasExpandedRef = useRef(false);
  const role = getCachedUser()?.role;
  const canEdit = canUpdateSupplier(role);
  const canDelete = canDeleteSupplier(role);

  useLayoutEffect(() => {
    if (isExpanded && !wasExpandedRef.current) {
      wasExpandedRef.current = true;
      setLoading(true);
      const t = setTimeout(() => setLoading(false), 350);
      return () => clearTimeout(t);
    }
    if (!isExpanded) {
      wasExpandedRef.current = false;
    }
  }, [isExpanded]);

  if (loading) {
    return (
      <div className={cn("bg-background px-6 py-4 space-y-4", !isLastRow && "border-b")}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-1.5">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-4 w-28" />
            </div>
          ))}
        </div>
        <Separator />
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-16 rounded-md" />
          <Skeleton className="h-8 w-32 rounded-md" />
        </div>
      </div>
    );
  }

  const debtRatio =
    supplier.creditLimit > 0
      ? (supplier.outstandingDebt / supplier.creditLimit) * 100
      : 0;

  return (
    <div
      className={cn(
        "bg-background px-6 py-4 animate-in fade-in-0 duration-200",
        !isLastRow && "border-b",
      )}
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-3 text-sm">
        <div className="flex flex-col gap-0.5 col-span-2 md:col-span-1">
          <span className="text-xs text-muted-foreground">Tên nhà cung cấp</span>
          <span className="font-medium">{supplier.supplierName}</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-muted-foreground">Người liên hệ</span>
          <span>{supplier.contactName || "-"}</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-muted-foreground">Số điện thoại</span>
          {supplier.phoneNumber ? (
            <a
              href={`tel:${supplier.phoneNumber}`}
              className="flex items-center gap-1 text-primary hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              <Phone className="size-3" />
              {supplier.phoneNumber}
            </a>
          ) : (
            <span className="text-muted-foreground">-</span>
          )}
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-muted-foreground">Email</span>
          {supplier.email ? (
            <a
              href={`mailto:${supplier.email}`}
              className="flex items-center gap-1 text-primary hover:underline truncate max-w-44"
              onClick={(e) => e.stopPropagation()}
            >
              <Mail className="size-3 shrink-0" />
              {supplier.email}
            </a>
          ) : (
            <span className="text-muted-foreground">-</span>
          )}
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-muted-foreground">Hạn mức tín dụng</span>
          <span className="tabular-nums font-medium">
            {formatVND(supplier.creditLimit)}
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-muted-foreground">Công nợ hiện tại</span>
          <span
            className={cn(
              "tabular-nums font-semibold",
              supplier.outstandingDebt > 0
                ? "text-orange-600 dark:text-orange-400"
                : "text-muted-foreground",
            )}
          >
            {formatVND(supplier.outstandingDebt)}
          </span>
          {supplier.creditLimit > 0 && (
            <span className="text-xs text-muted-foreground">
              {debtRatio.toFixed(1)}% hạn mức
            </span>
          )}
        </div>
        {supplier.createdAt && (
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-muted-foreground">Ngày tạo</span>
            <span>{new Date(supplier.createdAt).toLocaleDateString("vi-VN")}</span>
          </div>
        )}
        {supplier.address && (
          <div className="flex flex-col gap-0.5 col-span-2 md:col-span-4">
            <span className="text-xs text-muted-foreground">Địa chỉ</span>
            <span className="flex items-start gap-1 text-muted-foreground">
              <MapPin className="size-3.5 mt-0.5 shrink-0" />
              {supplier.address}
            </span>
          </div>
        )}
      </div>

      {(canDelete || canEdit || supplier.outstandingDebt > 0) && (
        <>
          <Separator className="mt-4" />
          <div className="flex items-center justify-between mt-3">
            {canDelete ? (
              <Button
                variant="destructive"
                size="sm"
                className="cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentRow(supplier);
                  setOpen("delete");
                }}
              >
                <Trash2 className="mr-2 size-4" />
                Xóa
              </Button>
            ) : (
              <span />
            )}
            <div className="flex items-center gap-2">
              {supplier.outstandingDebt > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  className="cursor-pointer border-orange-400 text-orange-600 hover:bg-orange-50 hover:text-orange-700 dark:border-orange-500 dark:text-orange-400 dark:hover:bg-orange-950"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentRow(supplier);
                    setOpen("payDebt");
                  }}
                >
                  <Banknote className="mr-2 size-4" />
                  Thanh toán
                </Button>
              )}
              {canEdit && (
                <Button
                  size="sm"
                  className="cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentRow(supplier);
                    setOpen("edit");
                  }}
                >
                  <Pencil className="mr-2 size-4" />
                  Chỉnh sửa
                </Button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
