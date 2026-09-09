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
import { Funnel, PackageSearch, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { Skeleton } from "@/components/ui/skeleton";
import { parseLocationKey } from "@/lib/location-key";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import { useAdjustments } from "./adjustments-provider";
import { adjustmentsColumns as columns } from "./adjustments-columns";
import { AdjustmentsExpandedPanel } from "./adjustments-expanded-panel";

const COLUMN_LABELS: Record<string, string> = {
  id: "Mã phiếu",
  fromLocationName: "Kho / Chi nhánh",
  totalItems: "Số mặt hàng",
  totalQtyChange: "Tổng thay đổi SL",
  requestedByName: "Người tạo",
  createdAt: "Ngày tạo",
  status: "Trạng thái",
};

export function AdjustmentsTable() {
  const { adjustments, isLoading, statusFilter, setStatusFilter } = useAdjustments();

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({ requestedByName: false });
  const [rowSelection, setRowSelection] = useState({});
  const [globalFilter, setGlobalFilter] = useState("");
  const [expanded, setExpanded] = useState<ExpandedState>({});
  const [locationFilter, setLocationFilter] = useState("ALL");
  const locationKey = useAuthStore((s) => s.locationKey);
  const scopedLocationId = useMemo(
    () => parseLocationKey(locationKey)?.locationId,
    [locationKey],
  );

  useEffect(() => {
    setLocationFilter(scopedLocationId ?? "ALL");
  }, [scopedLocationId]);

  const locationOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const row of adjustments) {
      if (row.fromLocationId) {
        map.set(
          row.fromLocationId,
          row.fromLocationName || row.fromLocationId,
        );
      }
    }
    if (scopedLocationId && !map.has(scopedLocationId)) {
      map.set(scopedLocationId, scopedLocationId);
    }
    return [...map.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, "vi"));
  }, [adjustments, scopedLocationId]);

  const filteredAdjustments = useMemo(() => {
    if (locationFilter === "ALL") return adjustments;
    return adjustments.filter((row) => row.fromLocationId === locationFilter);
  }, [adjustments, locationFilter]);

  const table = useReactTable({
    data: filteredAdjustments,
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
        const newlyOpened = Object.keys(next).filter((key) => next[key] && !prev[key]);
        if (newlyOpened.length > 0) return { [newlyOpened[0]]: true };
        return next;
      });
    },
    initialState: { pagination: { pageSize: 10 } },
    state: { sorting, columnFilters, columnVisibility, rowSelection, globalFilter, expanded },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-52 max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Tìm theo kho, mã phiếu..."
              value={globalFilter ?? ""}
              onChange={(e) => setGlobalFilter(String(e.target.value))}
              className="h-9 pl-9"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}
          >
            <SelectTrigger className="h-9 w-44 cursor-pointer text-sm">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PENDING">Chờ duyệt</SelectItem>
              <SelectItem value="COMPLETED">Đã hoàn tất</SelectItem>
              <SelectItem value="CANCELLED">Đã huỷ</SelectItem>
              <SelectItem value="ALL">Tất cả</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={locationFilter}
            onValueChange={setLocationFilter}
            disabled={!!scopedLocationId}
          >
            <SelectTrigger className="h-9 w-48 cursor-pointer text-sm">
              <SelectValue placeholder="Kho / Chi nhánh" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả nơi gửi</SelectItem>
              {locationOptions.map((opt) => (
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
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {columns.map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => {
                const isExpanded = row.getIsExpanded();
                const hasExpandedRow = table.getRowModel().rows.some((r) => r.getIsExpanded());
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
                          onClick={cell.column.id === "select" ? (e) => e.stopPropagation() : undefined}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                    {isExpanded ? (
                      <TableRow className="border-transparent bg-muted/40 hover:bg-muted/40">
                        <TableCell colSpan={row.getVisibleCells().length} className="p-0">
                          <div className="px-3 pb-3 pt-1">
                            <AdjustmentsExpandedPanel
                              request={row.original}
                              isExpanded
                              onClose={() => row.toggleExpanded(false)}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </Fragment>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length}>
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <PackageSearch className="mb-4 size-12 text-muted-foreground" />
                    <h3 className="mb-1 text-base font-semibold">Không có phiếu điều chỉnh</h3>
                    <p className="text-sm text-muted-foreground">Chưa có phiếu nào phù hợp bộ lọc hiện tại.</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="flex items-center space-x-2">
          <Label className="text-sm font-medium">Hiển thị</Label>
          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(value) => table.setPageSize(Number(value))}
          >
            <SelectTrigger className="w-20 cursor-pointer">
              <SelectValue />
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 20, 30, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>{pageSize}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="hidden text-sm text-muted-foreground sm:block">
          Đã chọn {table.getFilteredSelectedRowModel().rows.length} / {table.getFilteredRowModel().rows.length} phiếu
        </div>
        <div className="flex items-center space-x-2">
          <span className="hidden text-sm font-medium sm:block">
            Trang <strong>{table.getState().pagination.pageIndex + 1} / {table.getPageCount() || 1}</strong>
          </span>
          <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} className="cursor-pointer">
            Trước
          </Button>
          <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} className="cursor-pointer">
            Tiếp
          </Button>
        </div>
      </div>
    </div>
  );
}
