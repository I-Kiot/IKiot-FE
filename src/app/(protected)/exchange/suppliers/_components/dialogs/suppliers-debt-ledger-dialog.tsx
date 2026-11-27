// [Dialog – Sổ công nợ một nhà cung cấp]
"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { BookOpen, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { HistoryPager } from "@/components/history/history-pager";
import { historyPersonLabel } from "@/components/history/history-person";
import { useHistoryPage } from "@/components/history/use-history-page";
import { allows } from "@/components/sidebar/constants/role-permissions";
import { getSessionRole } from "@/lib/auth";
import { formatVND } from "@/lib/stats-format";
import { cn } from "@/lib/utils";
import { formatVietnamDateTime } from "@/app/(protected)/staffs/shared/vietnam-datetime";
import { supplierApi } from "@/lib/api/supplier";
import type {
  Supplier,
  SupplierDebtEntry,
  SupplierDebtEntryType,
} from "@/types/supplier";

const PAGE_SIZE = 10;

const ENTRY_TYPE_LABELS: Record<SupplierDebtEntryType, string> = {
  OPENING: "Số dư đầu",
  CHARGE: "Phát sinh nợ",
  PAYMENT: "Thanh toán",
};

type Ref = { label: string; href: string | null };

/** Chứng từ của một dòng sổ. Link chỉ hiện khi người xem có quyền đọc màn đó. */
function entryRef(entry: SupplierDebtEntry, role: string | undefined): Ref | null {
  const code = entry.referenceCode ?? "";
  const search = code ? `&search=${encodeURIComponent(code)}` : "";
  switch (entry.referenceType) {
    case "STOCK_MOVEMENT":
      return {
        label: code ? `Phiếu nhập ${code}` : "Phiếu nhập hàng",
        href: allows(role, "stock_movement", "read") ? `/exchange/imports?source=SUPPLIER${search}` : null,
      };
    case "PRODUCTION_REQUEST":
      return {
        label: code ? `YCSX ${code}` : "Yêu cầu sản xuất",
        href: allows(role, "production_requests", "read") ? `/exchange/imports?source=WORKSHOP${search}` : null,
      };
    case "CASH_FLOW":
      return {
        label: code ? `Phiếu chi ${code}` : "Phiếu chi",
        href: allows(role, "cash_flows", "read") ? "/cashflow" : null,
      };
    default:
      return null;
  }
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier: Supplier | null;
};

export function SuppliersDebtLedgerDialog({ open, onOpenChange, supplier }: Props) {
  const [entryType, setEntryType] = useState<SupplierDebtEntryType | "ALL">("ALL");
  const [debt, setDebt] = useState<number | null>(null);
  const supplierId = supplier?.id;
  const role = getSessionRole();

  const fetchPage = useCallback(
    async (page: number) => {
      const res = await supplierApi.getDebtEntries(supplierId as string, {
        entryType: entryType === "ALL" ? undefined : entryType,
        page,
        limit: PAGE_SIZE,
      });
      setDebt(res.supplier.outstandingDebt);
      return res;
    },
    [supplierId, entryType],
  );

  const { rows, pagination, loading, error, setPage } = useHistoryPage<SupplierDebtEntry>(
    fetchPage,
    open && !!supplierId,
    `${supplierId}:${entryType}`,
  );

  if (!supplier) return null;
  const currentDebt = debt ?? supplier.outstandingDebt;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="size-5 text-primary" />
            Sổ công nợ - {supplier.supplierName}
          </DialogTitle>
          <DialogDescription>
            Mỗi lần công nợ đổi là một dòng ghi thêm, không sửa được. Mới nhất ở trên.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm">
            <span className="text-muted-foreground">Công nợ hiện tại: </span>
            <Badge
              variant={currentDebt > 0 ? "destructive" : "secondary"}
              className="tabular-nums text-sm font-bold"
            >
              {formatVND(currentDebt)}
            </Badge>
          </div>
          <Select value={entryType} onValueChange={(v) => setEntryType(v as SupplierDebtEntryType | "ALL")}>
            <SelectTrigger className="w-44" aria-label="Lọc theo loại">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả loại</SelectItem>
              {(Object.keys(ENTRY_TYPE_LABELS) as SupplierDebtEntryType[]).map((t) => (
                <SelectItem key={t} value={t}>
                  {ENTRY_TYPE_LABELS[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="max-h-[55vh] overflow-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Thời gian</TableHead>
                <TableHead>Loại</TableHead>
                <TableHead className="text-right">Số tiền</TableHead>
                <TableHead className="text-right">Dư sau</TableHead>
                <TableHead>Chứng từ</TableHead>
                <TableHead>Người làm</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    <Loader2 className="mx-auto size-4 animate-spin" />
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-destructive">
                    Không tải được sổ công nợ.
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    Chưa có dòng nào.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((entry) => {
                  const ref = entryRef(entry, role);
                  return (
                    <TableRow key={entry.id}>
                      <TableCell className="whitespace-nowrap text-xs">
                        {formatVietnamDateTime(entry.createdAt)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{ENTRY_TYPE_LABELS[entry.entryType] ?? entry.entryType}</Badge>
                      </TableCell>
                      <TableCell
                        className={cn(
                          "text-right tabular-nums font-medium",
                          entry.amount < 0
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-orange-600 dark:text-orange-400",
                        )}
                      >
                        {entry.amount > 0 ? "+" : ""}
                        {formatVND(entry.amount)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{formatVND(entry.balanceAfter)}</TableCell>
                      <TableCell className="text-xs">
                        {ref ? (
                          ref.href ? (
                            <Link href={ref.href} className="text-primary hover:underline">
                              {ref.label}
                            </Link>
                          ) : (
                            <span>{ref.label}</span>
                          )
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs">{historyPersonLabel(entry.createdBy)}</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
        <HistoryPager pagination={pagination} disabled={loading} onPageChange={setPage} />
      </DialogContent>
    </Dialog>
  );
}
