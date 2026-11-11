"use client";

import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

/** Dòng "Mã hết hạn sau mm:ss"; dưới 1 phút chuyển sang màu cảnh báo. */
export function QrCountdown({ label, remainingMs }: { label: string; remainingMs: number }) {
  return (
    <p
      className={cn(
        "flex items-center justify-center gap-1.5 text-sm tabular-nums",
        remainingMs < 60_000 ? "font-semibold text-destructive" : "text-muted-foreground",
      )}
    >
      <Clock className="size-4" />
      Mã hết hạn sau {label}
    </p>
  );
}
