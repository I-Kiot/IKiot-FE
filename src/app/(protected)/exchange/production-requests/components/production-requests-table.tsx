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
import { productionRequestApi } from "@/lib/api/production-request";
import { getApiErrorBody } from "@/lib/api/error-codes";
import {
  PRODUCTION_REQUEST_STATUS_LABELS,
  type ProductionRequest,
  type ProductionRequestStatus,
} from "@/types/order-flow";
import {
  formatDate,
  formatDateTime,
  requestProgress,
  requestStatusDisplay,
} from "../shared/production-display";
import { ProductionRequestDetailDialog } from "./production-request-detail-dialog";
import { ProductionRequestFormDialog } from "./production-request-form-dialog";

const DEFAULT_PAGE_SIZE = 10;
const ALL = "ALL";

/** B-6: the production-request list (`GET /production-requests`, contract §3). */
export function ProductionRequestsTable() {
  const canCreate = allows(getSessionRole(), "production_requests", "create");

  const [page, setPage] = React.useState(1);

  const [pageSize, setPageSize] = React.useState(DEFAULT_PAGE_SIZE);
  const [status, setStatus] = React.useState<string>(ALL);
  const [search, setSearch] = React.useState("");
  const [term, setTerm] = React.useState("");
  const [reloads, setReloads] = React.useState(0);
  const [creating, setCreating] = React.useState(false);
  const [selected, setSelected] = React.useState<ProductionRequest | null>(null);
  // Tagged with the query it answered: while the tag differs, a newer request is in flight.
  const query = `${page}|${pageSize}|${status}|${term}|${reloads}`;
  const [loaded, setLoaded] = React.useState<{
    query: string;
    rows: ProductionRequest[];
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
    productionRequestApi
      .getList({
        page,
        limit: pageSize,
        ...(status !== ALL ? { status: status as ProductionRequestStatus } : {}),
        ...(term ? { search: term } : {}),
      })
      .then((result) => {
        if (!stale) setLoaded({ query, rows: result.data, total: result.pagination.total });
      })
      .catch((error) => {
        if (stale) return;
        toast.error(getApiErrorBody(error)?.message ?? "Không tải được yêu cầu sản xuất");
        setLoaded({ query, rows: [], total: 0 });
      });
    return () => {
      stale = true;
    };
  }, [page, pageSize, status, term, query]);

  const pages = Math.ceil(total / pageSize);

  const replaceRow = (updated: ProductionRequest) =>
    setLoaded((prev) =>
      prev
        ? { ...prev, rows: prev.rows.map((row) => (row.id === updated.id ? updated : row)) }
        : prev,
    );

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
            setStatus(value);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Tất cả trạng thái</SelectItem>
            {(Object.keys(PRODUCTION_REQUEST_STATUS_LABELS) as ProductionRequestStatus[]).map(
              (value) => (
                <SelectItem key={value} value={value}>
                  {PRODUCTION_REQUEST_STATUS_LABELS[value]}
                </SelectItem>
              ),
            )}
          </SelectContent>
        </Select>
        {canCreate && (
          <Button className="ml-auto" onClick={() => setCreating(true)}>
            <Plus className="size-4" />
            Tạo yêu cầu
          </Button>
        )}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã</TableHead>
              <TableHead>Xưởng</TableHead>
              <TableHead>Nơi nhận</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right">Đã nhận / đặt</TableHead>
              <TableHead>Hẹn xong</TableHead>
              <TableHead>Ngày tạo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              const display = requestStatusDisplay(row.status, row.closedShort);
              const progress = requestProgress(row);
              return (
                <TableRow key={row.id} className="cursor-pointer" onClick={() => setSelected(row)}>
                  <TableCell className="font-medium">{row.code}</TableCell>
                  <TableCell>{row.supplier.supplierName}</TableCell>
                  <TableCell>{row.location.name}</TableCell>
                  <TableCell>
                    <Badge variant={display.variant}>{display.label}</Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {progress.received}/{progress.ordered}
                  </TableCell>
                  <TableCell>{formatDate(row.expectedReadyDate)}</TableCell>
                  <TableCell>{formatDateTime(row.createdAt)}</TableCell>
                </TableRow>
              );
            })}
            {!loading && rows.length === 0 && <DataTableEmpty columnCount={7} />}
            {loading && rows.length === 0 && <DataTableLoading columnCount={7} />}
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

      {creating && (
        <ProductionRequestFormDialog
          open
          onOpenChange={setCreating}
          onSaved={(created) => {
            setCreating(false);
            setSelected(created);
            setReloads((n) => n + 1);
          }}
        />
      )}
      <ProductionRequestDetailDialog
        key={selected ? `${selected.id}:${selected.status}:${selected.updatedAt}` : "none"}
        request={selected}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
        onChanged={(updated) => {
          setSelected(updated);
          replaceRow(updated);
        }}
        onDeleted={() => {
          setSelected(null);
          setReloads((n) => n + 1);
        }}
      />
    </div>
  );
}
