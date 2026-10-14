"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PAGE_SIZE_OPTIONS = [10, 20, 30, 50];

type Props = {
  /** Trang đang xem, đếm từ 1. */
  page: number;
  pageCount: number;
  pageSize: number;
  /** Tổng số dòng (sau lọc với bảng phân trang ở client, BE trả về với bảng phân trang ở server). */
  total: number;
  /** Tên đơn vị hiển thị, vd. "hàng hóa", "đơn nhập". */
  unit: string;
  /** Khoá hai nút chuyển trang, vd. khi trang trước chưa tải xong. */
  disabled?: boolean;
  onPageChange: (page: number) => void;
  /** Đổi số dòng mỗi trang; bên gọi tự quay về trang 1. */
  onPageSizeChange: (pageSize: number) => void;
};

// Thanh phân trang dùng chung cho mọi bảng (client, server hay bảng thô): chọn số dòng mỗi trang,
// "Hiển thị a–b / N", "Trang x / y" và hai nút Trước / Tiếp.
export function DataTablePagination({
  page,
  pageCount,
  pageSize,
  total,
  unit,
  disabled = false,
  onPageChange,
  onPageSizeChange,
}: Props) {
  // Bảng rỗng vẫn là "Trang 1 / 1", không phải "Trang 1 / 0".
  const lastPage = Math.max(pageCount, 1);
  const currentPage = Math.min(Math.max(page, 1), lastPage);

  const rangeStart = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const rangeEnd = Math.min(currentPage * pageSize, total);

  let summary = `Không có ${unit}`;
  if (total > 0) {
    summary = `Hiển thị ${rangeStart}–${rangeEnd} / ${total} ${unit}`;
  }

  return (
    <div className="flex items-center justify-between gap-2 py-4">
      <div className="flex items-center gap-2">
        <Label className="text-sm font-medium">Hiển thị</Label>
        <Select
          value={`${pageSize}`}
          onValueChange={(value) => onPageSizeChange(Number(value))}
        >
          <SelectTrigger className="w-20 cursor-pointer">
            <SelectValue placeholder={pageSize} />
          </SelectTrigger>
          <SelectContent side="top">
            {PAGE_SIZE_OPTIONS.map((option) => (
              <SelectItem key={option} value={`${option}`}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="hidden text-sm text-muted-foreground sm:block">
        {summary}
      </div>

      <div className="flex items-center gap-2">
        <span className="hidden text-sm font-medium sm:block">
          Trang{" "}
          <strong>
            {currentPage} / {lastPage}
          </strong>
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={disabled || currentPage <= 1}
          className="cursor-pointer"
        >
          Trước
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={disabled || currentPage >= lastPage}
          className="cursor-pointer"
        >
          Tiếp
        </Button>
      </div>
    </div>
  );
}
