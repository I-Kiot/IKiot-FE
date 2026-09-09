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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type CancelConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  confirmLabel?: string;
  loadingLabel?: string;
  isLoading?: boolean;
  onConfirm: () => void | Promise<void>;
  /** Optional reason input (e.g. return goods). */
  reason?: {
    value: string;
    onChange: (value: string) => void;
    label?: string;
    placeholder?: string;
    required?: boolean;
  };
};

export function CancelConfirmDialog({
  open,
  onOpenChange,
  title = "Xác nhận huỷ yêu cầu",
  description = "Bạn có chắc muốn huỷ phiếu này? Thao tác không thể hoàn tác.",
  confirmLabel = "Huỷ yêu cầu",
  loadingLabel,
  isLoading = false,
  onConfirm,
  reason,
}: CancelConfirmDialogProps) {
  const reasonMissing = Boolean(reason?.required && !reason.value.trim());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-md"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {reason ? (
          <div className="space-y-2">
            <Label htmlFor="confirm-reason">
              {reason.label ?? "Lý do"}
              {reason.required ? (
                <span className="text-destructive"> *</span>
              ) : null}
            </Label>
            <Textarea
              id="confirm-reason"
              value={reason.value}
              onChange={(e) => reason.onChange(e.target.value)}
              placeholder={reason.placeholder ?? "Nhập lý do..."}
              disabled={isLoading}
              rows={3}
              className="resize-none"
            />
          </div>
        ) : null}

        <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
          <Button
            type="button"
            variant="outline"
            className="cursor-pointer"
            disabled={isLoading}
            onClick={() => onOpenChange(false)}
          >
            Không
          </Button>
          <Button
            type="button"
            variant="destructive"
            className="cursor-pointer"
            disabled={isLoading || reasonMissing}
            onClick={() => void onConfirm()}
          >
            {isLoading ? (loadingLabel ?? `Đang ${confirmLabel.toLowerCase()}...`) : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
