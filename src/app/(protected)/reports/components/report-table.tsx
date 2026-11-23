"use client"

import type { CSSProperties, ReactNode } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DataTablePagination } from "@/components/data-table/data-table-pagination"
import { cn } from "@/lib/utils"
import { formatNumber, formatVND, negativeClass } from "@/lib/stats-format"

export interface ReportColumn<T> {
  header: string
  /** Cột số căn phải. */
  numeric?: boolean
  className?: string
  /** `index` là thứ tự tuyệt đối của dòng (đã cộng các trang trước), dùng cho cột STT. */
  cell: (row: T, index: number) => ReactNode
  /** Ô của dòng cộng cuối bảng; bảng chỉ có dòng cộng khi ít nhất một cột khai báo. */
  footer?: ReactNode
}

/** Phân trang phía server: dòng cộng (`footer`) vẫn là tổng cả kỳ do server trả, không cộng trên trang đang xem. */
export interface ReportPagination {
  page: number
  pageSize: number
  total: number
  /** Tên đơn vị trên thanh phân trang, vd. "nhân viên". */
  unit: string
  disabled?: boolean
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
}

export const REPORT_PAGE_SIZES = [20, 50, 100]
export const DEFAULT_REPORT_PAGE_SIZE = 50

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
  /** Dòng in đậm (dòng tổng nằm giữa bảng, như Doanh thu thuần): luôn dính trên hoặc dưới khung khi cuộn. */
  isStrong?: (row: T) => boolean
  /** Ghi chú dưới bảng. */
  note?: ReactNode
  pagination?: ReportPagination
}

/** Chiều cao cố định của đầu bảng và các dòng dính (h-10), để tính chỗ xếp chồng khi nhiều dòng cùng dính. */
const STICKY_ROW_REM = 2.5
const rem = (n: number) => `${n * STICKY_ROW_REM}rem`

/**
 * Khung chung của mọi bảng báo cáo: tiêu đề, bảng số liệu, dòng cộng, ghi chú, phân trang.
 * Bảng cuộn trong khung riêng (cao tối đa 70vh); đầu bảng dính trên, dòng cộng dính dưới, còn các dòng in đậm
 * dính cả hai phía - cuộn qua thì dính trên (dưới đầu bảng), chưa tới thì dính dưới (trên dòng cộng) - nên dòng tổng nào cũng luôn thấy.
 * Không dùng `<Table>` của ui: khung `overflow-x-auto` của nó thành vùng cuộn không giới hạn chiều cao, làm `sticky` dọc vô hiệu.
 */
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
  pagination,
}: ReportTableProps<T>) {
  const hasFooter = rows.length > 0 && columns.some((column) => column.footer !== undefined)
  const offset = pagination ? (pagination.page - 1) * pagination.pageSize : 0

  // Vị trí của từng dòng in đậm trong chồng dòng dính: dòng thứ i dính trên ở dưới đầu bảng + i dòng trước,
  // dính dưới ở trên dòng cộng + các dòng in đậm sau nó.
  const strongIndexes = isStrong ? rows.flatMap((row, index) => (isStrong(row) ? [index] : [])) : []
  const stickyStyleOf = (index: number): CSSProperties | undefined => {
    const position = strongIndexes.indexOf(index)
    if (position < 0) return undefined
    const after = strongIndexes.length - 1 - position
    return { top: rem(1 + position), bottom: rem(after + (hasFooter ? 1 : 0)) }
  }

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
          <div className="max-h-[70vh] overflow-auto rounded-lg border">
            <table className="w-full caption-bottom border-separate border-spacing-0 text-sm">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  {columns.map((column) => (
                    <TableHead
                      key={column.header}
                      className={cn(
                        "sticky top-0 z-20 whitespace-nowrap border-b bg-muted font-semibold",
                        column.numeric && "text-right",
                        column.className,
                      )}
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
                  rows.map((row, index) => {
                    const sticky = stickyStyleOf(index)
                    return (
                      <TableRow key={rowKey(row, index)} className={cn(sticky && "font-semibold hover:bg-transparent")}>
                        {columns.map((column) => (
                          <TableCell
                            key={column.header}
                            style={sticky}
                            className={cn(
                              "border-b",
                              column.numeric && "text-right tabular-nums",
                              sticky && "sticky z-10 h-10 bg-muted py-0",
                              column.className,
                            )}
                          >
                            {column.cell(row, offset + index)}
                          </TableCell>
                        ))}
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
              {hasFooter ? (
                <TableFooter className="border-t-0 bg-transparent">
                  <TableRow className="font-semibold hover:bg-transparent">
                    {columns.map((column) => (
                      <TableCell
                        key={column.header}
                        className={cn(
                          "sticky bottom-0 z-20 h-10 border-t bg-muted py-0",
                          column.numeric && "text-right tabular-nums",
                          column.className,
                        )}
                      >
                        {column.footer}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableFooter>
              ) : null}
            </table>
          </div>
        )}
        {note ? <p className="text-xs text-muted-foreground">{note}</p> : null}
      </CardContent>
      {pagination ? (
        <DataTablePagination
          page={pagination.page}
          pageCount={Math.ceil(pagination.total / pagination.pageSize)}
          pageSize={pagination.pageSize}
          total={pagination.total}
          unit={pagination.unit}
          disabled={pagination.disabled}
          onPageChange={pagination.onPageChange}
          onPageSizeChange={pagination.onPageSizeChange}
          pageSizeOptions={REPORT_PAGE_SIZES}
        />
      ) : null}
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
