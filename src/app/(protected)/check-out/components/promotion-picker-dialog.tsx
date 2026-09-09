"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Layers, Store, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { promotionApi } from "@/lib/api/promotion";
import type {
  PromotionCandidate,
  PromotionCandidatesResponse,
  PromotionCalculateItem,
} from "@/types/promotion";

const formatVND = (value: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);

function discountLabel(candidate: PromotionCandidate) {
  return candidate.discountType === "PERCENT"
    ? `Giảm ${candidate.discountValue}%${
        candidate.maxDiscountAmount ? ` (tối đa ${formatVND(candidate.maxDiscountAmount)})` : ""
      }`
    : `Giảm ${formatVND(candidate.discountValue)}`;
}

interface PromotionPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branchId: string;
  customerId?: string;
  items: PromotionCalculateItem[];
  selectedPromotionIds: string[];
  onConfirm: (selectedIds: string[]) => void;
}

export function PromotionPickerDialog({
  open,
  onOpenChange,
  branchId,
  customerId,
  items,
  selectedPromotionIds,
  onConfirm,
}: PromotionPickerDialogProps) {
  const [candidates, setCandidates] = useState<PromotionCandidatesResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>(selectedPromotionIds);

  // Re-sync the working selection with the invoice's current one whenever the dialog opens
  useEffect(() => {
    if (open) setSelectedIds(selectedPromotionIds);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const itemsKey = items.map((i) => `${i.productItemId}:${i.quantity}:${i.unitPrice}`).join(",");

  useEffect(() => {
    if (!open || !branchId || items.length === 0) return;

    setIsLoading(true);
    promotionApi
      .listCandidates({ branchId, customerId, items })
      .then(setCandidates)
      .catch((error) => {
        console.error("Lỗi khi tải danh sách khuyến mãi:", error);
        toast.error("Không tải được danh sách khuyến mãi.");
      })
      .finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, branchId, customerId, itemsKey]);

  const allCandidates = [
    ...(candidates?.branchPromotions ?? []),
    ...(candidates?.systemPromotions ?? []),
  ];

  const toggleSelect = (candidate: PromotionCandidate) => {
    if (!candidate.eligible) return;

    setSelectedIds((prev) => {
      if (prev.includes(candidate.id)) {
        return prev.filter((id) => id !== candidate.id);
      }

      if (!candidate.stackable) {
        if (prev.length > 0) {
          toast.info(`"${candidate.promoName}" không thể cộng dồn, đã bỏ chọn khuyến mãi khác.`);
        }
        return [candidate.id];
      }

      const prevCandidates = prev
        .map((id) => allCandidates.find((c) => c.id === id))
        .filter((c): c is PromotionCandidate => Boolean(c));
      const prevAllStackable = prevCandidates.every((c) => c.stackable);

      if (prev.length === 0) return [candidate.id];
      if (prev.length === 1 && prevAllStackable) return [...prev, candidate.id];

      toast.info("Chỉ được chọn tối đa 2 khuyến mãi cộng dồn, đã thay thế lựa chọn trước đó.");
      return [candidate.id];
    });
  };

  const renderSection = (title: string, icon: React.ReactNode, list: PromotionCandidate[]) => (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
        {icon}
        {title}
      </div>
      {list.length === 0 ? (
        <p className="text-sm text-muted-foreground italic px-1">Không có khuyến mãi.</p>
      ) : (
        <div className="space-y-2">
          {list.map((candidate) => {
            const isSelected = selectedIds.includes(candidate.id);
            return (
              <button
                type="button"
                key={candidate.id}
                onClick={() => toggleSelect(candidate)}
                disabled={!candidate.eligible}
                className={cn(
                  "w-full text-left p-3 rounded-lg border transition-colors cursor-pointer",
                  !candidate.eligible && "opacity-50 cursor-not-allowed bg-muted/30",
                  candidate.eligible && isSelected && "border-primary bg-primary/5",
                  candidate.eligible && !isSelected && "border-border hover:bg-muted/40",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-semibold text-foreground truncate">
                        {candidate.promoName}
                      </span>
                      {candidate.stackable && (
                        <Badge variant="secondary" className="text-xs shrink-0">
                          Cộng dồn
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground mt-0.5">
                      {discountLabel(candidate)}
                      {candidate.minOrderValue > 0 &&
                        ` • Đơn tối thiểu ${formatVND(candidate.minOrderValue)}`}
                    </div>
                    {!candidate.eligible && candidate.reason && (
                      <div className="text-sm text-destructive mt-1">{candidate.reason}</div>
                    )}
                  </div>
                  {isSelected && (
                    <div className="shrink-0 size-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                      <Check className="size-3.5" />
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Gán giảm giá</DialogTitle>
          <DialogDescription>
            Chọn khuyến mãi để áp dụng cho đơn hàng. Có thể chọn thêm 1 khuyến mãi khác nếu cả hai
            đều được phép cộng dồn.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[420px] pr-3">
          {isLoading ? (
            <p className="text-sm text-muted-foreground text-center py-8">Đang tải...</p>
          ) : (
            <div className="space-y-5">
              {renderSection(
                "Khuyến mãi chi nhánh",
                <Store className="size-4" />,
                candidates?.branchPromotions ?? [],
              )}
              {renderSection(
                "Khuyến mãi toàn hệ thống",
                <Layers className="size-4" />,
                candidates?.systemPromotions ?? [],
              )}
            </div>
          )}
        </ScrollArea>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              onConfirm([]);
              onOpenChange(false);
            }}
          >
            Bỏ chọn
          </Button>
          <Button
            type="button"
            onClick={() => {
              onConfirm(selectedIds);
              onOpenChange(false);
            }}
          >
            Xác nhận
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
