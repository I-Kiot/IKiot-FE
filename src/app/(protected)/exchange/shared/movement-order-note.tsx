"use client";

import { MessageSquareText } from "lucide-react";
import { normalizeOptionalNote } from "@/app/(protected)/exchange/shared/qty";

export function MovementOrderNote({ note }: { note?: string | null }) {
  const value = normalizeOptionalNote(note);

  return (
    <div className="mb-4 rounded-md border border-dashed bg-muted/30 p-3 text-sm">
      <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <MessageSquareText className="size-3.5" />
        Ghi chú đơn
      </div>
      <p className="whitespace-pre-wrap break-words text-foreground">
        {value || "Không có ghi chú đơn"}
      </p>
    </div>
  );
}
