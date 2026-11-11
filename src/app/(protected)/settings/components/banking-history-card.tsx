"use client";

import { useCallback } from "react";
import { History, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { HistoryPager } from "@/components/history/history-pager";
import { historyPersonLabel } from "@/components/history/history-person";
import { useHistoryPage } from "@/components/history/use-history-page";
import { getBankingHistory, type BankingChange, type BankingChangeSource } from "@/lib/api/tenant";
import { formatVietnamDateTime } from "@/app/(protected)/staffs/shared/vietnam-datetime";

const PAGE_SIZE = 10;

const SOURCE_LABELS: Record<BankingChangeSource, string> = {
  OWNER: "Chủ shop",
  ADMIN: "Quản trị viên",
  SEPAY_SYNC: "Đồng bộ SePay",
};

const FIELD_LABELS: Record<string, string> = {
  bankingAccountNumber: "Số tài khoản",
  bankingBankName: "Ngân hàng",
  bankingAccountName: "Chủ tài khoản",
  bankingSepayLinkedAt: "Liên kết SePay lúc",
  bankingSepayWebhookApiKey: "Khóa webhook SePay",
};

function formatValue(field: string, value: string | null | undefined): string {
  if (value == null || value === "") return "(trống)";
  if (field === "bankingSepayLinkedAt") return formatVietnamDateTime(value);
  return value;
}

function ChangeRow({ change }: { change: BankingChange }) {
  const entries = Object.entries(change.changes ?? {});
  return (
    <li className="space-y-1 rounded-md border px-3 py-2 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline">{SOURCE_LABELS[change.source] ?? change.source}</Badge>
        <span className="text-xs text-muted-foreground">
          {change.source === "SEPAY_SYNC" ? "Hệ thống" : historyPersonLabel(change.changedBy)} ·{" "}
          {formatVietnamDateTime(change.createdAt)}
        </span>
      </div>
      <ul className="space-y-0.5">
        {entries.map(([field, diff]) => (
          <li key={field}>
            <span className="text-muted-foreground">{FIELD_LABELS[field] ?? field}:</span>{" "}
            {diff?.keyChanged ? (
              <span>Đã đổi khóa webhook</span>
            ) : (
              <span>
                {formatValue(field, diff?.from)} → {formatValue(field, diff?.to)}
              </span>
            )}
          </li>
        ))}
      </ul>
    </li>
  );
}

/** "Lịch sử thay đổi" của thông tin nhận tiền (chỉ render khi người xem có `tenants:update`). */
export function BankingHistoryCard() {
  const fetchPage = useCallback((page: number) => getBankingHistory({ page, limit: PAGE_SIZE }), []);
  const { rows, pagination, loading, error, setPage } = useHistoryPage<BankingChange>(fetchPage, true, "banking");

  return (
    <section className="space-y-3">
      <h4 className="flex items-center gap-2 text-sm font-semibold text-foreground/80">
        <History className="size-4" />
        Lịch sử thay đổi
      </h4>
      {loading && rows.length === 0 ? (
        <Loader2 className="size-4 animate-spin text-muted-foreground" />
      ) : error ? (
        <p className="text-sm text-destructive">Không tải được lịch sử thay đổi.</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">Chưa có thay đổi nào.</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((row) => (
            <ChangeRow key={row.id} change={row} />
          ))}
        </ul>
      )}
      <HistoryPager pagination={pagination} disabled={loading} onPageChange={setPage} />
    </section>
  );
}
