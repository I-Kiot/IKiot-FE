"use client";

import { Fragment, useState } from "react";
import { ChevronRight, MessageSquareText, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
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
import { cn, formatDateTime } from "@/lib/utils";
import {
  PRODUCTION_REQUEST_STATUS_LABELS,
  type ProductionRequest,
  type ProductionRequestStatus,
} from "@/types/order-flow";
import { useProduction } from "./production-provider";
import { STATUS_BADGE, formatDay } from "./production-format";
import { ProductionRequestCard } from "./production-request-card";

const COLUMN_COUNT = 9;

function progressOf(request: ProductionRequest) {
  const ordered = request.items.reduce((sum, line) => sum + line.quantity, 0);
  const received = request.items.reduce(
    (sum, line) => sum + line.receivedQuantity,
    0,
  );
  return { ordered, received };
}

/** The production requests - the screen's main table. Expanding a row shows its lines and every action its status allows. */
export function ProductionRequestsTable() {
  const {
    requests,
    requestsLoading,
    filter,
    setFilter,
    locations,
    scopedLocationId,
  } = useProduction();
  const [expanded, setExpanded] = useState<string | null>(null);
  const { page, totalPages, total } = requests.pagination;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-52 max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tìm mã YCSX..."
            value={filter.search}
            onChange={(e) => setFilter({ search: e.target.value })}
            className="h-9 pl-9"
          />
        </div>
        <Select
          value={filter.status}
          onValueChange={(status) =>
            setFilter({ status: status as ProductionRequestStatus | "ALL" })
          }
        >
          <SelectTrigger className="h-9 w-44 cursor-pointer text-sm">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
            {(
              Object.keys(
                PRODUCTION_REQUEST_STATUS_LABELS,
              ) as ProductionRequestStatus[]
            ).map((s) => (
              <SelectItem key={s} value={s}>
                {PRODUCTION_REQUEST_STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filter.locationId}
          onValueChange={(locationId) => setFilter({ locationId })}
          disabled={!!scopedLocationId}
        >
          <SelectTrigger className="h-9 w-48 cursor-pointer text-sm">
            <SelectValue placeholder="Nơi nhận" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tất cả nơi nhận</SelectItem>
            {locations
              .filter((l) => l.isSellable)
              .map((l) => (
                <SelectItem key={l.id} value={l.id}>
                  {l.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã YCSX</TableHead>
              <TableHead>Xưởng</TableHead>
              <TableHead>Nơi nhận</TableHead>
              <TableHead className="text-right">Số mặt hàng</TableHead>
              <TableHead className="text-right">Đã nhận / đã đặt</TableHead>
              <TableHead>Hẹn xong</TableHead>
              <TableHead>Ngày tạo</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {requestsLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: COLUMN_COUNT }).map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : requests.data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={COLUMN_COUNT}
                  className="py-10 text-center text-sm text-muted-foreground"
                >
                  Chưa có yêu cầu sản xuất nào.
                </TableCell>
              </TableRow>
            ) : (
              requests.data.map((request) => {
                const isOpen = expanded === request.id;
                const { ordered, received } = progressOf(request);
                const dimmed = expanded !== null && !isOpen;
                return (
                  <Fragment key={request.id}>
                    <TableRow
                      className={cn(
                        "cursor-pointer transition-colors",
                        isOpen
                          ? "bg-muted border-l-2 border-l-foreground/40"
                          : dimmed
                            ? "opacity-55 hover:opacity-100"
                            : "hover:bg-muted/40",
                      )}
                      onClick={() => setExpanded(isOpen ? null : request.id)}
                    >
                      <TableCell className="font-mono text-xs font-medium">
                        {request.code}
                      </TableCell>
                      <TableCell className="font-medium">
                        {request.supplier.supplierName}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">
                            {request.location.name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {request.location.type === "WAREHOUSE"
                              ? "Kho"
                              : "Chi nhánh"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {request.items.length}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {received}/{ordered}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDay(request.expectedReadyDate)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDateTime(request.createdAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge variant={STATUS_BADGE[request.status]}>
                            {PRODUCTION_REQUEST_STATUS_LABELS[request.status]}
                            {request.closedShort ? " (đóng thiếu)" : ""}
                          </Badge>
                          {request.note ? (
                            <Badge
                              variant="outline"
                              className="gap-1 font-normal text-muted-foreground"
                              title={request.note}
                            >
                              <MessageSquareText className="size-3" />
                              Ghi chú
                            </Badge>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        <ChevronRight
                          className={cn(
                            "size-4 text-muted-foreground transition-transform duration-200",
                            isOpen && "rotate-90",
                          )}
                        />
                      </TableCell>
                    </TableRow>
                    {isOpen ? (
                      <TableRow className="border-transparent bg-muted/40 hover:bg-muted/40">
                        <TableCell colSpan={COLUMN_COUNT} className="p-0">
                          <div className="px-3 pb-3 pt-1">
                            <ProductionRequestCard request={request} />
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </Fragment>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="text-muted-foreground">{total} yêu cầu</span>
        <div className="flex items-center gap-2">
          <Select
            value={`${filter.limit}`}
            onValueChange={(value) => setFilter({ limit: Number(value) })}
          >
            <SelectTrigger className="h-8 w-20 cursor-pointer">
              <SelectValue />
            </SelectTrigger>
            <SelectContent side="top">
              {[20, 50, 100].map((size) => (
                <SelectItem key={size} value={`${size}`}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span>
            Trang{" "}
            <strong>
              {page} / {totalPages || 1}
            </strong>
          </span>
          <Button
            variant="outline"
            size="sm"
            className="cursor-pointer"
            disabled={page <= 1}
            onClick={() => setFilter({ page: page - 1 })}
          >
            Trước
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="cursor-pointer"
            disabled={page >= totalPages}
            onClick={() => setFilter({ page: page + 1 })}
          >
            Tiếp
          </Button>
        </div>
      </div>
    </div>
  );
}
