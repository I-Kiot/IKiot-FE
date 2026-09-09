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
import { Funnel, PackageOpen, Search } from "lucide-react";
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
import { MovementExpandedPanel } from "@/app/(protected)/exchange/shared/movement-expanded-panel";
import { useTransfers } from "./transfers-provider";
import { createTransfersColumns } from "./transfers-columns";

export function TransfersTable() {
  const {
    transfers,
    isLoading,
    statusFilter,
    setStatusFilter,
    labels,
    handleOpen,
    handleSubmitFromOpening,
    handleShipFromOpening,
    handleShip,
    handleReceive,
    handleCancel,
    handleReturnGoods,
  } = useTransfers();

  const columns = useMemo(
    () => createTransfersColumns(labels),
    [labels],
  );

  const columnLabels: Record<string, string> = {
    id: "Mã yêu cầu",
    fromLocationName: labels.fromColumnHeader,
    toLocationName: labels.toColumnHeader,
    totalItems: "Số mặt hàng",
    totalQty: "Tổng SL",
    requestedByName: "Người yêu cầu",
    createdAt: "Ngày tạo",
    status: "Trạng thái",
  };

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    requestedByName: false,
  });
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

  // Tenant switch BR/WH → reset filter thủ công; scope áp qua scopedLocationId (from OR to).
  useEffect(() => {
    setFromFilter("ALL");
    setToFilter("ALL");
  }, [scopedLocationId]);

  const fromOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const row of transfers) {
      if (row.fromLocationId) {
        map.set(
          row.fromLocationId,
          row.fromLocationName || row.fromLocationId,
        );
      }
    }
    return [...map.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, "vi"));
  }, [transfers]);

  const toOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const row of transfers) {
      if (row.toLocationId) {
        map.set(row.toLocationId, row.toLocationName || row.toLocationId);
      }
    }
    return [...map.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, "vi"));
  }, [transfers]);

  const filteredTransfers = useMemo(() => {
    return transfers.filter((row) => {
      // Khi đứng ở 1 BR/WH: chỉ phiếu liên quan (gửi hoặc nhận tại location đó).
      if (scopedLocationId) {
        const involves =
          row.fromLocationId === scopedLocationId ||
          row.toLocationId === scopedLocationId;
        if (!involves) return false;
      }
      if (fromFilter !== "ALL" && row.fromLocationId !== fromFilter) return false;
      if (toFilter !== "ALL" && row.toLocationId !== toFilter) return false;
      return true;
    });
  }, [transfers, fromFilter, toFilter, scopedLocationId]);

  const table = useReactTable({
    data: filteredTransfers,
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-52 max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={labels.searchPlaceholder}
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
              <SelectItem value="DRAFT">Nháp / cần xử lý</SelectItem>
              <SelectItem value="OPENING">Đang soạn</SelectItem>
              <SelectItem value="CLOSED">Đã chốt</SelectItem>
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
          <Select value={toFilter} onValueChange={setToFilter}>
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
                  {columnLabels[col.id] ?? col.id}
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
                              mode="transfer"
                              request={row.original}
                              isExpanded
                              onClose={() => row.toggleExpanded(false)}
                              transferActions={{
                                handleOpen,
                                handleSubmitFromOpening,
                                handleShipFromOpening,
                                handleShip,
                                handleReceive,
                                handleCancel,
                                handleReturnGoods,
                                labels,
                              }}
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
                    <PackageOpen className="mb-4 size-12 text-muted-foreground" />
                    <h3 className="mb-1 text-base font-semibold">
                      {labels.emptyState}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Chưa có yêu cầu nào phù hợp bộ lọc hiện tại.
                    </p>
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
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="hidden text-sm text-muted-foreground sm:block">
          Đã chọn {table.getFilteredSelectedRowModel().rows.length} /{" "}
          {table.getFilteredRowModel().rows.length} yêu cầu
        </div>
        <div className="flex items-center space-x-2">
          <span className="hidden text-sm font-medium sm:block">
            Trang{" "}
            <strong>
              {table.getState().pagination.pageIndex + 1} /{" "}
              {table.getPageCount() || 1}
            </strong>
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="cursor-pointer"
          >
            Trước
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="cursor-pointer"
          >
            Tiếp
          </Button>
        </div>
      </div>
    </div>
  );
}
