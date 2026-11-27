"use client";

import { flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { Search } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { getVietnamDateString } from "@/app/(protected)/staffs/shared/vietnam-datetime";
import { holidaysColumns } from "./holidays-columns";
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


  const columnCount = table.getVisibleLeafColumns().length;

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
            {isInitialLoading && <DataTableLoading columnCount={columnCount} />}
            {!isInitialLoading && table.getRowModel().rows.length === 0 && (
              <DataTableEmpty columnCount={columnCount} />
            )}
            {!isInitialLoading && (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
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
        unit="ngày lễ"
        disabled={isFetching}
        onPageChange={updatePage}
        onPageSizeChange={updatePageSize}
      />
    </div>
  );
}
