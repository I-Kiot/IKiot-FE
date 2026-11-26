"use client";

// Tab "Theo thu ngân" của Lịch sử két: mỗi người giữ két bao nhiêu ca, lệch bao nhiêu. Chỉ đoạn một người giữ két
// mới gán cho họ; lệch lúc không ai giữ (mở két, giữa hai ca, quản lý đếm chốt) hiện riêng bên dưới.

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DataTableEmpty } from "@/components/data-table/data-table-empty";
import { DataTableLoading } from "@/components/data-table/data-table-loading";
import { cashDrawerApi } from "@/lib/api/cash-drawer";
import { formatVND } from "@/lib/stats-format";
import type { CashierReport, CashDrawerHistoryQuery, UnattributedVariance } from "@/types/cash-drawer";

const COLUMN_COUNT = 10;

const UNATTRIBUTED_LABEL: Record<UnattributedVariance["kind"], string> = {
  OPENING: "Từ lúc mở két đến khi người đầu tiên nhận ca",
  GAP: "Giữa lúc một người trả két và người sau nhận",
  CLOSING: "Từ lần trả két cuối đến khi quản lý đếm chốt",
};

const signed = (n: number) => (n === 0 ? "-" : `${n > 0 ? "+" : "−"}${formatVND(Math.abs(n))}`);

const toneOf = (n: number) => (n < 0 ? "text-red-600" : n > 0 ? "text-green-600" : "text-muted-foreground");

export function CashierTab({
  filters,
  tableClassName,
  reloadKey,
}: {
  filters: Omit<CashDrawerHistoryQuery, "page" | "limit" | "varianceOnly">;
  tableClassName: string;
  reloadKey: number;
}) {
  const filterKey = JSON.stringify(filters);
  const requestKey = `${filterKey}|${reloadKey}`;
  const [report, setReport] = useState<CashierReport | null>(null);
  const [doneKey, setDoneKey] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const isLoading = doneKey !== requestKey;

  useEffect(() => {
    let stale = false;
    cashDrawerApi
      .getCashierReport(JSON.parse(filterKey))
      .then((data) => {
        if (stale) return;
        setReport(data);
        setFailed(false);
      })
      .catch(() => {
        if (!stale) setFailed(true);
      })
      .finally(() => {
        if (!stale) setDoneKey(`${filterKey}|${reloadKey}`);
      });
    return () => {
      stale = true;
    };
  }, [filterKey, reloadKey]);

  const rows = report?.data ?? [];
  const unattributed = report?.unattributed ?? [];

  return (
    <div className="grid gap-4">
      <Card className="gap-0 overflow-hidden py-0">
        <div className="max-h-[70vh] overflow-auto">
          <table className={tableClassName}>
            <TableHeader>
              <TableRow>
                <TableHead>Thu ngân</TableHead>
                <TableHead className="text-right">Số ca</TableHead>
                <TableHead className="text-right" title="Số ngày (theo chi nhánh) có ca của người này">
                  Số ngày
                </TableHead>
                <TableHead className="text-right">Thu TM</TableHead>
                <TableHead className="text-right">Chi TM</TableHead>
                <TableHead className="text-right">Ca thiếu</TableHead>
                <TableHead className="text-right">Tổng thiếu</TableHead>
                <TableHead className="text-right">Ca thừa</TableHead>
                <TableHead className="text-right">Tổng thừa</TableHead>
                <TableHead className="text-right">Chênh lệch ròng</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && rows.length === 0 && <DataTableLoading columnCount={COLUMN_COUNT} />}
              {failed && (
                <TableRow>
                  <TableCell colSpan={COLUMN_COUNT} className="py-8 text-center text-sm text-muted-foreground">
                    Không tải được số liệu theo thu ngân. Bấm làm mới để thử lại.
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && !failed && rows.length === 0 && <DataTableEmpty columnCount={COLUMN_COUNT} />}
              {!failed &&
                rows.map((row) => {
                  const name =
                    [row.staff?.profile?.lastName, row.staff?.profile?.firstName].filter(Boolean).join(" ").trim() ||
                    row.staff?.phoneNumber ||
                    "Nhân viên";
                  return (
                    <TableRow key={row.staffId}>
                      <TableCell className="font-medium">
                        {name}
                        {row.openShifts > 0 && (
                          <span className="ml-2 text-xs font-normal text-muted-foreground">
                            {row.openShifts} ca đang giữ
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{row.shifts}</TableCell>
                      <TableCell className="text-right tabular-nums">{row.sessions}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatVND(row.cashIn)}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatVND(row.cashOut)}</TableCell>
                      <TableCell className={`text-right tabular-nums ${row.shortShifts ? "text-red-600" : "text-muted-foreground"}`}>
                        {row.shortShifts || "-"}
                      </TableCell>
                      <TableCell className={`text-right tabular-nums ${toneOf(row.shortfall)}`}>
                        {signed(row.shortfall)}
                      </TableCell>
                      <TableCell className={`text-right tabular-nums ${row.overShifts ? "text-green-600" : "text-muted-foreground"}`}>
                        {row.overShifts || "-"}
                      </TableCell>
                      <TableCell className={`text-right tabular-nums ${toneOf(row.overage)}`}>{signed(row.overage)}</TableCell>
                      <TableCell className={`text-right font-semibold tabular-nums ${toneOf(row.variance)}`}>
                        {row.variance === 0 ? "Khớp" : signed(row.variance)}
                      </TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </table>
        </div>
      </Card>

      {unattributed.length > 0 && (
        <Card className="gap-2 px-6 py-4">
          <p className="text-base font-semibold">Lệch không gán cho thu ngân nào</p>
          <p className="text-xs text-muted-foreground">
            Lệch ở lúc không ai giữ két. Nếu lệch lúc quản lý đếm chốt, thường là đếm lại khác số thu ngân trả.
          </p>
          <ul className="grid gap-1 text-sm">
            {unattributed.map((entry) => (
              <li key={entry.kind} className="flex items-center justify-between gap-4">
                <span>
                  {UNATTRIBUTED_LABEL[entry.kind]}
                  <span className="ml-2 text-xs text-muted-foreground">{entry.count} lần</span>
                </span>
                <span className={`font-semibold tabular-nums ${toneOf(entry.variance)}`}>{signed(entry.variance)}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
