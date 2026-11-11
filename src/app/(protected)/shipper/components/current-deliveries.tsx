"use client";

// Tab "Đang giao" của màn Đơn giao của tôi: các lần giao chưa kết thúc, cùng bộ lọc với tab "Lịch sử giao"
// (thẻ trạng thái bấm để lọc, khoảng ngày, trạng thái, từ khoá). `GET /shipments/mine` trả về toàn bộ lần giao
// còn mở của mình (không phân trang, vài chục dòng là nhiều), nên lọc ngay trên trình duyệt thay vì gọi lại API.
// Khác lịch sử ở một chỗ: đơn chưa giao thì chưa có ngày giao, nên khoảng ngày lọc theo **ngày hẹn giao**, và mặc
// định không giới hạn ngày - đơn cần giao không được bị ẩn chỉ vì hẹn ngoài khoảng mặc định.

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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

/** Một đơn trong danh sách: mã, người nhận, địa chỉ, giờ hẹn, số còn phải thu. */
function DeliveryCard({ shipment, onOpen }: { shipment: ShipmentSummary; onOpen: () => void }) {
  return (
    <Card className="cursor-pointer py-4 transition-colors hover:bg-muted/40" onClick={onOpen}>
      <CardContent className="space-y-2 px-4">
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium">{shipment.order.code}</span>
          <ShipmentStatusBadge status={shipment.status} />
        </div>
        <p className="text-sm">
          {shipment.recipientName ?? shipment.order.customerName}
          {shipment.recipientPhone && <span className="text-muted-foreground"> · {shipment.recipientPhone}</span>}
        </p>
        {shipment.deliveryAddress && <p className="text-sm text-muted-foreground">{shipment.deliveryAddress}</p>}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {[shipment.scheduledDate?.slice(0, 10), shipment.scheduledSlot].filter(Boolean).join(" · ") ||
              "Chưa hẹn giờ"}
          </span>
          <span className="font-semibold">
            {shipment.order.amountDue > 0 ? `Thu ${formatVND(shipment.order.amountDue)}` : amountDueText(shipment)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

export type MineState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; shipments: ShipmentSummary[] };

/** Tab đang giao: thẻ số liệu, bộ lọc, danh sách thẻ đơn. */
export function CurrentDeliveries({ state, onOpen }: { state: MineState; onOpen: (id: string) => void }) {
  const [status, setStatus] = useState<StatusFilter>("ALL");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [search, setSearch] = useState("");

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

  const ready = state.status === "ready";
  const filtered = status !== "ALL" || !!from || !!to || !!search.trim();
  const pickRange = (fromDays: number, toDays: number) => {
    setFrom(addDaysIso(fromDays));
    setTo(addDaysIso(toDays));
  };
  const clearFilters = () => {
    setStatus("ALL");
    setFrom("");
    setTo("");
    setSearch("");
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
              onClick={() => setStatus(selected ? "ALL" : value)}
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
            onChange={(e) => setFrom(e.target.value)}
            className="h-9 w-40"
          />
        </div>
        <div className="grid gap-1">
          <span className="text-xs text-muted-foreground">đến</span>
          <Input
            type="date"
            min={from || undefined}
            value={to}
            onChange={(e) => setTo(e.target.value)}
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
            onClick={() => {
              setFrom("");
              setTo("");
            }}
          >
            Mọi ngày
          </Button>
        </div>
        <select
          aria-label="Trạng thái"
          value={status}
          onChange={(e) => setStatus(e.target.value as StatusFilter)}
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
          onChange={(e) => setSearch(e.target.value)}
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
          <div className="grid gap-3 md:grid-cols-2">
            {visible.map((shipment) => (
              <DeliveryCard key={shipment.id} shipment={shipment} onOpen={() => onOpen(shipment.id)} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
