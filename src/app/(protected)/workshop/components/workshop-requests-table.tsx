"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { useLiveTick } from "@/hooks/use-live-refresh";
import { CHANGE_RESOURCES } from "@/types/change-feed";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import { DataTableEmpty } from "@/components/data-table/data-table-empty";
import { DataTableLoading } from "@/components/data-table/data-table-loading";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { workshopApi } from "@/lib/api/production-delivery";
import { getApiErrorBody, messageForCode } from "@/lib/api/error-codes";
import {
  PRODUCTION_REQUEST_STATUS_LABELS,
  type ProductionRequest,
  type WorkshopProductionRequestQuery,
} from "@/types/order-flow";
import {
  formatDate,
  formatDateTime,
  requestProgress,
  requestStatusDisplay,
  workshopAcceptanceDisplay,
} from "../../exchange/production-requests/shared/production-display";
import { WorkshopRequestSheet } from "./workshop-request-sheet";

const LIVE_RESOURCES = [CHANGE_RESOURCES.PRODUCTION_REQUESTS, CHANGE_RESOURCES.PRODUCTION_DELIVERIES] as const;

const DEFAULT_PAGE_SIZE = 10;
const COLUMN_COUNT = 6;
const ALL = "ALL";

type WorkshopStatus = NonNullable<WorkshopProductionRequestQuery["status"]>;

/** Trạng thái xưởng được thấy (nháp chưa gửi nên không có), theo thứ tự hành trình. */
const STATUS_OPTIONS: WorkshopStatus[] = ["SENT", "PARTIALLY_RECEIVED", "COMPLETED", "CANCELLED"];

type Props = {
  /** Tăng lên khi trang bấm "Tải lại" để bảng tải lại. */
  refreshSignal: number;
};

/** Bảng YCSX gửi cho xưởng của tài khoản (`GET /workshop/production-requests`): tìm theo mã, lọc trạng thái, phân trang ở server. Bấm một dòng mở chi tiết. */
export function WorkshopRequestsTable({ refreshSignal }: Props) {
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(DEFAULT_PAGE_SIZE);
  const [status, setStatus] = React.useState<WorkshopStatus | typeof ALL>(ALL);
  const [search, setSearch] = React.useState("");
  const [term, setTerm] = React.useState("");
  const [reloads, setReloads] = React.useState(0);
  const [openId, setOpenId] = React.useState<string | null>(null);

  // Gắn kèm query đã trả lời: kết quả về muộn của bộ lọc cũ không đè lên kết quả mới.
  const query = `${page}|${pageSize}|${status}|${term}|${reloads}|${refreshSignal}`;
  const [loaded, setLoaded] = React.useState<{
    query: string;
    rows: ProductionRequest[];
    total: number;
  } | null>(null);
  const loading = loaded?.query !== query;
  const rows = loaded?.rows ?? [];
  const total = loaded?.total ?? 0;
  // Người khác đổi dữ liệu: tải lại nền. Tick chỉ vào deps của effect tải, KHÔNG vào `query`, nên bảng không nháy "đang tải".
  const liveTick = useLiveTick({ resources: LIVE_RESOURCES, visibleIds: rows.map((row) => row.id) });
  const shownQueryRef = React.useRef<string | null>(null);

  // Gõ tìm kiếm chờ 300ms mới thành request, như bảng YCSX phía shop.
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setTerm(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  React.useEffect(() => {
    // Cùng query với lần đã hiển thị = tải nền: lỗi thì giữ dữ liệu đang hiện, không toast.
    const silent = shownQueryRef.current === query;
    let stale = false;
    workshopApi
      .getRequests({
        page,
        limit: pageSize,
        ...(status !== ALL ? { status } : {}),
        ...(term ? { search: term } : {}),
      })
      .then((result) => {
        if (stale) return;
        shownQueryRef.current = query;
        setLoaded({ query, rows: result.data, total: result.pagination.total });
      })
      .catch((error) => {
        if (stale || silent) return;
        toast.error(messageForCode(getApiErrorBody(error)?.code) ?? "Không tải được yêu cầu sản xuất");
        shownQueryRef.current = query;
        setLoaded({ query, rows: [], total: 0 });
      });
    return () => {
      stale = true;
    };
  }, [page, pageSize, status, term, query, liveTick]);

  const pages = Math.ceil(total / pageSize);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder="Mã yêu cầu"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <Select
          value={status}
          onValueChange={(value) => {
            setStatus(value as WorkshopStatus | typeof ALL);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Tất cả trạng thái</SelectItem>
            {STATUS_OPTIONS.map((value) => (
              <SelectItem key={value} value={value}>
                {PRODUCTION_REQUEST_STATUS_LABELS[value]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã</TableHead>
              <TableHead>Giao về</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right">Đã nhận / đặt</TableHead>
              <TableHead>Hẹn xong</TableHead>
              <TableHead>Ngày gửi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              const display = requestStatusDisplay(row.status, row.closedShort);
              const acceptance = workshopAcceptanceDisplay(row);
              const progress = requestProgress(row);
              const pending = row.items.reduce((sum, line) => sum + line.pendingDeliveryQuantity, 0);
              return (
                <TableRow key={row.id} className="cursor-pointer" onClick={() => setOpenId(row.id)}>
                  <TableCell className="font-medium">{row.code}</TableCell>
                  <TableCell>{row.location.name}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant={display.variant}>{display.label}</Badge>
                      {acceptance && <Badge variant={acceptance.variant}>{acceptance.label}</Badge>}
                    </div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {progress.received}/{progress.ordered}
                    {pending > 0 && <span className="text-amber-600"> · chờ nhận {pending}</span>}
                  </TableCell>
                  <TableCell>{formatDate(row.expectedReadyDate)}</TableCell>
                  <TableCell>{formatDateTime(row.sentAt)}</TableCell>
                </TableRow>
              );
            })}
            {!loading && rows.length === 0 && <DataTableEmpty columnCount={COLUMN_COUNT} />}
            {loading && rows.length === 0 && <DataTableLoading columnCount={COLUMN_COUNT} />}
          </TableBody>
        </Table>
      </div>

      <DataTablePagination
        page={page}
        pageCount={pages}
        pageSize={pageSize}
        total={total}
        unit="yêu cầu"
        disabled={loading}
        onPageChange={setPage}
        onPageSizeChange={(nextPageSize) => {
          setPageSize(nextPageSize);
          setPage(1);
        }}
      />

      <WorkshopRequestSheet
        key={openId ?? "none"}
        requestId={openId}
        onClose={() => setOpenId(null)}
        onChanged={() => setReloads((count) => count + 1)}
      />
    </div>
  );
}
