"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { HistoryPagination } from "@/types/history";

/** Thanh chuyển trang gọn cho các màn lịch sử (trong hộp thoại / thẻ), không dùng PageFooter cố định đáy. */
export function HistoryPager({
  pagination,
  disabled,
  onPageChange,
}: {
  pagination: HistoryPagination | null;
  disabled?: boolean;
  onPageChange: (page: number) => void;
}) {
  if (!pagination || pagination.total === 0) return null;
  const pageCount = Math.max(1, pagination.totalPages);
  return (
    <div className="flex items-center justify-between gap-2 pt-2 text-xs text-muted-foreground">
      <span>
        {pagination.total} dòng · Trang {pagination.page} / {pageCount}
      </span>
      <div className="flex gap-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 cursor-pointer"
          disabled={disabled || pagination.page <= 1}
          onClick={() => onPageChange(pagination.page - 1)}
        >
          <ChevronLeft className="size-4" />
          Trước
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 cursor-pointer"
          disabled={disabled || pagination.page >= pageCount}
          onClick={() => onPageChange(pagination.page + 1)}
        >
          Tiếp
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
