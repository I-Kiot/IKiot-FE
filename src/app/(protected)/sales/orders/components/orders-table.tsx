"use client";

import { Fragment, useState } from "react";
import {
  type ExpandedState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Funnel, RotateCcw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { DataTableEmpty } from "@/components/data-table/data-table-empty";
import { DataTableLoading } from "@/components/data-table/data-table-loading";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { cn } from "@/lib/utils";
import {
  ORDER_PRIORITIES,
  ORDER_PRIORITY_LABELS,
  ORDER_STATUS_LABELS,
  REMITTANCE_STATUS_LABELS,
  STOCK_CHECK_STATUSES,
  STOCK_CHECK_STATUS_LABELS,
  type OrderPriority,
  type OrderSort,
  type OrderStatus,
  type RemittanceStatus,
  type StockCheckStatus,
} from "@/types/order-flow";
import { ORDERS_COLUMN_LABELS, ordersColumns as columns } from "./orders-columns";
import { OrdersExpandedPanel } from "./orders-expanded-panel";
import { useOrders } from "./orders-provider";

/** The statuses the journey list filters by, in journey order. POS's legacy PENDING is left out. */
const STATUS_FILTER_OPTIONS: OrderStatus[] = [
  "PENDING_CONFIRMATION",
  "CONFIRMED",
  "PACKED",
  "PICKED_UP",
  "SHIPPING",
  "RECEIVED",
  "COMPLETED",
  "CANCELLED",
  "RETURNED",
];

const SORT_LABELS: Record<OrderSort, string> = {
  createdAt: "Mới tạo nhất",
  requestedDeliveryDate: "Hẹn giao sớm nhất",
  priority: "Ưu tiên cao nhất",
};

export function OrdersTable() {
  const {
    orders,
    isInitialLoading,
    isFetching,
    total,
    totalPages,
    listQuery,
    keywordInput,
    setKeywordInput,
    updateQuery,
    updatePage,
    resetFilters,
  } = useOrders();

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [expanded, setExpanded] = useState<ExpandedState>({});

  const table = useReactTable({
    data: orders,
    columns,
    getRowId: (row) => row.id,
    pageCount: totalPages,
    manualPagination: true,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getRowCanExpand: () => true,
    onColumnVisibilityChange: setColumnVisibility,
    onExpandedChange: setExpanded,
    state: {
      columnVisibility,
      expanded,
      pagination: { pageIndex: listQuery.page - 1, pageSize: listQuery.limit },
    },
  });

  const isFiltered =
    listQuery.search !== "" ||
    listQuery.status !== "all" ||
    listQuery.priority !== "all" ||
    listQuery.stockSummary !== "all" ||
    listQuery.cashRemittanceStatus !== "all" ||
    listQuery.mineOnly;


  const columnCount = table.getVisibleLeafColumns().length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-48 max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Mã đơn, tên, SĐT khách..."
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              className="h-9 pl-9"
            />
          </div>

          <Select
            value={listQuery.status}
            onValueChange={(value) => updateQuery({ status: value as OrderStatus | "all" })}
          >
            <SelectTrigger className="h-9 w-44 cursor-pointer text-sm">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              {STATUS_FILTER_OPTIONS.map((status) => (
                <SelectItem key={status} value={status}>
                  {ORDER_STATUS_LABELS[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={listQuery.priority}
            onValueChange={(value) =>
              updateQuery({ priority: value as OrderPriority | "all" })
            }
          >
            <SelectTrigger className="h-9 w-44 cursor-pointer text-sm">
              <SelectValue placeholder="Ưu tiên" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Mọi mức ưu tiên</SelectItem>
              {ORDER_PRIORITIES.map((priority) => (
                <SelectItem key={priority} value={priority}>
                  {ORDER_PRIORITY_LABELS[priority]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={listQuery.stockSummary}
            onValueChange={(value) =>
              updateQuery({ stockSummary: value as StockCheckStatus | "all" })
            }
          >
            <SelectTrigger className="h-9 w-48 cursor-pointer text-sm">
              <SelectValue placeholder="Tồn kho" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Mọi tình trạng hàng</SelectItem>
              {STOCK_CHECK_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {STOCK_CHECK_STATUS_LABELS[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={listQuery.cashRemittanceStatus}
            onValueChange={(value) =>
              updateQuery({ cashRemittanceStatus: value as RemittanceStatus | "all" })
            }
          >
            <SelectTrigger className="h-9 w-44 cursor-pointer text-sm">
              <SelectValue placeholder="Tiền shipper" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Mọi tình trạng tiền</SelectItem>
              <SelectItem value="PENDING">{REMITTANCE_STATUS_LABELS.PENDING}</SelectItem>
              <SelectItem value="RECEIVED">{REMITTANCE_STATUS_LABELS.RECEIVED}</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={listQuery.sort}
            onValueChange={(value) => updateQuery({ sort: value as OrderSort })}
          >
            <SelectTrigger className="h-9 w-44 cursor-pointer text-sm">
              <SelectValue placeholder="Sắp xếp" />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(SORT_LABELS) as OrderSort[]).map((sort) => (
                <SelectItem key={sort} value={sort}>
                  {SORT_LABELS[sort]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2 px-1">
            <Checkbox
              id="orders-mine-only"
              checked={listQuery.mineOnly}
              onCheckedChange={(checked) => updateQuery({ mineOnly: checked === true })}
            />
            <Label htmlFor="orders-mine-only" className="cursor-pointer text-sm font-normal">
              Đơn tôi phụ trách
            </Label>
          </div>

          {isFiltered && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="h-9 cursor-pointer"
            >
              <RotateCcw />
              Xoá lọc
            </Button>
          )}
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
              .filter((column) => column.getCanHide())
              .map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  checked={column.getIsVisible()}
                  onCheckedChange={(value) => column.toggleVisibility(!!value)}
                >
                  {ORDERS_COLUMN_LABELS[column.id] ?? column.id}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div
        className={cn(
          "relative rounded-md border transition-opacity",
          isFetching && orders.length > 0 && "opacity-60",
        )}
      >
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
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
            {isInitialLoading && <DataTableLoading columnCount={columnCount} />}
            {!isInitialLoading && table.getRowModel().rows.length === 0 && (
              <DataTableEmpty columnCount={columnCount} />
            )}
            {!isInitialLoading && (
              table.getRowModel().rows.map((row, index, rows) => (
                <Fragment key={row.id}>
                  <TableRow
                    onClick={() => row.toggleExpanded()}
                    className={cn(
                      "cursor-pointer",
                      index === rows.length - 1 && "border-b-0",
                      row.getIsExpanded() &&
                        "bg-primary/15 shadow-[inset_0_1px_0_hsl(var(--primary)/0.7),inset_1px_0_0_hsl(var(--primary)/0.7),inset_-1px_0_0_hsl(var(--primary)/0.7)]",
                    )}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow
                    className={cn(
                      "border-transparent transition-colors duration-300 hover:bg-transparent",
                      row.getIsExpanded() &&
                        "shadow-[inset_0_-1px_0_hsl(var(--primary)/0.7),inset_1px_0_0_hsl(var(--primary)/0.7),inset_-1px_0_0_hsl(var(--primary)/0.7)]",
                    )}
                  >
                    <TableCell colSpan={row.getVisibleCells().length} className="p-0">
                      <div
                        className={cn(
                          "sticky left-0 w-[100cqw] grid transition-[grid-template-rows] duration-300 ease-in-out",
                          row.getIsExpanded() ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                        )}
                      >
                        <div className="overflow-hidden">
                          {row.getIsExpanded() && (
                            <OrdersExpandedPanel
                              order={row.original}
                              isLastRow={index === rows.length - 1}
                            />
                          )}
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                </Fragment>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <DataTablePagination
        page={listQuery.page}
        pageCount={totalPages}
        pageSize={listQuery.limit}
        total={total}
        unit="đơn"
        disabled={isFetching}
        onPageChange={updatePage}
        onPageSizeChange={(limit) => updateQuery({ limit })}
      />
    </div>
  );
}
