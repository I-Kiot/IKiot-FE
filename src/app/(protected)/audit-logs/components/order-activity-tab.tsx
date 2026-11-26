"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { formatVietnamDateTime } from "@/app/(protected)/staffs/shared/vietnam-datetime";
import {
  actorLabel,
  eventTypeLabel,
  formatChangeValue,
  lineChangeTexts,
  metadataTexts,
  statusTransition,
} from "@/app/(protected)/sales/orders/[id]/hooks/order-event-format";
import { listOrderActivity, type OrderActivity } from "@/lib/api/audit";
import { ORDER_EVENT_FIELD_LABELS, ORDER_EVENT_TYPE_LABELS } from "@/types/order-event";

const ALL = "all";

// Tóm tắt thay đổi của một thao tác: trường đã đổi, dòng hàng, số tiền, lý do...
function ActivityDetail({ event }: { event: OrderActivity }) {
  const changes = Object.entries(event.changes ?? {});
  const lines = lineChangeTexts(event.metadata?.lines);
  const details = metadataTexts(event.metadata);
  if (changes.length === 0 && lines.length === 0 && details.length === 0) {
    return <span className="text-muted-foreground">-</span>;
  }
  return (
    <ul className="space-y-0.5 text-sm">
      {changes.map(([field, change]) => (
        <li key={field}>
          <span className="text-muted-foreground">{ORDER_EVENT_FIELD_LABELS[field] ?? field}:</span>{" "}
          {formatChangeValue(field, change?.from)} → {formatChangeValue(field, change?.to)}
        </li>
      ))}
      {lines.map((text, index) => (
        <li key={`line-${index}`}>{text}</li>
      ))}
      {details.map((text, index) => (
        <li key={`meta-${index}`} className="text-muted-foreground">
          {text}
        </li>
      ))}
    </ul>
  );
}

export function OrderActivityTab() {
  const [rows, setRows] = useState<OrderActivity[]>([]);
  const [loading, setLoading] = useState(true);

  const [actorQuery, setActorQuery] = useState("");
  const [orderCode, setOrderCode] = useState("");
  const [typeFilter, setTypeFilter] = useState(ALL);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const fetchRows = useCallback(() => {
    setLoading(true);
    listOrderActivity({
      actor: actorQuery || undefined,
      orderCode: orderCode || undefined,
      type: typeFilter === ALL ? undefined : typeFilter,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      page: currentPage,
      limit: pageSize,
    })
      .then((res) => {
        if (res.success) {
          setRows(res.data);
          setTotalPages(res.pagination.totalPages);
          setTotalItems(res.pagination.total);
        }
      })
      .catch(() => toast.error("Không thể tải thao tác đơn hàng"))
      .finally(() => setLoading(false));
  }, [actorQuery, orderCode, typeFilter, startDate, endDate, currentPage, pageSize]);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(fetchRows, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [fetchRows]);

  const resetPage = () => setCurrentPage(1);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 items-end gap-4 md:grid-cols-4">
        <div className="space-y-1">
          <Label className="text-xs font-semibold">Người thực hiện</Label>
          <Input
            placeholder="Tên người thao tác..."
            value={actorQuery}
            onChange={(e) => {
              setActorQuery(e.target.value);
              resetPage();
            }}
            className="h-9"
          />
        </div>

        <div className="space-y-1">
          <Label className="text-xs font-semibold">Mã đơn</Label>
          <Input
            placeholder="Ví dụ: ORD4254..."
            value={orderCode}
            onChange={(e) => {
              setOrderCode(e.target.value);
              resetPage();
            }}
            className="h-9"
          />
        </div>

        <div className="space-y-1">
          <Label className="text-xs font-semibold">Thao tác</Label>
          <Select
            value={typeFilter}
            onValueChange={(value) => {
              setTypeFilter(value);
              resetPage();
            }}
          >
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Tất cả thao tác</SelectItem>
              {Object.entries(ORDER_EVENT_TYPE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-xs font-semibold">Từ ngày - Đến ngày</Label>
          <div className="flex gap-2">
            <Input
              type="date"
              aria-label="Từ ngày"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                resetPage();
              }}
              className="h-9 text-xs"
            />
            <Input
              type="date"
              aria-label="Đến ngày"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                resetPage();
              }}
              className="h-9 text-xs"
            />
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead className="w-[170px] text-sm font-semibold">Thời gian</TableHead>
              <TableHead className="w-[210px] text-sm font-semibold">Người thực hiện</TableHead>
              <TableHead className="w-[210px] text-sm font-semibold">Thao tác</TableHead>
              <TableHead className="w-[150px] text-sm font-semibold">Đơn hàng</TableHead>
              <TableHead className="text-sm font-semibold">Thay đổi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="py-20 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    <p className="text-xs text-muted-foreground">Đang tải thao tác đơn hàng...</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center text-sm text-muted-foreground">
                  Không có thao tác nào phù hợp với bộ lọc.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((event) => {
                const transition = statusTransition(event);
                return (
                  <TableRow key={event.id} className="align-top hover:bg-muted/30">
                    <TableCell className="text-xs text-muted-foreground">
                      {formatVietnamDateTime(event.occurredAt)}
                    </TableCell>
                    <TableCell className="text-sm">{actorLabel(event)}</TableCell>
                    <TableCell>
                      <div className="flex flex-col items-start gap-1">
                        <span className="text-sm font-medium">
                          {eventTypeLabel(event.type, event.metadata)}
                        </span>
                        {transition && <Badge variant="outline">{transition}</Badge>}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      <Link
                        href={`/sales/orders/${event.orderId}`}
                        className="font-medium text-primary underline-offset-4 hover:underline"
                      >
                        {event.orderCode}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <ActivityDetail event={event} />
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {totalItems > 0 && (
        <DataTablePagination
          page={currentPage}
          pageCount={totalPages}
          pageSize={pageSize}
          total={totalItems}
          unit="thao tác"
          disabled={loading}
          onPageChange={setCurrentPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            resetPage();
          }}
        />
      )}
    </div>
  );
}
