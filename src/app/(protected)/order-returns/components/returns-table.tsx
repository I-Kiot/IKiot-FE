"use client";

import * as React from "react";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { allows } from "@/components/sidebar/constants/role-permissions";
import { getSessionRole } from "@/lib/auth";
import { orderReturnApi } from "@/lib/api/order-return";
import { getApiErrorBody } from "@/lib/api/error-codes";
import {
  ORDER_RETURN_STATUS_LABELS,
  type OrderReturn,
  type OrderReturnStatus,
} from "@/types/order-flow";
import { formatDateTime, returnReasonLabel, returnStatusDisplay } from "../shared/return-display";
import { CreateReturnDialog } from "./create-return-dialog";
import { ReturnDetailDialog } from "./return-detail-dialog";

const DEFAULT_PAGE_SIZE = 10;
const ALL = "ALL";

/** D-6: the return list (`GET /order-returns`) with create / receive / inspect / cancel (contract §5). */
export function ReturnsTable() {
  const role = getSessionRole();
  // Opening a return is also open to the order's person in charge, so the button is not hidden by
  // permission - the server answers ORDER_RETURN_DENIED to anyone else.
  const canInspect = allows(role, "returns", "inspect");
  const canCancel = allows(role, "returns", "cancel");

  const [page, setPage] = React.useState(1);

  const [pageSize, setPageSize] = React.useState(DEFAULT_PAGE_SIZE);
  const [status, setStatus] = React.useState<string>(ALL);
  const [search, setSearch] = React.useState("");
  const [term, setTerm] = React.useState("");
  /** Bumped after a change the list must re-read (a return was created). */
  const [reloads, setReloads] = React.useState(0);
  const [creating, setCreating] = React.useState(false);
  const [selected, setSelected] = React.useState<OrderReturn | null>(null);
  // What the last request returned, tagged with the query it answered: while the tag differs
  // from the current query a newer request is in flight, so `loading` needs no state of its own.
  const query = `${page}|${pageSize}|${status}|${term}|${reloads}`;
  const [loaded, setLoaded] = React.useState<{
    query: string;
    rows: OrderReturn[];
    total: number;
  } | null>(null);
  const loading = loaded?.query !== query;
  const rows = loaded?.rows ?? [];
  const total = loaded?.total ?? 0;

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setTerm(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  React.useEffect(() => {
    let stale = false;
    orderReturnApi
      .getList({
        page,
        limit: pageSize,
        ...(status !== ALL ? { status: status as OrderReturnStatus } : {}),
        ...(term ? { search: term } : {}),
      })
      .then((result) => {
        if (!stale) setLoaded({ query, rows: result.data, total: result.pagination.total });
      })
      .catch((error) => {
        if (stale) return;
        toast.error(getApiErrorBody(error)?.message ?? "Không tải được danh sách đơn hoàn");
        setLoaded({ query, rows: [], total: 0 });
      });
    return () => {
      stale = true;
    };
  }, [page, pageSize, status, term, query]);

  const pages = Math.ceil(total / pageSize);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder="Mã đơn hoàn, mã đơn, khách hàng"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <Select
          value={status}
          onValueChange={(value) => {
            setStatus(value);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Tất cả trạng thái</SelectItem>
            {(Object.keys(ORDER_RETURN_STATUS_LABELS) as OrderReturnStatus[]).map((value) => (
              <SelectItem key={value} value={value}>
                {ORDER_RETURN_STATUS_LABELS[value]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button className="ml-auto" onClick={() => setCreating(true)}>
          <Plus className="size-4" />
          Tạo đơn hoàn
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã đơn hoàn</TableHead>
              <TableHead>Đơn hàng</TableHead>
              <TableHead>Lý do</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right">Số dòng</TableHead>
              <TableHead>Ngày tạo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              const display = returnStatusDisplay(row.status);
              return (
                <TableRow
                  key={row.id}
                  className="cursor-pointer"
                  onClick={() => setSelected(row)}
                >
                  <TableCell className="font-medium">{row.code}</TableCell>
                  <TableCell>
                    <div>{row.order.code ?? row.order.id.slice(0, 8)}</div>
                    <div className="text-xs text-muted-foreground">{row.order.customerName}</div>
                  </TableCell>
                  <TableCell>{returnReasonLabel(row.reason)}</TableCell>
                  <TableCell>
                    <Badge variant={display.variant}>{display.label}</Badge>
                  </TableCell>
                  <TableCell className="text-right">{row.items.length}</TableCell>
                  <TableCell>{formatDateTime(row.createdAt)}</TableCell>
                </TableRow>
              );
            })}
            {!loading && rows.length === 0 && <DataTableEmpty columnCount={6} />}
            {loading && rows.length === 0 && <DataTableLoading columnCount={6} />}
          </TableBody>
        </Table>
      </div>

      <DataTablePagination
        page={page}
        pageCount={pages}
        pageSize={pageSize}
        total={total}
        unit="đơn hoàn"
        disabled={loading}
        onPageChange={setPage}
        onPageSizeChange={(nextPageSize) => {
          setPageSize(nextPageSize);
          setPage(1);
        }}
      />

      {/* Mounted only while open, so each opening starts from an empty form. */}
      {creating && (
        <CreateReturnDialog
          open
          onOpenChange={setCreating}
          onCreated={(created) => {
            setCreating(false);
            setSelected(created);
            setReloads((n) => n + 1);
          }}
        />
      )}
      <ReturnDetailDialog
        key={selected ? `${selected.id}:${selected.status}` : "none"}
        orderReturn={selected}
        canInspect={canInspect}
        canCancel={canCancel}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
        onChanged={(updated) => {
          setSelected(updated);
          setLoaded((prev) =>
            prev
              ? {
                  ...prev,
                  rows: prev.rows.map((row) => (row.id === updated.id ? updated : row)),
                }
              : prev,
          );
        }}
      />
    </div>
  );
}
