"use client";

import Link from "next/link";
import { ArrowLeft, Loader2, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { SalesBranch } from "../_hooks/use-sales-branch";

/**
 * Bắt buộc chọn chi nhánh khi vào /check-out từ chế độ xem toàn chuỗi hoặc một kho: bán tại quầy luôn ghi nhận
 * và đọc tồn tại một chi nhánh cụ thể. Không đóng được - lối ra duy nhất là chọn hoặc quay lại.
 */
export function PickSalesBranchDialog({
  sales,
  backHref,
}: {
  sales: SalesBranch;
  backHref: string;
}) {
  const { branches, ready, setBranchId } = sales;

  return (
    <Dialog open>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-md"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Chọn chi nhánh bán hàng</DialogTitle>
          <DialogDescription>
            Bạn đang xem toàn chuỗi hoặc một kho hàng. Chọn chi nhánh sẽ bán tại quầy để tìm hàng và tính tồn đúng.
          </DialogDescription>
        </DialogHeader>

        {!ready ? (
          <div className="flex justify-center py-6 text-muted-foreground">
            <Loader2 className="size-5 animate-spin" />
          </div>
        ) : branches.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Cửa hàng chưa có chi nhánh nào để bán hàng.
          </p>
        ) : (
          <div className="flex max-h-80 flex-col gap-2 overflow-y-auto">
            {branches.map((b) => (
              <Button
                key={b.id}
                type="button"
                variant="outline"
                className="h-auto cursor-pointer justify-start gap-2 py-3 text-left"
                onClick={() => setBranchId(b.id)}
              >
                <Store className="size-4 shrink-0 text-muted-foreground" />
                <span className="truncate">{b.name}</span>
              </Button>
            ))}
          </div>
        )}

        <Button asChild variant="ghost" size="sm" className="self-start">
          <Link href={backHref}>
            <ArrowLeft className="size-4" />
            Quay lại
          </Link>
        </Button>
      </DialogContent>
    </Dialog>
  );
}
