"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import {
  type ColumnFiltersState,
  type ExpandedState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Funnel, Search } from "lucide-react";
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
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { parseLocationKey } from "@/lib/location-key";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import { MovementExpandedPanel } from "@/app/(protected)/exchange/shared/movement-expanded-panel";
import { useImports } from "./imports-provider";
import { importsColumns as columns } from "./imports-columns";

const COLUMN_LABELS: Record<string, string> = {
  id: "Mã đơn",
  supplierName: "Nguồn hàng",
  toLocationName: "Nơi nhận",
  totalItems: "Số mặt hàng",
  totalValue: "Giá trị",
  requestedByName: "Người tạo",
  requestedByPhone: "SĐT người tạo",
  createdAt: "Ngày tạo",
  status: "Trạng thái",
};

export function ImportsTable() {
  const {
    imports,
    isLoading,
    statusFilter,
    setStatusFilter,
    handleUpdateDetails,
    handleShip,
    handleReceive,
    handleCancel,
  } = useImports();

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [globalFilter, setGlobalFilter] = useState("");
  const [expanded, setExpanded] = useState<ExpandedState>({});
  const [fromFilter, setFromFilter] = useState("ALL");
  const [toFilter, setToFilter] = useState("ALL");
  const locationKey = useAuthStore((s) => s.locationKey);
  const scopedLocationId = useMemo(
    () => parseLocationKey(locationKey)?.locationId,
    [locationKey],
  );

  // Tenant switch BR/WH → khóa filter nơi nhận theo location đang chọn.
  useEffect(() => {
    if (scopedLocationId) {
      setToFilter(scopedLocationId);
      setFromFilter("ALL");
    } else {
      setToFilter("ALL");
      setFromFilter("ALL");
    }
  }, [scopedLocationId]);

  const fromOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const row of imports) {
      const id = row.fromSupplierId || row.fromLocationId;
      const name =
        row.supplierName ||
        row.fromLocationName ||
        id;
      if (id) map.set(id, name || id);
    }
    return [...map.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, "vi"));
  }, [imports]);

  const toOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const row of imports) {
      if (row.toLocationId) {
        map.set(row.toLocationId, row.toLocationName || row.toLocationId);
      }
    }
    if (scopedLocationId && !map.has(scopedLocationId)) {
      map.set(scopedLocationId, scopedLocationId);
    }
    return [...map.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, "vi"));
  }, [imports, scopedLocationId]);

  const filteredImports = useMemo(() => {
    return imports.filter((row) => {
      if (fromFilter !== "ALL") {
        const fromId = row.fromSupplierId || row.fromLocationId;
        if (fromId !== fromFilter) return false;
      }
      if (toFilter !== "ALL" && row.toLocationId !== toFilter) return false;
      return true;
    });
  }, [imports, fromFilter, toFilter]);

  const table = useReactTable({
    data: filteredImports,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    onExpandedChange: (updater) => {
      setExpanded((old) => {
        const prev = typeof old === "boolean" ? {} : old;
        const next = typeof updater === "function" ? updater(old) : updater;
        if (next === true) return next;
        const newlyOpened = Object.keys(next).filter(
          (key) => next[key] && !prev[key],
        );
        if (newlyOpened.length > 0) {
          return { [newlyOpened[0]]: true };
        }
        return next;
      });
    },
    initialState: {
      pagination: { pageSize: 10 },
    },
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
      expanded,
    },
  });

  const columnCount = table.getVisibleLeafColumns().length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-52 max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Tìm nguồn hàng, mã đơn..."
              value={globalFilter ?? ""}
              onChange={(e) => setGlobalFilter(String(e.target.value))}
              className="h-9 pl-9"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(value) =>
              setStatusFilter(value as typeof statusFilter)
            }
          >
            <SelectTrigger className="h-9 w-44 cursor-pointer text-sm">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PENDING">Chờ giao hàng</SelectItem>
              <SelectItem value="IN_TRANSIT">Đang vận chuyển</SelectItem>
              <SelectItem value="RECEIVED">Đã nhận hàng</SelectItem>
              <SelectItem value="CANCELLED">Đã huỷ</SelectItem>
              <SelectItem value="ALL">Tất cả</SelectItem>
            </SelectContent>
          </Select>
          <Select value={fromFilter} onValueChange={setFromFilter}>
            <SelectTrigger className="h-9 w-44 cursor-pointer text-sm">
              <SelectValue placeholder="Nơi gửi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả nơi gửi</SelectItem>
              {fromOptions.map((opt) => (
                <SelectItem key={opt.id} value={opt.id}>
                  {opt.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={toFilter}
            onValueChange={setToFilter}
            disabled={!!scopedLocationId}
          >
            <SelectTrigger className="h-9 w-44 cursor-pointer text-sm">
              <SelectValue placeholder="Nơi nhận" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả nơi nhận</SelectItem>
              {toOptions.map((opt) => (
                <SelectItem key={opt.id} value={opt.id}>
                  {opt.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 cursor-pointer">
              <Funnel />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((col) => col.getCanHide())
              .map((col) => (
                <DropdownMenuCheckboxItem
                  key={col.id}
                  className="capitalize"
                  checked={col.getIsVisible()}
                  onCheckedChange={(value) => col.toggleVisibility(!!value)}
                >
                  {COLUMN_LABELS[col.id] ?? col.id}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading && <DataTableLoading columnCount={columnCount} />}
            {!isLoading && table.getRowModel().rows.length === 0 && (
              <DataTableEmpty columnCount={columnCount} />
            )}
            {!isLoading && (
              table.getRowModel().rows.map((row) => {
                const isExpanded = row.getIsExpanded();
                const hasExpandedRow = table
                  .getRowModel()
                  .rows.some((item) => item.getIsExpanded());
                return (
                  <Fragment key={row.id}>
                    <TableRow
                      data-state={row.getIsSelected() ? "selected" : undefined}
                      onClick={() => row.toggleExpanded()}
                      className={cn(
                        "cursor-pointer transition-colors",
                        isExpanded
                          ? "bg-muted border-l-2 border-l-foreground/40"
                          : hasExpandedRow
                            ? "opacity-55 hover:opacity-100"
                            : "hover:bg-muted/40",
                      )}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell
                          key={cell.id}
                          onClick={
                            cell.column.id === "select"
                              ? (e) => e.stopPropagation()
                              : undefined
                          }
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                    {isExpanded ? (
                      <TableRow className="border-transparent bg-muted/40 hover:bg-muted/40">
                        <TableCell
                          colSpan={row.getVisibleCells().length}
                          className="p-0"
                        >
                          <div className="px-3 pb-3 pt-1">
                            <MovementExpandedPanel
                              mode="import"
                              request={row.original}
                              isExpanded
                              importActions={{
                                handleUpdateDetails,
                                handleShip,
                                handleReceive,
                                handleCancel,
                              }}
                            />
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

      <DataTablePagination
        page={table.getState().pagination.pageIndex + 1}
        pageCount={table.getPageCount()}
        pageSize={table.getState().pagination.pageSize}
        total={table.getFilteredRowModel().rows.length}
        unit="đơn nhập"
        onPageChange={(page) => table.setPageIndex(page - 1)}
        onPageSizeChange={(pageSize) => {
          table.setPageSize(pageSize);
          table.setPageIndex(0);
        }}
      />
    </div>
  );
}
