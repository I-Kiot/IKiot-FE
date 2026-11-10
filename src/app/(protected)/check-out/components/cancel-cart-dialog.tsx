"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/** Xác nhận huỷ giỏ của một tab bán hàng (thay `confirm()` của trình duyệt). */
export function CancelCartDialog({
  open,
  onOpenChange,
  tabName,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tabName: string;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Huỷ đơn hàng</DialogTitle>
          <DialogDescription>
            Bạn có muốn huỷ đơn hàng{" "}
            <strong className="text-foreground">{tabName}</strong>? Toàn bộ sản phẩm, khách hàng và khuyến mãi
            trong giỏ sẽ bị xoá.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" className="cursor-pointer" onClick={() => onOpenChange(false)}>
            Không
          </Button>
          <Button
            variant="destructive"
            className="cursor-pointer"
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
          >
            Đồng ý
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
