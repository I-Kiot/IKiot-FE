"use client";

// Tab "Lịch sử giao" của màn Đơn giao của tôi: mọi lần giao của mình (xong, thất bại, hoàn, huỷ, và cả
// những đơn còn cần giao), lọc theo ngày giao / trạng thái / từ khoá, kèm các thẻ số liệu theo trạng thái.
// Bấm một dòng để mở lại chi tiết (ảnh bằng chứng, khoản thu, nhật trình).

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { shipmentApi } from "@/lib/api/shipment";
import { todayIso } from "@/lib/date-input";
import type {
  ShipmentHistoryItem,
  ShipmentHistoryPage,
  ShipmentHistoryQuery,
} from "@/types/order-flow";
import { formatVND, ShipmentStatusBadge } from "../../shipments/components/shipment-ui";
import { DeliverySheet } from "./delivery-sheet";

type StatusFilter = NonNullable<ShipmentHistoryQuery["status"]> | "ALL";

const PAGE_SIZE = 10;

const METHOD_LABELS: Record<string, string> = {
  CASH: "tiền mặt",
  SEPAY: "QR",
  BANK_TRANSFER: "chuyển khoản",
};

/** Các thẻ số liệu; bấm thẻ để lọc danh sách theo trạng thái đó. */
const CARDS: { status: Exclude<StatusFilter, "ALL">; label: string; tone: string }[] = [
  { status: "ACTIVE", label: "Cần giao", tone: "text-amber-600" },
  { status: "DELIVERED", label: "Đã giao", tone: "text-emerald-600" },
  { status: "FAILED", label: "Giao không thành", tone: "text-red-600" },
  { status: "RETURNED", label: "Hoàn hàng", tone: "text-muted-foreground" },
  { status: "CANCELLED", label: "Đã huỷ", tone: "text-muted-foreground" },
];

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "ALL", label: "Tất cả" },
  ...CARDS.map((card) => ({ value: card.status, label: card.label })),
];

/** `YYYY-MM-DD` of `days` ago in the browser's calendar. */
function daysAgoIso(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

const QUICK_RANGES = [
  { label: "Hôm nay", days: 0 },
  { label: "7 ngày", days: 6 },
  { label: "30 ngày", days: 29 },
];

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

/** Bảng lịch sử: mỗi dòng một lần giao; bấm dòng để mở chi tiết. Bảng cuộn ngang trong khung khi màn hẹp. */
function HistoryTable({
  items,
  dimmed,
  onOpen,
}: {
  items: ShipmentHistoryItem[];
  dimmed: boolean;
  onOpen: (id: string) => void;
}) {
  return (
    <div className={cn("overflow-x-auto rounded-md border bg-card", dimmed && "opacity-60")}>
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead>Mã đơn</TableHead>
            <TableHead>Trạng thái</TableHead>
            <TableHead>Người nhận</TableHead>
            <TableHead>Địa chỉ</TableHead>
            <TableHead>Giờ giao</TableHead>
            <TableHead className="text-right">Tiền thu</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => {
            const collection = item.collection;
            return (
              <TableRow key={item.id} className="cursor-pointer" onClick={() => onOpen(item.id)}>
                <TableCell className="font-medium whitespace-nowrap">{item.order.code}</TableCell>
                <TableCell>
                  <ShipmentStatusBadge status={item.status} />
                </TableCell>
                <TableCell>
                  <div className="text-sm">{item.recipientName ?? item.order.customerName}</div>
                  {item.recipientPhone && <div className="text-xs text-muted-foreground">{item.recipientPhone}</div>}
                </TableCell>
                <TableCell className="max-w-64 truncate text-sm text-muted-foreground" title={item.deliveryAddress ?? ""}>
                  {item.deliveryAddress ?? "–"}
                </TableCell>
                <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                  {item.deliveredAt ? formatDateTime(item.deliveredAt) : "Chưa giao"}
                </TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  {collection ? (
                    <>
                      <div className="text-sm font-semibold tabular-nums">{formatVND(collection.amount)}</div>
                      <div className="text-xs text-muted-foreground">
                        {collection.status === "PAID" ? "Đã thu" : "Chờ thu"} ·{" "}
                        {METHOD_LABELS[collection.method] ?? collection.method}
                      </div>
                    </>
                  ) : (
                    <span className="text-muted-foreground">–</span>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

/** Tab lịch sử giao của tôi. */
export function DeliveryHistory({ initialOpenId = null }: { initialOpenId?: string | null }) {
  const [status, setStatus] = useState<StatusFilter>("ALL");
  // Khoảng ngày mặc định 30 ngày gần nhất.
  const [from, setFrom] = useState(() => daysAgoIso(29));
  const [to, setTo] = useState(() => todayIso());
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const [openId, setOpenId] = useState<string | null>(initialOpenId);

  // Gõ xong 300ms mới tìm; setState chỉ nằm trong callback của timer (lint cấm setState trực tiếp trong effect).
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const dateInvalid = !!from && !!to && from > to;
  const requestKey = useMemo(
    () => JSON.stringify({ status, from, to, search, page, reloadKey }),
    [status, from, to, search, page, reloadKey],
  );

  // Kết quả gắn với khoá của yêu cầu đã sinh ra nó: khoá lệch nghĩa là đang tải (không cần setState "loading").
  const [result, setResult] = useState<
    { key: string; error: false; page: ShipmentHistoryPage } | { key: string; error: true } | null
  >(null);

  useEffect(() => {
    if (dateInvalid) return;
    let cancelled = false;
    shipmentApi
      .getMyHistory({
        page,
        limit: PAGE_SIZE,
        ...(status !== "ALL" ? { status } : {}),
        ...(from ? { from } : {}),
        ...(to ? { to } : {}),
        ...(search ? { search } : {}),
      })
      .then(
        (data) => {
          if (!cancelled) setResult({ key: requestKey, error: false, page: data });
        },
        () => {
          if (!cancelled) setResult({ key: requestKey, error: true });
        },
      );
    return () => {
      cancelled = true;
    };
  }, [requestKey, dateInvalid, page, status, from, to, search]);

  const loading = !dateInvalid && result?.key !== requestKey;
  // Giữ số liệu lần trước trong lúc tải lại để các thẻ không nhấp nháy.
  const latest = result && !result.error ? result.page : null;
  const summary = latest?.summary;

  const pickStatus = (next: StatusFilter) => {
    setStatus(next);
    setPage(1);
  };
  const pickRange = (days: number) => {
    setFrom(daysAgoIso(days));
    setTo(todayIso());
    setPage(1);
  };
  const countFor = (card: (typeof CARDS)[number]) => {
    if (!summary) return "–";
    switch (card.status) {
      case "ACTIVE":
        return summary.active;
      case "DELIVERED":
        return summary.delivered;
      case "FAILED":
        return summary.failed;
      case "RETURNED":
        return summary.returned;
      default:
        return summary.cancelled;
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {CARDS.map((card) => {
          const selected = status === card.status;
          return (
            <button
              key={card.status}
              type="button"
              onClick={() => pickStatus(selected ? "ALL" : card.status)}
              aria-pressed={selected}
              className={cn(
                "cursor-pointer rounded-xl border bg-card p-3 text-left shadow-xs transition-colors hover:bg-muted/40",
                selected && "border-primary bg-primary/5",
              )}
            >
              <div className="text-sm text-muted-foreground">{card.label}</div>
              <div className={cn("text-2xl font-bold tabular-nums", card.tone)}>{countFor(card)}</div>
            </button>
          );
        })}
        <div className="rounded-xl border bg-card p-3 shadow-xs">
          <div className="text-sm text-muted-foreground">Đã thu hộ</div>
          <div className="text-2xl font-bold tabular-nums">{summary ? formatVND(summary.collectedTotal) : "–"}</div>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="grid gap-1">
          <span className="text-xs text-muted-foreground">Ngày giao từ</span>
          <Input
            type="date"
            max={to || undefined}
            value={from}
            onChange={(e) => {
              setFrom(e.target.value);
              setPage(1);
            }}
            className="h-9 w-40"
          />
        </div>
        <div className="grid gap-1">
          <span className="text-xs text-muted-foreground">đến</span>
          <Input
            type="date"
            min={from || undefined}
            value={to}
            onChange={(e) => {
              setTo(e.target.value);
              setPage(1);
            }}
            className="h-9 w-40"
          />
        </div>
        <div className="flex gap-1">
          {QUICK_RANGES.map((range) => (
            <Button key={range.label} type="button" variant="outline" size="sm" onClick={() => pickRange(range.days)}>
              {range.label}
            </Button>
          ))}
        </div>
        <select
          aria-label="Trạng thái"
          value={status}
          onChange={(e) => pickStatus(e.target.value as StatusFilter)}
          className="h-9 rounded-md border bg-background px-2 text-sm"
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <Input
          placeholder="Tìm mã đơn, tên, SĐT người nhận..."
          aria-label="Tìm kiếm"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="h-9 w-64"
        />
      </div>
      {dateInvalid && <p className="text-sm text-destructive">Ngày bắt đầu phải trước ngày kết thúc.</p>}

      {!dateInvalid && loading && !latest && <p className="text-center text-muted-foreground">Đang tải...</p>}
      {!dateInvalid && result?.key === requestKey && result.error && (
        <p className="text-center text-muted-foreground">
          Không tải được lịch sử -{" "}
          <button className="underline" onClick={() => setReloadKey((key) => key + 1)}>
            thử lại
          </button>
        </p>
      )}
      {!dateInvalid && latest && result?.key === requestKey && latest.data.length === 0 && (
        <p className="text-center text-muted-foreground">Không có đơn nào trong khoảng này</p>
      )}
      {!dateInvalid && latest && latest.data.length > 0 && (
        <HistoryTable items={latest.data} dimmed={loading} onOpen={setOpenId} />
      )}

      {latest && latest.pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            Trước
          </Button>
          <span className="text-sm text-muted-foreground">
            Trang {latest.pagination.page}/{latest.pagination.totalPages} · {latest.pagination.total} đơn
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= latest.pagination.totalPages}
            onClick={() => setPage(page + 1)}
          >
            Sau
          </Button>
        </div>
      )}

      <DeliverySheet
        key={openId ?? "none"}
        shipmentId={openId}
        onClose={() => setOpenId(null)}
        onChanged={() => setReloadKey((key) => key + 1)}
      />
    </div>
  );
}
