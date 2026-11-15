"use client"

import type { ReactNode } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { formatNumber, formatVND, negativeClass } from "@/lib/stats-format"

export interface ReportColumn<T> {
  header: string
  /** Cột số căn phải. */
  numeric?: boolean
  className?: string
  cell: (row: T, index: number) => ReactNode
  /** Ô của dòng cộng cuối bảng; bảng chỉ có dòng cộng khi ít nhất một cột khai báo. */
  footer?: ReactNode
}

interface ReportTableProps<T> {
  title: string
  description?: string
  /** Bộ lọc riêng của bảng, đặt ở góc phải tiêu đề. */
  actions?: ReactNode
  columns: ReportColumn<T>[]
  rows: T[]
  rowKey: (row: T, index: number) => string
  /** Đang tải lần đầu (chưa có số liệu để hiện). */
  isLoading?: boolean
  emptyText?: string
  /** Dòng in đậm (dòng tổng nằm giữa bảng, như Doanh thu thuần). */
  isStrong?: (row: T) => boolean
  /** Ghi chú dưới bảng. */
  note?: ReactNode
}

/** Khung chung của mọi bảng báo cáo: tiêu đề, bảng số liệu, dòng cộng, ghi chú. */
export function ReportTable<T>({
  title,
  description,
  actions,
  columns,
  rows,
  rowKey,
  isLoading,
  emptyText = "Không có số liệu trong kỳ",
  isStrong,
  note,
}: ReportTableProps<T>) {
  const hasFooter = rows.length > 0 && columns.some((column) => column.footer !== undefined)

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
        <div className="space-y-1.5">
          <CardTitle>{title}</CardTitle>
          {description ? <CardDescription>{description}</CardDescription> : null}
        </div>
        {actions}
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-full" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((column) => (
                    <TableHead
                      key={column.header}
                      className={cn("whitespace-nowrap font-semibold", column.numeric && "text-right", column.className)}
                    >
                      {column.header}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="py-8 text-center text-sm text-muted-foreground">
                      {emptyText}
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row, index) => (
                    <TableRow key={rowKey(row, index)} className={cn(isStrong?.(row) && "bg-muted/40 font-semibold")}>
                      {columns.map((column) => (
                        <TableCell
                          key={column.header}
                          className={cn(column.numeric && "text-right tabular-nums", column.className)}
                        >
                          {column.cell(row, index)}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
              {hasFooter ? (
                <TableFooter>
                  <TableRow className="font-semibold">
                    {columns.map((column) => (
                      <TableCell
                        key={column.header}
                        className={cn(column.numeric && "text-right tabular-nums", column.className)}
                      >
                        {column.footer}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableFooter>
              ) : null}
            </Table>
          </div>
        )}
        {note ? <p className="text-xs text-muted-foreground">{note}</p> : null}
      </CardContent>
    </Card>
  )
}

/** Số tiền trong bảng: số âm tô đỏ. */
export function Money({ value }: { value: number }) {
  return <span className={negativeClass(value)}>{formatVND(value)}</span>
}

export const sumOf = <T,>(rows: T[], pick: (row: T) => number): number => rows.reduce((total, row) => total + pick(row), 0)

/** Tỷ trọng một dòng trên tổng, một chữ số thập phân; tổng không dương thì không có tỷ trọng. */
export function sharePct(part: number, whole: number): string {
  if (whole <= 0) return "-"
  return `${formatNumber(Math.round((part / whole) * 1000) / 10)}%`
}
