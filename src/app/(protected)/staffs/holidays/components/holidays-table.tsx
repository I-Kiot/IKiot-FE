"use client";

import { flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { Search } from "lucide-react";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { getVietnamDateString } from "@/app/(protected)/staffs/shared/vietnam-datetime";
import { holidaysColumns } from "./holidays-columns";
import { HolidaysEmpty } from "./holidays-empty";
import { useHolidays } from "./holidays-provider";

const currentYear = Number(getVietnamDateString().slice(0, 4));
const YEAR_OPTIONS = Array.from({ length: 11 }, (_, index) => currentYear + 5 - index);

export function HolidaysTable() {
  const {
    holidays,
    isInitialLoading,
    isFetching,
    total,
    totalPages,
    listQuery,
    nameInput,
    setNameInput,
    updateYear,
    updateStatusFilter,
    updatePage,
    updatePageSize,
  } = useHolidays();

  const table = useReactTable({
    data: holidays,
    columns: holidaysColumns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: totalPages,
    state: {
      pagination: {
        pageIndex: listQuery.page - 1,
        pageSize: listQuery.limit,
      },
    },
  });

  const rangeStart =
    total === 0 ? 0 : (listQuery.page - 1) * listQuery.limit + 1;
  const rangeEnd = Math.min(listQuery.page * listQuery.limit, total);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-56 flex-1 sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={nameInput}
            onChange={(event) => setNameInput(event.target.value)}
            placeholder="Tìm theo tên ngày lễ..."
            className="h-9 pl-9"
          />
        </div>
        <Select
          value={String(listQuery.year)}
          onValueChange={(value) => updateYear(Number(value))}
        >
          <SelectTrigger className="h-9 w-32 cursor-pointer">
            <SelectValue placeholder="Năm" />
          </SelectTrigger>
          <SelectContent>
            {YEAR_OPTIONS.map((year) => (
              <SelectItem key={year} value={String(year)}>
                Năm {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={listQuery.isActive}
          onValueChange={(value) =>
            updateStatusFilter(value as typeof listQuery.isActive)
          }
        >
          <SelectTrigger className="h-9 w-44 cursor-pointer">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả trạng thái</SelectItem>
            <SelectItem value="active">Đang áp dụng</SelectItem>
            <SelectItem value="inactive">Đã tắt</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div
        className={cn(
          "relative rounded-md border transition-opacity",
          isFetching && holidays.length > 0 && "opacity-60",
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
            {isInitialLoading ? (
              Array.from({ length: 6 }).map((_, rowIndex) => (
                <TableRow key={rowIndex}>
                  {holidaysColumns.map((_, cellIndex) => (
                    <TableCell key={cellIndex}>
                      <Skeleton className="h-5 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={holidaysColumns.length}>
                  <HolidaysEmpty />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 py-2">
        <div className="flex items-center gap-2">
          <Label className="text-sm font-medium">Hiển thị</Label>
          <Select
            value={String(listQuery.limit)}
            onValueChange={(value) => updatePageSize(Number(value))}
          >
            <SelectTrigger className="w-20 cursor-pointer">
              <SelectValue />
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 20, 30, 50].map((limit) => (
                <SelectItem key={limit} value={String(limit)}>
                  {limit}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <span className="text-sm text-muted-foreground">
          {total === 0
            ? "Không có ngày lễ"
            : `Hiển thị ${rangeStart}–${rangeEnd} / ${total} ngày lễ`}
        </span>
        <div className="flex items-center gap-2">
          <span className="hidden text-sm font-medium sm:block">
            Trang {listQuery.page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="cursor-pointer"
            disabled={listQuery.page <= 1 || isFetching}
            onClick={() => updatePage(listQuery.page - 1)}
          >
            Trước
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="cursor-pointer"
            disabled={listQuery.page >= totalPages || isFetching}
            onClick={() => updatePage(listQuery.page + 1)}
          >
            Tiếp
          </Button>
        </div>
      </div>
    </div>
  );
}
