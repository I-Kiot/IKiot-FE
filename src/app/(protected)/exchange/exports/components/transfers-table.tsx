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
    requestedByPhone: "SĐT người yêu cầu",
    createdAt: "Ngày tạo",
    status: "Trạng thái",
  };

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

  const columnCount = table.getVisibleLeafColumns().length;

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
                              mode="transfer"
                              request={row.original}
                              isExpanded
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
            )}
          </TableBody>
        </Table>
      </div>

      <DataTablePagination
        page={table.getState().pagination.pageIndex + 1}
        pageCount={table.getPageCount()}
        pageSize={table.getState().pagination.pageSize}
        total={table.getFilteredRowModel().rows.length}
        unit="yêu cầu"
        onPageChange={(page) => table.setPageIndex(page - 1)}
        onPageSizeChange={(pageSize) => {
          table.setPageSize(pageSize);
          table.setPageIndex(0);
        }}
      />
    </div>
  );
}
