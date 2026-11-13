"use client";

// Tab "Đang giao" của màn Đơn giao của tôi: các lần giao chưa kết thúc, cùng bộ lọc với tab "Lịch sử giao"
// (thẻ trạng thái bấm để lọc, khoảng ngày, trạng thái, từ khoá). `GET /shipments/mine` trả về toàn bộ lần giao
// còn mở của mình (không phân trang, vài chục dòng là nhiều), nên lọc ngay trên trình duyệt thay vì gọi lại API.
// Khác lịch sử ở một chỗ: đơn chưa giao thì chưa có ngày giao, nên khoảng ngày lọc theo **ngày hẹn giao**, và mặc
// định không giới hạn ngày - đơn cần giao không được bị ẩn chỉ vì hẹn ngoài khoảng mặc định.

import { useMemo, useState } from "react";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { addDaysIso } from "@/lib/date-input";
import { cn } from "@/lib/utils";
import { SHIPMENT_STATUS_LABELS, type ShipmentStatus, type ShipmentSummary } from "@/types/order-flow";
import { amountDueText, formatVND, ShipmentStatusBadge } from "../../shipments/components/shipment-ui";

/** Trạng thái của một lần giao còn mở (BE `listMine`: mọi trạng thái trừ DELIVERED / RETURNED / CANCELLED). */
const OPEN_STATUSES: ShipmentStatus[] = ["CREATED", "PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY", "FAILED"];

const STATUS_TONE: Partial<Record<ShipmentStatus, string>> = {
  CREATED: "text-amber-600",
  OUT_FOR_DELIVERY: "text-sky-600",
  FAILED: "text-red-600",
};

type StatusFilter = ShipmentStatus | "ALL";

const QUICK_RANGES = [
  { label: "Hôm nay", from: 0, to: 0 },
  { label: "Ngày mai", from: 1, to: 1 },
  { label: "7 ngày tới", from: 0, to: 6 },
];

/** Bỏ dấu + chữ thường, để "nguyen" tìm ra "Nguyễn". */
function fold(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/gi, "d").toLowerCase();
}

/** Ô tìm kiếm khớp mã đơn, mã vận đơn, tên / SĐT người nhận, địa chỉ - như `shipmentSearchWhere` của BE, thêm địa chỉ. */
function matchesSearch(shipment: ShipmentSummary, needle: string): boolean {
  return [
    shipment.order.code,
    shipment.trackingCode,
    shipment.recipientName ?? shipment.order.customerName,
    shipment.recipientPhone,
    shipment.deliveryAddress,
  ].some((value) => !!value && fold(value).includes(needle));
}

/** Ngày hẹn + khung giờ hẹn của một lần giao, hoặc "Chưa hẹn giờ". */
function scheduleText(shipment: ShipmentSummary): string {
  const parts = [shipment.scheduledDate?.slice(0, 10), shipment.scheduledSlot].filter(Boolean);
  if (parts.length === 0) return "Chưa hẹn giờ";
  return parts.join(" · ");
}

/** Số còn phải thu của một lần giao: số tiền nếu còn nợ, không thì câu mô tả của `amountDueText`. */
function amountDueCell(shipment: ShipmentSummary): string {
  if (shipment.order.amountDue > 0) return formatVND(shipment.order.amountDue);
  return amountDueText(shipment);
}

/**
 * Bảng các đơn đang giao: mỗi dòng một lần giao, bấm dòng để mở chi tiết.
 * Cùng kiểu với bảng của tab "Lịch sử giao"; màn hẹp thì bảng cuộn ngang trong khung.
 */
function CurrentTable({ shipments, onOpen }: { shipments: ShipmentSummary[]; onOpen: (id: string) => void }) {
  return (
    <div className="overflow-x-auto rounded-md border bg-card">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead>Mã đơn</TableHead>
            <TableHead>Trạng thái</TableHead>
            <TableHead>Người nhận</TableHead>
            <TableHead>Địa chỉ</TableHead>
            <TableHead>Hẹn giao</TableHead>
            <TableHead className="text-right">Còn phải thu</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {shipments.map((shipment) => (
            <TableRow key={shipment.id} className="cursor-pointer" onClick={() => onOpen(shipment.id)}>
              <TableCell className="font-medium whitespace-nowrap">{shipment.order.code}</TableCell>
              <TableCell>
                <ShipmentStatusBadge status={shipment.status} />
              </TableCell>
              <TableCell>
                <div className="text-sm">{shipment.recipientName ?? shipment.order.customerName}</div>
                {shipment.recipientPhone && (
                  <div className="text-xs text-muted-foreground">{shipment.recipientPhone}</div>
                )}
              </TableCell>
              <TableCell
                className="max-w-64 truncate text-sm text-muted-foreground"
                title={shipment.deliveryAddress ?? ""}
              >
                {shipment.deliveryAddress ?? "–"}
              </TableCell>
              <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                {scheduleText(shipment)}
              </TableCell>
              <TableCell className="text-right font-semibold whitespace-nowrap tabular-nums">
                {amountDueCell(shipment)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export type MineState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; shipments: ShipmentSummary[] };

/** Tab đang giao: thẻ số liệu, bộ lọc, bảng đơn. */
export function CurrentDeliveries({ state, onOpen }: { state: MineState; onOpen: (id: string) => void }) {
  const [status, setStatus] = useState<StatusFilter>("ALL");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const dateInvalid = !!from && !!to && from > to;
  const shipments = useMemo(() => (state.status === "ready" ? state.shipments : []), [state]);

  // Thẻ số liệu theo khoảng ngày nhưng bỏ qua trạng thái và từ khoá, để bấm thẻ ra đúng số đơn đó (như tab lịch sử).
  const inRange = useMemo(() => {
    if (dateInvalid || (!from && !to)) return shipments;
    return shipments.filter((shipment) => {
      const day = shipment.scheduledDate?.slice(0, 10);
      if (!day) return false;
      return (!from || day >= from) && (!to || day <= to);
    });
  }, [shipments, from, to, dateInvalid]);

  const visible = useMemo(() => {
    const needle = fold(search.trim());
    return inRange.filter(
      (shipment) =>
        (status === "ALL" || shipment.status === status) && (!needle || matchesSearch(shipment, needle)),
    );
  }, [inRange, status, search]);

  const counts = useMemo(() => {
    const byStatus = new Map<ShipmentStatus, number>();
    let due = 0;
    for (const shipment of inRange) {
      byStatus.set(shipment.status, (byStatus.get(shipment.status) ?? 0) + 1);
      due += Math.max(0, shipment.order.amountDue);
    }
    return { byStatus, due };
  }, [inRange]);

  // Phân trang ngay trên trình duyệt: danh sách đã tải hết. `currentPage` kẹp lại khi danh sách ngắn đi
  // (giao xong một đơn ở trang cuối rồi tải lại) - tính lúc render, không sửa `page` trong effect.
  const pageCount = Math.max(1, Math.ceil(visible.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageRows = visible.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const ready = state.status === "ready";
  const filtered = status !== "ALL" || !!from || !!to || !!search.trim();

  // Mọi thay đổi bộ lọc đều quay về trang 1, như tab lịch sử.
  const changeStatus = (next: StatusFilter) => {
    setStatus(next);
    setPage(1);
  };
  const changeFrom = (next: string) => {
    setFrom(next);
    setPage(1);
  };
  const changeTo = (next: string) => {
    setTo(next);
    setPage(1);
  };
  const changeSearch = (next: string) => {
    setSearch(next);
    setPage(1);
  };
  const pickRange = (fromDays: number, toDays: number) => {
    setFrom(addDaysIso(fromDays));
    setTo(addDaysIso(toDays));
    setPage(1);
  };
  const clearDates = () => {
    setFrom("");
    setTo("");
    setPage(1);
  };
  const clearFilters = () => {
    setStatus("ALL");
    setFrom("");
    setTo("");
    setSearch("");
    setPage(1);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {OPEN_STATUSES.map((value) => {
          const selected = status === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => changeStatus(selected ? "ALL" : value)}
              aria-pressed={selected}
              className={cn(
                "cursor-pointer rounded-xl border bg-card p-3 text-left shadow-xs transition-colors hover:bg-muted/40",
                selected && "border-primary bg-primary/5",
              )}
            >
              <div className="text-sm text-muted-foreground">{SHIPMENT_STATUS_LABELS[value]}</div>
              <div className={cn("text-2xl font-bold tabular-nums", STATUS_TONE[value])}>
                {ready ? (counts.byStatus.get(value) ?? 0) : "–"}
              </div>
            </button>
          );
        })}
        <div className="rounded-xl border bg-card p-3 shadow-xs">
          <div className="text-sm text-muted-foreground">Còn phải thu</div>
          <div className="text-2xl font-bold tabular-nums">{ready ? formatVND(counts.due) : "–"}</div>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="grid gap-1">
          <span className="text-xs text-muted-foreground">Ngày hẹn giao từ</span>
          <Input
            type="date"
            max={to || undefined}
            value={from}
            onChange={(e) => changeFrom(e.target.value)}
            className="h-9 w-40"
          />
        </div>
        <div className="grid gap-1">
          <span className="text-xs text-muted-foreground">đến</span>
          <Input
            type="date"
            min={from || undefined}
            value={to}
            onChange={(e) => changeTo(e.target.value)}
            className="h-9 w-40"
          />
        </div>
        <div className="flex flex-wrap gap-1">
          {QUICK_RANGES.map((range) => (
            <Button
              key={range.label}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => pickRange(range.from, range.to)}
            >
              {range.label}
            </Button>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={clearDates}
          >
            Mọi ngày
          </Button>
        </div>
        <select
          aria-label="Trạng thái"
          value={status}
          onChange={(e) => changeStatus(e.target.value as StatusFilter)}
          className="h-9 rounded-md border bg-background px-2 text-sm"
        >
          <option value="ALL">Tất cả</option>
          {OPEN_STATUSES.map((value) => (
            <option key={value} value={value}>
              {SHIPMENT_STATUS_LABELS[value]}
            </option>
          ))}
        </select>
        <Input
          placeholder="Tìm mã đơn, tên, SĐT, địa chỉ..."
          aria-label="Tìm kiếm"
          value={search}
          onChange={(e) => changeSearch(e.target.value)}
          className="h-9 w-64"
        />
      </div>
      {dateInvalid && <p className="text-sm text-destructive">Ngày bắt đầu phải trước ngày kết thúc.</p>}
      {(from || to) && !dateInvalid && (
        <p className="text-xs text-muted-foreground">
          Đang lọc theo ngày hẹn giao - đơn chưa hẹn ngày không hiện.
        </p>
      )}

      {state.status === "loading" && <p className="text-center text-muted-foreground">Đang tải...</p>}
      {state.status === "error" && (
        <p className="text-center text-muted-foreground">Không tải được danh sách - bấm Tải lại để thử lại</p>
      )}
      {ready && shipments.length === 0 && (
        <p className="text-center text-muted-foreground">Bạn không có đơn nào cần giao</p>
      )}
      {ready && shipments.length > 0 && !dateInvalid && visible.length === 0 && (
        <p className="text-center text-muted-foreground">
          Không có đơn nào khớp bộ lọc -{" "}
          <button className="underline" onClick={clearFilters}>
            bỏ lọc
          </button>
        </p>
      )}
      {ready && !dateInvalid && visible.length > 0 && (
        <>
          {filtered && (
            <p className="text-sm text-muted-foreground">
              {visible.length}/{shipments.length} đơn
            </p>
          )}
          <CurrentTable shipments={pageRows} onOpen={onOpen} />
        </>
      )}

      {ready && !dateInvalid && (
        <DataTablePagination
          page={currentPage}
          pageCount={pageCount}
          pageSize={pageSize}
          total={visible.length}
          unit="đơn"
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
        />
      )}
    </div>
  );
}
