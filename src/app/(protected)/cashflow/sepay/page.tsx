// [Page – Giao dịch SePay cần xử lý] Tiền về chưa chốt được: chuyển thiếu, trả dư, không gắn được đơn.
"use client";

import Link from "next/link";
import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { PermissionButton } from "@/components/permission-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { DataTableLoading } from "@/components/data-table/data-table-loading";
import { allows } from "@/components/sidebar/constants/role-permissions";
import { useAuth } from "@/store/hooks/use-auth";
import { formatVND } from "@/lib/stats-format";
import {
  SEPAY_OUTCOME_LABELS,
  SEPAY_REJECT_REASON_LABELS,
  SEPAY_RESOLUTION_LABELS,
  type SepayOutcome,
  type SepayResolution,
  type SepayTransaction,
} from "@/types/sepay-transaction";
import { useSepayTransactions } from "./_hooks/use-sepay-transactions";
import { ResolveDialog } from "./_components/resolve-dialog";

const OUTCOME_VARIANT: Record<string, "success" | "warning" | "error" | "secondary"> = {
  SETTLED: "success",
  SETTLED_LATE: "success",
  SETTLED_PARTIAL: "warning",
  REJECTED: "error",
  UNMATCHED: "error",
};

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

/** Tên người xử lý: họ trước tên, không có tên thì số điện thoại. */
function resolverName(tx: SepayTransaction): string {
  const by = tx.resolvedBy;
  if (!by) return "";
  const name = `${by.profile?.lastName ?? ""} ${by.profile?.firstName ?? ""}`.trim();
  return name || by.phoneNumber;
}

export default function SepayTransactionsPage() {
  const { user } = useAuth();
  const canRead = allows(user?.role, "cash_flows", "read");
  const canResolve = allows(user?.role, "cash_flows", "update");
  const state = useSepayTransactions(canRead);
  const [current, setCurrent] = useState<SepayTransaction | null>(null);

  const rows = state.list?.data ?? [];
  const pagination = state.list?.pagination;

  return (
    <div className="flex-1 space-y-6 px-6 pt-0">
      <PageHeader
        breadcrumbs={[
          { label: "Trang chủ", href: "/dashboard" },
          { label: "Sổ thu chi", href: "/cashflow" },
          { label: "Giao dịch SePay cần xử lý" },
        ]}
        title="Giao dịch SePay cần xử lý"
        description="Tiền khách chuyển khoản đã về nhưng chưa chốt được cho đơn: chuyển thiếu, trả dư, đơn đã huỷ hoặc không gắn được đơn nào"
        actions={
          <Button variant="outline" size="sm" onClick={state.refetch} disabled={state.isLoading || !canRead}>
            <RefreshCw className={`size-4 ${state.isLoading ? "animate-spin" : ""}`} />
            Làm mới
          </Button>
        }
      />

      {!canRead ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Bạn cần quyền xem Sổ thu chi (cash_flows:read) để xem các giao dịch này.
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <Switch
              id="sepay-unresolved"
              checked={state.unresolvedOnly}
              onCheckedChange={state.setUnresolvedOnly}
            />
            <Label htmlFor="sepay-unresolved">Chỉ hiện giao dịch chưa xử lý</Label>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Thời gian</TableHead>
                    <TableHead>Kết cục</TableHead>
                    <TableHead className="text-right">Số tiền</TableHead>
                    <TableHead>Nội dung chuyển khoản</TableHead>
                    <TableHead>Đơn</TableHead>
                    <TableHead>Xử lý</TableHead>
                    <TableHead className="w-28" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {state.isLoading && rows.length === 0 && <DataTableLoading columnCount={7} />}
                  {!state.isLoading && rows.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                        {state.unresolvedOnly ? "Không có giao dịch nào cần xử lý." : "Chưa có giao dịch nào."}
                      </TableCell>
                    </TableRow>
                  )}
                  {rows.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                        {formatDateTime(tx.createdAt)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={OUTCOME_VARIANT[tx.outcome] ?? "secondary"}>
                          {SEPAY_OUTCOME_LABELS[tx.outcome as SepayOutcome] ?? tx.outcome}
                        </Badge>
                        {tx.rejectReason && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {SEPAY_REJECT_REASON_LABELS[tx.rejectReason] ?? tx.rejectReason}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-right font-semibold">
                        {formatVND(tx.amount)}
                        {tx.excessAmount > 0 && (
                          <p className="text-xs font-normal text-orange-600">Trả dư {formatVND(tx.excessAmount)}</p>
                        )}
                      </TableCell>
                      <TableCell className="max-w-[260px] text-sm">
                        <p className="truncate" title={tx.content ?? undefined}>
                          {tx.content || "-"}
                        </p>
                        {tx.paymentReference && (
                          <p className="text-xs text-muted-foreground">{tx.paymentReference}</p>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {tx.order ? (
                          <Link href={`/sales/orders/${tx.order.id}`} className="text-primary underline">
                            {tx.order.code}
                          </Link>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {tx.resolvedAt ? (
                          <div>
                            <Badge variant="muted">
                              {SEPAY_RESOLUTION_LABELS[tx.resolution as SepayResolution] ?? tx.resolution}
                            </Badge>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {formatDateTime(tx.resolvedAt)}
                              {tx.resolvedBy && ` · ${resolverName(tx)}`}
                            </p>
                            {tx.resolutionNote && <p className="text-xs">{tx.resolutionNote}</p>}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Chưa xử lý</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {!tx.resolvedAt && (
                          <PermissionButton
                            size="sm"
                            variant="outline"
                            className="cursor-pointer"
                            allowed={canResolve}
                            permission="cash_flows:update"
                            onClick={() => setCurrent(tx)}
                          >
                            Xử lý
                          </PermissionButton>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <DataTablePagination
            page={state.page}
            pageCount={pagination?.totalPages ?? 1}
            pageSize={state.pageSize}
            total={pagination?.total ?? 0}
            unit="giao dịch"
            disabled={state.isLoading}
            onPageChange={state.setPage}
            onPageSizeChange={state.setPageSize}
          />
        </>
      )}

      {current && (
        <ResolveDialog
          transaction={current}
          onClose={() => setCurrent(null)}
          onResolve={(resolution, note) => state.resolve(current.id, resolution, note)}
        />
      )}
    </div>
  );
}
