"use client";

import { format } from "date-fns";
import { vi } from "date-fns/locale";
import type { StockMovement } from "@/types/stock-movement";

function stamp(at?: string): string {
  if (!at) return "";
  const date = new Date(at);
  return Number.isNaN(date.getTime())
    ? ""
    : format(date, "dd/MM/yyyy HH:mm", { locale: vi });
}

/** Ai đã giao / nhận / duyệt / huỷ phiếu và lúc nào. Chỉ hiện bước đã xảy ra; phiếu cũ không có thì không hiện gì. */
export function MovementActors({ detail }: { detail: StockMovement }) {
  const steps = [
    { label: "Giao hàng", name: detail.shippedByName, at: detail.shippedAt },
    { label: "Nhận hàng", name: detail.receivedByName, at: detail.receivedAt },
    { label: "Duyệt", name: detail.approvedByName, at: detail.approvedAt },
    { label: "Huỷ", name: detail.cancelledByName, at: detail.cancelledAt },
  ].filter((step) => step.name || step.at);

  if (steps.length === 0) return null;

  return (
    <div className="mb-4 grid grid-cols-2 gap-x-6 gap-y-3 md:grid-cols-4">
      {steps.map((step) => (
        <div key={step.label}>
          <p className="text-xs text-muted-foreground">{step.label}</p>
          <p className="text-sm font-medium">{step.name || "-"}</p>
          {stamp(step.at) && (
            <p className="text-xs text-muted-foreground">{stamp(step.at)}</p>
          )}
        </div>
      ))}
    </div>
  );
}
