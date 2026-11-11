// [Dialog – Lịch sử giá của một phiên bản]
"use client";

import { useCallback, useState } from "react";
import { History, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { HistoryPager } from "@/components/history/history-pager";
import { historyPersonLabel } from "@/components/history/history-person";
import { useHistoryPage } from "@/components/history/use-history-page";
import { productApi } from "@/lib/api/product";
import { formatVND } from "@/lib/stats-format";
import { formatVietnamDateTime } from "@/app/(protected)/staffs/shared/vietnam-datetime";
import type { PriceHistoryField, ProductPriceChange } from "@/types/product";

const PAGE_SIZE = 10;

const FIELD_LABELS: Record<PriceHistoryField, string> = {
  RETAIL_PRICE: "Giá bán",
  COST_PRICE: "Giá vốn",
};

type Props = {
  itemId: string;
  sku: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ProductsPriceHistoryDialog({ itemId, sku, open, onOpenChange }: Props) {
  const [field, setField] = useState<PriceHistoryField | "ALL">("ALL");

  const fetchPage = useCallback(
    (page: number) =>
      productApi.getPriceHistory(itemId, {
        field: field === "ALL" ? undefined : field,
        page,
        limit: PAGE_SIZE,
      }),
    [itemId, field],
  );
  const { rows, pagination, loading, error, setPage } = useHistoryPage<ProductPriceChange>(
    fetchPage,
    open,
    `${itemId}:${field}`,
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="size-5 text-primary" />
            Lịch sử giá - {sku}
          </DialogTitle>
          <DialogDescription>Mỗi lần đổi giá bán hoặc giá vốn. Mới nhất ở trên.</DialogDescription>
        </DialogHeader>

        <div className="flex justify-end">
          <Select value={field} onValueChange={(v) => setField(v as PriceHistoryField | "ALL")}>
            <SelectTrigger className="w-44" aria-label="Lọc theo loại giá">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Cả hai loại giá</SelectItem>
              <SelectItem value="RETAIL_PRICE">Giá bán</SelectItem>
              <SelectItem value="COST_PRICE">Giá vốn</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="max-h-[55vh] overflow-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Thời gian</TableHead>
                <TableHead>Loại giá</TableHead>
                <TableHead className="text-right">Từ</TableHead>
                <TableHead className="text-right">Thành</TableHead>
                <TableHead>Người đổi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    <Loader2 className="mx-auto size-4 animate-spin text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-destructive">
                    Không tải được lịch sử giá.
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    Chưa có thay đổi nào.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="whitespace-nowrap text-xs">{formatVietnamDateTime(row.createdAt)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{FIELD_LABELS[row.field] ?? row.field}</Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {row.fromValue == null ? (
                        <span className="text-muted-foreground">Lúc tạo</span>
                      ) : (
                        formatVND(row.fromValue)
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">{formatVND(row.toValue)}</TableCell>
                    <TableCell className="text-xs">
                      {historyPersonLabel(row.changedBy, "Hệ thống – tính lại giá vốn combo")}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        <HistoryPager pagination={pagination} disabled={loading} onPageChange={setPage} />
      </DialogContent>
    </Dialog>
  );
}
