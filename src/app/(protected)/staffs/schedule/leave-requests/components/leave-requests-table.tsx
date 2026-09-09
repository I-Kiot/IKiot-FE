"use client";

import { Fragment, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  type ExpandedState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Funnel, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { cn } from "@/lib/utils";
import { leaveRequestsColumns as columns } from "./leave-requests-columns";
import { LeaveRequestsEmpty } from "./leave-requests-empty";
import { LeaveRequestsExpandedPanel } from "./leave-requests-expanded-panel";
import { useLeaveRequests } from "./leave-requests-provider";

const COLUMN_LABELS: Record<string, string> = {
  staffName: "Nhân viên",
  kind: "Phân loại",
  duration: "Khoảng thời gian",
  createdAt: "Ngày tạo",
  reason: "Lý do",
  status: "Trạng thái",
};

export function LeaveRequestsTable() {
  const {
    leaveRequests,
    isInitialLoading,
    isFetching,
    total,
    totalPages,
    listQuery,
    updateStatusFilter,
    updateKeywordFilter,
    updatePage,
    updatePageSize,
  } = useLeaveRequests();

  const params = useParams();
  const targetId = params.id as string | undefined;

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [keywordInput, setKeywordInput] = useState(listQuery.search);
  const [expanded, setExpanded] = useState<ExpandedState>({});
  const [rowSelection, setRowSelection] = useState({});

  useEffect(() => {
    if (targetId) {
      setExpanded({ [targetId]: true });
    } else {
      setExpanded({});
    }
  }, [targetId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (keywordInput !== listQuery.search) {
        updateKeywordFilter(keywordInput);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [keywordInput, listQuery.search, updateKeywordFilter]);

  const table = useReactTable({
    data: leaveRequests,
    columns,
    getRowId: (row) => row.id,
    pageCount: totalPages,
    manualPagination: true,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onExpandedChange: setExpanded,
    onRowSelectionChange: setRowSelection,
    enableRowSelection: true,
    state: {
      columnVisibility,
      expanded,
      rowSelection,
      pagination: {
        pageIndex: listQuery.page - 1,
        pageSize: listQuery.limit,
      },
    },
  });

  const isLoading = isInitialLoading || isFetching;
  const rangeStart =
    total === 0 ? 0 : (listQuery.page - 1) * listQuery.limit + 1;
  const rangeEnd = Math.min(
    listQuery.page * listQuery.limit,
    total,
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-48 max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Tìm theo tên nhân viên, lý do..."
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <Select
            value={listQuery.status}
            onValueChange={(value) =>
              updateStatusFilter(value as typeof listQuery.status)
            }
          >
            <SelectTrigger className="cursor-pointer w-40 h-9 text-sm">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              <SelectItem value="PENDING">Chờ duyệt</SelectItem>
              <SelectItem value="APPROVED">Đã duyệt</SelectItem>
              <SelectItem value="REJECTED">Từ chối</SelectItem>
              <SelectItem value="CANCELLED">Đã hủy</SelectItem>
              <SelectItem value="EXPIRED">Hết hạn</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="cursor-pointer h-9">
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
                  className="capitalize"
                  checked={column.getIsVisible()}
                  onCheckedChange={(value) => column.toggleVisibility(!!value)}
                >
                  {COLUMN_LABELS[column.id] ?? column.id}
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
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  {columns.map((_, cellIndex) => (
                    <TableCell key={cellIndex}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row, index, rows) => (
                <Fragment key={row.id}>
                  <TableRow
                    data-state={row.getIsSelected() ? "selected" : undefined}
                    onClick={() => row.toggleExpanded()}
                    className={cn(
                      "cursor-pointer",
                      index === rows.length - 1 && "border-b-0",
                      row.getIsExpanded() &&
                        "bg-primary/15 shadow-[inset_0_1px_0_hsl(var(--primary)/0.7),inset_1px_0_0_hsl(var(--primary)/0.7),inset_-1px_0_0_hsl(var(--primary)/0.7)]",
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
                  <TableRow
                    className={cn(
                      "border-transparent transition-colors duration-300 hover:bg-transparent",
                      row.getIsExpanded() &&
                        "shadow-[inset_0_-1px_0_hsl(var(--primary)/0.7),inset_1px_0_0_hsl(var(--primary)/0.7),inset_-1px_0_0_hsl(var(--primary)/0.7)]",
                    )}
                  >
                    <TableCell
                      colSpan={row.getVisibleCells().length}
                      className="p-0"
                    >
                      <div
                        className={cn(
                          "grid transition-[grid-template-rows] duration-300 ease-in-out",
                          row.getIsExpanded()
                            ? "grid-rows-[1fr]"
                            : "grid-rows-[0fr]",
                        )}
                      >
                        <div className="overflow-hidden">
                          {row.getIsExpanded() && (
                            <LeaveRequestsExpandedPanel
                              request={row.original}
                              isLastRow={index === rows.length - 1}
                            />
                          )}
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                </Fragment>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length}>
                  <LeaveRequestsEmpty />
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
            value={`${listQuery.limit}`}
            onValueChange={(value) => updatePageSize(Number(value))}
          >
            <SelectTrigger className="w-20 cursor-pointer">
              <SelectValue placeholder={listQuery.limit} />
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
        <div className="hidden sm:block text-sm text-muted-foreground">
          {total === 0
            ? "Không có đơn nghỉ phép"
            : `Hiển thị ${rangeStart}–${rangeEnd} / ${total} đơn nghỉ phép`}
        </div>
        <div className="flex items-center space-x-2">
          <span className="hidden sm:block text-sm font-medium">
            Trang{" "}
            <strong>
              {listQuery.page} / {totalPages || 1}
            </strong>
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => updatePage(listQuery.page - 1)}
            disabled={listQuery.page <= 1 || isLoading}
            className="cursor-pointer"
          >
            Trước
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => updatePage(listQuery.page + 1)}
            disabled={listQuery.page >= totalPages || isLoading}
            className="cursor-pointer"
          >
            Tiếp
          </Button>
        </div>
      </div>
    </div>
  );
}
