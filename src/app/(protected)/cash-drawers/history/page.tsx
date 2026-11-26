"use client";

// [Trang – Lịch sử két] Mỗi phiên két một dòng, đã đối soát với sổ quỹ: két có đủ không, ca nào làm lệch,
// chủ đã rút về bao nhiêu và để lại bao nhiêu. Thu ngân chỉ có `read_own` tự động chỉ thấy phiên mình từng giữ (BE lọc).

import { Fragment, Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, Download, ExternalLink, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CashierTab } from "./_components/cashier-tab";
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
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DataTableEmpty } from "@/components/data-table/data-table-empty";
import { DataTableLoading } from "@/components/data-table/data-table-loading";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { ReportDateRangeFilter } from "@/components/report-date-range-filter";
import { ReportLocationSelect } from "@/components/report-location-select";
import { useReportLocation } from "@/hooks/use-report-location";
import { useReportPeriod } from "@/hooks/use-report-period";
import type { ReportPeriod } from "../../reports/hooks/use-dashboard-stats";
import { cashDrawerApi } from "@/lib/api/cash-drawer";
import { saveBlob } from "@/lib/download-file";
import { formatVND, PAYMENT_METHOD_LABELS } from "@/lib/stats-format";
import type {
  CashDrawerHistory,
  CashDrawerHistoryRow,
  CashDrawerReconciliation,
  CashDrawerUserRef,
  CashSegment,
} from "@/types/cash-drawer";

type StatusFilter = "ALL" | "OPEN" | "CLOSED";

const COLUMN_COUNT = 12;

/** Mép trái / phải bảng thụt 24px cho thẳng với nội dung card, như các bảng báo cáo khác. */
const TABLE_CLASS =
  "w-full caption-bottom text-sm [&>*>tr>:first-child]:pl-6 [&>*>tr>:last-child]:pr-6 [&>thead>tr>th]:sticky [&>thead>tr>th]:top-0 [&>thead>tr>th]:z-20 [&>thead>tr>th]:border-b [&>thead>tr>th]:bg-muted";

const formatDay = (day: string) => {
  const [y, m, d] = day.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
};

const formatTime = (iso: string | null) =>
  iso ? new Date(iso).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : "…";

const personName = (ref?: CashDrawerUserRef | null) =>
  ref
    ? [ref.profile?.lastName, ref.profile?.firstName].filter(Boolean).join(" ").trim() || ref.phoneNumber || "Nhân viên"
    : null;

const SEGMENT_LABEL: Record<CashSegment["kind"], string> = {
  OPENING: "Mở két → nhận ca",
  SHIFT: "Ca",
  GAP: "Giữa hai ca (không ai giữ)",
  CLOSING: "Trả két → quản lý đếm chốt",
};

/** Thừa xanh, thiếu đỏ, khớp xám; chưa chốt thì gạch. */
function VarianceCell({ value }: { value: number | null }) {
  if (value === null) return <span className="text-muted-foreground">-</span>;
  if (value === 0) return <span className="text-muted-foreground">Khớp</span>;
  return (
    <span className={`font-semibold ${value < 0 ? "text-red-600" : "text-green-600"}`}>
      {value > 0 ? "+" : "−"}
      {formatVND(Math.abs(value))}
    </span>
  );
}

function StatusBadge({ row }: { row: CashDrawerHistoryRow }) {
  if (row.overdue) return <Badge variant="error">Quên chốt</Badge>;
  if (row.status === "OPEN") return <Badge variant="info">Đang mở</Badge>;
  return <Badge variant="outline">Đã chốt</Badge>;
}

function SummaryCard({ label, value, hint, tone }: { label: string; value: string; hint?: string; tone?: string }) {
  return (
    <Card className="gap-1 px-5 py-4">
      <p className="text-base font-semibold">{label}</p>
      <p className={`text-2xl font-bold leading-tight tabular-nums ${tone ?? ""}`}>{value}</p>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </Card>
  );
}

/** Bọc Suspense vì kỳ và nơi đọc từ URL (`useSearchParams`). */
export default function CashDrawersHistoryPage() {
  return (
    <Suspense fallback={null}>
      <CashDrawersHistory />
    </Suspense>
  );
}

function CashDrawersHistory() {
  const { period, setPeriod: setPeriodParam } = useReportPeriod();
  const location = useReportLocation();
  // Két chỉ có ở chi nhánh: đang xem một kho thì coi như xem mọi chi nhánh.
  const branchId = location.branchId;

  const [tab, setTab] = useState<"sessions" | "cashiers">("sessions");
  const [status, setStatus] = useState<StatusFilter>("ALL");
  const [varianceOnly, setVarianceOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [history, setHistory] = useState<CashDrawerHistory | null>(null);
  /** Khoá của request đã trả lời gần nhất; khác khoá hiện tại nghĩa là đang tải. */
  const [doneKey, setDoneKey] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const filters = {
    branchId,
    fromDate: period.fromDate,
    toDate: period.toDate,
    status: status === "ALL" ? undefined : status,
    varianceOnly: varianceOnly || undefined,
  };
  const filterKey = JSON.stringify(filters);
  const requestKey = `${filterKey}|${page}|${pageSize}|${reloadKey}`;
  const isLoading = doneKey !== requestKey;

  useEffect(() => {
    let stale = false;
    cashDrawerApi
      .getHistory({ ...JSON.parse(filterKey), page, limit: pageSize })
      .then((data) => {
        if (stale) return;
        setHistory(data);
        setFailed(false);
      })
      .catch(() => {
        if (!stale) setFailed(true);
      })
      .finally(() => {
        if (!stale) setDoneKey(`${filterKey}|${page}|${pageSize}|${reloadKey}`);
      });
    return () => {
      stale = true;
    };
  }, [filterKey, page, pageSize, reloadKey]);

  // Đổi bộ lọc thì về trang đầu.
  const setPeriod = (value: ReportPeriod) => {
    setPeriodParam(value);
    setPage(1);
  };
  const setLocationKey = (key: string) => {
    location.setLocationKey(key);
    setPage(1);
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const blob = await cashDrawerApi.exportHistory(filters);
      saveBlob(blob, `lich-su-ket_${period.fromDate}_${period.toDate}.xlsx`);
    } catch {
      toast.error("Không xuất được file Excel");
    } finally {
      setIsExporting(false);
    }
  };

  const rows = history?.data ?? [];
  const totals = history?.totals;

  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      <PageHeader
        breadcrumbs={[
          { label: "Trang chủ", href: "/dashboard" },
          { label: "Két tiền", href: "/cash-drawers/today" },
          { label: "Lịch sử" },
        ]}
        title="Lịch sử két tiền"
        description="Mỗi ngày két có đủ tiền không, ca nào làm lệch, chủ đã rút về bao nhiêu"
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={tab !== "sessions" || isExporting || rows.length === 0}
            >
              <Download className="size-4" />
              Xuất Excel
            </Button>
            <Button variant="outline" size="sm" onClick={() => setReloadKey((k) => k + 1)} disabled={isLoading}>
              <RefreshCw className={`size-4 ${isLoading ? "animate-spin" : ""}`} />
              Làm mới
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Số phiên"
          value={String(totals?.sessions ?? 0)}
          hint={
            totals
              ? `${totals.openSessions} đang mở${totals.overdueSessions ? ` · ${totals.overdueSessions} quên chốt` : ""}`
              : undefined
          }
        />
        <SummaryCard
          label="Tổng thiếu két"
          value={formatVND(Math.abs(totals?.shortfall ?? 0))}
          hint={totals ? `${totals.shortfallSessions} phiên thiếu` : undefined}
          tone={(totals?.shortfall ?? 0) < 0 ? "text-red-600" : undefined}
        />
        <SummaryCard
          label="Tổng thừa két"
          value={formatVND(totals?.overage ?? 0)}
          hint={totals ? `${totals.sessionsWithVariance - totals.shortfallSessions} phiên thừa` : undefined}
          tone={(totals?.overage ?? 0) > 0 ? "text-green-600" : undefined}
        />
        <SummaryCard
          label="Chủ đã rút về"
          value={formatVND(totals?.withdrawn ?? 0)}
          hint="Chuyển quỹ Két → Chủ khi chốt két"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <ReportLocationSelect location={{ ...location, warehouses: [], setLocationKey }} />
        <ReportDateRangeFilter period={period} onChange={setPeriod} />
        <Select
          value={status}
          onValueChange={(v) => {
            setStatus(v as StatusFilter);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Mọi trạng thái</SelectItem>
            <SelectItem value="OPEN">Đang mở</SelectItem>
            <SelectItem value="CLOSED">Đã chốt</SelectItem>
          </SelectContent>
        </Select>
        <div className={`flex items-center gap-2 ${tab === "sessions" ? "" : "hidden"}`}>
          <Switch
            id="variance-only"
            checked={varianceOnly}
            onCheckedChange={(checked) => {
              setVarianceOnly(checked);
              setPage(1);
            }}
          />
          <Label htmlFor="variance-only" className="font-normal">
            Chỉ phiên có chênh lệch
          </Label>
        </div>
      </div>
      {location.isWarehouse && (
        <p className="-mt-3 text-xs text-muted-foreground">Kho không có két; đang hiện mọi chi nhánh.</p>
      )}

      <Tabs value={tab} onValueChange={(v) => setTab(v as "sessions" | "cashiers")} className="gap-4">
        <TabsList>
          <TabsTrigger value="sessions">Theo phiên</TabsTrigger>
          <TabsTrigger value="cashiers">Theo thu ngân</TabsTrigger>
        </TabsList>
        <TabsContent value="sessions" className="flex flex-col gap-6">
          <Card className="gap-0 overflow-hidden py-0">
            <div className="max-h-[70vh] overflow-auto">
              <table className={TABLE_CLASS}>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ngày</TableHead>
                    <TableHead>Chi nhánh</TableHead>
                    <TableHead className="text-right">Đầu ca</TableHead>
                    <TableHead className="text-right">Thu TM</TableHead>
                    <TableHead className="text-right">Chi TM</TableHead>
                    <TableHead className="text-right" title="Đầu ca + thu − chi tiền mặt qua két">
                      Theo sổ
                    </TableHead>
                    <TableHead className="text-right">Đếm được</TableHead>
                    <TableHead className="text-right">Chênh lệch</TableHead>
                    <TableHead className="text-right">Chủ rút</TableHead>
                    <TableHead className="text-right">Để lại</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="w-8" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading && rows.length === 0 && <DataTableLoading columnCount={COLUMN_COUNT} />}
                  {failed && (
                    <TableRow>
                      <TableCell colSpan={COLUMN_COUNT} className="py-8 text-center text-sm text-muted-foreground">
                        Không tải được lịch sử két. Bấm làm mới để thử lại.
                      </TableCell>
                    </TableRow>
                  )}
                  {!isLoading && !failed && rows.length === 0 && <DataTableEmpty columnCount={COLUMN_COUNT} />}
                  {!failed && rows.map((row) => <HistoryRow key={row.sessionId} row={row} />)}
                </TableBody>
                {totals && rows.length > 0 && (
                  <TableFooter className="border-t-0 bg-transparent">
                    <TableRow className="font-semibold hover:bg-transparent [&>td]:sticky [&>td]:bottom-0 [&>td]:z-20 [&>td]:h-10 [&>td]:border-t [&>td]:bg-muted [&>td]:py-0">
                      <TableCell colSpan={7}>Tổng (toàn bộ lọc): {totals.sessions} phiên</TableCell>
                      <TableCell className="text-right">
                        <VarianceCell value={totals.sessionsWithVariance ? totals.totalVariance : 0} />
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{formatVND(totals.withdrawn)}</TableCell>
                      <TableCell colSpan={3} />
                    </TableRow>
                  </TableFooter>
                )}
              </table>
            </div>
          </Card>

          <DataTablePagination
            page={page}
            pageCount={history?.pagination.totalPages ?? 1}
            pageSize={pageSize}
            total={history?.pagination.total ?? 0}
            unit="phiên"
            disabled={isLoading}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
          />
        </TabsContent>
        <TabsContent value="cashiers">
          <CashierTab
            filters={{ branchId, fromDate: period.fromDate, toDate: period.toDate, status: filters.status }}
            tableClassName={TABLE_CLASS}
            reloadKey={reloadKey}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/** Một phiên; bấm để xem từng ca, tải đối soát chi tiết lúc mở lần đầu. */
function HistoryRow({ row }: { row: CashDrawerHistoryRow }) {
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<CashDrawerReconciliation | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);

  const toggle = useCallback(() => {
    setOpen((was) => {
      if (!was && !detail) {
        setLoadFailed(false);
        cashDrawerApi
          .getReconciliation(row.sessionId)
          .then(setDetail)
          .catch(() => setLoadFailed(true));
      }
      return !was;
    });
  }, [detail, row.sessionId]);

  const money = (n: number | null) => (n === null ? "-" : formatVND(n));
  const day = row.businessDate.slice(0, 10);

  return (
    <Fragment>
      <TableRow className="cursor-pointer" onClick={toggle}>
        <TableCell className="whitespace-nowrap">{formatDay(row.businessDate)}</TableCell>
        <TableCell>{row.branch?.name ?? "-"}</TableCell>
        <TableCell className="text-right tabular-nums">{money(row.openingAmount)}</TableCell>
        <TableCell className="text-right tabular-nums">{money(row.cashIn)}</TableCell>
        <TableCell className="text-right tabular-nums">{money(row.cashOut)}</TableCell>
        <TableCell className="text-right tabular-nums">{money(row.expectedClosing)}</TableCell>
        <TableCell className="text-right tabular-nums">{money(row.countedClosing)}</TableCell>
        <TableCell className="text-right tabular-nums">
          <VarianceCell value={row.variance} />
        </TableCell>
        <TableCell className="text-right tabular-nums">{money(row.withdrawnAmount)}</TableCell>
        <TableCell className="text-right tabular-nums">{money(row.keptAmount)}</TableCell>
        <TableCell>
          <StatusBadge row={row} />
        </TableCell>
        <TableCell>
          {open ? (
            <ChevronDown className="size-4" aria-label="Thu gọn" />
          ) : (
            <ChevronRight className="size-4" aria-label="Xem từng ca" />
          )}
        </TableCell>
      </TableRow>
      {open && (
        <TableRow className="bg-muted/30 hover:bg-muted/30">
          <TableCell colSpan={COLUMN_COUNT} className="py-4">
            {loadFailed && <p className="text-sm text-muted-foreground">Không tải được chi tiết phiên.</p>}
            {!loadFailed && !detail && <p className="text-sm text-muted-foreground">Đang tải…</p>}
            {detail && <SessionDetail row={row} detail={detail} day={day} />}
          </TableCell>
        </TableRow>
      )}
    </Fragment>
  );
}

function SessionDetail({
  row,
  detail,
  day,
}: {
  row: CashDrawerHistoryRow;
  detail: CashDrawerReconciliation;
  day: string;
}) {
  const segments = detail.segments ?? [];
  const nonCash = (detail.nonCash ?? []).filter((n) => n.amount !== 0);
  return (
    <div className="grid gap-3">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Đoạn</TableHead>
            <TableHead>Người giữ két</TableHead>
            <TableHead>Thời gian</TableHead>
            <TableHead className="text-right">Nhận</TableHead>
            <TableHead className="text-right">Thu TM</TableHead>
            <TableHead className="text-right">Chi TM</TableHead>
            <TableHead className="text-right">Theo sổ</TableHead>
            <TableHead className="text-right">Đếm khi giao</TableHead>
            <TableHead className="text-right">Lệch</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {segments.map((segment, i) => (
            <TableRow key={i}>
              <TableCell>{SEGMENT_LABEL[segment.kind]}</TableCell>
              <TableCell>{personName(segment.staff) ?? <span className="text-muted-foreground">-</span>}</TableCell>
              <TableCell className="whitespace-nowrap text-muted-foreground">
                {formatTime(segment.from)} – {formatTime(segment.to)}
              </TableCell>
              <TableCell className="text-right tabular-nums">{formatVND(segment.openingCount)}</TableCell>
              <TableCell className="text-right tabular-nums">{formatVND(segment.cashIn)}</TableCell>
              <TableCell className="text-right tabular-nums">{formatVND(segment.cashOut)}</TableCell>
              <TableCell className="text-right tabular-nums">{formatVND(segment.expected)}</TableCell>
              <TableCell className="text-right tabular-nums">
                {segment.closingCount === null ? "-" : formatVND(segment.closingCount)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                <VarianceCell value={segment.variance} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>
          {nonCash.length > 0
            ? `Không qua két (tham khảo): ${nonCash
                .map(
                  (n) =>
                    `${(n.paymentMethod && PAYMENT_METHOD_LABELS[n.paymentMethod]) || n.paymentMethod || "Khác"} ${
                      n.flowType === "INCOME" ? "+" : "−"
                    }${formatVND(n.amount)}`,
                )
                .join(" · ")}`
            : "Không có khoản chuyển khoản / thẻ trong phiên."}
        </span>
        <span className="flex gap-3">
          <Link
            href={`/cashflow?place=branch-${row.branchId}&from=${day}&to=${day}`}
            className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
          >
            Sổ thu chi của ngày <ExternalLink className="size-3" />
          </Link>
          <Link
            href={`/cash-drawers/${row.sessionId}`}
            className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
          >
            {row.overdue ? "Vào chốt két" : "Chi tiết phiên"} <ExternalLink className="size-3" />
          </Link>
        </span>
      </div>
    </div>
  );
}
