"use client";

import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getMovementStatusConfig } from "@/app/(protected)/exchange/shared/movement-labels";
import type { MovementStatus, MovementType } from "@/types/stock-movement";

type MovementDetailHeaderProps = {
  movementId: string;
  title: string;
  subtitle?: string;
  status: MovementStatus;
  movementType?: MovementType;
  onClose?: () => void;
};

export function MovementDetailHeader({
  movementId,
  title,
  subtitle,
  status,
  movementType,
  onClose,
}: MovementDetailHeaderProps) {
  const statusConfig = getMovementStatusConfig(status, movementType);
  const code = `#${String(movementId).slice(-6).toUpperCase()}`;

  return (
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3 border-b pb-3">
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
            Đang xem
          </span>
          <span className="font-mono text-sm font-semibold tracking-wide">
            {code}
          </span>
          <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
        </div>
        <p className="text-sm font-semibold leading-snug">{title}</p>
        {subtitle ? (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
      {onClose ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 cursor-pointer shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
        >
          <X className="mr-1 size-4" />
          Đóng
        </Button>
      ) : null}
    </div>
  );
}
